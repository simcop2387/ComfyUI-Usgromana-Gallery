// ComfyUI-Usgromana-Gallery/web/js/gallery_ui.js

import { listImages, deleteImageRemote } from "./gallery_api.js";

export const EXT_NAME = "usgromana.gallery";

function log(...args) {
    console.log("[Usgromana-Gallery]", ...args);
}

let overlay = null;
let grid = null;
let infoBar = null;
let detailsOverlay = null;

let searchInput = null;
let sortSelect = null;
let sizeSlider = null;

let detailsState = {
    images: [],
    index: 0,
};

// client-side state
let imagesCache = [];
let currentFiltered = [];
let currentSort = "newest";
let currentSearch = "";

// --- Overlay ---------------------------------------------------------------

function buildOverlay() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.id = "usgromana-gallery-overlay";

    Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        zIndex: "9999",
        background: "rgba(3, 7, 18, 0.25)", // more transparent
        backdropFilter: "blur(22px) saturate(1.4)",
        WebkitBackdropFilter: "blur(22px) saturate(1.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: "0",
        transform: "scale(1.02)",
        transition: "opacity 120ms ease-out, transform 120ms ease-out",
    });

    const panel = document.createElement("div");
    Object.assign(panel.style, {
        width: "86vw",
        maxWidth: "1400px",
        height: "82vh",
        borderRadius: "16px",
        background: "rgba(10, 20, 40, 0.45)", // glassy
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 22px 70px rgba(0,0,0,0.7)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "#e5e7eb",
        fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    });

    // --- Header -----------------------------------------------------------
    const header = document.createElement("div");
    Object.assign(header.style, {
        padding: "8px 16px 6px 16px",
        borderBottom: "1px solid rgba(148,163,184,0.30)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        background:
            "linear-gradient(90deg, rgba(37,99,235,0.35), rgba(30,64,175,0.10), transparent)",
    });

    const titleWrap = document.createElement("div");
    Object.assign(titleWrap.style, {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    });

    const title = document.createElement("div");
    title.textContent = "USGROMANA GALLERY";
    Object.assign(title.style, {
        fontSize: "14px",
        fontWeight: "600",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
    });

    const subtitle = document.createElement("div");
    subtitle.textContent = "Recent outputs from /output";
    Object.assign(subtitle.style, {
        fontSize: "11px",
        opacity: "0.75",
    });

    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);

    // Controls on right side
    const controls = document.createElement("div");
    Object.assign(controls.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    });

    // search
    const searchWrap = document.createElement("div");
    Object.assign(searchWrap.style, {
        display: "flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "999px",
        border: "1px solid rgba(148,163,184,0.7)",
        background: "rgba(15,23,42,0.9)",
        gap: "6px",
    });

    const searchIcon = document.createElement("span");
    searchIcon.textContent = "⌕";
    Object.assign(searchIcon.style, {
        fontSize: "11px",
        opacity: "0.8",
    });

    searchInput = document.createElement("input");
    Object.assign(searchInput.style, {
        border: "none",
        outline: "none",
        background: "transparent",
        color: "#e5e7eb",
        fontSize: "11px",
        width: "150px",
    });
    searchInput.placeholder = "Search filename…";
    searchInput.addEventListener("input", () => {
        currentSearch = searchInput.value.trim().toLowerCase();
        applyFiltersAndRender();
    });

    searchWrap.appendChild(searchIcon);
    searchWrap.appendChild(searchInput);

    // sort
    const sortWrap = document.createElement("div");
    Object.assign(sortWrap.style, {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "11px",
    });

    const sortLabel = document.createElement("span");
    sortLabel.textContent = "Sort";

    sortSelect = document.createElement("select");
    Object.assign(sortSelect.style, {
        borderRadius: "999px",
        border: "1px solid rgba(148,163,184,0.7)",
        background: "rgba(15,23,42,0.9)",
        color: "#e5e7eb",
        fontSize: "11px",
        padding: "2px 8px",
    });

    [
        { value: "newest", label: "Newest" },
        { value: "oldest", label: "Oldest" },
        { value: "name_az", label: "Name A–Z" },
        { value: "name_za", label: "Name Z–A" },
    ].forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.label;
        sortSelect.appendChild(opt);
    });

    sortSelect.value = currentSort;
    sortSelect.addEventListener("change", () => {
        currentSort = sortSelect.value;
        applyFiltersAndRender();
    });

    sortWrap.appendChild(sortLabel);
    sortWrap.appendChild(sortSelect);

    // thumb size slider
    const sizeWrap = document.createElement("div");
    Object.assign(sizeWrap.style, {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "11px",
    });

    const sizeLabel = document.createElement("span");
    sizeLabel.textContent = "Size";

    sizeSlider = document.createElement("input");
    sizeSlider.type = "range";
    sizeSlider.min = "0";
    sizeSlider.max = "2";
    sizeSlider.value = "1"; // medium
    Object.assign(sizeSlider.style, {
        width: "70px",
    });
    sizeSlider.addEventListener("input", () => {
        applySizeToGrid();
    });

    sizeWrap.appendChild(sizeLabel);
    sizeWrap.appendChild(sizeSlider);

    // refresh + close
    const headerButtons = document.createElement("div");
    Object.assign(headerButtons.style, {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    });

    const refreshBtn = createPillButton("Refresh");
    refreshBtn.onclick = () => loadGallery();

    const closeBtn = createPillButton("Close");
    closeBtn.onclick = () => toggleOverlay(false);

    headerButtons.appendChild(refreshBtn);
    headerButtons.appendChild(closeBtn);

    controls.appendChild(searchWrap);
    controls.appendChild(sortWrap);
    controls.appendChild(sizeWrap);
    controls.appendChild(headerButtons);

    header.appendChild(titleWrap);
    header.appendChild(controls);

    // --- Grid --------------------------------------------------------------
    grid = document.createElement("div");
    Object.assign(grid.style, {
        flex: "1",
        padding: "12px 16px 8px 16px",
        overflow: "auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px",
    });

    // --- Footer ------------------------------------------------------------
    const footer = document.createElement("div");
    Object.assign(footer.style, {
        padding: "6px 12px 8px 12px",
        borderTop: "1px solid rgba(30,64,175,0.5)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
        fontSize: "11px",
        color: "rgba(209,213,219,0.8)",
    });

    infoBar = document.createElement("div");
    infoBar.textContent = "Ready.";

    const hint = document.createElement("div");
    hint.textContent = "Click a card for details • Delete removes from disk";
    hint.style.opacity = "0.75";

    footer.appendChild(infoBar);
    footer.appendChild(hint);

    panel.appendChild(header);
    panel.appendChild(grid);
    panel.appendChild(footer);
    overlay.appendChild(panel);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) toggleOverlay(false);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (detailsOverlay && detailsOverlay.style.display === "flex") {
                detailsOverlay.style.display = "none";
            } else if (overlay && overlay.style.display === "flex") {
                toggleOverlay(false);
            }
        }
    });

    document.body.appendChild(overlay);
}

