import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

BASE_DIR = Path(__file__).resolve().parent
SEED_BOOKS = (
    ("9780743273565", "The Great Gatsby", 12.90, "CHF"),
    ("9780141439518", "Pride and Prejudice", 9.90, "CHF"),
    ("9780451524935", "1984", 11.50, "CHF"),
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL fehlt. Bitte eine PostgreSQL-Datenbank konfigurieren.")

    pool = ConnectionPool(
        conninfo=database_url,
        min_size=1,
        max_size=5,
        kwargs={"row_factory": dict_row},
    )
    try:
        pool.wait()
        with pool.connection() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS books (
                    barcode TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
                    currency CHAR(3) NOT NULL DEFAULT 'CHF'
                )
                """
            )
            connection.executemany(
                """
                INSERT INTO books (barcode, title, price, currency)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (barcode) DO NOTHING
                """,
                SEED_BOOKS,
            )
        app.state.pool = pool
        yield
    finally:
        pool.close()


app = FastAPI(title="Buchscanner", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


@app.get("/")
def home() -> FileResponse:
    return FileResponse(BASE_DIR / "templates" / "index.html")


@app.get("/api/books")
def list_books(request: Request) -> list[dict[str, object]]:
    with request.app.state.pool.connection() as connection:
        rows = connection.execute(
            "SELECT barcode, title, price, currency FROM books ORDER BY title"
        ).fetchall()
    return [
        {**row, "price": float(row["price"]), "currency": row["currency"].strip()}
        for row in rows
    ]


@app.get("/api/books/{barcode}")
def get_book(barcode: str, request: Request) -> dict[str, object]:
    normalized_barcode = re.sub(r"[\s-]", "", barcode)
    with request.app.state.pool.connection() as connection:
        book = connection.execute(
            """
            SELECT barcode, title, price, currency
            FROM books
            WHERE barcode = %s
            """,
            (normalized_barcode,),
        ).fetchone()

    if book is None:
        raise HTTPException(status_code=404, detail="Dieses Buch ist nicht im Katalog.")

    return {
        **book,
        "price": float(book["price"]),
        "currency": book["currency"].strip(),
    }
