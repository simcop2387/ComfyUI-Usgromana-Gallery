// ComfyUI-Usgromana-Gallery/web/core/state.js

import { getImageKey as utilsGetImageKey } from "./utils.js";

const state = {
    images: [],
    visibleImages: [],
    selectedIndex: null,
};

const listeners = new Set();

// --- Shared registries (grid produces; details consumes) ---
const thumbRegistry = new Map(); // imageKey -> thumbUrl

export function subscribe(fn) {
    if (typeof fn !== "function") return () => {};
    listeners.add(fn);

    // Fire once immediately
    try { fn(state); } catch (e) { console.warn("[Gallery] listener init error:", e); }

    return () => listeners.delete(fn);
}

function notify() {
    for (const fn of listeners) {
        try { fn(state); } catch (e) { console.warn("[Gallery] listener error:", e); }
    }
}

// Stable key for any image (reuse utility)
export function getImageKey(img) {
    return utilsGetImageKey(img);
}

// Track if grid has set visibleImages to prevent overwriting
let gridHasSetVisibleImages = false;

// Export function to reset the flag (for initial gallery open)
export function resetGridHasSetVisibleImagesFlag() {
    gridHasSetVisibleImages = false;
}

export function setImages(images, resetVisible = false) {
    state.images = Array.isArray(images) ? images : [];
    
    // Only reset visibleImages if:
    // 1. Explicitly requested AND grid hasn't set it yet, OR
    // 2. visibleImages is empty (initial load)
    // This prevents overwriting the grid's filtered/sorted order
    if ((resetVisible && !gridHasSetVisibleImages) || state.visibleImages.length === 0) {
        state.visibleImages = [...state.images];
        // If we're resetting, clear the flag so grid can set it again
        if (resetVisible) {
            gridHasSetVisibleImages = false;
        }
    }

    // clamp selected index
    const max = getImages().length;
    if (state.selectedIndex != null) {
        if (state.selectedIndex < 0 || state.selectedIndex >= max) {
            state.selectedIndex = null;
        }
    }

    notify();
}

export function setVisibleImages(images) {
    state.visibleImages = Array.isArray(images) ? images : [];
    gridHasSetVisibleImages = true; // Mark that grid has set the order

    // clamp selected index
    const max = getImages().length;
    if (state.selectedIndex != null) {
        if (state.selectedIndex < 0 || state.selectedIndex >= max) {
            state.selectedIndex = null;
        }
    }
    // Note: We don't call notify() here to avoid infinite loops.
    // The detail view calls getImages() which returns the current visibleImages,
    // so it will automatically get the updated order when needed.
}

export function getAllImagesRaw() {
    return state.images;
}

export function getImages() {
    return Array.isArray(state.visibleImages) && state.visibleImages.length ? state.visibleImages : state.images;
}

export function getFilteredImages() {
    return getImages();
}

export function setSelectedIndex(index) {
    if (index == null) {
        state.selectedIndex = null;
    } else {
        const i = Number(index);
        const max = getImages().length;
        state.selectedIndex = Number.isFinite(i) && i >= 0 && i < max ? i : null;
    }
    notify();
}

export function getSelectedImage() {
    const arr = getImages();
    if (state.selectedIndex == null) return null;
    if (state.selectedIndex < 0 || state.selectedIndex >= arr.length) return null;
    return arr[state.selectedIndex];
}

// --- Thumbnail registry ---
export function registerThumbnail(imageKey, thumbUrl) {
    if (!imageKey || !thumbUrl) return;
    thumbRegistry.set(imageKey, thumbUrl);
}

export function getThumbnail(imageKey) {
    if (!imageKey) return null;
    return thumbRegistry.get(imageKey) || null;
}

export function clearThumbnails() {
    thumbRegistry.clear();
}