"""
Seed Neon PostgreSQL with scraped product data.

Usage:
    DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" python scripts/seed_neon.py path/to/scraped_products.xlsx

The script maps scraped Excel columns to the JPA 'products' table that Spring Boot creates via ddl-auto=update.
Run the Spring Boot backend once first so the tables exist, then run this script.
"""

import sys
import os
import uuid
import psycopg2
import pandas as pd

DATABASE_URL = os.environ.get("DATABASE_URL", "")


def connect():
    if not DATABASE_URL:
        print("ERROR: Set DATABASE_URL env var to your Neon connection string.")
        sys.exit(1)
    return psycopg2.connect(DATABASE_URL, sslmode="require")


COLUMN_MAP = {
    "product_name": "name",
    "brand": "brand",
    "product_type": "category",
    "price": "price",
    "dimensions": "dimensions",
    "color": "color",
    "material": "material",
    "source": "vendor",
    "affiliate_url": "affiliate_link",
    "image_url": "image",
    "description": "description",
}

INSERT_SQL = """
    INSERT INTO products (id, name, brand, category, price, dimensions, color, material, vendor, affiliate_link, image, description)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO NOTHING
"""


def seed(xlsx_path: str):
    df = pd.read_excel(xlsx_path)
    print(f"Loaded {len(df)} rows from {xlsx_path}")

    rename = {k: v for k, v in COLUMN_MAP.items() if k in df.columns}
    df = df.rename(columns=rename)

    required = ["name"]
    for col in required:
        if col not in df.columns:
            print(f"ERROR: Required column '{col}' not found. Available: {list(df.columns)}")
            sys.exit(1)

    conn = connect()
    cur = conn.cursor()

    inserted = 0
    for _, row in df.iterrows():
        pid = str(uuid.uuid4())
        values = (
            pid,
            _s(row, "name"),
            _s(row, "brand"),
            _s(row, "category"),
            _n(row, "price"),
            _s(row, "dimensions"),
            _s(row, "color"),
            _s(row, "material"),
            _s(row, "vendor"),
            _s(row, "affiliate_link"),
            _s(row, "image"),
            _s(row, "description"),
        )
        cur.execute(INSERT_SQL, values)
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"Inserted {inserted} products into Neon PostgreSQL.")


def _s(row, col):
    val = row.get(col, None)
    if pd.isna(val):
        return None
    return str(val).strip() or None


def _n(row, col):
    val = row.get(col, None)
    if pd.isna(val):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: DATABASE_URL=... python scripts/seed_neon.py <path_to_xlsx>")
        sys.exit(1)
    seed(sys.argv[1])
