// web/core/api.js
import { getLogger } from "./logger.js";

const log = getLogger("API");
const BASE = "/usgromana/gallery";

async function request(path, options = {}) {
    const url = `${BASE}${path}`;
    try {
        const res = await fetch(url, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
        if (!res.ok) {
            const text = await res.text();
            log.warn("HTTP non-OK", { url, status: res.status, text });
            throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return await res.json();
    } catch (err) {
        log.error("Request failed", { url, error: String(err) });
        throw err;
    }
}

export const api = {
    listImages() {
        return request("/list", { method: "GET" });
    },
    deleteImage(filename) {
        return request("/delete", {
            method: "POST",
            body: JSON.stringify({ filename }),
        });
    },
    updateTags(filename, tags) {
        return request("/tag", {
            method: "POST",
            body: JSON.stringify({ filename, tags }),
        });
    },
    updateRating(filename, rating) {
        return request("/rate", {
            method: "POST",
            body: JSON.stringify({ filename, rating }),
        });
    },
    listFolders() {
        return request("/folders", { method: "GET" });
    },
    setFolder(filename, folder) {
        return request("/folders/set", {
            method: "POST",
            body: JSON.stringify({ filename, folder }),
        });
    },
    deleteFolder(folder) {
        return request("/folders/delete", {
            method: "POST",
            body: JSON.stringify({ folder }),
        });
    },
    openWorkflow(filename) {
        return request("/open_workflow", {
            method: "POST",
            body: JSON.stringify({ filename }),
        });
    },
};
