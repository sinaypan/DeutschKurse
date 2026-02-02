from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from pathlib import Path
import urllib.parse
import requests

import database

app = FastAPI()

@app.on_event("startup")
def startup_event():
    database.init_db()

BASE_DIR = Path(__file__).parent

# Tes 3 dossiers (noms EXACTS)
CATEGORIES = {
    "grammar": "grammatik_wortschatz",
    "reading": "leseverstaendnis",
    "tests": "pruefungen_tests",
}

templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Sert /static/*
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


def safe_url(path: str) -> str:
    # Encode proprement espaces/accents pour URL
    return urllib.parse.quote(path)


def scan_pdfs():
    """
    Retourne une structure:
    [
      {
        "slug": "grammar",
        "title": "Grammatik und Wortschatz",
        "groups": [
           {"folder": "A1", "items":[{"name":"x.pdf","rel":"A1/x.pdf","view_url":...}, ...]},
           {"folder": "(racine)", ...}
        ]
      }, ...
    ]
    """
    result = []
    for slug, folder_name in CATEGORIES.items():
        root = BASE_DIR / folder_name
        if not root.exists() or not root.is_dir():
            # Si le dossier n'existe pas, on le met vide plutôt que crash
            result.append({"slug": slug, "title": folder_name, "groups": []})
            continue

        # regroupe par sous-dossier
        groups = {}
        for pdf_path in root.rglob("*.pdf"):
            rel = pdf_path.relative_to(root).as_posix()  # ex: "A1/file.pdf" ou "file.pdf"
            parent = pdf_path.parent.relative_to(root).as_posix()
            if parent == ".":
                parent = "(racine)"

            view_url = f"/view/{slug}/{safe_url(rel)}"
            groups.setdefault(parent, []).append({
                "name": pdf_path.name,
                "rel": rel,
                "view_url": view_url
            })

        # tri
        group_list = []
        for folder, items in sorted(groups.items(), key=lambda x: x[0].lower()):
            items_sorted = sorted(items, key=lambda x: x["name"].lower())
            group_list.append({"folder": folder, "pdfs": items_sorted})

        result.append({"slug": slug, "title": folder_name, "groups": group_list})

    return result


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    cats = scan_pdfs()
    return templates.TemplateResponse("index.html", {"request": request, "categories": cats})


@app.get("/pdf/{cat_slug}/{pdf_relpath:path}")
def serve_pdf(cat_slug: str, pdf_relpath: str):
    if cat_slug not in CATEGORIES:
        raise HTTPException(status_code=404, detail="Unknown category")

    folder_name = CATEGORIES[cat_slug]
    root = BASE_DIR / folder_name
    path = (root / pdf_relpath).resolve()

    # sécurité: empêche ../
    if not str(path).startswith(str(root.resolve())):
        raise HTTPException(status_code=400, detail="Invalid path")

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="PDF not found")

    return FileResponse(str(path), media_type="application/pdf")


@app.get("/view/{cat_slug}/{pdf_relpath:path}", response_class=HTMLResponse)
def view_pdf(request: Request, cat_slug: str, pdf_relpath: str):
    if cat_slug not in CATEGORIES:
        raise HTTPException(status_code=404, detail="Unknown category")

    title = CATEGORIES[cat_slug]
    pdf_url = f"/pdf/{cat_slug}/{safe_url(pdf_relpath)}#toolbar=1&navpanes=0"

    return templates.TemplateResponse(
        "viewer.html",
        {
            "request": request,
            "title": title,
            "filename": pdf_relpath,
            "pdf_url": pdf_url
        }
    )

@app.get("/vocab", response_class=HTMLResponse)
def view_vocabulary(request: Request):
    return templates.TemplateResponse("vocabulary.html", {"request": request})



class TranslateReq(BaseModel):
    q: str
    source: str = "de"
    target: str = "fr"


from deep_translator import GoogleTranslator

@app.post("/api/translate")
def translate(body: TranslateReq):
    """
    Utilise deep-translator (Google Translate) directement.
    Plus besoin de Docker.
    """
    try:
        # deep-translator gère la plupart des exceptions
        # source='de', target='fr' par défaut dans le modèle, mais on peut forcer 'auto'
        translator = GoogleTranslator(source=body.source, target=body.target)
        translation = translator.translate(body.q)
        
        return {"translatedText": translation}
    except Exception as e:
        print(f"Translation error: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "translatedText": "Erreur de traduction (connexion internet requise)."
            },
        )

# -- Vocabulary API --

class VocabItem(BaseModel):
    original: str
    translation: str
    context: str = ""

@app.get("/api/vocab")
def get_vocabulary():
    return database.get_vocab()

@app.post("/api/vocab")
def add_vocabulary(item: VocabItem):
    # Check if duplicate? For now, allowing duplicates or simple inserts
    new_id = database.add_vocab(item.original, item.translation, item.context)
    return {"id": new_id, "status": "added"}

@app.delete("/api/vocab/{vocab_id}")
def delete_vocabulary(vocab_id: int):
    database.delete_vocab(vocab_id)
    return {"status": "deleted"}

# -- Progress API --

class ProgressItem(BaseModel):
    filename: str
    page_num: int
    scroll_top: int

@app.get("/api/progress/{filename:path}")
def get_progress(filename: str):
    prog = database.get_progress(filename)
    return prog if prog else {}

@app.post("/api/progress")
def save_progress(item: ProgressItem):
    database.save_progress(item.filename, item.page_num, item.scroll_top)
    return {"status": "saved"}

# -- Annotation API --

class AnnotationItem(BaseModel):
    filename: str
    page_num: int
    rects: list
    color: str
    note: str = ""

@app.get("/api/annotations/{filename:path}")
def get_annotations(filename: str):
    return database.get_annotations(filename)

@app.post("/api/annotations")
def add_annotation(item: AnnotationItem):
    # Pass dict or list to database, handled by helper
    import json
    new_id = database.add_annotation(item.filename, item.page_num, json.dumps(item.rects), item.color, item.note)
    return {"id": new_id, "status": "added"}

@app.delete("/api/annotations/{ann_id}")
def delete_annotation(ann_id: int):
    database.delete_annotation(ann_id)
    return {"status": "deleted"}
