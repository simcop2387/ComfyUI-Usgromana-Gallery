// web/ui/overlay.js
import { getLogger } from "../core/logger.js";

let overlayRoot = null;

export function initOverlay() {
    const log = getLogger("Overlay");

    if (overlayRoot) {
        log.debug("Overlay already initialized.");
        return overlayRoot;
    }

    overlayRoot = document.createElement("div");
    overlayRoot.id = "usgromana-gallery-overlay";

    Object.assign(overlayRoot.style, {
        position: "fixed",
        inset: "0",
        zIndex: "9998",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(3, 7, 18, 0.25)",
        backdropFilter: "blur(22px) saturate(1.4)",
        WebkitBackdropFilter: "blur(22px) saturate(1.4)",
    });

    const panel = document.createElement("div");
    panel.id = "usgromana-gallery-panel";
    Object.assign(panel.style, {
        width: "86vw",
        maxWidth: "1400px",
        height: "82vh",
        borderRadius: "16px",
        background: "rgba(10, 20, 40, 0.45)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 22px 70px rgba(0,0,0,0.7)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "#e5e7eb",
        fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    });

    overlayRoot.appendChild(panel);
    document.body.appendChild(overlayRoot);

    overlayRoot.addEventListener("click", (e) => {
        if (e.target === overlayRoot) hideOverlay();
    });

    log.info("Overlay initialized.");
    return overlayRoot;
}

export function getOverlayPanel() {
    return document.getElementById("usgromana-gallery-panel");
}

export function showOverlay() {
    if (!overlayRoot) initOverlay();
    overlayRoot.style.display = "flex";
}

export function hideOverlay() {
    if (!overlayRoot) return;
    overlayRoot.style.display = "none";
}
