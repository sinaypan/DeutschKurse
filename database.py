import sqlite3
import json
from datetime import datetime

DB_NAME = "learning_platform.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # 1. Vocabulary Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS vocabulary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original TEXT NOT NULL,
            translation TEXT NOT NULL,
            context TEXT,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. Progress Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS progress (
            filename TEXT PRIMARY KEY,
            page_num INTEGER,
            scroll_top INTEGER,
            last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 3. Annotations Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS annotations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            page_num INTEGER NOT NULL,
            rects_json TEXT NOT NULL, -- JSON list of coordinates
            color TEXT NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()
    print(f"Database {DB_NAME} initialized.")

# -- Vocabulary Operations --

def add_vocab(original, translation, context=""):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('INSERT INTO vocabulary (original, translation, context) VALUES (?, ?, ?)',
              (original, translation, context))
    conn.commit()
    vocab_id = c.lastrowid
    conn.close()
    return vocab_id

def get_vocab():
    conn = get_db_connection()
    vocab = conn.execute('SELECT * FROM vocabulary ORDER BY added_at DESC').fetchall()
    conn.close()
    return [dict(row) for row in vocab]

def delete_vocab(vocab_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM vocabulary WHERE id = ?', (vocab_id,))
    conn.commit()
    conn.close()

# -- Progress Operations --

def save_progress(filename, page_num, scroll_top):
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO progress (filename, page_num, scroll_top, last_read_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(filename) DO UPDATE SET
            page_num=excluded.page_num,
            scroll_top=excluded.scroll_top,
            last_read_at=CURRENT_TIMESTAMP
    ''', (filename, page_num, scroll_top))
    conn.commit()
    conn.close()

def get_progress(filename):
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM progress WHERE filename = ?', (filename,)).fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

# -- Annotation Operations --

def add_annotation(filename, page_num, rects_json, color, note=""):
    conn = get_db_connection()
    # Normalize valid JSON string
    if not isinstance(rects_json, str):
        rects_json = json.dumps(rects_json)
        
    c = conn.cursor()
    c.execute('INSERT INTO annotations (filename, page_num, rects_json, color, note) VALUES (?, ?, ?, ?, ?)',
              (filename, page_num, rects_json, color, note))
    conn.commit()
    ann_id = c.lastrowid
    conn.close()
    return ann_id

def get_annotations(filename):
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM annotations WHERE filename = ?', (filename,)).fetchall()
    conn.close()
    results = []
    for row in rows:
        d = dict(row)
        # Parse JSON back to object
        try:
            d['rects'] = json.loads(d['rects_json'])
        except:
            d['rects'] = []
        del d['rects_json']
        results.append(d)
    return results

def delete_annotation(ann_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM annotations WHERE id = ?', (ann_id,))
    conn.commit()
    conn.close()
