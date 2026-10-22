// Point de composition : choix des transporteurs, décorateurs, messages et canaux.
import './notifications/slack.js';
import { createChannel } from './notifications/channels.js';
import { MessageBuilder } from './notifications/MessageBuilder.js';
import { ColissimoApi, DhlClient, ColissimoAdapter, DhlAdapter } from './shipping/adapters.js';
import { CachedQuote, RetryQuote } from './shipping/decorators.js';
import { ShippingService } from './shipping/ShippingService.js';

const shipping = new ShippingService([
  new CachedQuote(new ColissimoAdapter(new ColissimoApi())),
  new CachedQuote(new RetryQuote(new DhlAdapter(new DhlClient({ failFirst: 1 })))),
]);
for (const weightKg of [2, 10]) {
  const best = await shipping.bestQuote({ weightKg, zip: '75011' });
  const message = new MessageBuilder()
    .to('alice@exemple.fr')
    .template('Bonjour {{nom}}, votre colis de {{poids}} kg part avec {{transporteur}} ({{prix}} €).')
    .with('nom', 'Alice')
    .with('poids', weightKg)
    .with('transporteur', best.carrier)
    .with('prix', best.price.toFixed(2))
    .build();
  console.log(createChannel('email').send(message));
}
console.log(createChannel('slack').send({ to: 'logistique', body: 'Tarifs mis à jour', priority: 'normale' }));
