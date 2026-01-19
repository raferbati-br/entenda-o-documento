let qaContext: string | null = null;

export function saveQaContext(text: string) {
  qaContext = text;
}

export function loadQaContext() {
  return qaContext;
}

export function clearQaContext() {
  qaContext = null;
}
