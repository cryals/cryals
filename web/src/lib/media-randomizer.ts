export function randomItem<T>(items: readonly T[]): T | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];

  const values = new Uint32Array(1);
  const value = globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(values)[0] : Math.floor(Math.random() * 2 ** 32);
  return items[value % items.length];
}

export function randomImage(items: readonly string[], storageKey: string): string | null {
  if (items.length < 2) return items[0] ?? null;

  try {
    const previous = sessionStorage.getItem(storageKey);
    const alternatives = items.filter((item) => item !== previous);
    const selected = randomItem(alternatives.length ? alternatives : items);
    if (selected) sessionStorage.setItem(storageKey, selected);
    return selected;
  } catch {
    return randomItem(items);
  }
}
