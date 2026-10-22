// Decorator : les deux wrappers exposent exactement getQuote(parcel).
export class RetryQuote {
  constructor(inner, { attempts = 3 } = {}) {
    this.inner = inner;
    this.attempts = attempts;
  }
  async getQuote(parcel) {
    let lastError;
    for (let i = 0; i < this.attempts; i++) {
      try { return await this.inner.getQuote(parcel); }
      catch (error) { lastError = error; }
    }
    throw lastError ?? new Error('Nombre de tentatives invalide');
  }
}
export class CachedQuote {
  constructor(inner, { ttlMs = 60000, now = Date.now } = {}) {
    this.inner = inner;
    this.ttlMs = ttlMs;
    this.now = now;
    this.cache = new Map();
  }
  async getQuote(parcel) {
    const key = `${parcel.weightKg}|${parcel.zip}`;
    const entry = this.cache.get(key);
    if (entry && this.now() < entry.expiresAt) return entry.value;
    // Ne jamais mémoriser un échec : le retry doit avoir abouti avant mise en cache.
    const quote = await this.inner.getQuote(parcel);
    this.cache.set(key, { value: quote, expiresAt: this.now() + this.ttlMs });
    return quote;
  }
}
