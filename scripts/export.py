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


def connect():
    return psycopg.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )


def write_json(path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            separators=(",", ":"),
        )


def export_societies(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                id,
                name,
                latitude,
                longitude,
                glottocode,
                year,
                region
            FROM societies
            WHERE dataset_id = %s
            ORDER BY id
            """,
            (DATASET_ID,),
        )

        rows = cur.fetchall()

    societies = []

    for row in rows:
        societies.append(
            {
                "id": row[0],
                "name": row[1],
                "latitude": row[2],
                "longitude": row[3],
                "glottocode": row[4],
                "year": row[5],
                "region": row[6],
            }
        )

    output_file = OUTPUT_DIR / "societies.json"
    write_json(output_file, societies)

    print(
        f"Exported {len(societies)} societies → "
        f"{output_file}"
    )


def export_variables(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                id,
                name,
                description,
                category,
                type,
                unit
            FROM variables
            WHERE dataset_id = %s
            ORDER BY id
            """,
            (DATASET_ID,),
        )

        rows = cur.fetchall()

    variables = []

    for row in rows:
        variables.append(
            {
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "category": row[3],
                "type": row[4],
                "unit": row[5],
            }
        )

    output_file = OUTPUT_DIR / "variables.json"
    write_json(output_file, variables)

    print(
        f"Exported {len(variables)} variables → "
        f"{output_file}"
    )


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
            """,
            (DATASET_ID,),
        )
        variable_count = cur.fetchone()[0]

        cur.execute(
            """
            SELECT COUNT(*)
            FROM "values" v
            JOIN societies s
                ON s.id = v.society_id
            JOIN variables var
                ON var.id = v.variable_id
            WHERE s.dataset_id = %s
              AND var.dataset_id = %s
            """,
            (DATASET_ID, DATASET_ID),
        )
        value_count = cur.fetchone()[0]

    meta = {
        "dataset_id": DATASET_ID,
        "dataset_name": "Ethnographic Atlas",
        "societies": society_count,
        "variables": variable_count,
        "values": value_count,
    }

    output_file = OUTPUT_DIR / "meta.json"
    write_json(output_file, meta)

    print(f"Exported metadata → {output_file}")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with connect() as conn:
        export_societies(conn)
        export_variables(conn)
        export_meta(conn)

    print("Export completed successfully.")


if __name__ == "__main__":
    main()