function createPillButton(label) {
    const btn = document.createElement("button");
    btn.textContent = label;
    Object.assign(btn.style, {
        fontSize: "12px",
        padding: "4px 10px",
        borderRadius: "999px",
        border: "1px solid rgba(148,163,184,0.7)",
        background: "rgba(15,23,42,0.9)",
        color: "#e5e7eb",
        cursor: "pointer",
    });
    btn.addEventListener("mouseenter", () => {
        btn.style.background = "rgba(37,99,235,0.9)";
        btn.style.borderColor = "rgba(191,219,254,1)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.background = "rgba(15,23,42,0.9)";
        btn.style.borderColor = "rgba(148,163,184,0.7)";
    });
    return btn;
}

function toggleOverlay(show) {
    buildOverlay();

    if (show) {
        overlay.style.display = "flex";
        requestAnimationFrame(() => {
            overlay.style.opacity = "1";
            overlay.style.transform = "scale(1)";
        });
        loadGallery();
    } else {
        overlay.style.opacity = "0";
        overlay.style.transform = "scale(1.02)";
        setTimeout(() => {
            overlay.style.display = "none";
        }, 120);
    }
}

function applySizeToGrid() {
    if (!grid || !sizeSlider) return;
    const mode = parseInt(sizeSlider.value, 10);
    let minWidth;
    if (mode === 0) minWidth = 180; // compact
    else if (mode === 2) minWidth = 300; // chunky
    else minWidth = 230; // medium
    grid.style.gridTemplateColumns = `repeat(auto-fit, minmax(${minWidth}px, 1fr))`;
}

