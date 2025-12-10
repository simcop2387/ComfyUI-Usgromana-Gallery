# ComfyUI-Usgromana-Gallery/server.py

import os
import urllib.parse
from aiohttp import web

import folder_paths
from server import PromptServer

GALLERY_PREFIX = "/usgromana/gallery"
OUTPUT_DIR = folder_paths.get_output_directory()

def _log(msg: str):
    print(f"[Usgromana-Gallery] {msg}", flush=True)

# --- Helper: collect images recursively ------------------------------------

IMAGE_EXTS = (".png", ".jpg", ".jpeg", ".webp", ".bmp")

def _collect_images(limit: int = 400):
    """
    Walks the entire OUTPUT_DIR tree and returns the newest `limit` images.
    Uses standard ComfyUI /view endpoint for URLs.
    """
    entries = []

    for root, dirs, files in os.walk(OUTPUT_DIR):
        for name in files:
            if not name.lower().endswith(IMAGE_EXTS):
                continue

            full = os.path.join(root, name)

            try:
                stat = os.stat(full)
            except OSError:
                continue

            # Get path relative to OUTPUT_DIR (e.g. "subfolder/image.png")
            rel = os.path.relpath(full, OUTPUT_DIR)
            
            # Split into subfolder and filename for the standard ComfyUI API
            subfolder = os.path.dirname(rel)
            filename = os.path.basename(rel)

            # Construct the standard ComfyUI view URL
            # /view?filename=X&subfolder=Y&type=output
            params = {
                "filename": filename,
                "subfolder": subfolder,
                "type": "output"
            }
            url_query = urllib.parse.urlencode(params)
            
            entries.append(
                {
                    # We keep the relative path as the ID for our delete logic
                    "filename": rel, 
                    "mtime": stat.st_mtime,
                    "size": stat.st_size,
                    "url": f"/view?{url_query}",
                }
            )

    # Newest first
    entries.sort(key=lambda e: e["mtime"], reverse=True)

    if len(entries) > limit:
        entries = entries[:limit]

    _log(f"_collect_images → {len(entries)} files")
    return entries


# --- API: list images ------------------------------------------------------

@PromptServer.instance.routes.get(f"{GALLERY_PREFIX}/list")
async def list_images(request: web.Request):
    # _log("GET /list") # Uncomment for debugging
    images = _collect_images()
    return web.json_response({"images": images})


# --- API: delete image -----------------------------------------------------

@PromptServer.instance.routes.post(f"{GALLERY_PREFIX}/delete")
async def delete_image(request: web.Request):
    data = await request.json()
    # 'filename' here is the relative path we stored earlier
    filename = (data.get("filename") or "").strip()
    
    if not filename:
        return web.json_response({"ok": False, "error": "Missing filename"}, status=400)

    # `filename` is a relative path under OUTPUT_DIR
    target = os.path.join(OUTPUT_DIR, filename)

    _log(f"DELETE requested: {target}")

    # sanity check: keep deletes inside OUTPUT_DIR
    try:
        common = os.path.commonpath([os.path.abspath(OUTPUT_DIR), os.path.abspath(target)])
        if common != os.path.abspath(OUTPUT_DIR):
            return web.json_response({"ok": False, "error": "Invalid path"}, status=400)
    except Exception:
        return web.json_response({"ok": False, "error": "Invalid path"}, status=400)

    if not os.path.isfile(target):
        return web.json_response({"ok": False, "error": "File not found"}, status=404)

    try:
        os.remove(target)
    except OSError as e:
        return web.json_response({"ok": False, "error": str(e)}, status=500)

    return web.json_response({"ok": True})
