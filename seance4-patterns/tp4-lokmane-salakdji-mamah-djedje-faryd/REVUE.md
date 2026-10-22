# REVUE — TP 4 DEV

**Binôme auteur :** Lokmane Salakdji et MAMAH DJEDJE Faryd  
**État :** auto-vérification effectuée ; **revue croisée par un autre binôme à réaliser**.

## Remarque 1 — point fort (auto-vérification)

L'ajout du canal Slack se fait uniquement dans `notifications/slack.js`, grâce à `registerChannel` ; le fichier `channels.js` n'a pas besoin d'être modifié. Cette extension est une application concrète du principe OCP et évite une cascade de conditions.

## Remarque 2 — piste d'amélioration (auto-vérification)

`CachedQuote` mémorise correctement les devis réussis, mais ne mutualise pas encore deux appels *simultanés* pour le même colis. En situation de forte concurrence, une évolution consisterait à stocker temporairement une Promise en cours, puis à l'effacer en cas de rejet, pour éviter des requêtes doublées.

## Contrôle à faire avec l'autre binôme

- [ ] Vérifier que `channels.js` reste intact après l'ajout de Slack.
- [ ] Vérifier que toutes les validations du message ont lieu dans `build()`.
- [ ] Vérifier l'interface commune et la composition des décorateurs.
- [ ] Vérifier le comportement de la façade lorsqu'un transporteur échoue.

**Binôme relecteur :** à compléter  
**Date de la revue :** à compléter  
**Deux remarques du binôme relecteur :** à compléter après échange réel.
