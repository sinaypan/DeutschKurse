# DeutschKurse – Interactive PDF Library (German Learning)

DeutschKurse is a simple web application that organizes German learning PDFs into categories and provides an **interactive reading experience** directly in your browser.

Browse PDFs by category  
Open and read PDFs in a clean interface  
Select a word/sentence → **Right click** → **Read aloud (German)** / **Translate (French)**  
Works locally on Windows / Linux / macOS

---

## Project Structure

Your folders should look like this:

```

DeutschKurse/
app.py

grammatik_wortschatz/
German.pdf
...

leseverstaendnis/
...

pruefungen_tests/
...

templates/
index.html
viewer.html

static/
app.js
pdf_viewer.js
styles.css
pdfjs/
build/
web/

````

---

## Categories (German)

- **Grammatik und Wortschatz** → `grammatik_wortschatz/`
- **Leseverständnis** → `leseverstaendnis/`
- **Prüfungen und Tests** → `pruefungen_tests/`

---

## Features

### PDF Library
- Automatically scans all PDF files inside the folders
- Displays PDFs in a clean homepage interface

### Text-to-Speech (German)
- Select text inside a PDF
- Right click → **Lire (DE)**
- Uses **Web Speech API** (free, built-in browser feature)

### Translation (German → French)
- Right click → **Traduire (FR)**
- Uses **LibreTranslate** (optional / recommended)

---

## Installation

### 1) Create & activate a Python environment (recommended)

```bash
python -m venv .venv
````

**Windows (PowerShell):**

```bash
.venv\Scripts\Activate.ps1
```

**Windows (cmd):**

```bash
.venv\Scripts\activate.bat
```

**macOS / Linux:**

```bash
source .venv/bin/activate
```

---

### 2) Install dependencies

```bash
pip install fastapi uvicorn jinja2 requests
```

---

## Run the app

From the project root:

```bash
python -m uvicorn app:app --reload
```

Then open:

[http://127.0.0.1:8000/](http://127.0.0.1:8000/)

---

## (Optional) Enable Translation with LibreTranslate

If you want the **Translate (FR)** button to actually work, start LibreTranslate using Docker:

```bash
docker run -it -p 5000:5000 libretranslate/libretranslate
```

Then translation will work automatically inside the app.

LibreTranslate runs locally (free)
No Google API key required

---

## Notes / Limitations

* **Text selection works only if the PDF contains real text**
  (scanned image PDFs will not allow text selection → OCR would be needed)

* Text-to-speech quality depends on your browser/system voice
  (Edge and Chrome on Windows usually work great)

---

## Future Improvements (Ideas)

* Search bar (filter PDFs by name)
* Add OCR support for scanned PDFs
* Save vocabulary list / flashcards
* Dark/light mode toggle
* Export selected text to a notebook

---
