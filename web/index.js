// ComfyUI-Usgromana-Gallery/web/js/index.js

import { app } from "/scripts/app.js";
import { initGalleryExtension, EXT_NAME } from "./gallery_ui.js";

app.registerExtension({
    name: EXT_NAME,
    async setup() {
        initGalleryExtension();
    },
});
// web/index.js
import { app } from "../../scripts/app.js";
import { initGalleryExtension } from "./core/entry.js";

app.registerExtension({
    name: "Usgromana.Gallery",
    async setup() {
        await initGalleryExtension();
    },
});
