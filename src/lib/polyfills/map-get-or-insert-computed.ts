/**
 * Compatibility shim for the Map.prototype.getOrInsertComputed proposal.
 *
 * PDF.js 6 uses this method internally. Some iOS WebKit versions do not
 * implement it yet, which causes the PDF worker/message handler to fail
 * before a document can render.
 */
const mapPrototype = Map.prototype as Map<unknown, unknown> & {
  getOrInsertComputed?: (
    key: unknown,
    callback: (key: unknown) => unknown,
  ) => unknown;
};

if (typeof mapPrototype.getOrInsertComputed !== 'function') {
  Object.defineProperty(Map.prototype, 'getOrInsertComputed', {
    configurable: true,
    writable: true,
    value: function <K, V>(
      this: Map<K, V>,
      key: K,
      callback: (key: K) => V,
    ): V {
      if (this.has(key)) return this.get(key) as V;
      const value = callback(key);
      this.set(key, value);
      return value;
    },
  });
}
