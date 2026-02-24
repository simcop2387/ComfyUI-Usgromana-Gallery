// ComfyUI-Usgromana-Gallery/web/js/usgromana_gallery.js

import { app } from "../../../scripts/app.js";
import { initGalleryExtension } from "../core/entry.js";

// Register both extensions with ComfyUI so they appear in the Usgromana
// admin UI under "Extension UI & Settings Categories".
//   "UsgromanaGallery"         → key settings_usgromanagallery
//   "UsgromanaGallery.ViewAll" → key settings_usgromanagalleryviewall
// The permissions system determines which list endpoint the gallery uses.
app.registerExtension({
    name: "UsgromanaGallery",
    async setup() {
        await initGalleryExtension();
    },
});

// ViewAll is a permission-only marker — no additional setup needed.
app.registerExtension({ name: "UsgromanaGallery.ViewAll" });
