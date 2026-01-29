import { clearCaptureId } from "@/lib/captureIdStore";
import { clearQaContext } from "@/lib/qaContextStore";
import { clearResult } from "@/lib/resultStore";

export function resetAnalysisSession() {
  clearResult();
  clearQaContext();
  clearCaptureId();
}
