type GlobalStub = {
  key: PropertyKey;
  had: boolean;
  value: unknown;
};

const stubs: GlobalStub[] = [];

export function stubGlobal(key: PropertyKey, value: unknown) {
  const had = Object.prototype.hasOwnProperty.call(globalThis, key);
  const original = (globalThis as Record<PropertyKey, unknown>)[key];
  stubs.push({ key, had, value: original });
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value,
  });
}

export function unstubAllGlobals() {
  while (stubs.length) {
    const { key, had, value } = stubs.pop()!;
    if (had) {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value,
      });
    } else {
      delete (globalThis as Record<PropertyKey, unknown>)[key];
    }
  }
}
