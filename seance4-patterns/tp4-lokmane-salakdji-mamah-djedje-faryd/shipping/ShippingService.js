// Facade : une seule opération pour comparer les transporteurs.
export class ShippingService {
  constructor(carriers) { this.carriers = carriers; }
  async bestQuote(parcel) {
    const results = await Promise.allSettled(this.carriers.map(carrier => carrier.getQuote(parcel)));
    const quotes = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    if (quotes.length === 0) throw new Error('Aucun transporteur disponible');
    return quotes.reduce((best, quote) =>
      quote.price < best.price || (quote.price === best.price && quote.days < best.days)
        ? quote : best
    );
  }
}
