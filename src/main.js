import { BrowserMultiFormatReader } from "@zxing/browser";
import "./style.css";

const camera = document.querySelector("#camera");
const cameraPlaceholder = document.querySelector("#camera-placeholder");
const startButton = document.querySelector("#start-camera");
const statusMessage = document.querySelector("#status");
const form = document.querySelector("#lookup-form");
const barcodeInput = document.querySelector("#barcode-input");
const resultPanel = document.querySelector("#book-result");
const bookTitle = document.querySelector("#book-title");
const bookBarcode = document.querySelector("#book-barcode");
const bookPrice = document.querySelector("#book-price");
const bookList = document.querySelector("#book-list");
const bookCount = document.querySelector("#book-count");
const reader = new BrowserMultiFormatReader();

let scannerControls;

function setStatus(message, state = "") {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
}

function normalizeBarcode(value) {
  return value.replace(/[\s-]/g, "");
}

async function showBook(barcode) {
  const normalizedBarcode = normalizeBarcode(barcode);
  if (!normalizedBarcode) {
    setStatus("Bitte gib einen Barcode ein.", "error");
    return;
  }

  try {
    const response = await fetch(`/api/books/${encodeURIComponent(normalizedBarcode)}`);
    const book = await response.json();

    if (!response.ok) {
      resultPanel.hidden = true;
      setStatus(book.error || "Das Buch konnte nicht gefunden werden.", "error");
      return;
    }

    bookTitle.textContent = book.title;
    bookBarcode.textContent = `ISBN ${book.barcode}`;
    bookPrice.textContent = new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: book.currency,
    }).format(Number(book.price));
    resultPanel.hidden = false;
    setStatus("Buch erfolgreich gefunden.", "success");
    barcodeInput.value = book.barcode;
  } catch (error) {
    console.error("Buch konnte nicht geladen werden:", error);
    setStatus("Verbindung fehlgeschlagen. Bitte versuche es nochmals.", "error");
  }
}

async function loadCatalog() {
  try {
    const response = await fetch("/api/books");
    if (!response.ok) {
      throw new Error(`Katalog konnte nicht geladen werden (${response.status}).`);
    }

    const books = await response.json();
    bookCount.textContent = `${books.length} ${books.length === 1 ? "Buch" : "Bücher"}`;
    bookList.replaceChildren();

    for (const book of books) {
      const item = document.createElement("li");
      const title = document.createElement("span");
      const price = document.createElement("strong");
      title.textContent = book.title;
      price.textContent = new Intl.NumberFormat("de-CH", {
        style: "currency",
        currency: book.currency,
      }).format(Number(book.price));
      item.append(title, price);
      bookList.append(item);
    }
  } catch (error) {
    console.error("Katalog konnte nicht geladen werden:", error);
    bookCount.textContent = "Nicht verfügbar";
    setStatus("Der Katalog konnte nicht geladen werden.", "error");
  }
}

startButton.addEventListener("click", async () => {
  if (scannerControls) {
    scannerControls.stop();
    scannerControls = undefined;
    cameraPlaceholder.hidden = false;
    startButton.textContent = "Kamera starten";
    setStatus("Kamera wurde gestoppt.");
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("Dein Browser unterstützt keinen Kamerazugriff.", "error");
    return;
  }

  try {
    setStatus("Kamera wird gestartet …");
    scannerControls = await reader.decodeFromVideoDevice(
      undefined,
      camera,
      (result, _error, controls) => {
        if (result) {
          controls.stop();
          scannerControls = undefined;
          cameraPlaceholder.hidden = false;
          startButton.textContent = "Kamera starten";
          void showBook(result.getText());
        }
      },
    );
    cameraPlaceholder.hidden = true;
    startButton.textContent = "Kamera stoppen";
    setStatus("Kamera aktiv – halte den Barcode ins Bild.", "success");
  } catch (error) {
    console.error("Kamera konnte nicht gestartet werden:", error);
    scannerControls?.stop();
    scannerControls = undefined;
    cameraPlaceholder.hidden = false;
    startButton.textContent = "Kamera starten";
    setStatus(
      "Kamera nicht verfügbar. Erlaube den Zugriff oder gib den Barcode unten ein.",
      "error",
    );
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void showBook(barcodeInput.value);
});

void loadCatalog();