// --- Details modal ---------------------------------------------------------

function ensureDetailsOverlay() {
    if (detailsOverlay) return;

    detailsOverlay = document.createElement("div");
    detailsOverlay.id = "usgromana-gallery-details";

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
        gridTemplateColumns: "minmax(0, 1fr)", // metadata panel toggles this
        overflow: "hidden",
        color: "#e5e7eb",
        fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    });

    // LEFT: image + bottom toolbar
    const left = document.createElement("div");
    Object.assign(left.style, {
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(circle at top, #1f2937, #020617)",
    });

    // IMAGE AREA
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
    bigImg.id = "usg-details-image";
    Object.assign(bigImg.style, {
        width: "100%",
        height: "100%",
        objectFit: "contain",   // 🔥 this guarantees it fits container
    });

    imgWrap.appendChild(bigImg);
    imgArea.appendChild(imgWrap);

    // BOTTOM TOOLBAR (ICONS)
    const bottomToolbar = document.createElement("div");
    Object.assign(bottomToolbar.style, {
        borderTop: "1px solid rgba(148,163,184,0.25)",
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        fontSize: "11px",
        minHeight: "34px", // ensure it’s always visible
        background: "linear-gradient(to top, rgba(15,23,42,0.95), rgba(15,23,42,0.8))",
    });

    const leftControls = document.createElement("div");
    Object.assign(leftControls.style, {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    });

    const rightControls = document.createElement("div");
    Object.assign(rightControls.style, {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    });

    const filenameEl = document.createElement("div");
    filenameEl.id = "usg-details-filename";
    Object.assign(filenameEl.style, {
        fontSize: "11px",
        opacity: "0.8",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "260px",
        textAlign: "center",
        flex: "1",
    });

    const indexEl = document.createElement("span");
    indexEl.id = "usg-details-index";
    Object.assign(indexEl.style, {
        fontSize: "10px",
        opacity: "0.7",
        marginLeft: "6px",
    });

    function makeIconButton(label, title) {
        const btn = document.createElement("button");
        btn.textContent = label;
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
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0",
        });
        btn.addEventListener("mouseenter", () => {
            btn.style.background = "rgba(37,99,235,0.9)";
            btn.style.borderColor = "rgba(191,219,254,1)";
        });
        btn.addEventListener("mouseleave", () => {
            btn.style.background = "rgba(15,23,42,0.9)";
            btn.style.borderColor = "rgba(148,163,184,0.7)";
        });
        return btn;
    }

    const prevBtn = makeIconButton("◀", "Previous image");
    const nextBtn = makeIconButton("▶", "Next image");

    const openBtn = makeIconButton("🗗", "Open in new tab");
    const copyUrlBtn = makeIconButton("🔗", "Copy image URL");
    const copyPathBtn = makeIconButton("📁", "Copy relative path");
    const deleteBtn = makeIconButton("🗑", "Delete from disk");
    deleteBtn.style.borderColor = "rgba(248,113,113,0.9)";
    deleteBtn.style.color = "#fecaca";

    const metaToggleBtn = makeIconButton("ⓘ", "Toggle metadata panel");

    leftControls.appendChild(prevBtn);
    leftControls.appendChild(nextBtn);

    // center: filename + index
    const centerWrap = document.createElement("div");
    Object.assign(centerWrap.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "1",
        gap: "4px",
    });
    centerWrap.appendChild(filenameEl);
    centerWrap.appendChild(indexEl);

    rightControls.appendChild(openBtn);
    rightControls.appendChild(copyUrlBtn);
    rightControls.appendChild(copyPathBtn);
    rightControls.appendChild(deleteBtn);
    rightControls.appendChild(metaToggleBtn);

    bottomToolbar.appendChild(leftControls);
    bottomToolbar.appendChild(centerWrap);
    bottomToolbar.appendChild(rightControls);

    left.appendChild(imgArea);
    left.appendChild(bottomToolbar);

    // RIGHT: metadata panel (hidden by default)
    const metaPanel = document.createElement("div");
    metaPanel.id = "usg-details-meta-panel";
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

    const metaClose = document.createElement("button");
    metaClose.textContent = "×";
    Object.assign(metaClose.style, {
        borderRadius: "999px",
        border: "1px solid rgba(148,163,184,0.7)",
        width: "20px",
        height: "20px",
        background: "rgba(15,23,42,0.9)",
        color: "#e5e7eb",
        cursor: "pointer",
        fontSize: "12px",
        padding: "0",
    });
    metaClose.onclick = () => {
        hideMetaPanel(panel, metaPanel);
    };

    metaHeader.appendChild(metaTitle);
    metaHeader.appendChild(metaClose);

    const metaScroll = document.createElement("div");
    Object.assign(metaScroll.style, {
        flex: "1",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    });

    const metaBlock = document.createElement("div");
    metaBlock.id = "usg-details-meta";
    Object.assign(metaBlock.style, {
        fontSize: "11px",
        opacity: "0.9",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    });

    metaScroll.appendChild(metaBlock);
    metaPanel.appendChild(metaHeader);
    metaPanel.appendChild(metaScroll);

    // wire metadata toggle
    metaToggleBtn.onclick = () => {
        if (metaPanel.style.display === "none") {
            showMetaPanel(panel, metaPanel);
        } else {
            hideMetaPanel(panel, metaPanel);
        }
    };

    prevBtn.onclick = () => navigateDetails(-1);
    nextBtn.onclick = () => navigateDetails(1);

    detailsOverlay._refs = {
        panel,
        bigImg,
        filenameEl,
        indexEl,
        metaBlock,
        openBtn,
        copyUrlBtn,
        copyPathBtn,
        deleteBtn,
        metaToggleBtn,
        prevBtn,
        nextBtn,
        metaPanel,
    };

    panel.appendChild(left);
    panel.appendChild(metaPanel);
    detailsOverlay.appendChild(panel);

    detailsOverlay.addEventListener("click", (e) => {
        if (e.target === detailsOverlay) detailsOverlay.style.display = "none";
    });

    document.body.appendChild(detailsOverlay);
}

