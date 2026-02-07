type GlobalStub = {
  key: PropertyKey;
  had: boolean;
  value: unknown;
  descriptor?: PropertyDescriptor;
  usedAssignment?: boolean;
};

const stubs: GlobalStub[] = [];

export function stubGlobal(key: PropertyKey, value: unknown) {
  const had = Object.prototype.hasOwnProperty.call(globalThis, key);
  const original = (globalThis as Record<PropertyKey, unknown>)[key];
  const descriptor = had ? Object.getOwnPropertyDescriptor(globalThis, key) : undefined;
  const nonConfigurable = descriptor && descriptor.configurable === false;
  if (nonConfigurable) {
    stubs.push({ key, had, value: original, descriptor, usedAssignment: true });
    (globalThis as Record<PropertyKey, unknown>)[key] = value;
    return;
  }
  stubs.push({ key, had, value: original, descriptor });
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value,
  });
}

export function unstubAllGlobals() {
  while (stubs.length) {
    const { key, had, value, descriptor, usedAssignment } = stubs.pop()!;
    if (had) {
      if (usedAssignment || (descriptor && descriptor.configurable === false)) {
        (globalThis as Record<PropertyKey, unknown>)[key] = value;
      } else {
        Object.defineProperty(globalThis, key, {
          configurable: true,
          writable: true,
          value,
        });
      }
    } else {
      delete (globalThis as Record<PropertyKey, unknown>)[key];
    }
  }
}
