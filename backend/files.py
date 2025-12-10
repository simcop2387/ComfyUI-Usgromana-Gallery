# ComfyUI-Usgromana-Gallery/files.py

import os
import json
from typing import Dict, Any
from folder_paths import get_output_directory, get_user_directory

GALLERY_DIR = os.path.join(get_user_directory(), "usgromana_gallery")
META_FILE = os.path.join(GALLERY_DIR, "meta.json")
LOG_FILE = os.path.join(GALLERY_DIR, "gallery.log")

os.makedirs(GALLERY_DIR, exist_ok=True)


def get_output_dir() -> str:
    return get_output_directory()


def load_meta() -> Dict[str, Any]:
    if not os.path.exists(META_FILE):
        return {}
    try:
        with open(META_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_meta(data: Dict[str, Any]) -> None:
    os.makedirs(GALLERY_DIR, exist_ok=True)
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def append_log(entry: Dict[str, Any]) -> None:
    try:
        os.makedirs(GALLERY_DIR, exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        print("[Usgromana-Gallery][LOGGER] Failed to write log:", e)
