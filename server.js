import express from "express";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3000;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL fehlt. Bitte eine PostgreSQL-Datenbank konfigurieren.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

app.use(express.json());

app.get("/api/books", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT barcode, title, price, currency FROM books ORDER BY title",
    );
    response.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/books/:barcode", async (request, response, next) => {
  try {
    const barcode = request.params.barcode.replace(/[\s-]/g, "");
    const result = await pool.query(
      "SELECT barcode, title, price, currency FROM books WHERE barcode = $1",
      [barcode],
    );

    if (result.rowCount === 0) {
      response.status(404).json({ error: "Dieses Buch ist nicht im Katalog." });
      return;
    }

    response.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.join(currentDirectory, "dist")));

app.use((error, _request, response, _next) => {
  console.error("API-Fehler:", error);
  response.status(500).json({ error: "Interner Serverfehler." });
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS books (
      barcode TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
      currency CHAR(3) NOT NULL DEFAULT 'CHF'
    )
  `);

  await pool.query(
    `INSERT INTO books (barcode, title, price, currency)
     VALUES
       ('9780743273565', 'The Great Gatsby', 12.90, 'CHF'),
       ('9780141439518', 'Pride and Prejudice', 9.90, 'CHF'),
       ('9780451524935', '1984', 11.50, 'CHF')
     ON CONFLICT (barcode) DO NOTHING`,
  );
}

try {
  await initializeDatabase();
  app.listen(port, "0.0.0.0", () => {
    console.log(`Buchscanner läuft auf Port ${port}.`);
  });
} catch (error) {
  console.error("Datenbank konnte nicht initialisiert werden:", error);
  process.exitCode = 1;
} finally {
  if (process.exitCode) {
    await pool.end();
  }
}