function showMetaPanel(panel, metaPanel) {
    metaPanel.style.display = "flex";
    panel.style.gridTemplateColumns = "minmax(0, 2.2fr) minmax(260px, 1fr)";
}

function hideMetaPanel(panel, metaPanel) {
    metaPanel.style.display = "none";
    panel.style.gridTemplateColumns = "minmax(0, 1fr)";
}

function navigateDetails(direction) {
    if (!detailsState.images.length) return;
    const total = detailsState.images.length;
    detailsState.index = (detailsState.index + direction + total) % total;
    updateDetailsView();
}

function updateDetailsView() {
    if (!detailsOverlay || !detailsState.images.length) return;
    const img = detailsState.images[detailsState.index];

    const {
        bigImg,
        filenameEl,
        indexEl,
        metaBlock,
        openBtn,
        copyUrlBtn,
        copyPathBtn,
        deleteBtn,
    } = detailsOverlay._refs;

    bigImg.src = img.url;
    filenameEl.textContent = img.filename;
    indexEl.textContent = `(${detailsState.index + 1}/${detailsState.images.length})`;

    metaBlock.innerHTML = "";

    const addLine = (label, val) => {
        const row = document.createElement("div");
        row.innerHTML = `<span style="opacity:0.7;">${label}:</span> <span style="opacity:0.95;">${val}</span>`;
        metaBlock.appendChild(row);
    };

    const sizeStr = img.size ? `${Math.round(img.size / 1024)} KB` : "Unknown";
    const dateStr =
        img.mtime != null
            ? new Date(img.mtime * 1000).toLocaleString()
            : "Unknown";

    addLine("Filename", img.filename);
    addLine("Size", sizeStr);
    addLine("Created", dateStr);
    addLine("URL", window.location.origin + img.url);

    openBtn.onclick = () => {
        window.open(img.url, "_blank", "noopener,noreferrer");
    };

    copyUrlBtn.onclick = async () => {
        try {
            await navigator.clipboard.writeText(
                window.location.origin + img.url,
            );
            if (infoBar) infoBar.textContent = "Image URL copied.";
        } catch {
            if (infoBar) infoBar.textContent = "Failed to copy URL.";
        }
    };

    copyPathBtn.onclick = async () => {
        try {
            await navigator.clipboard.writeText(img.filename);
            if (infoBar) infoBar.textContent = "Relative path copied.";
        } catch {
            if (infoBar) infoBar.textContent = "Failed to copy path.";
        }
    };

    deleteBtn.onclick = async () => {
        const ok = await deleteImage(img, null);
        if (!ok) return;
        detailsOverlay.style.display = "none";
        await loadGallery();
    };
}

