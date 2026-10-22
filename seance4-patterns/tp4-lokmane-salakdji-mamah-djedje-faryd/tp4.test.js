import test from 'node:test';
import assert from 'node:assert/strict';
import { Channel, EmailChannel, SmsChannel, PushChannel, createChannel, registerChannel } from './notifications/channels.js';
import { MessageBuilder } from './notifications/MessageBuilder.js';
import { ColissimoApi, DhlClient, ColissimoAdapter, DhlAdapter } from './shipping/adapters.js';
import { RetryQuote, CachedQuote } from './shipping/decorators.js';
import { ShippingService } from './shipping/ShippingService.js';
const parcel = { weightKg: 2, zip: '75011' };

test('Factory : e-mail, SMS et push', () => {
  const msg = { to: 'alice', body: 'Bonjour' };
  assert.equal(createChannel('email').send(msg), '[EMAIL → alice] Bonjour');
  assert.equal(createChannel('sms').send(msg), '[SMS → alice] Bonjour');
  assert.equal(createChannel('push').send(msg), '[PUSH → alice] Bonjour');
  assert.ok(createChannel('email') instanceof EmailChannel);
  assert.ok(createChannel('sms') instanceof SmsChannel);
  assert.ok(createChannel('push') instanceof PushChannel);
  assert.equal(createChannel('sms').send({ to: 'a', body: 'x'.repeat(161) }), '[SMS → a] ' + 'x'.repeat(160));
});
test('Factory : méthode abstraite et type inconnu', () => {
  assert.throws(() => new Channel().send({}), /méthode abstraite/);
  assert.throws(() => createChannel('fax'), /Canal inconnu : fax/);
});
test('Factory : refuse les classes qui ne dérivent pas de Channel', () => {
  assert.throws(() => registerChannel('invalide', class Invalid {}), /invalide/);
  assert.throws(() => registerChannel('invalide', {}), /invalide/);
});
test('Factory OCP : Slack ajouté par import, sans modifier channels.js', async () => {
  const { SlackChannel } = await import('./notifications/slack.js');
  assert.ok(createChannel('slack') instanceof SlackChannel);
  assert.equal(createChannel('slack').send({ to: 'logistique', body: 'Tarifs mis à jour' }), '[SLACK #logistique] Tarifs mis à jour');
});
test('Builder : message complet, fluent et immutable', () => {
  const builder = new MessageBuilder();
  assert.equal(builder.to('alice@exemple.fr'), builder);
  assert.equal(builder.template('Bonjour {{nom}}, votre colis part avec {{transporteur}}.'), builder);
  assert.equal(builder.with('nom', 'Alice'), builder);
  assert.equal(builder.with('transporteur', 'Colissimo'), builder);
  assert.equal(builder.priority('haute'), builder);
  const msg = builder.build();
  assert.deepEqual(msg, { to: 'alice@exemple.fr', body: 'Bonjour Alice, votre colis part avec Colissimo.', priority: 'haute' });
  assert.ok(Object.isFrozen(msg));
  assert.throws(() => { msg.body = 'modifié'; }, TypeError);
});
test('Builder : priorité normale par défaut', () => {
  assert.equal(new MessageBuilder().to('a').template('Bonjour').build().priority, 'normale');
});
test('Builder : destinataire obligatoire', () => {
  assert.throws(() => new MessageBuilder().template('Salut').build(), /Destinataire obligatoire/);
});
test('Builder : gabarit obligatoire', () => {
  assert.throws(() => new MessageBuilder().to('alice').build(), /Gabarit obligatoire/);
});
test('Builder : priorité valide', () => {
  assert.throws(() => new MessageBuilder().to('alice').template('Salut').priority('urgente').build(), /Priorité invalide : urgente/);
});
test('Builder : variable manquante', () => {
  assert.throws(() => new MessageBuilder().to('alice').template('Salut {{nom}}').build(), /Variable manquante : nom/);
});
test('Adapter : Colissimo 2 kg à 75011', async () => {
  assert.deepEqual(await new ColissimoAdapter(new ColissimoApi()).getQuote(parcel), { carrier: 'Colissimo', price: 9.95, days: 2 });
});
test('Adapter : DHL 2 kg à 75011', async () => {
  assert.deepEqual(await new DhlAdapter(new DhlClient()).getQuote(parcel), { carrier: 'DHL', price: 11, days: 1 });
});
test('Adapter : code postal invalide propagé', async () => {
  await assert.rejects(new ColissimoAdapter(new ColissimoApi()).getQuote({ weightKg: 2, zip: '750' }), /Code postal invalide/);
});
test('Decorator Retry : 2 pannes absorbées en 3 tentatives', async () => {
  const client = new DhlClient({ failFirst: 2 });
  assert.equal((await new RetryQuote(new DhlAdapter(client)).getQuote(parcel)).price, 11);
  assert.equal(client.calls, 3);
});
test('Decorator Retry : abandonne après 3 échecs', async () => {
  const client = new DhlClient({ failFirst: 5 });
  await assert.rejects(new RetryQuote(new DhlAdapter(client)).getQuote(parcel), /503 Service Unavailable/);
  assert.equal(client.calls, 3);
});
test('Decorator Cache : second appel évité, clé poids et code postal', async () => {
  const client = new DhlClient();
  const cached = new CachedQuote(new DhlAdapter(client));
  assert.deepEqual(await cached.getQuote(parcel), await cached.getQuote(parcel));
  assert.equal(client.calls, 1);
  await cached.getQuote({ weightKg: 3, zip: '75011' });
  assert.equal(client.calls, 2);
});
test('Decorator Cache : expiration pilotée par horloge', async () => {
  let time = 1000;
  const client = new DhlClient();
  const cached = new CachedQuote(new DhlAdapter(client), { ttlMs: 500, now: () => time });
  await cached.getQuote(parcel);
  time = 1499; await cached.getQuote(parcel);
  assert.equal(client.calls, 1);
  time = 1500; await cached.getQuote(parcel);
  assert.equal(client.calls, 2);
});
test('Decorator : cache(retry(dhl)) composable', async () => {
  const client = new DhlClient({ failFirst: 1 });
  const quote = new CachedQuote(new RetryQuote(new DhlAdapter(client)));
  assert.equal((await quote.getQuote(parcel)).price, 11);
  assert.equal((await quote.getQuote(parcel)).price, 11);
  assert.equal(client.calls, 2);
});
test('Decorator Cache : un échec ne doit pas être mis en cache', async () => {
  const client = new DhlClient({ failFirst: 1 });
  const cached = new CachedQuote(new DhlAdapter(client));
  await assert.rejects(cached.getQuote(parcel), /503/);
  assert.equal((await cached.getQuote(parcel)).price, 11);
  assert.equal(client.calls, 2);
});
test('Facade : 2 kg => Colissimo', async () => {
  const service = new ShippingService([new ColissimoAdapter(new ColissimoApi()), new DhlAdapter(new DhlClient())]);
  assert.equal((await service.bestQuote(parcel)).carrier, 'Colissimo');
});
test('Facade : 10 kg => DHL', async () => {
  const service = new ShippingService([new ColissimoAdapter(new ColissimoApi()), new DhlAdapter(new DhlClient())]);
  assert.deepEqual(await service.bestQuote({ weightKg: 10, zip: '75011' }), { carrier: 'DHL', price: 23, days: 1 });
});
test('Facade : prix égal => plus rapide', async () => {
  const service = new ShippingService([
    { getQuote: async () => ({ carrier: 'Lent', price: 10, days: 3 }) },
    { getQuote: async () => ({ carrier: 'Rapide', price: 10, days: 1 }) },
  ]);
  assert.equal((await service.bestQuote(parcel)).carrier, 'Rapide');
});
test('Facade : ignore un transporteur en panne', async () => {
  const service = new ShippingService([new DhlAdapter(new DhlClient({ failFirst: 10 })), new ColissimoAdapter(new ColissimoApi())]);
  assert.equal((await service.bestQuote(parcel)).carrier, 'Colissimo');
});
test('Facade : liste vide ou tous en panne => erreur', async () => {
  await assert.rejects(new ShippingService([]).bestQuote(parcel), /Aucun transporteur disponible/);
  await assert.rejects(new ShippingService([new DhlAdapter(new DhlClient({ failFirst: 10 }))]).bestQuote(parcel), /Aucun transporteur disponible/);
});
