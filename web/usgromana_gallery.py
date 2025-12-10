# custom_nodes/usgromana_gallery/usgromana_gallery.py

import os
import io
import json
import sqlite3
from datetime import datetime
from aiohttp import web
from pathlib import Path
from typing import Optional, Dict, Any, List

from aiohttp import web

import folder_paths
from server import PromptServer

META_DIR = os.path.join(get_user_directory(), "usgromana_gallery")
LOG_FILE = os.path.join(META_DIR, "gallery.log")

os.makedirs(META_DIR, exist_ok=True)


def _append_log_entry(entry: dict):
    try:
        os.makedirs(META_DIR, exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        # Worst case: print to server console
        print("[Usgromana-Gallery][LOGGER] Failed to write log:", e)


@PromptServer.instance.routes.post("/usgromana/gallery/log")
async def gallery_log(request):
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)

    level = str(data.get("level", "INFO")).upper()
    source = str(data.get("source", "frontend"))
    message = str(data.get("message", ""))
    extra = data.get("extra") or None

    entry = {
        "ts": datetime.utcnow().isoformat(timespec="milliseconds") + "Z",
        "level": level,
        "source": source,
        "message": message,
        "extra": extra,
    }

    _append_log_entry(entry)

    # Mirror WARN/ERROR to console for quick visibility
    if level in ("WARN", "ERROR"):
        print(f"[Usgromana-Gallery][{level}][{source}] {message}")

    return web.json_response({"ok": True})

try:
    # If Usgromana is installed, you already had something like this:
    from ..usgromana.globals import users_db, current_username_var
    USGROMANA_MODE = True
except Exception:
    users_db = None
    current_username_var = None
    USGROMANA_MODE = False

# ---------- CONFIG ----------

GALLERY_DIR = Path(folder_paths.get_output_directory()) / "usgromana_gallery"
GALLERY_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = GALLERY_DIR / "gallery.db"