function openImageDetails(images, index) {
    ensureDetailsOverlay();
    detailsState.images = images;
    detailsState.index = index;
    updateDetailsView();
    detailsOverlay.style.display = "flex";
}

// --- Data / rendering ------------------------------------------------------

async function loadGallery() {
    if (!grid || !infoBar) return;

    grid.innerHTML = "";
    const loading = document.createElement("div");
    loading.textContent = "Loading images…";
    Object.assign(loading.style, {
        gridColumn: "1 / -1",
        textAlign: "center",
        fontSize: "13px",
        opacity: "0.7",
        paddingTop: "20px",
    });
    grid.appendChild(loading);

    infoBar.textContent = "Loading…";

    try {
        const images = await listImages();
        imagesCache = images;
        currentSearch = searchInput ? searchInput.value.trim().toLowerCase() : "";
        applyFiltersAndRender();
    } catch (err) {
        console.error("[Usgromana-Gallery] loadGallery error:", err);
        grid.innerHTML = "";
        const errDiv = document.createElement("div");
        errDiv.textContent =
            "Failed to load gallery. Check backend logs for /usgromana/gallery/list.";
        Object.assign(errDiv.style, {
            gridColumn: "1 / -1",
            textAlign: "center",
            paddingTop: "20px",
            color: "#f97373",
        });
        grid.appendChild(errDiv);
        infoBar.textContent = "Error.";
    }
}

function applyFiltersAndRender() {
    let list = imagesCache.slice();

    if (currentSearch) {
        list = list.filter((img) =>
            img.filename.toLowerCase().includes(currentSearch),
        );
    }

    switch (currentSort) {
        case "oldest":
            list.sort((a, b) => (a.mtime || 0) - (b.mtime || 0));
            break;
        case "name_az":
            list.sort((a, b) => a.filename.localeCompare(b.filename));
            break;
        case "name_za":
            list.sort((a, b) => b.filename.localeCompare(a.filename));
            break;
        case "newest":
        default:
            list.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
            break;
    }

    currentFiltered = list;
    renderImages(list);
}

