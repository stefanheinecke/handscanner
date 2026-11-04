# Buchscanner

Eine mobilfreundliche FastAPI-Web-App zum Scannen und Nachschlagen von
Buch-ISBNs. Titel, Preise und Barcodes werden in PostgreSQL gespeichert.

## Lokal starten

Voraussetzungen: Python 3.11+ und PostgreSQL.

In PowerShell im Projektordner:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL = "postgresql://postgres:passwort@localhost:5432/buchscanner"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Danach die App unter `http://localhost:8000` öffnen. Beim ersten Start legt die
App die Tabelle `books` an und fügt drei Beispieldatensätze ein. Bestehende
Datensätze werden nicht überschrieben.

Die Scan-Bibliothek und die Bibliothek für die sichtbaren EAN-13-Barcodes werden
im Browser von jsDelivr geladen; dafür benötigt der Browser eine Internetverbindung.
Für Kamerazugriff auf dem Handy muss die App über HTTPS geöffnet werden. Für
einen einfachen Test kannst du die Seite auf dem Computer anzeigen und die
Barcodes mit dem Handy scannen.

## Auf Railway deployen

1. Das Projekt in ein Git-Repository pushen und in Railway deployen.
2. Im Railway-Projekt einen PostgreSQL-Service hinzufügen.
3. Im Variablen-Bereich des App-Services `DATABASE_URL` auf
   `${{Postgres.DATABASE_URL}}` setzen. `Postgres` gegebenenfalls durch den Namen
   deines Datenbank-Services ersetzen.
4. Railway verwendet den Startbefehl aus `Procfile`; die Python-Abhängigkeiten
   werden anhand von `requirements.txt` installiert.
5. Die öffentliche HTTPS-Domain auf dem Handy öffnen und den Kamerazugriff
   erlauben.

Die drei Beispieldatensätze sind ISBNs mit CHF-Preisen. Sie können nach dem
ersten Start direkt in der PostgreSQL-Tabelle `books` angepasst werden.
