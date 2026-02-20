# AUDIT TECHNIQUE — VALO-SYNDIC

**Date:** 20 Février 2026
**Auditeur:** Jules (Senior Architect)
**Version:** 1.0

---

## 1. ARCHITECTURE & SCALABILITÉ

**Synthèse :**
L'architecture est celle d'un "Thick Client" déguisé en SaaS. Le cœur du métier (`calculator.ts`) est exécuté côté client, ce qui est excellent pour la réactivité (60ms pour un calcul) mais désastreux pour la sécurité de la propriété intellectuelle et la cohérence des données. L'application repose sur un fichier JSON statique (`dpe-49.json`) pour les données DPE, ce qui est une bombe à retardement pour la scalabilité nationale.

**Problèmes Critiques :**
1.  **Limitation "Département 49" :** Le système dépend de `dpe-49.json` (~400KB). Pour couvrir la France, il faudrait charger ~40MB de JSON ou multiplier les fichiers, rendant le build ou le chargement client ingérables. Une vraie base de données (PostgreSQL/PostGIS) est requise *immédiatement*.
2.  **Logique Métier Exposée :** Tout le savoir-faire (les "Failles" réglementaires optimisées) est dans le bundle JS client (`calculator.ts`). Un concurrent peut copier votre moteur en 5 minutes.

**Note :** 6/10
*Justification : MVP fonctionnel et rapide, mais architecture de données naïve pour une ambition nationale.*

---

## 2. CODE MORT & DETTE TECHNIQUE

**Synthèse :**
Le code est relativement propre mais contient des traces d'amateurisme inquiétantes pour un produit financier. Les commentaires mentionnant explicitement "Faille 3" ou "Faille 5" sont inacceptables dans un code professionnel auditable.

**Liste Exhaustive :**
-   **Types `any` :** 21 occurrences détectées (hors node_modules). C'est trop pour un projet financier.
    -   `src/hooks/useAddressSearch.ts` : Parsing API Adresse lâche.
    -   `src/lib/schemas.ts` : `json_data: z.any()` (Voir Sécurité).
    -   `src/services/riskService.ts` : Parsing Georisques non typé.
-   **Commentaires "Borderline" :**
    -   `src/lib/calculator.ts` : "Faille 3", "Faille 5", "Faille 7". Cela suggère une exploitation de zones grises réglementaires qui pourrait être illégale ou corrigée rétroactivement par l'État.
-   **Magic Numbers :** `calculator.ts` contient des valeurs en dur (prix au m², plafonds) qui devraient être dans une config injectée.

**Note :** 5/10

---

## 3. SÉCURITÉ (OWASP)

**Synthèse :**
La sécurité est le point faible majeur. La configuration CSP est permissive et le schéma de base de données accepte n'importe quoi.

**Failles Identifiées :**
-   **CSP Permissive (CRITIQUE) :** `middleware.ts` autorise `unsafe-eval` et `unsafe-inline` même en production (commenté comme "temporaire"). Cela ouvre la porte aux attaques XSS.
-   **Data Integrity (HAUTE) :** `src/lib/schemas.ts` définit `SavedSimulationSchema` avec `json_data: z.any()`. Cela signifie que vous pouvez stocker des données corrompues ou malveillantes dans votre base de données sans aucune validation. Si le format de `DiagnosticResult` change, vous casserez toutes les vieilles simulations sans le savoir.
-   **SSR Forgery (MOYENNE) :** `src/actions/getRealEstateData.ts` appelle une URL externe (`api.cquest.org`) sans validation stricte des paramètres d'entrée autres que le type number.

**Note :** 4/10

---

## 4. PERFORMANCE FRONT-END

**Synthèse :**
Performance correcte grâce à Next.js et Tailwind. Le chargement des polices est optimisé. Cependant, le chargement du JSON DPE est un goulot d'étranglement futur.

**Métriques Estimées :**
-   **Bundle Size :** Correct pour l'instant, mais le chargement de `leaflet` (CSS blocking) et `dpe-49.json` (400KB) va peser sur le FCP (First Contentful Paint) mobile.
-   **LCP (Largest Contentful Paint) :** Risque de dégradation si `dpe-49.json` grossit.

**Recommandations :**
-   Passer le chargement de `dpe-49.json` en Lazy Loading ou (mieux) en appel API serveur.

---

## 5. PERFORMANCE BACK-END & DATABASE

**Synthèse :**
Inexistante car "Serverless/Thick Client". Le backend se résume à des Server Actions et Supabase.

**Problèmes :**
-   **N+1 Potentiel :** Si vous passez à une vraie DB pour les DPE, l'absence d'ORM optimisé (actuellement appels fetch bruts ou json local) sera un problème.
-   **Pas de Cache API :** `getRealEstateData.ts` a un `revalidate: 86400`, ce qui est bien, mais c'est un cache de fichier Next.js, pas un cache distribué (Redis).

---

## 6. QUALITÉ DU CODE & TESTS

**Synthèse :**
Les tests unitaires (`calculator.test.ts`) existent et couvrent les cas critiques (MPR, Éco-PTZ). C'est un point fort. Cependant, il y a une incohérence flagrante : les tests s'attendent à un "Bonus Passoire" de 0 alors que le code semble l'activer (10%).

**Note Sonarqube Simulée :** C (Dette technique moyenne, Couverture partielle).

---

## 7. DEVOPS & PRODUCTION-READINESS

**Checklist :**
-   [x] Dockerfile présent.
-   [x] CI/CD (GitHub Actions) semble en place.
-   [ ] **Monitoring :** Sentry est configuré (`sentry.*.config.ts`), c'est un bon point.
-   [ ] **Logs :** Pas de structuration de logs visible (console.log/error standards).

---

## VERDICT FINAL

**Note Globale :** 58/100

**Verdict :** 🟡 **CORRECTIF NÉCESSAIRE**

Le projet est une preuve de concept (POC) avancée, mais pas une application prête pour une mise en production à grande échelle ou pour une acquisition sérieuse. L'approche "Tout en JSON local" et "Logique client" est un cul-de-sac architectural.

**Estimation :** 15 jours de dev senior pour rendre le projet "Investable".

**Deal-Breakers (Les 3 problèmes qui tueraient ce projet) :**
1.  **Scalabilité "Départementale" :** L'usage de `dpe-49.json` empêche tout déploiement national immédiat.
2.  **Sécurité CSP :** `unsafe-eval` en production est un red flag immédiat pour un auditeur sécu bancaire.
3.  **Intégrité des Données :** `z.any()` dans le schéma de sauvegarde de la base de données.

---

### PLAN D'ACTION (PRIORITAIRE)

1.  **Migrer les données DPE** vers Supabase (PostGIS) et créer une API de recherche géographique (2j).
2.  **Durcir la CSP** en supprimant `unsafe-eval` et `unsafe-inline` (1j).
3.  **Typer strictement** le champ `json_data` en base avec un schéma Zod versionné (1j).
4.  **Nettoyer le code** : Supprimer les commentaires "Faille", typer les `any` (2j).