function renderImages(images) {
    grid.innerHTML = "";

    applySizeToGrid();

    if (!images.length) {
        const empty = document.createElement("div");
        empty.innerHTML =
            "<div style='font-size:36px;margin-bottom:6px;'>🖼️</div>No images found in /output yet.";
        Object.assign(empty.style, {
            gridColumn: "1 / -1",
            textAlign: "center",
            paddingTop: "40px",
            fontSize: "13px",
            opacity: "0.7",
        });
        grid.appendChild(empty);
        infoBar.textContent = "0 images.";
        return;
    }

    infoBar.textContent = `${images.length} image${
        images.length === 1 ? "" : "s"
    } loaded.`;

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

        // staggered fade in
        setTimeout(() => {
            card.style.opacity = "1";
        }, 20 + index * 15);

        card.addEventListener("mouseenter", () => {
            card.style.transform = "translateY(-2px)";
            card.style.boxShadow = "0 14px 30px rgba(0,0,0,0.7)";
            card.style.borderColor = "rgba(96,165,250,0.9)";
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "translateY(0)";
            card.style.boxShadow = "none";
            card.style.borderColor = "rgba(255,255,255,0.1)";
        });

        const thumbWrap = document.createElement("div");
        Object.assign(thumbWrap.style, {
            position: "relative",
            paddingTop: "70%",
            overflow: "hidden",
            background:
                "radial-gradient(circle at top, #111827 0, #020617 60%, #000 100%)",
        });

        const thumb = document.createElement("img");
        thumb.src = img.url;
        thumb.alt = img.filename;
        Object.assign(thumb.style, {
            position: "absolute",
            inset: "0",
            width: "100%",
            height: "100%",
            objectFit: "cover",
        });

        const overlayBar = document.createElement("div");
        Object.assign(overlayBar.style, {
            position: "absolute",
            inset: "0",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            padding: "4px",
            background:
                "linear-gradient(to top, rgba(15,23,42,0.85), transparent 60%)",
            opacity: "0",
            transition: "opacity 0.12s ease",
        });

        card.addEventListener("mouseenter", () => {
            overlayBar.style.opacity = "1";
        });
        card.addEventListener("mouseleave", () => {
            overlayBar.style.opacity = "0";
        });

        const leftActions = document.createElement("div");
        leftActions.style.display = "flex";
        leftActions.style.gap = "4px";

        const openBtn = document.createElement("button");
        openBtn.textContent = "Open";
        Object.assign(openBtn.style, {
            borderRadius: "999px",
            border: "0",
            padding: "2px 8px",
            fontSize: "10px",
            background: "rgba(59,130,246,0.9)",
            color: "#f9fafb",
            cursor: "pointer",
        });
        openBtn.onclick = (e) => {
            e.stopPropagation();
            window.open(img.url, "_blank", "noopener,noreferrer");
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        Object.assign(delBtn.style, {
            borderRadius: "999px",
            border: "0",
            padding: "2px 8px",
            fontSize: "10px",
            background: "rgba(239,68,68,0.9)",
            color: "#fef2f2",
            cursor: "pointer",
        });
        delBtn.onclick = async (e) => {
            e.stopPropagation();
            await deleteImage(img, card);
        };

        leftActions.appendChild(openBtn);
        leftActions.appendChild(delBtn);

        overlayBar.appendChild(leftActions);
        thumbWrap.appendChild(thumb);
        thumbWrap.appendChild(overlayBar);

        card.appendChild(thumbWrap);

        card.onclick = () => openImageDetails(images, index);

        grid.appendChild(card);
    });
}

async function deleteImage(img, cardEl) {
    if (!confirm(`Delete ${img.filename}? This removes the file from disk.`))
        return false;

    try {
        await deleteImageRemote(img.filename);
        if (cardEl && cardEl.remove) cardEl.remove();
        if (infoBar) infoBar.textContent = "Image deleted.";
        return true;
    } catch (err) {
        console.error("[Usgromana-Gallery] delete error:", err);
        alert("Failed to delete image.");
        return false;
    }
}

// --- Floating FAB ----------------------------------------------------------

function createFloatingButton() {
    if (document.getElementById("usgromana-gallery-fab")) return;

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
        fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        cursor: "pointer",
        boxShadow: "0 14px 30px rgba(15,23,42,0.9)",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
    });

    const dot = document.createElement("span");
    Object.assign(dot.style, {
        width: "8px",
        height: "8px",
        borderRadius: "999px",
        background:
            "conic-gradient(from 0deg, #22c55e, #a855f7, #22c55e)",
    });
    btn.prepend(dot);

    btn.addEventListener("mouseenter", () => {
        btn.style.transform = "translateY(-1px)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translateY(0)";
    });

    btn.addEventListener("click", () => {
        toggleOverlay(true);
    });

    document.body.appendChild(btn);
}

// --- Public entrypoint -----------------------------------------------------

export function initGalleryExtension() {
    log("frontend setup");

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            () => {
                createFloatingButton();
            },
            { once: true },
        );
    } else {
        createFloatingButton();
    }
}
