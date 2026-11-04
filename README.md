# Buchscanner

Eine kleine, mobilfreundliche Web-App: Buch-ISBN per Handykamera scannen oder
manuell eingeben und Titel sowie Preis aus PostgreSQL anzeigen lassen.

## Lokal starten

Voraussetzungen: Node.js 20+ und PostgreSQL.

1. Abhängigkeiten installieren: `npm install`
2. `DATABASE_URL` auf die PostgreSQL-Verbindung setzen, zum Beispiel
   `postgresql://postgres:passwort@localhost:5432/buchscanner`
3. Frontend starten und bauen: `npm run build`
4. Server starten: `npm start`
5. Die App unter `http://localhost:3000` öffnen.

Beim ersten Start wird die Tabelle `books` erstellt und mit drei Beispielen
befüllt. Vorhandene Datensätze werden nicht überschrieben. Bücher und Preise
werden ausschliesslich in PostgreSQL gespeichert.

Im Katalog zeigt die App zu jedem Buch auch einen scannbaren EAN-13-Barcode.
Zum Testen öffnest du die Seite auf einem Computer und scannst den angezeigten
Barcode mit dem Handy. Ein Handy kann nicht gleichzeitig seinen eigenen
Bildschirm mit der eigenen Kamera scannen.

Für den Kamerazugriff auf dem Handy muss die App über HTTPS geöffnet werden.
Auf Railway wird HTTPS automatisch bereitgestellt. Zum lokalen Testen auf einem
Handy braucht es ebenfalls eine HTTPS-Adresse; andernfalls kann der Barcode
manuell eingegeben werden.

## Auf Railway deployen

1. Dieses Projekt in ein Git-Repository pushen und das Repository in Railway
   als neues Projekt deployen.
2. Im Railway-Projekt einen PostgreSQL-Service hinzufügen.
3. Im Variablen-Bereich des App-Services `DATABASE_URL` auf die Variable
   `${{Postgres.DATABASE_URL}}` setzen (den Namen `Postgres` an den Namen des
   Datenbank-Services anpassen).
4. Railway verwendet `npm start`; der Build läuft über `npm run build`.
5. Die öffentliche HTTPS-Domain des App-Services auf dem Handy öffnen und den
   Kamerazugriff erlauben.

Die drei Beispieldatensätze sind ISBNs mit CHF-Preisen und können nach dem
ersten Start direkt in der PostgreSQL-Tabelle `books` angepasst werden.
