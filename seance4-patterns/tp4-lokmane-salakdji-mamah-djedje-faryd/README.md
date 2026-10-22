# TP4 — ShopLite — parcours DEV

Binôme : **Lokmane Salakdji** et **MAMAH DJEDJE Faryd**.  
Master 1 Informatique — INGETIS.

Ce dossier traite uniquement le parcours **DEV** du TP4 (Factory Method, Builder, Adapter, Decorator et Facade).

## Exécuter

Depuis la racine du projet `archi-logicielle-exemples-2` :

```bash
node --test seance4-patterns/tp4-lokmane-salakdji-mamah-djedje-faryd/tp4.test.js
node seance4-patterns/tp4-lokmane-salakdji-mamah-djedje-faryd/main.js
```

Aucune installation de dépendances n'est nécessaire (Node.js 20+).

## Fichiers

- `notifications/channels.js` : factory et registre.
- `notifications/slack.js` : extension sans modification de la factory.
- `notifications/MessageBuilder.js` : messages fluides, validés et immuables.
- `shipping/adapters.js` : transporteurs au contrat commun.
- `shipping/decorators.js` : retry et cache composables.
- `shipping/ShippingService.js` : façade robuste aux pannes.
- `main.js` : assemblage et démonstration.
- `tp4.test.js` : tests automatisés.
- `PATTERNS.md` : justification des choix.
- `REVUE.md` : auto-vérification et fiche pour la revue croisée.

**Remarque :** le ZIP fourni précédemment ne contenait pas `seance4-patterns/tp4/carrierApis.js`. Le fichier a été reproduit fidèlement depuis le PDF du sujet. Il doit rester non modifié ensuite.
