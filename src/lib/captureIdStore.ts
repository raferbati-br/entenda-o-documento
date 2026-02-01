/**
 * Armazenamento do ID de captura no sessionStorage do navegador.
 * Usado para persistir o ID entre sessões de navegação.
 */

const KEY = "eod_capture_id_v1"; // Chave para armazenar o ID

// Salva o ID de captura
export function saveCaptureId(id: string) {
  sessionStorage.setItem(KEY, id);
}

// Carrega o ID de captura salvo
export function loadCaptureId(): string | null {
  return sessionStorage.getItem(KEY);
}

// Limpa o ID de captura
export function clearCaptureId() {
  sessionStorage.removeItem(KEY);
}
