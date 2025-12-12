# ComfyUI-Usgromana-Gallery/backend/routes.py

import os
import json
import urllib.parse
from typing import Set, Callable

from PIL import Image
from aiohttp import web
from server import PromptServer

from .files import get_output_dir, list_output_images, IMAGE_EXTENSIONS
from .file_monitor import FileMonitor
from .scanner import BackgroundScanner
from .. import ASSETS_DIR  # from root __init__.py

# Use a unique prefix to avoid clashing with Usgromana RBAC
USGROMANA_GALLERY = "/usgromana-gallery"
ROUTE_PREFIX = USGROMANA_GALLERY

# Global state for file monitoring and scanning
_file_monitor: FileMonitor | None = None
_background_scanner: BackgroundScanner | None = None
_file_change_callbacks: list[Callable] = []
_current_extensions: Set[str] = IMAGE_EXTENSIONS.copy()

# --- Helpers ------------------------------------------------------


def _json(data: dict, status: int = 200) -> web.Response:
    return web.json_response(data, status=status)


def _safe_join_output(filename: str) -> str | None:
    """
    Safely join a filename to the output directory and ensure
    it cannot escape via .. or symlinks.
    """
    output_dir = os.path.abspath(get_output_dir())
    candidate = os.path.abspath(os.path.join(output_dir, filename))

    if not candidate.startswith(output_dir + os.sep) and candidate != output_dir:
        return None
    if not os.path.isfile(candidate):
        return None
    return candidate


def _apply_nsfw_filter(request: web.Request, images):
    """
    Hook to integrate the Usgromana NSFW checker.

    By default this does nothing and returns the list unchanged.

    You can plug your existing NSFW logic here, for example:

        from ..nsfw_guard import should_show_image, get_current_user

        user = get_current_user(request)
        return [
            img for img in images
            if should_show_image(user, _safe_join_output(img.relpath))
        ]

    Make sure guests and SFW-locked users are filtered here.
    """
    # TODO (Johnny): wire this to your real NSFW checker.
    return images


# --- Static assets (icons, logos, etc.) ---------------------------

# Serve files at: /usgromana-gallery/assets/<filename>
PromptServer.instance.app.router.add_static(
    f"{ROUTE_PREFIX}/assets",
    ASSETS_DIR,
    name="usgromana_gallery_assets",
)

# --- Image listing & serving --------------------------------------


