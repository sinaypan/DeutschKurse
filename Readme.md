# DeutschKurse – Interactive PDF Library

A modern, premium web application for learning German. Organize your PDF resources and interactive reading with built-in translation and text-to-speech.

![UI Preview](https://placehold.co/800x400/050505/ffffff?text=Modern+Dark+UI)

## ✨ Features

- **📂 Organized Library**: Automatically scans categorized folders for PDFs.
- **🎨 Premium Dark UI**: Stunning glassmorphism design with smooth animations.
- **📄 Interactive PDF Viewer**: Custom PDF engine (PDF.js) for perfect rendering.
- **🧠 Personal Vocabulary**: Save words to your list and review them with flashcards.
- **📖 Progress Tracking**: Automatically remembers your page and scroll position.
- **📝 Annotations**: Highlight text in color. Click to delete (Eraser Mode).
- **🌍 Instant Translation**: Select text -> Right Click -> **Traduire (FR)**.
- **🔊 Text-to-Speech**: Select text -> Right Click -> **Lire (DE)**.
- **🚀 No Docker Required**: Uses `deep-translator` for instant, setup-free translations.

---

## 🛠️ Installation

### 1. Prerequisites
- Python 3.8+
- Internet connection (for Google Translate API)

### 2. Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd DeutschKurse

# Create virtual environment (optional but recommended)
python -m venv .venv

# Activate on Windows
.venv\Scripts\Activate

# Install dependencies
pip install -r requirements.txt
```

## 🚀 Running the App

```bash
python -m uvicorn app:app --reload
```

Then open your browser at **[http://localhost:8000](http://localhost:8000)**.

---

## 📂 Project Structure

```
DeutschKurse/
├── app.py                 # Backend (FastAPI)
├── database.py            # SQLite Database Manager
├── learning_platform.db   # User Data (Vocab, Progress, Annotations)
├── requirements.txt       # Dependencies
├── static/                # Assets (CSS, JS, PDF.js)
│   ├── styles.css         # Premium dark theme
│   ├── app.js             # Logic for context menu & API
│   └── pdfjs/             # PDF rendering engine
├── templates/             # HTML Templates
│   ├── index.html         # Library Home
│   ├── viewer.html        # Custom PDF Viewer
│   └── vocabulary.html    # Vocabulary Flashcards
└── (PDF Folders)
    ├── grammatik_wortschatz
    ├── leseverstaendnis
    └── pruefungen_tests
```

## 💡 How to Use
1. **Browse**: Click a category card to see your PDFs.
2. **Read**: Click a PDF to open the viewer.
3. **Smart Features**:
   - **Translate/Speak**: Select text -> Right Click.
   - **Save Word**: Select -> Right Click -> "Ajouter au vocabulaire".
   - **Review Words**: Click "⭐ Mon Vocabulaire" on the home page.
   - **Highlight**: Select text -> Right Click -> Choose Color.
   - **Undo Highlight**: Click "🧹 Gomme" -> Click the highlight to delete.
   - **Resume**: Just close the PDF. When you return, you'll be on the same page.
