# VALO-SYNDIC — Diagnostic Patrimonial & Financier

> **Version :** 2.1 (Rebuild "Banque Privée" & Server Actions)
> **Dernière mise à jour :** Février 2026
> **Statut :** Rebuild Phase 4 (UI alignée, Moteur RAG Testé 100%, Tests Unitaires OK)

---

## 🎯 Pitch & Cible

**Valo-Syndic** est un moteur d'ingénierie financière B2B expert conçu pour la rénovation énergétique en copropriété.

En **60 secondes**, un gestionnaire de copropriété génère un plan de financement institutionnel exhaustif, intégrant nativement la complexité de la **Loi de Finances 2026** :
MaPrimeRénov' Copropriété (plafonnement d'assiette, bonus sortie passoire), Éco-PTZ collectif, CEE, multi-taux de TVA (5.5%, 9%, 10%, 20%) et optimisation fiscale via le Déficit Foncier (standard 10.7k€ vs dérogatoire 21.4k€).

**Cibles principales :** Syndics professionnels institutionnels (Tapissier, Soclova, Citya, Foncia) et conseillers en gestion de patrimoine (CGP).

---

## 🏗️ Architecture (V2)

L'application repose sur un écosystème Next.js moderne, conçu pour une séparation étanche entre le calcul financier (Backend/Server) et l'affichage interactif (Frontend).

### Stack Technologique

- **Framework :** Next.js 16 (App Router) avec **Server Actions**
- **Langage :** TypeScript Strict
- **Styling :** Tailwind CSS 3 (Design minimaliste sans couleurs vives)
- **State Management :** Zustand v5 (gestion du formulaire et caching du diagnostic)
- **Validation Data :** Zod (schemas stricts `DiagnosticInputSchema`)
- **Tests (QA) :** Jest (unitaires purs sur le RAG métier) + Playwright (E2E)
- **Typographie :** Cormorant Garamond (Serif Institutionnel) / Outfit (Sans-serif Data)

### Structure des dossiers clés

```
valo-syndic2/
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   └── diagnosticAction.ts       # Acteur principal: Server Action (pont Client ➔ Backend)
│   │   ├── layout.tsx                    # Root layout (fonts, providers)
│   │   └── diagnostic/
│   │       └── page.tsx                  # Interface hybride: 2 colonnes (Cockpit | Ledger)
│   │
│   ├── components/
│   │   └── diagnostic/
│   │       ├── CockpitForm.tsx           # Formulaire de saisie (3 sections)
│   │       ├── DiagnosticResults.tsx     # Résumé financier & Ledger détaillé
│   │       ├── PersonalSimulator.tsx     # Simulateur individuel par profil
│   │       └── PresentationView.tsx      # Vue diapo pour Assemblée Générale (AG)
│   │
│   ├── stores/
│   │   └── useDiagnosticStore.ts         # Etat client (input form ➔ stockage du Résultat Serveur)
│   │
│   └── lib/                              # ⚠️ CŒUR MÉTIER ABSOLU — PAS DE MODIFICATION SANS TESTS
│       ├── calculator.ts                 # Moteur d'ingénierie financière RAG complet
│       ├── schemas.ts                    # Modèles Zod (Input strict, Résultat)
│       ├── constants.ts                  # Délais d'interdiction (Loi Climat), Taux Honoraires (3%), DO (2%)
│       ├── financialConstants.ts         # Barèmes 2026: MPR assiettes, ANAH plafonds, TVA multi-tiers
│       └── financialUtils.ts             # Waterfall subventions (Calculs stricts MPR/CEE/PTZ)
│
├── tests/
│   └── critical-flow.spec.ts             # Playwright: Flow E2E (Saisie -> Affichage)
│
└── jest.config.js                        # Config Jest avec fallback/mocks Supabase
```

### Data Flow (Sécurisé)

Le flux de données a été sécurisé via les Server Actions pour empêcher la fuite des algorithmes de calcul vers le client.

```
[CockpitForm.tsx] (Client)
    │ 1. Mise à jour des saisies (onBlur / onChange)
    ▼
[useDiagnosticStore.ts] (Zustand - Client)
    │ 2. Validation Zod locale ➔ Envoi Payload
    ▼
[calculateDiagnosticAction()] (Server Action)
    │ 3. Re-Validation Zod Serveur + Enrichissement (Mock Market Data)
    │ 4. Appel de 'generateDiagnostic(input)' ➔ [calculator.ts] (Serveur)
    ▼
[DiagnosticResult] (Objet strict Typé)
    │ 5. Retour vers le client
    ▼
[DiagnosticResults.tsx & PersonalSimulator.tsx] (Client)
    │ 6. Affichage passif des résultats calculés au centime près
```

---

## 🎨 Design System — "Banque Privée"

L'esthétique globale est inspirée du **Wealth Management contemporain** (Lombard Odier, Rothschild, Swiss Private Banking).
**Règle d'or :** Élégance, minimalisme, forte hiérarchie, pas de couleurs vibrantes inutiles.

