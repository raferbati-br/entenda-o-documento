const KEY = "eod_capture_id_v1";

export function saveCaptureId(id: string) {
  sessionStorage.setItem(KEY, id);
}

export function loadCaptureId(): string | null {
  return sessionStorage.getItem(KEY);
}

export function clearCaptureId() {
  sessionStorage.removeItem(KEY);
}
