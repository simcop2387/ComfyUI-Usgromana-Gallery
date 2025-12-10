// ComfyUI-Usgromana-Gallery/web/index.js

import { app } from "/scripts/app.js";
import { initGalleryExtension } from "./core/entry.js";

app.registerExtension({
    name: "Usgromana.Gallery",
    async setup() {
        await initGalleryExtension();
    },
});
