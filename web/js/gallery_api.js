// ComfyUI-Usgromana-Gallery/web/js/gallery_api.js

import { api } from "/scripts/api.js";

const LIST_ENDPOINT = "/usgromana/gallery/list";
const DELETE_ENDPOINT = "/usgromana/gallery/delete";

export async function listImages() {
    const res = await api.fetchApi(LIST_ENDPOINT);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.images || [];
}

export async function deleteImageRemote(filename) {
    const res = await api.fetchApi(DELETE_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ filename }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return true;
}
