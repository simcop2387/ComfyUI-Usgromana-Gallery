// ComfyUI-Usgromana-Gallery/web/core/utils.js
// Shared utility functions

/**
 * Debounce function calls
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
    if (typeof bytes !== "number" || bytes < 0) return "Unknown";
    if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    if (bytes > 1024) return (bytes / 1024).toFixed(1) + " KB";
    return bytes + " B";
}

/**
 * Format date
 */
export function formatDate(timestamp) {
    if (!timestamp) return "Unknown";
    try {
        const date = typeof timestamp === "number" 
            ? (timestamp < 10000000000 ? timestamp * 1000 : timestamp)
            : new Date(timestamp);
        return date.toLocaleString();
    } catch {
        return "Unknown";
    }
}

/**
 * Safely unload image element
 */
export function unloadImage(img) {
    if (!img) return;
    img.src = "";
    img.removeAttribute("src");
    if (img.onload) img.onload = null;
    if (img.onerror) img.onerror = null;
}

/**
 * Clean up event listeners from element
 */
export function removeAllListeners(element) {
    if (!element) return;
    const newElement = element.cloneNode(true);
    element.parentNode?.replaceChild(newElement, element);
    return newElement;
}

/**
 * Check if image file by extension
 */
export function isImageFile(filename) {
    if (!filename) return false;
    const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
    return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"].includes(ext);
}

/**
 * Get image key from image object
 */
export function getImageKey(img) {
    if (!img) return null;
    return img.id || img.filename || img.relpath || null;
}

/**
 * Safe JSON parse
 */
export function safeJsonParse(str, defaultValue = null) {
    try {
        return JSON.parse(str);
    } catch {
        return defaultValue;
    }
}

/**
 * Create element with styles
 */
export function createElement(tag, styles = {}, attributes = {}) {
    const el = document.createElement(tag);
    Object.assign(el.style, styles);
    Object.keys(attributes).forEach(key => {
        el.setAttribute(key, attributes[key]);
    });
    return el;
}

/**
 * Cleanup interval
 */
export function createManagedInterval(callback, delay) {
    let intervalId = null;
    const start = () => {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(callback, delay);
    };
    const stop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };
    return { start, stop };
}

