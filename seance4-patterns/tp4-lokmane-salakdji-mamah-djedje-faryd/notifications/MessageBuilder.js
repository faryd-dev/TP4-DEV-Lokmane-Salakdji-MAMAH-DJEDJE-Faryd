// Builder : les validations métier sont centralisées dans build().
export class MessageBuilder {
  constructor() {
    this._to = undefined;
    this._template = undefined;
    this._variables = new Map();
    this._priority = 'normale';
  }
  to(value) { this._to = value; return this; }
  template(value) { this._template = value; return this; }
  with(name, value) { this._variables.set(name, value); return this; }
  priority(value) { this._priority = value; return this; }
  build() {
    if (!this._to) throw new Error('Destinataire obligatoire');
    if (!this._template) throw new Error('Gabarit obligatoire');
    if (!['basse', 'normale', 'haute'].includes(this._priority)) {
      throw new Error(`Priorité invalide : ${this._priority}`);
    }
    const body = this._template.replace(/{{\s*([^{}]+?)\s*}}/g, (_, name) => {
      if (!this._variables.has(name) || this._variables.get(name) == null) {
        throw new Error(`Variable manquante : ${name}`);
      }
      return String(this._variables.get(name));
    });
    return Object.freeze({ to: this._to, body, priority: this._priority });
  }
}
