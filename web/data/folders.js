// web/data/folders.js
import { api } from "../core/api.js";
import { getLogger } from "../core/logger.js";

const log = getLogger("Folders");

export async function getFolders() {
    try {
        const res = await api.listFolders();
        return res.folders || [];
    } catch (err) {
        log.error("Failed to get folders", { error: String(err) });
        return ["Unsorted"];
    }
}

export async function setFolder(filename, folder) {
    try {
        return await api.setFolder(filename, folder);
    } catch (err) {
        log.error("Failed to set folder", { filename, folder, error: String(err) });
        throw err;
    }
}

export async function deleteFolder(folder) {
    try {
        return await api.deleteFolder(folder);
    } catch (err) {
        log.error("Failed to delete folder", { folder, error: String(err) });
        throw err;
    }
}
