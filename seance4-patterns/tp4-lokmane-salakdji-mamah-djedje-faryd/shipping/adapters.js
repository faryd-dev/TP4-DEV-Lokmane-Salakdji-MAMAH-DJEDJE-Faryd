// Adapter : normalise des API incompatibles vers Promise<{carrier, price, days}>.
import { ColissimoApi, DhlClient } from '../../tp4/carrierApis.js';
export { ColissimoApi, DhlClient };
export class ColissimoAdapter {
  constructor(api) { this.api = api; }
  async getQuote({ weightKg, zip }) {
    const result = this.api.tarif({ poidsGrammes: weightKg * 1000, codePostal: zip });
    return { carrier: 'Colissimo', price: result.prixCentimes / 100, days: result.delaiJours };
  }
}
export class DhlAdapter {
  constructor(client) { this.client = client; }
  async getQuote({ weightKg, zip }) {
    const result = await this.client.getRate(weightKg, zip);
    return { carrier: 'DHL', price: Number(result.amount), days: result.transitDays };
  }
}
