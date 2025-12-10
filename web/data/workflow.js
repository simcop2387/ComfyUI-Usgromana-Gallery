// web/data/workflow.js
import { api } from "../core/api.js";
import { getLogger } from "../core/logger.js";

const log = getLogger("Workflow");

export async function openWorkflowForImage(filename) {
    try {
        const res = await api.openWorkflow(filename);
        if (res.error) {
            log.warn("openWorkflow responded with error", { filename, error: res.error });
        } else {
            log.info("openWorkflow OK", { filename, workflow_id: res.workflow_id });
        }
        // Actual opening is done server-side; this is mainly for status.
        return res;
    } catch (err) {
        log.error("Failed to open workflow", { filename, error: String(err) });
        throw err;
    }
}
