// web/ui/details.js
import { getLogger } from "../core/logger.js";

// web/ui/details.js
import {
    subscribe,
    getFilteredImages,
    getSelectedIndex,
    setSelectedIndex,
} from "../core/state.js";

import { refreshGalleryImages } from "../core/entry.js";

import { on } from "../js/events.js";
import { openWorkflowForImage } from "../data/workflow.js";
import { api } from "../core/api.js";
import { saveTags } from "../data/tags.js";
import { getFolders, setFolder } from "../data/folders.js";

let detailsOverlay = null;

export function initDetails() {
    const log = getLogger("Details");

    detailsOverlay = document.createElement("div");
    Object.assign(detailsOverlay.style, {
        position: "fixed",
        inset: "0",
        zIndex: "10000",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
    });

    const panel = document.createElement("div");
    panel.id = "usg-details-panel";
    Object.assign(panel.style, {
        width: "72vw",
        maxWidth: "1100px",
        height: "72vh",
        maxHeight: "800px",
        background: "rgba(10, 20, 40, 0.50)",
        backdropFilter: "blur(25px)",
        WebkitBackdropFilter: "blur(25px)",
        borderRadius: "18px",
        border: "1px solid rgba(148,163,184,0.25)",
        boxShadow: "0 22px 60px rgba(0,0,0,0.9)",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        overflow: "hidden",
        color: "#e5e7eb",
    });

    const left = document.createElement("div");
    Object.assign(left.style, {
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(circle at top, #1f2937, #020617)",
    });

    const imgArea = document.createElement("div");
    Object.assign(imgArea.style, {
        flex: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px",
    });

    const imgWrap = document.createElement("div");
    Object.assign(imgWrap.style, {
        width: "100%",
        height: "100%",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    });

    const bigImg = document.createElement("img");
    Object.assign(bigImg.style, {
        width: "100%",
        height: "100%",
        objectFit: "contain",
    });

    imgWrap.appendChild(bigImg);
    imgArea.appendChild(imgWrap);

    const bottomBar = document.createElement("div");
    Object.assign(bottomBar.style, {
        borderTop: "1px solid rgba(148,163,184,0.25)",
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        fontSize: "11px",
    });

    const leftControls = document.createElement("div");
    leftControls.style.display = "flex";
    leftControls.style.gap = "6px";

    const rightControls = document.createElement("div");
    rightControls.style.display = "flex";
    rightControls.style.gap = "6px";

    const filenameEl = document.createElement("div");
    Object.assign(filenameEl.style, {
        fontSize: "11px",
        opacity: "0.8",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "260px",
    });

    function iconBtn(text, title) {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.title = title;
        Object.assign(btn.style, {
            borderRadius: "999px",
            border: "1px solid rgba(148,163,184,0.7)",
            width: "26px",
            height: "26px",
            background: "rgba(15,23,42,0.9)",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "13px",
        });
        return btn;
    }

    const prevBtn = iconBtn("◀", "Previous");
    const nextBtn = iconBtn("▶", "Next");
    const openBtn = iconBtn("🗗", "Open in new tab");
    const linkBtn = iconBtn("🔗", "Copy URL");
    const pathBtn = iconBtn("📁", "Copy path");
    const delBtn = iconBtn("🗑", "Delete");
    delBtn.style.borderColor = "rgba(248,113,113,0.9)";
    delBtn.style.color = "#fecaca";
    const wfBtn = iconBtn("🧩", "Show workflow");
    const metaBtn = iconBtn("ⓘ", "Metadata");

    leftControls.append(prevBtn, nextBtn);
    rightControls.append(openBtn, linkBtn, pathBtn, delBtn, wfBtn, metaBtn);

    bottomBar.append(leftControls, filenameEl, rightControls);

    left.append(imgArea, bottomBar);
    panel.appendChild(left);

    // Metadata panel (quick basic version)
    const metaPanel = document.createElement("div");
    Object.assign(metaPanel.style, {
        borderLeft: "1px solid rgba(30,64,175,0.5)",
        display: "none",
        flexDirection: "column",
        padding: "8px 10px",
        gap: "6px",
        fontSize: "11px",
        background:
            "radial-gradient(circle at top, rgba(15,23,42,0.98), rgba(15,23,42,0.92))",
    });

    const metaHeader = document.createElement("div");
    Object.assign(metaHeader.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(148,163,184,0.4)",
        paddingBottom: "4px",
        marginBottom: "4px",
    });

    const metaTitle = document.createElement("div");
    metaTitle.textContent = "Metadata";
    Object.assign(metaTitle.style, {
        fontWeight: "600",
        fontSize: "11px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
    });

    const metaClose = iconBtn("×", "Close");
    Object.assign(metaClose.style, {
        width: "20px",
        height: "20px",
        fontSize: "12px",
    });

    metaHeader.append(metaTitle, metaClose);

    const metaContent = document.createElement("div");
    Object.assign(metaContent.style, {
        flex: "1",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    });

    metaPanel.append(metaHeader, metaContent);
    panel.appendChild(metaPanel);

    detailsOverlay.appendChild(panel);
    document.body.appendChild(detailsOverlay);

    // Behavior
    function showMeta(show) {
        metaPanel.style.display = show ? "flex" : "none";
        panel.style.gridTemplateColumns = show
            ? "minmax(0, 2.2fr) minmax(260px, 1fr)"
            : "minmax(0, 1fr)";
    }

    metaBtn.onclick = () => showMeta(metaPanel.style.display === "none");
    metaClose.onclick = () => showMeta(false);

    detailsOverlay.addEventListener("click", (e) => {
        if (e.target === detailsOverlay) detailsOverlay.style.display = "none";
    });

    function renderCurrent() {
        const imgs = getFilteredImages();
        const idx = getSelectedIndex();
        if (idx == null || idx < 0 || idx >= imgs.length) {
            detailsOverlay.style.display = "none";
            return;
        }
        const img = imgs[idx];
        bigImg.src = img.url;
        filenameEl.textContent = img.filename;

        metaContent.innerHTML = "";
        const addMeta = (label, value) => {
            const row = document.createElement("div");
            row.innerHTML = `<span style="opacity:0.7;">${label}:</span> <span>${value}</span>`;
            metaContent.appendChild(row);
        };

        addMeta("Filename", img.filename);
        addMeta("Size", img.size ? `${Math.round(img.size / 1024)} KB` : "Unknown");
        addMeta(
            "Created",
            img.mtime ? new Date(img.mtime * 1000).toLocaleString() : "Unknown",
        );
        addMeta("Folder", img.folder || "Unsorted");

        // TODO: tags UI – can hook to saveTags() here if you want inline editing.
    }

    prevBtn.onclick = () => {
        const imgs = getFilteredImages();
        if (!imgs.length) return;

        let idx = getSelectedIndex() ?? 0;
        idx = (idx - 1 + imgs.length) % imgs.length;
        setSelectedIndex(idx);
        renderCurrent();
    };

    nextBtn.onclick = () => {
        const imgs = getFilteredImages();
        if (!imgs.length) return;

        let idx = getSelectedIndex() ?? 0;
        idx = (idx + 1) % imgs.length;
        setSelectedIndex(idx);
        renderCurrent();
    };

    openBtn.onclick = () => {
        const imgs = getFilteredImages();
        const idx = getSelectedIndex();
        if (idx == null) return;
        window.open(imgs[idx].url, "_blank", "noopener,noreferrer");
    };

    linkBtn.onclick = async () => {
        const imgs = getFilteredImages();
        const idx = getSelectedIndex();
        if (idx == null) return;
        const url = window.location.origin + imgs[idx].url;
        await navigator.clipboard.writeText(url);
    };

    pathBtn.onclick = async () => {
        const imgs = getFilteredImages();
        const idx = getSelectedIndex();
        if (idx == null) return;
        await navigator.clipboard.writeText(imgs[idx].filename);
    };

    delBtn.onclick = async () => {
        const imgs = getFilteredImages();
        const idx = getSelectedIndex();
        if (idx == null) return;
        const img = imgs[idx];
        if (!confirm(`Delete ${img.filename}?`)) return;
        await api.deleteImage(img.filename);
        // You’ll refresh state from outside.
        detailsOverlay.style.display = "none";
    };

    wfBtn.onclick = async () => {
        const imgs = getFilteredImages();
        const idx = getSelectedIndex();
        if (idx == null) return;
        await openWorkflowForImage(imgs[idx].filename);
    };

    on("gallery:openDetails", () => {
        renderCurrent();
        detailsOverlay.style.display = "flex";
    });

    subscribe(() => {
        // keep in sync when filters or images change
        if (detailsOverlay.style.display === "flex") {
            renderCurrent();
        }
    });

    log.info("Details overlay initialized.");
}
