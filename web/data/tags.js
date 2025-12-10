// web/data/tags.js
import { api } from "../core/api.js";
import { getLogger } from "../core/logger.js";

const log = getLogger("Tags");

export async function saveTags(filename, tags) {
    try {
        const res = await api.updateTags(filename, tags);
        return res.tags || tags;
    } catch (err) {
        log.error("Failed to save tags", { filename, error: String(err) });
        throw err;
    }
}
