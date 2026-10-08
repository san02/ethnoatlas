import json
import os
from pathlib import Path

import psycopg


BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "site" / "data"

DB_NAME = os.getenv("POSTGRES_DB", "ethnoatlas")
DB_USER = os.getenv("POSTGRES_USER", "ethnoatlas")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")

DATASET_ID = "dplace-dataset-ea"
DATASET_CODE = "EA"

# Variables specified in the guide.
SELECTED_VARIABLES = [
    "EA043",  # Descent type
    "EA027",  # Cousin terms
    "EA023",  # Cousin marriage
    "EA009",  # Monogamy or polygamy
    "EA012",  # Where couples live
    "EA006",  # Marriage payments
    "EA042",  # Main activity
    "EA028",  # Farming intensity
    "EA029",  # Main crop
    "EA033",  # Levels of authority
    "EA066",  # Class divisions
    "EA070",  # Slavery
    "EA030",  # Settlement pattern
    "EA031",  # Community size
    "EA034",  # High gods
]

FIRST_VARIABLE = "EA043"


def connect():
    return psycopg.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            separators=(",", ":"),
        )

def export_societies(conn):
    societies = {}

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                s.id,
                s.name,
                s.latitude,
                s.longitude,
                s.region,
                s.year,
                sn.name
            FROM societies s
            LEFT JOIN society_names sn
                ON sn.society_id = s.id
            WHERE s.dataset_id = %s
            ORDER BY s.id, sn.id
            """,
            (DATASET_ID,),
        )

        for row in cur:
            (
                society_id,
                name,
                latitude,
                longitude,
                region,
                year,
                alternative_name,
            ) = row

            if society_id not in societies:
                societies[society_id] = {
                    "id": society_id,
                    "name": name,
                    "alternativeNames": [],
                    "lat": latitude,
                    "lon": longitude,
                    "region": region,
                    "year": year,
                    "dataset": DATASET_CODE,
                    "answers": {},
                }

            if alternative_name:
                societies[society_id]["alternativeNames"].append(
                    alternative_name
                )

        cur.execute(
            """
            SELECT
                s.id,
                v.id,
                v.name,
                c.name,
                val.value
            FROM societies s
            LEFT JOIN "values" val
                ON val.society_id = s.id
                AND val.variable_id = ANY(%s)
            LEFT JOIN variables v
                ON v.id = val.variable_id
            LEFT JOIN codes c
                ON c.id = val.code_id
            WHERE s.dataset_id = %s
            ORDER BY s.id, v.id
            """,
            (SELECTED_VARIABLES, DATASET_ID),
        )

        for row in cur:
            (
                society_id,
                variable_id,
                variable_name,
                code_name,
                value,
            ) = row

            if variable_id is not None:
                answer = code_name if code_name is not None else value
                societies[society_id]["answers"][variable_name] = answer

    output = list(societies.values())

    path = OUTPUT_DIR / "societies.json"
    write_json(path, output)

    print(f"Exported {len(output)} societies → {path}")

def export_variables(conn):
    variables = []

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                v.id,
                v.name,
                v.description,
                v.category,
                v.type,
                v.unit
            FROM variables v
            WHERE v.dataset_id = %s
              AND v.id = ANY(%s)
            ORDER BY array_position(%s, v.id)
            """,
            (
                DATASET_ID,
                SELECTED_VARIABLES,
                SELECTED_VARIABLES,
            ),
        )

        variable_rows = cur.fetchall()

        for row in variable_rows:
            (
                variable_id,
                name,
                description,
                category,
                variable_type,
                unit,
            ) = row

            cur.execute(
                """
                SELECT
                    c.id,
                    c.name,
                    c.description,
                    c.ord
                FROM codes c
                WHERE c.variable_id = %s
                ORDER BY c.ord, c.id
                """,
                (variable_id,),
            )

            answers = []

            for code_id, code_name, code_description, ord_value in cur.fetchall():
                answers.append(
                    {
                        "id": code_id,
                        "name": code_name,
                        "description": code_description,
                        "ord": ord_value,
                    }
                )

            variables.append(
                {
                    "id": variable_id,
                    "name": name,
                    "description": description,
                    "category": category,
                    "type": variable_type,
                    "unit": unit,
                    "answers": answers,
                }
            )

    path = OUTPUT_DIR / "variables.json"
    write_json(path, variables)

    print(f"Exported {len(variables)} variables → {path}")


def export_meta(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*)
            FROM societies
            WHERE dataset_id = %s
            """,
            (DATASET_ID,),
        )
        society_count = cur.fetchone()[0]

        cur.execute(
            """
            SELECT COUNT(*)
            FROM variables
            WHERE dataset_id = %s
              AND id = ANY(%s)
            """,
            (DATASET_ID, SELECTED_VARIABLES),
        )
        variable_count = cur.fetchone()[0]

        cur.execute(
            """
            SELECT COUNT(*)
            FROM "values" val
            JOIN societies s
                ON s.id = val.society_id
            WHERE s.dataset_id = %s
              AND val.variable_id = ANY(%s)
            """,
            (DATASET_ID, SELECTED_VARIABLES),
        )
        value_count = cur.fetchone()[0]

        cur.execute(
            """
            SELECT DISTINCT region
            FROM societies
            WHERE dataset_id = %s
              AND region IS NOT NULL
              AND region <> ''
            ORDER BY region
            """,
            (DATASET_ID,),
        )
        regions = [row[0] for row in cur.fetchall()]

    meta = {
        "dataset": DATASET_CODE,
        "dataset_id": DATASET_ID,
        "dataset_name": "Ethnographic Atlas",
        "societies": society_count,
        "variables": variable_count,
        "values": value_count,
        "regions": regions,
        "first_variable": FIRST_VARIABLE,
    }

    path = OUTPUT_DIR / "meta.json"
    write_json(path, meta)

    print(f"Exported metadata → {path}")


def main():
    with connect() as conn:
        export_societies(conn)
        export_variables(conn)
        export_meta(conn)

    print("Export completed successfully.")


if __name__ == "__main__":
    main()