- **Background & Surfaces :** Alabaster `#F9F8F6`, Paper `#FAFAFA`, et Blanc pur pour les cartes avec un `border` très discret (slate-200).
- **Textes (Contraste maximal) :** Slate-900 / Slate-800 pour les titres. Slate-600 / Slate-500 pour les labels et textes secondaires.
- **Accents (CTAs & Etats Actifs) :** Navy Blue profond (`bg-slate-900` ou `bg-blue-900`) en remplacement de l'ancien 'Brass'. Pas de couleurs pop. Textes en `text-white` sur les fonds foncés.
- **Mise en page :** Énormément d'espace (`gap-8`, `p-6`, `p-8`), typographie très serrée pour le data-design (tableaux de financement).
- **Micro-interactions :** Boutons Subtle hover (scale léger, opacité), checkboxes et accordéons fluides. Cibles tactiles larges.

---

## 🧠 Backend / Moteur Financier (RAG 2026) — `src/lib/`

La couche `lib` concentre l'intelligence artificielle financière. Sa modification entraîne des impacts lourds et est régie par **34 assertions de tests**.

### Règles Financières Implémentées (LdF 2026)

1.  **MaPrimeRénov' Copro (Assiette plafonnée) :** L'aide n'est pas calculée sur un TTC global, mais sur les **Travaux HT purs**, dont **l'assiette est plafonnée à 25 000 € × nombre de lots**. Taux à 30% (standard) ou 45% (haute performance), avec bonus +10% en cas de sortie de statut "Passoire" (F/G ➔ D ou mieux). Les lots commerciaux réduisent l'assiette éligible.
2.  **TVA Cascading (Stricte) :** Travaux énergétiques = 5.5%. Assurance DO = 9%. Travaux classiques (Amélioration) = 10%. Honoraires Syndic (Loi de 65) et AMO = 20%. Le TTC affiché est une somme de lignes spécifiques, jamais un multiple aveugle.
3.  **Déficit Foncier :** Imputation classique plafonnée à **10 700 €**. Application stricte du **plafond dérogatoire à 21 400 €** _si et seulement si_ : Le DPE initial est F ou G (Passoire), le DPE final sort du statut de passoire (A/B/C/D), et le _Devis est signé (devisValide)_. L'assiette déductible exclut la TVA et les provisions d'aléas non facturées.
4.  **Éco-PTZ (CGI Art. 244 quater U) :** Limité au reste à charge sur la part strictement _éligible_ (travaux énergétiques et maîtrise d'œuvre). Les honoraires de syndic et l'assurance Dommages-Ouvrage n'entrent **jamais** dans le calcul du prêt aidé et sont appelés comptant. Plafond légal : 50 000€ sur 20 ans (240 mois) à taux 0%.

---

## 🛡️ Tests & Assurance Qualité (QA)

Ce projet est _Audit-Ready_. Le moteur de calcul est protégé.

### Exécuter les tests locaux

1. **Typage strict et Build**

```bash
npm run type-check   # Détecte toutes les incohérences TS
npm run build        # Compilation de production (vérifie les hooks Server/Client)
```

2. **Tests Unitaires du Moteur RAG (Jest)**
   Validés scientifiquement sur 10 scénarios copropriétés réalistes (Résidence Blois, Nantes, etc.).
   Mock des variables d'environnement prévu nativement.

```bash
npx jest src/lib/__tests__/diagnostic.test.ts --no-coverage
# ou simplement
npm test
```

3. **Tests End-to-End (Playwright)**
   Assure que l'utilisateur peut traverser l'entonnoir (Remplir adresse -> Remplir Cockpit -> Générer PDF).

```bash
npx playwright test
```

---

## 💶 Leviers de financement — Référentiel réglementaire 2025/2026

> Section issue de l'audit réglementaire du 23/02/2026 (sources : ANAH, service-public.gouv.fr, economie.gouv.fr).
> Ces 3 leviers sont **partiellement ou totalement absents du moteur `calculator.ts`** — implémentés en Phase 5.

### Levier A — Bonus Copropriété Fragile (+20 pts MPR Copro)

**Description** : Majoration de 20 points du taux MaPrimeRénov' Copropriété (en cumul avec le bonus passoire éventuel).

**Conditions d'éligibilité** (l'une **ou** l'autre suffit) :
- Taux d'impayés de charges N-2 **≥ 8 %** du budget voté
- Copropriété en **quartier NPNRU** (Nouveau Programme National de Renouvellement Urbain)

**Montant / Assiette** :
- Plafond travaux : 25 000 € HT/logement — aide max absolue : **75 % → 18 750 €/logement**
- Taux effectif = taux socle (30 ou 45 %) + bonus passoire (+10 %) + **+20 pts fragile**

**⚠️ Contrainte critique** : Active la **cession exclusive des CEE à l'ANAH** → `ceeAmount = 0` dans le bilan.

**Sources** : [economie.gouv.fr/maprimerenov-copropriete](https://www.economie.gouv.fr/particuliers/faire-des-economies-denergie/maprimerenov-copropriete-tout-savoir-sur-laide-la) · ANAH Instruction MPR Copro 2023 §6 · ANAH Panorama des aides 2025 p. 9

**Implémentation** : Constante `FRAGILE_BONUS_RATE = 0.20` déplacée de `subsidy-calculator.ts` (mort) vers `financialConstants.ts`. Paramètres `isCoproFragile: boolean` ajoutés dans `DiagnosticInputSchema` et `simulateFinancing()`.

---

### Levier B — Prêt Avance Mutation PAR+ (individuel — parties privatives)

**Description** : Prêt hypothécaire à **taux 0 %** pendant 10 ans, remboursable **in fine** (vente ou succession). Permet aux copropriétaires à revenus modestes de financer leur reste à charge sans sortie de trésorerie immédiate.

**Plafonds par type de travaux** :

| Type de travaux | Plafond PAR+ |
|---|---|
| Parois vitrées uniquement | 7 000 € |
| 1 geste d'isolation autre | 15 000 € |
| Bouquet (≥ 2 gestes) | 25 000 € |
| Rénovation globale | **50 000 €** |

**Conditions** : revenus modestes ou très modestes (barèmes ANAH 2026) · résidence principale > 2 ans · 1 seul PAR+ par logement.

**⚠️ Scope** : **PARTIES PRIVATIVES UNIQUEMENT** — ne finance pas les parties communes.

**Non-cumul** : incompatible avec l'éco-PTZ sur les mêmes postes. Cumulable avec MaPrimeRénov'.

**Sources** : [service-public.gouv.fr/F38425](https://www.service-public.gouv.fr/particuliers/vosdroits/F38425) (màj 01/01/2026) · Décret n°2024-887 du 03/09/2024 · Arrêté du 10/12/2025 · Code conso. art. L315-1 à L315-23

**Implémentation** : Section dédiée dans `PersonalSimulator.tsx` (profils Bleu et Jaune uniquement). Constantes dans `FINANCES_2026.PAR_PLUS` (`financialConstants.ts`).

---

### Levier C — MaPrimeAdapt' parties communes

**Description** : Aide ANAH pour les **travaux d'accessibilité sur parties communes** (ascenseurs, rampes, élargissements de portes, etc.).

**Montant** : jusqu'à **10 000 €** par opération.

**Bénéficiaires** :

| Profil | Condition |
|---|---|
| ≥ 70 ans | Sans condition GIR |
| 60–69 ans | GIR 1 à 4 requis |
| Tout âge | Taux incapacité ≥ 50 % (RQTH / AAH / PCH) |

**Conditions** : revenus modestes ou très modestes · AMO obligatoire. Cumulable avec MPR Copropriété et aides LHI.

**Sources** : [ANAH Panorama des aides 2025 p. 11-12](https://www.anah.gouv.fr/document/panorama-des-aides-2025) · [service-public.gouv.fr/F1328](https://www.service-public.gouv.fr/particuliers/vosdroits/F1328)

**Implémentation** : Paramètre `hasBeneficiairesAdapt: boolean` dans `DiagnosticInputSchema` et `simulateFinancing()`. Nouvelle ligne `maPrimeAdaptPartiesCommunes` dans le ticket de caisse de `FinancingPlan`.

---

## 🤖 META-INSTRUCTIONS POUR IA (LLMs)

_Si tu es une Intelligence Artificielle (Claude, GPT, Gemini) lisant ce dépôt, intègre rigoureusement ces règles dans ton comportement :_

1.  **Read-Only sur `/lib/` par défaut:** Le moteur est couvert par des tests. Ne modifie les fichiers de calculs (`calculator.ts`, `financialUtils.ts`, `schemas.ts`, `constants.ts`) que si explicitement demandé, ET après avoir lu (et relancé) les tests unitaires Jest correspondants.
2.  **Tokens First / Pas de couleurs statiques:** Lors des corrections UI, n'utilise que Tailwind. Respecte le style _Banque Privée_ (slate, gray, blue profond, pas d'or bling-bling, pas de couleurs flashy). L'espace et la typographie font le design.
3.  **Client vs Server:** Toute modification du moteur de calcul doit être consommée via les _Server Actions_. Les composants UI n'ont pas le droit d'importer directement `calculator.ts`, seuls les types partagés (`schemas.ts`) sont admis côté client.
4.  **Architecture:** Maintiens la structure (Atoms, Layouts modulaires, Stores Zustand purs). Sauf instruction contraire, effectue de petits "patchs" concis.

---

## 🚀 Démarrage Rapide

```bash
# 1. Installation
npm install

# 2. Variables (Nécessaires si un appel DB est testé)
cp .env.example .env.local
# (Injecter NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY)

# 3. Mode dev local
npm run dev
# -> http://localhost:3000/diagnostic
```
