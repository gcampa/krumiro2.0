let contatore = 0;

/** Id univoco; usa crypto.randomUUID quando disponibile (Safari ≥ 15.4). */
export function nuovoId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  contatore++;
  return `${Date.now().toString(36)}-${contatore.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
