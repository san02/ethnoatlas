import csv
import os
from pathlib import Path

import psycopg


BASE_DIR = Path(__file__).resolve().parent.parent
CLDF_DIR = BASE_DIR / "source" / "dplace" / "cldf"

DB_NAME = os.getenv("POSTGRES_DB", "ethnoatlas")
DB_USER = os.getenv("POSTGRES_USER", "ethnoatlas")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")

DATASET_ID = "dplace-dataset-ea"
DATASET_NAME = "Ethnographic Atlas"


def connect():
    return psycopg.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )


def reset_data(conn):
    with conn.cursor() as cur:
        cur.execute(
            'TRUNCATE TABLE "values", society_names, codes, '
            'variables, societies, datasets CASCADE'
        )


def load_dataset(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO datasets (id, name, citation)
            VALUES (%s, %s, %s)
            """,
            (
                DATASET_ID,
                DATASET_NAME,
                "D-PLACE Ethnographic Atlas",
            ),
        )


def load_societies(conn):
    path = CLDF_DIR / "societies.csv"

    with conn.cursor() as cur:
        with path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                if row["Contribution_ID"] != DATASET_ID:
                    continue

                latitude = row["Latitude"] or None
                longitude = row["Longitude"] or None
                year = row["main_focal_year"] or None

                cur.execute(
                    """
                    INSERT INTO societies (
                        id,
                        dataset_id,
                        name,
                        latitude,
                        longitude,
                        glottocode,
                        year,
                        region,
                        geometry
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s,
                        CASE
                            WHEN %s::double precision IS NOT NULL
                             AND %s::double precision IS NOT NULL
                            THEN ST_SetSRID(
                                ST_MakePoint(
                                    %s::double precision,
                                    %s::double precision
                                ),
                                4326
                            )
                            ELSE NULL
                        END
                    )
                    """,
                    (
                        row["ID"],
                        DATASET_ID,
                        row["Name"],
                        latitude,
                        longitude,
                        row["Glottocode"] or None,
                        year,
                        row["region"] or None,
                        longitude,
                        latitude,
                        longitude,
                        latitude,
                    ),
                )


def load_society_names(conn):
    path = CLDF_DIR / "societies.csv"

    with conn.cursor() as cur:
        with path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                if row["Contribution_ID"] != DATASET_ID:
                    continue

                society_id = row["ID"]
                alt_names = row["alt_names_by_society"] or ""

                for name in alt_names.split(";"):
                    name = name.strip()

                    if not name:
                        continue

                    cur.execute(
                        """
                        INSERT INTO society_names (
                            society_id,
                            name
                        )
                        VALUES (%s, %s)
                        """,
                        (society_id, name),
                    )


def load_variables(conn):
    path = CLDF_DIR / "variables.csv"

    with conn.cursor() as cur:
        with path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                if row["Contribution_ID"] != DATASET_ID:
                    continue

                cur.execute(
                    """
                    INSERT INTO variables (
                        id,
                        dataset_id,
                        name,
                        description,
                        category,
                        type,
                        unit
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        row["ID"],
                        DATASET_ID,
                        row["Name"],
                        row["Description"] or None,
                        row["category"] or None,
                        row["type"] or None,
                        row["unit"] or None,
                    ),
                )


def load_codes(conn):
    path = CLDF_DIR / "codes.csv"

    with conn.cursor() as cur:
        cur.execute("SELECT id FROM variables")
        variable_ids = {row[0] for row in cur.fetchall()}

        with path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                if row["Var_ID"] not in variable_ids:
                    continue

                ord_value = row["ord"] or None

                cur.execute(
                    """
                    INSERT INTO codes (
                        id,
                        variable_id,
                        name,
                        description,
                        ord
                    )
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        row["ID"],
                        row["Var_ID"],
                        row["Name"],
                        row["Description"] or None,
                        ord_value,
                    ),
                )


def load_values(conn):
    path = CLDF_DIR / "data.csv"

    with conn.cursor() as cur:
        cur.execute("SELECT id FROM societies")
        society_ids = {row[0] for row in cur.fetchall()}

        cur.execute("SELECT id FROM variables")
        variable_ids = {row[0] for row in cur.fetchall()}

        with cur.copy(
            """
            COPY "values" (
                id,
                society_id,
                variable_id,
                code_id,
                value,
                comment,
                source,
                sub_case,
                year,
                source_coded_data,
                admin_comment
            )
            FROM STDIN WITH (FORMAT text)
            """
        ) as copy:
            with path.open(
                "r",
                encoding="utf-8",
                newline=""
            ) as f:
                reader = csv.DictReader(f)

                for row in reader:
                    if row["Soc_ID"] not in society_ids:
                        continue

                    if row["Var_ID"] not in variable_ids:
                        continue

                    year = row["year"] or None

                    # The source contains some year ranges such as
                    # "1898-1909", while the database column is INTEGER.
                    # Keep only a single numeric year; otherwise NULL.
                    if year and not year.isdigit():
                        year = None

                    copy.write_row(
                        (
                            row["ID"],
                            row["Soc_ID"],
                            row["Var_ID"],
                            row["Code_ID"] or None,
                            row["Value"] or None,
                            row["Comment"] or None,
                            row["Source"] or None,
                            row["sub_case"] or None,
                            year,
                            row["source_coded_data"] or None,
                            row["admin_comment"] or None,
                        )
                    )


def main():
    with connect() as conn:
        reset_data(conn)

        load_dataset(conn)
        load_societies(conn)
        load_society_names(conn)
        load_variables(conn)
        load_codes(conn)
        load_values(conn)

        conn.commit()

    print("Database loaded successfully.")


if __name__ == "__main__":
    main()