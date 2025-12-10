// web/core/entry.js
import { getLogger } from "./logger.js";
import { api } from "./api.js";
import { setImages } from "./state.js";
import { initOverlay, showOverlay } from "../ui/overlay.js";
import { initGrid } from "../ui/grid.js";
import { initDetails } from "../ui/details.js";

const log = getLogger("Entry");

export async function initGalleryExtension() {
    initOverlay();
    initGrid();
    initDetails();

    try {
        await refreshGalleryImages();
        log.info("Initial images loaded", { count: items?.length ?? 0 });
    } catch (err) {
        log.error("Failed to load images", { error: String(err) });
    }

    createFloatingButton();
}

export async function refreshGalleryImages() {
    try {
        const items = await api.listImages();
        setImages(items || []);
    } catch (err) {
        console.error("[Usgromana-Gallery] Failed to refresh images", err);
    }
}

function createFloatingButton() {
    const btn = document.createElement("button");
    btn.id = "usgromana-gallery-fab";
    btn.textContent = "Gallery";

    Object.assign(btn.style, {
        position: "fixed",
        right: "18px",
        bottom: "18px",
        zIndex: "9999",
        padding: "8px 16px",
        borderRadius: "999px",
        border: "1px solid rgba(148,163,184,0.8)",
        background:
            "radial-gradient(circle at top left, #3b82f6, #0f172a)",
        color: "#e5e7eb",
        fontSize: "13px",
        cursor: "pointer",
        boxShadow: "0 14px 30px rgba(15,23,42,0.9)",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
    });

    btn.onclick = () => showOverlay();

    document.body.appendChild(btn);
}
