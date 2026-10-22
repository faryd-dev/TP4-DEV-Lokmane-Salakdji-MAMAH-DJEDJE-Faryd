// Factory Method + registre : extensible sans switch et sans modification de ce fichier.
export class Channel {
  send(_message) { throw new Error('méthode abstraite'); }
}
export class EmailChannel extends Channel {
  send({ to, body }) { return `[EMAIL → ${to}] ${body}`; }
}
export class SmsChannel extends Channel {
  send({ to, body }) { return `[SMS → ${to}] ${String(body).slice(0, 160)}`; }
}
export class PushChannel extends Channel {
  send({ to, body }) { return `[PUSH → ${to}] ${body}`; }
}
const channels = new Map([
  ['email', EmailChannel],
  ['sms', SmsChannel],
  ['push', PushChannel],
]);
export function registerChannel(type, Classe) {
  if (typeof Classe !== 'function' || Classe === Channel || !(Classe.prototype instanceof Channel)) {
    throw new Error('Classe de canal invalide : doit hériter de Channel');
  }
  channels.set(type, Classe);
}
export function createChannel(type) {
  const Classe = channels.get(type);
  if (!Classe) throw new Error(`Canal inconnu : ${type}`);
  return new Classe();
}
