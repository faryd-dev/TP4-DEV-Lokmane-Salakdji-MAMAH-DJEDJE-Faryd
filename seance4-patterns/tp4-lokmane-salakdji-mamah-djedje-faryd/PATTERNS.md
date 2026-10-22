# PATTERNS — TP 4 · parcours DEV

**Binôme :** Lokmane Salakdji · MAMAH DJEDJE Faryd  
**Projet :** ShopLite — notifications et comparaison de transporteurs  
**Master 1 Informatique — INGETIS · 22 octobre 2026**

## Tableau des patterns

| Pattern | Problème résolu dans ShopLite | Alternative écartée | Pourquoi écartée |
|---|---|---|---|
| Factory Method + registre | Instancier e-mail, SMS, push ou Slack à partir d'un identifiant, sans connaître les classes concrètes côté appelant. | Un `switch` sur le nom du canal. | Ajouter Slack imposerait de modifier la fabrique à chaque extension, contre le principe ouvert/fermé (OCP). |
| Builder | Construire progressivement un message paramétré, vérifier les variables et renvoyer un objet immuable. | Un constructeur avec de nombreux paramètres positionnels. | Difficile à lire, fragile face aux paramètres facultatifs, et les validations seraient dispersées. |
| Adapter | Comparer Colissimo (grammes, centimes, synchrone) et DHL (kg, texte, asynchrone) avec le même contrat `getQuote`. | Des conversions spécifiques dans `ShippingService`. | La façade dépendrait de chaque API externe et devrait changer à l'arrivée d'un transporteur. |
| Decorator | Ajouter retries et cache aux devis sans toucher aux adaptateurs ni changer leur interface. | Intégrer la logique de cache et de retry dans chaque adaptateur. | Duplication, responsabilités mélangées et impossibilité de composer librement les fonctionnalités. |
| Facade | Obtenir simplement le devis le moins cher (puis le plus rapide), même si un transporteur tombe en panne. | Faire `Promise.allSettled` et le tri des tarifs dans chaque appelant. | Répétition de la logique métier et gestion incohérente des pannes selon les écrans. |

## Justification de la composition cache et retry

La composition retenue est `CachedQuote(RetryQuote(DhlAdapter(...)))`. Le cache est à l'extérieur : sur un *hit*, aucune requête réseau ni nouvelle tentative n'est exécutée. Sur un *miss*, le retry traite les échecs transitoires et le cache ne conserve que le devis final réussi. Une exception n'est jamais mise en cache. À l'inverse, placer le retry autour du cache rend moins claire la responsabilité de chaque couche et peut compliquer la gestion des résultats ou des échecs mémorisés si le cache évolue.

## Décisions techniques

- **Factory / OCP :** `slack.js` importe `registerChannel` et installe `SlackChannel` ; `channels.js` n'est pas modifié pour cette extension.
- **Builder :** `to()`, `template()`, `with()` et `priority()` sont fluides ; toutes les validations sont effectuées par `build()` ; `Object.freeze` protège le message final.
- **Adapter :** les deux méthodes `getQuote` sont asynchrones et renvoient `{ carrier, price, days }` avec un prix numérique en euros.
- **Decorator :** `RetryQuote` tente au plus trois appels par défaut ; `CachedQuote` utilise `poids|codePostal`, une durée de vie et une horloge injectable pour des tests déterministes.
- **Facade :** `Promise.allSettled` permet d'ignorer les transporteurs défaillants. À égalité de prix, le délai le plus court gagne.

## Vérifications

Exécuter depuis la racine du projet :

```bash
node --test seance4-patterns/tp4-lokmane-salakdji-mamah-djedje-faryd/tp4.test.js
node seance4-patterns/tp4-lokmane-salakdji-mamah-djedje-faryd/main.js
```

Les API des transporteurs reproduites dans `seance4-patterns/tp4/carrierApis.js` proviennent du code imprimé dans l'énoncé : ce fichier était absent du ZIP antérieur. Lorsqu'un ZIP actualisé du professeur est disponible, il est préférable de remplacer cette reconstitution par son fichier original, sans le modifier.
