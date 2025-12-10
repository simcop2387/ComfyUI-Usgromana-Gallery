// web/ui/grid.js
import { getLogger } from "../core/logger.js";
import { subscribe, getFilteredImages, setSelectedIndex } from "../core/state.js";
import { getOverlayPanel } from "./overlay.js";
import { emit } from "../js/events.js";

let gridEl = null;

export function initGrid() {
    const log = getLogger("Grid");
    const panel = getOverlayPanel();
    if (!panel) {
        log.error("No overlay panel found for grid.");
        return;
    }

    const container = document.createElement("div");
    Object.assign(container.style, {
        flex: "1",
        display: "flex",
        flexDirection: "column",
    });

    gridEl = document.createElement("div");
    Object.assign(gridEl.style, {
        flex: "1",
        padding: "12px 16px 8px 16px",
        overflow: "auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px",
    });

    container.appendChild(gridEl);
    panel.appendChild(container);

    subscribe(renderGrid);

    log.info("Grid initialized.");
}

function renderGrid() {
    if (!gridEl) return;
    const images = getFilteredImages();
    gridEl.innerHTML = "";

    if (!images.length) {
        const empty = document.createElement("div");
        empty.innerHTML =
            "<div style='font-size:36px;margin-bottom:6px;'>🖼️</div>No images yet.";
        Object.assign(empty.style, {
            gridColumn: "1 / -1",
            textAlign: "center",
            paddingTop: "40px",
            fontSize: "13px",
            opacity: "0.7",
        });
        gridEl.appendChild(empty);
        return;
    }

    images.forEach((img, index) => {
        const card = document.createElement("div");
        Object.assign(card.style, {
            borderRadius: "14px",
            overflow: "hidden",
            background: "rgba(15, 23, 42, 0.35)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            flexDirection: "column",
            cursor: "pointer",
            transition:
                "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease, opacity 160ms ease-out",
            opacity: "0",
        });

        setTimeout(() => { card.style.opacity = "1"; }, 20 + index * 15);

        const thumbWrap = document.createElement("div");
        Object.assign(thumbWrap.style, {
            position: "relative",
            paddingTop: "70%",
            overflow: "hidden",
            background:
                "radial-gradient(circle at top, #111827 0, #020617 60%, #000 100%)",
        });

        const imgEl = document.createElement("img");
        imgEl.src = img.url;
        imgEl.alt = img.filename;
        Object.assign(imgEl.style, {
            position: "absolute",
            inset: "0",
            width: "100%",
            height: "100%",
            objectFit: "cover",
        });

        thumbWrap.appendChild(imgEl);
        card.appendChild(thumbWrap);

        card.onclick = () => {
            setSelectedIndex(index);
            emit("gallery:openDetails", { index });
        };

        gridEl.appendChild(card);
    });
}
