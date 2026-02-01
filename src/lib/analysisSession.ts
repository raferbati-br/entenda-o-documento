/**
 * Utilitários para gerenciar sessões de análise de documentos.
 * Permite resetar o estado da sessão, limpando dados armazenados.
 */

import { clearCaptureId } from "@/lib/captureIdStore";
import { clearQaContext } from "@/lib/qaContextStore";
import { clearResult } from "@/lib/resultStore";

// Reseta a sessão de análise, limpando todos os dados relacionados
export function resetAnalysisSession() {
  clearResult(); // Limpa resultados armazenados
  clearQaContext(); // Limpa contexto de perguntas
  clearCaptureId(); // Limpa ID de captura
}
