// web/core/logger.js

const LOG_ENDPOINT = "/usgromana/gallery/log";
const inMemoryLogs = [];

async function sendToServer(entry) {
    try {
        await fetch(LOG_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
        });
    } catch (err) {
        console.warn("[GalleryLogger] Failed to send log to server:", err);
    }
}

export function getLogger(source = "Gallery") {
    function base(level, message, extra) {
        const entry = {
            level,
            source,
            message,
            extra: extra || null,
            ts: Date.now(),
        };

        inMemoryLogs.push(entry);

        const prefix = `[Usgromana-Gallery][${source}][${level}]`;
        if (level === "ERROR") console.error(prefix, message, extra || "");
        else if (level === "WARN") console.warn(prefix, message, extra || "");
        else if (level === "INFO") console.info(prefix, message, extra || "");
        else console.debug(prefix, message, extra || "");

        void sendToServer(entry);
    }

    return {
        debug(msg, extra) { base("DEBUG", msg, extra); },
        info(msg, extra) { base("INFO", msg, extra); },
        warn(msg, extra) { base("WARN", msg, extra); },
        error(msg, extra) { base("ERROR", msg, extra); },
    };
}

export function exportLogs() {
    const blob = new Blob([JSON.stringify(inMemoryLogs, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "usgromana_gallery_log.json";
    a.click();
}
