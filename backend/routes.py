# ComfyUI-Usgromana-Gallery/routes.py

import os
from datetime import datetime
from aiohttp import web

from server import PromptServer
from folder_paths import get_output_directory
from .files import load_meta, save_meta, append_log

ROUTE_PREFIX = "/usgromana/gallery"


def require_admin(request: web.Request) -> None:
    """
    Hook this into Usgromana auth.
    Right now it does nothing (everyone allowed).
    """
    # Example if you attach user info to request:
    # user = request.get("usg_user")
    # if not user or not user.get("is_admin"):
    #     raise web.HTTPForbidden()
    return


# ---------- LOGGING ---------------------------------------------------------

@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/log")
async def gallery_log(request: web.Request):
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

    append_log(entry)

    if level in ("WARN", "ERROR"):
        print(f"[Usgromana-Gallery][{level}][{source}] {message}")

    return web.json_response({"ok": True})


# ---------- IMAGE LIST / DELETE --------------------------------------------

@PromptServer.instance.routes.get(f"{ROUTE_PREFIX}/list")
async def gallery_list(request: web.Request):
    output_dir = get_output_directory()
    meta = load_meta()

    items = []
    try:
        filenames = sorted(os.listdir(output_dir))
    except FileNotFoundError:
        filenames = []

    for fname in filenames:
        full = os.path.join(output_dir, fname)
        if not os.path.isfile(full):
            continue

        lower = fname.lower()
        if not lower.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm")):
            continue

        st = os.stat(full)
        m = meta.get(fname, {})
        items.append({
            "filename": fname,
            "url": f"/static_gallery/{fname}",
            "size": st.st_size,
            "mtime": int(st.st_mtime),
            "tags": m.get("tags", []),
            "rating": m.get("rating", 0),
            "folder": m.get("folder", "Unsorted"),
            "workflow_id": m.get("workflow_id"),
        })

    return web.json_response(items)


@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/delete")
async def gallery_delete(request: web.Request):
    data = await request.json()
    filename = data.get("filename")
    if not filename:
        return web.json_response({"error": "missing filename"}, status=400)

    output_dir = get_output_directory()
    full = os.path.join(output_dir, filename)

    if os.path.isfile(full):
        try:
            os.remove(full)
        except Exception as e:
            print("[Usgromana-Gallery] Failed to delete file:", e)
            return web.json_response({"error": "failed to delete"}, status=500)

    meta = load_meta()
    if filename in meta:
        meta.pop(filename)
        save_meta(meta)

    return web.json_response({"ok": True})

# ---------- TAGS / RATING ---------------------------------------------------

@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/tag")
async def gallery_tag(request: web.Request):
    data = await request.json()
    filename = data.get("filename")
    tags = data.get("tags", [])

    if not filename:
        return web.json_response({"error": "missing filename"}, status=400)

    if not isinstance(tags, list):
        tags = []

    meta = load_meta()
    entry = meta.get(filename, {})
    entry["tags"] = tags
    meta[filename] = entry
    save_meta(meta)

    return web.json_response({"ok": True, "tags": tags})


@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/rate")
async def gallery_rate(request: web.Request):
    data = await request.json()
    filename = data.get("filename")
    rating = int(data.get("rating", 0))

    if not filename:
        return web.json_response({"error": "missing filename"}, status=400)

    rating = max(0, min(5, rating))

    meta = load_meta()
    entry = meta.get(filename, {})
    entry["rating"] = rating
    meta[filename] = entry
    save_meta(meta)

    return web.json_response({"ok": True, "rating": rating})

# ---------- FOLDERS (VIRTUAL) ----------------------------------------------

@PromptServer.instance.routes.get(f"{ROUTE_PREFIX}/folders")
async def gallery_folders(request: web.Request):
    require_admin(request)
    meta = load_meta()
    folders = set()

    for entry in meta.values():
        folders.add(entry.get("folder", "Unsorted"))

    if not folders:
        folders.add("Unsorted")

    return web.json_response({"folders": sorted(folders)})


@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/folders/set")
async def gallery_set_folder(request: web.Request):
    require_admin(request)
    data = await request.json()
    filename = data.get("filename")
    folder = data.get("folder") or "Unsorted"

    if not filename:
        return web.json_response({"error": "missing filename"}, status=400)

    meta = load_meta()
    entry = meta.get(filename, {})
    entry["folder"] = folder

    # auto-tag folder name
    tags = entry.get("tags", [])
    if folder not in tags:
        tags.append(folder)
    entry["tags"] = tags

    meta[filename] = entry
    save_meta(meta)

    return web.json_response({"ok": True, "folder": folder, "tags": tags})


@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/folders/delete")
async def gallery_delete_folder(request: web.Request):
    require_admin(request)
    data = await request.json()
    name = data.get("folder")
    if not name:
        return web.json_response({"error": "missing folder"}, status=400)

    meta = load_meta()
    changed = False
    for entry in meta.values():
        if entry.get("folder") == name:
            entry["folder"] = "Unsorted"
            tags = entry.get("tags", [])
            entry["tags"] = [t for t in tags if t != name]
            changed = True

    if changed:
        save_meta(meta)

    return web.json_response({"ok": True})

# ---------- WORKFLOW --------------------------------------------------------

@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/open_workflow")
async def gallery_open_workflow(request: web.Request):
    data = await request.json()
    filename = data.get("filename")
    if not filename:
        return web.json_response({"error": "missing filename"}, status=400)

    meta = load_meta()
    entry = meta.get(filename) or {}
    workflow_id = entry.get("workflow_id")

    if not workflow_id:
        return web.json_response({"error": "no workflow recorded"}, status=404)

    # 🔴 TODO: integrate with your existing Usgromana / Comfy workflow loader.
    # Example pseudocode:
    # from .workflow_loader import open_workflow_in_workspace
    # await open_workflow_in_workspace(workflow_id)

    print(f"[Usgromana-Gallery] open_workflow requested for {filename} -> {workflow_id}")
    return web.json_response({"ok": True, "workflow_id": workflow_id})
