# ComfyUI-Usgromana-Gallery/__init__.py

import importlib
import traceback

# Tell ComfyUI where our frontend lives
WEB_DIRECTORY = "./web"

# No Python nodes yet, just UI + API
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}


def _safe_import_backend_routes():
    """
    Import backend.routes, but never let it crash the whole extension.
    Any error will be printed instead of killing ComfyUI.
    """
    try:
        importlib.import_module(".backend.routes", __name__)
        print("[Usgromana-Gallery] backend.routes loaded.")
    except Exception as e:
        print("[Usgromana-Gallery] ERROR: failed to import backend.routes:", e)
        traceback.print_exc()


_safe_import_backend_routes()