def _get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    conn = _get_db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            user TEXT,
            workflow_name TEXT,
            workflow_id TEXT,
            prompt TEXT,
            seed TEXT,
            tags TEXT,
            created_at TEXT,
            favorite INTEGER DEFAULT 0,
            deleted INTEGER DEFAULT 0,
            metadata_json TEXT
        )
        """
    )
    conn.commit()
    conn.close()


_init_db()


def _now_iso():
    return datetime.datetime.utcnow().isoformat()


def _get_current_user() -> str:
    if USGROMANA_MODE and current_username_var is not None:
        try:
            return current_username_var.get() or "anonymous"
        except Exception:
            return "anonymous"
    return "anonymous"


def _is_admin(username: str) -> bool:
    """Usgromana-aware admin check. Adjust to match your UsersDB API."""
    if not username or not USGROMANA_MODE or users_db is None:
        # In non-Usgromana mode, treat everyone as admin (or change this if you want).
        return True

    try:
        # You probably have something like users_db.get_user or get_user_groups.
        # Adjust to your real API.
        user = users_db.get_user(username)
        groups = user.get("groups", []) if isinstance(user, dict) else []
        return "admin" in groups or "power" in groups
    except Exception:
        return False


# ---------- REST API ----------

async def api_list_gallery(request: web.Request):
    user = _get_current_user()
    params = request.rel_url.query

    page = int(params.get("page", "1"))
    per_page = int(params.get("per_page", "40"))
    search = params.get("search", "").strip()
    only_user = params.get("user", "").strip()
    include_deleted = params.get("include_deleted", "0") == "1"
    favorites_only = params.get("favorites", "0") == "1"

    conn = _get_db()
    cur = conn.cursor()

    where = []
    args: List[Any] = []

    if not include_deleted:
        where.append("deleted = 0")

    if favorites_only:
        where.append("favorite = 1")

    # If Usgromana mode + non-admin: force filter to current user
    if USGROMANA_MODE and not _is_admin(user):
        where.append("(user = ? OR user IS NULL)")
        args.append(user)
    else:
        if only_user:
            where.append("user = ?")
            args.append(only_user)

    if search:
        where.append("(workflow_name LIKE ? OR prompt LIKE ? OR tags LIKE ?)")
        like = f"%{search}%"
        args.extend([like, like, like])

    where_clause = " WHERE " + " AND ".join(where) if where else ""
    offset = (page - 1) * per_page

    count_sql = f"SELECT COUNT(*) AS c FROM images{where_clause}"
    cur.execute(count_sql, args)
    total = cur.fetchone()["c"]

    sql = f"""
        SELECT id, filename, user, workflow_name, workflow_id, prompt, seed,
               tags, created_at, favorite, deleted, metadata_json
        FROM images
        {where_clause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    """
    cur.execute(sql, args + [per_page, offset])
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    for r in rows:
        r["favorite"] = bool(r["favorite"])
        r["deleted"] = bool(r["deleted"])

    return web.json_response(
        {
            "items": rows,
            "page": page,
            "per_page": per_page,
            "total": total,
            "usgromana_mode": USGROMANA_MODE,
            "current_user": user,
            "is_admin": _is_admin(user),
        }
    )


async def api_toggle_favorite(request: web.Request):
    user = _get_current_user()
    data = await request.json()
    img_id = int(data.get("id"))

    conn = _get_db()
    cur = conn.cursor()
    cur.execute("SELECT user, favorite FROM images WHERE id = ?", (img_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return web.json_response({"error": "not_found"}, status=404)

    owner = row["user"]
    # Non-admins can only favorite their own images
    if USGROMANA_MODE and not _is_admin(user) and owner and owner != user:
        conn.close()
        return web.json_response({"error": "forbidden"}, status=403)

    new_val = 0 if row["favorite"] else 1
    cur.execute("UPDATE images SET favorite = ? WHERE id = ?", (new_val, img_id))
    conn.commit()
    conn.close()

    return web.json_response({"id": img_id, "favorite": bool(new_val)})


async def api_soft_delete(request: web.Request):
    user = _get_current_user()
    data = await request.json()
    img_ids = data.get("ids", [])
    if not isinstance(img_ids, list):
        img_ids = [img_ids]

    conn = _get_db()
    cur = conn.cursor()

    updated = []
    for img_id in img_ids:
        cur.execute("SELECT user, deleted FROM images WHERE id = ?", (img_id,))
        row = cur.fetchone()
        if not row:
            continue
        owner = row["user"]
        is_deleted = bool(row["deleted"])

        # Non-admins can only delete their own items
        if USGROMANA_MODE and not _is_admin(user) and owner and owner != user:
            continue

        if not is_deleted:
            cur.execute(
                "UPDATE images SET deleted = 1 WHERE id = ?",
                (img_id,),
            )
            updated.append(img_id)

    conn.commit()
    conn.close()

    return web.json_response({"deleted_ids": updated})


async def api_purge_deleted(request: web.Request):
    user = _get_current_user()
    if not _is_admin(user):
        return web.json_response({"error": "forbidden"}, status=403)

    conn = _get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, filename FROM images WHERE deleted = 1")
    rows = cur.fetchall()

    purged = []
    for row in rows:
        img_id = row["id"]
        filename = row["filename"]
        img_path = GALLERY_DIR / filename
        try:
            if img_path.exists():
                img_path.unlink()
        except Exception:
            # ignore filesystem errors for now
            pass
        cur.execute("DELETE FROM images WHERE id = ?", (img_id,))
        purged.append(img_id)

    conn.commit()
    conn.close()

    return web.json_response({"purged_ids": purged})


# ---------- NODE: SaveToGallery ----------

import torch
import numpy as np
from PIL import Image


def tensor_to_pil(img: torch.Tensor) -> Image.Image:
    # img: [H, W, C] (0..1)
    arr = (img.cpu().numpy().clip(0, 1) * 255).astype(np.uint8)
    return Image.fromarray(arr)


class SaveToGallery:
    """
    A simple node that saves images into the usgromana_gallery folder
    and indexes them in gallery.db for the web UI to consume.

    You’ll probably want to add more metadata inputs as needed.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
            },
            "optional": {
                "workflow_name": ("STRING", {"default": ""}),
                "workflow_id": ("STRING", {"default": ""}),
                "prompt": ("STRING", {"default": ""}),
                "seed": ("STRING", {"default": ""}),
                "tags": ("STRING", {"default": ""}),
            },
        }

    RETURN_TYPES = ()
    FUNCTION = "save"
    CATEGORY = "Usgromana/Gallery"

    def save(self, images, workflow_name="", workflow_id="", prompt="", seed="", tags=""):
        user = _get_current_user()
        conn = _get_db()
        cur = conn.cursor()

        # images: [B, H, W, C]
        if not isinstance(images, torch.Tensor):
            return ()

        os.makedirs(GALLERY_DIR, exist_ok=True)

        b, h, w, c = images.shape
        for i in range(b):
            pil = tensor_to_pil(images[i])
            ts = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
            filename = f"gal_{ts}_{i}.png"
            path = GALLERY_DIR / filename
            pil.save(path)

            metadata = {
                "user": user,
                "workflow_name": workflow_name,
                "workflow_id": workflow_id,
                "prompt": prompt,
                "seed": seed,
                "tags": tags,
            }

            cur.execute(
                """
                INSERT INTO images
                (filename, user, workflow_name, workflow_id, prompt, seed,
                 tags, created_at, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    filename,
                    user,
                    workflow_name or None,
                    workflow_id or None,
                    prompt or None,
                    seed or None,
                    tags or None,
                    _now_iso(),
                    json.dumps(metadata, ensure_ascii=False),
                ),
            )

        conn.commit()
        conn.close()
        return ()

# ---------- REGISTER NODE EXPORTS ----------

NODE_CLASS_MAPPINGS = {
    "SaveToGallery": SaveToGallery,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SaveToGallery": "Save To Usgromana Gallery",
}

# Do NOT call register_routes() here.
# It is called from __init__.py.


def register_routes():
    app = PromptServer.instance.app
    routes = [
        web.get("/usgromana/gallery/list", api_list_gallery),
        web.post("/usgromana/gallery/favorite", api_toggle_favorite),
        web.post("/usgromana/gallery/delete", api_soft_delete),
        web.post("/usgromana/gallery/purge", api_purge_deleted),
    ]
    app.add_routes(routes)


register_routes()
