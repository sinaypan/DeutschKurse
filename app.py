from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from pathlib import Path
import urllib.parse
import requests

app = FastAPI()

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



class TranslateReq(BaseModel):
    q: str
    source: str = "de"
    target: str = "fr"


@app.post("/api/translate")
def translate(body: TranslateReq):
    """
    Par défaut: tente LibreTranslate en local (docker)
    docker run -it -p 5000:5000 libretranslate/libretranslate
    """
    try:
        r = requests.post(
            "http://localhost:5000/translate",
            json={
                "q": body.q,
                "source": body.source,
                "target": body.target,
                "format": "text"
            },
            timeout=15,
        )
        r.raise_for_status()
        return r.json()
    except Exception:
        # Réponse claire si LibreTranslate n'est pas lancé
        return JSONResponse(
            status_code=200,
            content={
                "translatedText": "(LibreTranslate n'est pas lancé) Lance-le avec Docker, ou je peux te donner une alternative offline."
            },
        )
