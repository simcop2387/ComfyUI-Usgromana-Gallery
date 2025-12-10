// web/core/state.js
import { getLogger } from "./logger.js";

const log = getLogger("State");

const state = {
    images: [],
    selectedIndex: null,
    searchQuery: "",
    activeFolder: "All",
    minRating: 0,
};

const listeners = new Set();

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function notify() {
    for (const fn of listeners) {
        try {
            fn(state);
        } catch (err) {
            log.error("State listener failed", { error: String(err) });
        }
    }
}

export function setImages(images) {
    state.images = Array.isArray(images) ? images : [];
    log.info("Images set", { count: state.images.length });
    notify();
}

export function getImages() {
    return state.images;
}

export function setSelectedIndex(idx) {
    if (idx == null || idx < 0 || idx >= state.images.length) {
        state.selectedIndex = null;
    } else {
        state.selectedIndex = idx;
    }
    notify();
}

export function getSelectedIndex() {
    return state.selectedIndex;
}

export function setSearchQuery(q) {
    state.searchQuery = q || "";
    notify();
}

export function setActiveFolder(folder) {
    state.activeFolder = folder || "All";
    notify();
}

export function setMinRating(r) {
    state.minRating = r || 0;
    notify();
}

export function getFilteredImages() {
    let imgs = state.images || [];

    if (state.activeFolder && state.activeFolder !== "All") {
        imgs = imgs.filter((img) => img.folder === state.activeFolder);
    }
    if (state.minRating > 0) {
        imgs = imgs.filter((img) => (img.rating || 0) >= state.minRating);
    }
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        imgs = imgs.filter((img) => {
            if (img.filename?.toLowerCase().includes(q)) return true;
            const tags = img.tags || [];
            return tags.some((t) => t.toLowerCase().includes(q));
        });
    }
    return imgs;
}