@PromptServer.instance.routes.get(f"{ROUTE_PREFIX}/list")
async def gallery_list(request: web.Request) -> web.Response:
    """
    Return basic info about images in the output directory, including
    recursive subfolders. Also returns a folder list for the UI.
    """
    try:
        # Use current extensions (may be overridden by settings)
        images = list_output_images(extensions=_current_extensions)

        # Apply NSFW filtering based on current user / SFW flag.
        images = _apply_nsfw_filter(request, images)

        base_url = f"{ROUTE_PREFIX}/image"
        payload_images = []

        # Build folder summary map
        folders_map: dict[str, dict] = {}

        for img in images:
            d = img.to_dict()
            # URL used by frontend to actually load the file
            d["url"] = f"{base_url}?filename={urllib.parse.quote(img.relpath)}"
            payload_images.append(d)

            folder = img.folder or ""
            if folder not in folders_map:
                folders_map[folder] = {
                    "path": folder,
                    "name": folder or "Output",
                    "count": 0,
                }
            folders_map[folder]["count"] += 1

        folder_list = sorted(
            folders_map.values(),
            key=lambda f: (0 if f["path"] == "" else 1, f["path"]),
        )

        return _json({"ok": True, "images": payload_images, "folders": folder_list})
    except Exception as e:
        # Don't blow up Comfy if something goes wrong
        return _json({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.get(f"{ROUTE_PREFIX}/image")
async def gallery_image(request: web.Request) -> web.StreamResponse:
    """
    Serve an image from the output directory.

    Optional query:
      - size=thumb   → return a cached thumbnail (max ~512px on the long side)
    """
    filename = request.query.get("filename")
    if not filename:
        return _json({"ok": False, "error": "Missing filename"}, status=400)

    safe_path = _safe_join_output(filename)
    if safe_path is None:
        return _json({"ok": False, "error": "File not found or invalid path"}, status=404)

    size = request.query.get("size")
    if size == "thumb":
        # Thumbnails live under <output>/_thumbs/<filename>
        base_output = get_output_dir()
        thumbs_dir = os.path.join(base_output, "_thumbs")
        os.makedirs(thumbs_dir, exist_ok=True)

        # Avoid any directory tricks by only using basename
        thumb_name = os.path.basename(filename)
        thumb_path = os.path.join(thumbs_dir, thumb_name)

        try:
            # Rebuild thumb if missing or older than source
            needs_regen = (
                not os.path.isfile(thumb_path)
                or os.path.getmtime(thumb_path) < os.path.getmtime(safe_path)
            )

            if needs_regen:
                with Image.open(safe_path) as im:
                    # Preserve aspect, cap the longest side
                    im.thumbnail((512, 512))
                    # Save as PNG regardless of original type
                    im.save(thumb_path, format="PNG")

            return web.FileResponse(path=thumb_path)
        except Exception as e:
            # Fall back to full image if thumb generation fails
            print("[Usgromana-Gallery] Thumbnail error:", e)
            return web.FileResponse(path=safe_path)

    # Default: serve original full-size image
    return web.FileResponse(path=safe_path)


# --- Batch operations ---------------------------------------------

@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/batch/delete")
async def gallery_batch_delete(request: web.Request) -> web.Response:
    """Delete multiple files. Body: { "filenames": ["path1", "path2", ...] }"""
    try:
        body = await request.json()
        filenames = body.get("filenames", [])
        
        if not isinstance(filenames, list):
            return _json({"ok": False, "error": "filenames must be a list"}, status=400)
        
        output_dir = get_output_dir()
        deleted = []
        errors = []
        
        for filename in filenames:
            if not filename or not isinstance(filename, str):
                continue
            
            safe_path = _safe_join_output(filename)
            if safe_path is None:
                errors.append(f"{filename}: invalid path")
                continue
            
            try:
                if os.path.isfile(safe_path):
                    os.remove(safe_path)
                    deleted.append(filename)
            except OSError as e:
                errors.append(f"{filename}: {str(e)}")
        
        return _json({
            "ok": True,
            "deleted": deleted,
            "errors": errors,
            "count": len(deleted),
        })
    except Exception as e:
        return _json({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.get(f"{ROUTE_PREFIX}/batch/download")
async def gallery_batch_download(request: web.Request) -> web.Response:
    """Download multiple files as ZIP. Query: ?filenames=path1,path2,path3"""
    try:
        import zipfile
        import tempfile
        from io import BytesIO
        
        filenames_str = request.query.get("filenames", "")
        if not filenames_str:
            return _json({"ok": False, "error": "Missing filenames"}, status=400)
        
        filenames = [f.strip() for f in filenames_str.split(",") if f.strip()]
        if not filenames:
            return _json({"ok": False, "error": "No valid filenames"}, status=400)
        
        output_dir = get_output_dir()
        
        # Create ZIP in memory
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for filename in filenames:
                safe_path = _safe_join_output(filename)
                if safe_path and os.path.isfile(safe_path):
                    arcname = os.path.basename(filename)  # Store just the filename in ZIP
                    zip_file.write(safe_path, arcname)
        
        zip_buffer.seek(0)
        
        response = web.Response(
            body=zip_buffer.read(),
            headers={
                "Content-Type": "application/zip",
                "Content-Disposition": 'attachment; filename="gallery_images.zip"',
            },
        )
        return response
    except Exception as e:
        return _json({"ok": False, "error": str(e)}, status=500)

# --- Ratings persistence ------------------------------------------

RATINGS_FILE = os.path.join(get_output_dir(), "usgromana_gallery_ratings.json")


def _load_ratings() -> dict:
    try:
        if not os.path.isfile(RATINGS_FILE):
            return {}
        with open(RATINGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f) or {}
    except Exception:
        return {}


def _save_ratings(data: dict) -> None:
    try:
        os.makedirs(os.path.dirname(RATINGS_FILE), exist_ok=True)
        with open(RATINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception:
        # Don't crash Comfy if disk write fails
        pass


@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/rating")
async def gallery_set_rating(request: web.Request) -> web.Response:
    """
    Persist a single rating: { "filename": "...", "rating": 1-5 }.
    """
    try:
        payload = await request.json()
    except Exception:
        return _json({"ok": False, "error": "Invalid JSON"}, status=400)

    filename = payload.get("filename")
    rating = payload.get("rating")

    if not filename or not isinstance(rating, (int, float)):
        return _json({"ok": False, "error": "Missing or invalid filename/rating"}, status=400)

    ratings = _load_ratings()
    ratings[filename] = int(rating)
    _save_ratings(ratings)

    return _json({"ok": True})


@PromptServer.instance.routes.get(f"{ROUTE_PREFIX}/ratings")
async def gallery_get_ratings(request: web.Request) -> web.Response:
    """
    Return all stored ratings as { filename: rating, ... }.
    """
    ratings = _load_ratings()
    return web.json_response(ratings)


# --- Metadata persistence -----------------------------------------

META_FILE = os.path.join(get_output_dir(), "usgromana_gallery_meta.json")


def _load_meta() -> dict:
    if not os.path.exists(META_FILE):
        return {}
    try:
        with open(META_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_meta(meta: dict) -> None:
    tmp = META_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    os.replace(tmp, META_FILE)


@PromptServer.instance.routes.get(f"{ROUTE_PREFIX}/meta")
async def gallery_get_meta(request: web.Request) -> web.Response:
    """
    Get stored metadata for a single image.
    Query: ?filename=<name>
    """
    filename = request.query.get("filename")
    if not filename:
        return _json({"ok": False, "error": "Missing filename"}, status=400)

    meta = _load_meta()
    return _json({"ok": True, "meta": meta.get(filename, {})})


@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/meta")
async def gallery_set_meta(request: web.Request) -> web.Response:
    """
    Set stored metadata for a single image.
    Body: { "filename": "...", "meta": { ... } }
    """
    try:
        body = await request.json()
    except Exception:
        return _json({"ok": False, "error": "Invalid JSON"}, status=400)

    filename = body.get("filename")
    payload = body.get("meta") or {}

    if not filename:
        return _json({"ok": False, "error": "Missing filename"}, status=400)

    meta = _load_meta()
    meta[filename] = payload
    _save_meta(meta)

    return _json({"ok": True})


# --- Optional log endpoint ----------------------------------------


@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/log")
async def gallery_log(request: web.Request) -> web.Response:
    """
    Optional logging endpoint for the web UI. Currently just discards logs.
    """
    try:
        _ = await request.json()
    except Exception:
        pass
    return _json({"ok": True})


# --- File monitoring and real-time updates -------------------------

def _on_file_change(event_type: str, file_path: str):
    """Handle file system change events."""
    try:
        output_dir = get_output_dir()
        if not file_path.startswith(output_dir):
            return
        
        relpath = os.path.relpath(file_path, output_dir).replace("\\", "/")
        
        # Notify all registered callbacks
        for callback in _file_change_callbacks:
            try:
                callback(event_type, relpath)
            except Exception as e:
                print(f"[Usgromana-Gallery] File change callback error: {e}")
    except Exception as e:
        print(f"[Usgromana-Gallery] File change handler error: {e}")


def _init_file_monitoring():
    """Initialize file monitoring system."""
    global _file_monitor, _background_scanner
    
    try:
        output_dir = get_output_dir()
        if not os.path.isdir(output_dir):
            return
        
        # Initialize background scanner
        def on_scan_complete(images):
            # This will be called when background scan completes
            # The frontend will poll for updates, so we don't need to push here
            pass
        
        _background_scanner = BackgroundScanner(on_scan_complete, _current_extensions)
        _background_scanner.start_scan()
        
        # Initialize file monitor
        _file_monitor = FileMonitor(output_dir, _on_file_change, _current_extensions)
        _file_monitor.start(use_polling=False)  # Can be configured via settings
        
    except Exception as e:
        print(f"[Usgromana-Gallery] Failed to initialize file monitoring: {e}")


@PromptServer.instance.routes.get(f"{ROUTE_PREFIX}/watch")
async def gallery_watch(request: web.Request) -> web.Response:
    """
    WebSocket-like endpoint for file change notifications.
    Returns current state and can be polled for updates.
    """
    # For now, return a simple endpoint that can be polled
    # In the future, this could be upgraded to WebSocket
    return _json({"ok": True, "monitoring": _file_monitor.running if _file_monitor else False})


@PromptServer.instance.routes.post(f"{ROUTE_PREFIX}/settings")
async def gallery_save_settings(request: web.Request) -> web.Response:
    """Save gallery settings to server."""
    try:
        body = await request.json()
        settings = body.get("settings", {})
        
        # Save to user_settings.json in output directory
        settings_file = os.path.join(get_output_dir(), "usgromana_gallery_settings.json")
        os.makedirs(os.path.dirname(settings_file), exist_ok=True)
        
        # Merge with existing settings
        existing = {}
        if os.path.exists(settings_file):
            try:
                with open(settings_file, "r", encoding="utf-8") as f:
                    existing = json.load(f) or {}
            except Exception:
                pass
        
        merged = {**existing, **settings}
        
        with open(settings_file, "w", encoding="utf-8") as f:
            json.dump(merged, f, indent=2)
        
        # Update file extensions if changed
        if "fileExtensions" in settings:
            extensions = set(settings["fileExtensions"].split(","))
            extensions = {ext.strip().lower() for ext in extensions if ext.strip()}
            if extensions:
                _current_extensions.clear()
                _current_extensions.update(extensions)
                if _file_monitor:
                    _file_monitor.update_extensions(_current_extensions)
        
        # Update polling mode if changed
        if "usePollingObserver" in settings and _file_monitor:
            _file_monitor.update_polling(bool(settings["usePollingObserver"]))
        
        return _json({"ok": True})
    except Exception as e:
        return _json({"ok": False, "error": str(e)}, status=500)


@PromptServer.instance.routes.get(f"{ROUTE_PREFIX}/settings")
async def gallery_get_settings(request: web.Request) -> web.Response:
    """Load gallery settings from server."""
    try:
        settings_file = os.path.join(get_output_dir(), "usgromana_gallery_settings.json")
        if os.path.exists(settings_file):
            with open(settings_file, "r", encoding="utf-8") as f:
                settings = json.load(f) or {}
                return _json({"ok": True, "settings": settings})
        return _json({"ok": True, "settings": {}})
    except Exception as e:
        return _json({"ok": False, "error": str(e)}, status=500)


# Initialize file monitoring when routes are loaded
_init_file_monitoring()
