# 🧬 LE CENTRE — Bible ADN Valo-Syndic
> **Version :** Bêta 2026  
> **Date :** 31 Janvier 2026  
> **Statut :** Mémo interne vivant — Le repo change, ce doc aussi  
> **Devise :** *"Code is Law"* — Interdiction formelle de mentir via le code

---

## 🎯 PITCH — Pourquoi Valo-Syndic existe

**Le problème :** Les syndics de copropriété perdent des votes en Assemblée Générale parce qu'ils ne savent pas expliquer les chiffres. Un devis de 300k€ pour la rénovation énergétique ? C'est intimidant.

**La solution :** Un calculateur qui transforme "300k€" en "47€/mois pour votre lot" — avec toutes les aides (MaPrimeRénov', Éco-PTZ à 0%) et la valeur verte de l'immeuble.

**En 60 secondes**, le gestionnaire génère un rapport PDF + des slides PowerPoint pour convaincre l'AG. En bonus, une extension Chrome aspire automatiquement les données depuis l'ERP du syndic.

**La promesse :** Zéro copropriétaire laissé sur le bord de la route parce qu'il n'a pas compris le financement.

---

## ⚠️ AVERTISSEMENT CRITIQUE — NE PAS SUPPRIMER

> **Ce document est la mémoire unique et centralisée du projet.**
> 
> **EN AUCUN CAS ce fichier ne doit être supprimé ou déplacé.**  
> Il sert de référence absolue pour :
> - La compréhension de l'architecture
> - L'onboarding de nouveaux développeurs
> - La maintenance à long terme
> - La prise de décision sur les évolutions
> 
> **Si vous lisez ceci après 2026 et que ce fichier est obsolète :** mettez-le à jour, ne le supprimez pas.

---

## 🤖 MESSAGE POUR LES IA (LLM/Agents)

> **Si vous êtes une IA (Claude, Kimi, GPT, etc.) modifiant ce codebase :**
> 
> 1. **LISEZ ce document AVANT toute modification**
> 2. **Maintenez ce document à jour** si vous changez :
>    - L'architecture (§3)
>    - Les composants UI (§5, §10)
>    - La stack technique (§7)
>    - Les constantes métier (§3.2)
> 3. **NE SUPPRIMEZ PAS ce fichier** — mettez-le à jour
> 4. **Respectez la philosophie** "Code is Law" (§1)
> 5. **Ajoutez vos modifications** à la section "Changelog" en bas du document
> 
> **Pour toute question :** ce document est la source de vérité. Si vous ne comprenez pas quelque chose, cherchez ici d'abord.

---

# 📋 SOMMAIRE EXPLIQUÉ

| Section | Contenu | Pour qui ? |
|---------|---------|------------|
| **1. Identité & Philosophie** | Le "pourquoi", la vision produit, le Design System "Stealth Wealth" | Tout le monde (lire en premier) |
| **2. Momentum d'Usage** | Les 3 moments clés : Avant/Durant/Après l'AG | Équipe produit, Sales |
| **3. Architecture** | Le moteur de calcul, flux de données, fichiers clés | Développeurs, Tech Leads |
| **4. Data Layer** | Sources de données (APIs, Supabase), ingestion via extension | Backend, Data Engineers |
| **5. UI Bento** | Les composants React, module "Avocat du Diable" | Frontend, UX/UI |
| **6. Livrables** | PDF, PowerPoint AG, les 3 formules KPI | Produit, Sales, Marketing |
| **7. Stack Technique** | Next.js, TypeScript, Supabase, outils | Développeurs, DevOps |
| **8. Sécurité & GDPR** | Principe "Local First", anonymisation | Security, Legal |
| **9. Infrastructure SQL** | Schémas Supabase, vues matérialisées | Backend, DBA |
| **10. Catalogue Widgets** | Liste détaillée de tous les composants UI | Frontend |
| **11. Workflow AI** | Comment on code avec Claude/Gemini/Kimi | Tous les développeurs |
| **12. Roadmap** | V2.1 → V3 → V4, la feuille de route | Produit, Management |
| **13. Annexe** | Tous les fichiers du repo catalogués | Référence technique |
| **14. Gestion Docs** | Quels .md conserver/supprimer | Maintenance |

**Conseil de lecture :**
- **Nouveau sur le projet ?** → Lire §1, §2, §6, puis §3
- **Développeur frontend ?** → §5, §7, §10
- **Développeur backend ?** → §3, §4, §8, §9
- **Tech Lead ?** → Tout lire, mais §3, §7, §11 en priorité

---

# 🚀 QUICK START — Onboarding Développeur

> **Pour les humains qui rejoignent le projet**

## Installation

```bash
# 1. Cloner le repository
git clone https://github.com/lesaffrejb-beep/valo-syndic.git
cd valo-syndic

# 2. Installer les dépendances
# Version Node.js requise : Node v20+ (voir package.json engines si spécifié)
npm install

# 3. Configuration des variables d'environnement
cp .env.example .env.local
```

## Configuration des Clés

Éditez `.env.local` et renseignez les variables suivantes :

```bash
# SUPABASE — Obligatoire
NEXT_PUBLIC_SUPABASE_URL=https://[votre-projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Trouvez ces clés dans : Dashboard Supabase > Settings > API
```

## Lancement

```bash
# Mode développement
npm run dev

# L'application sera accessible sur http://localhost:3000
```

## Vérification

- ✅ La page d'accueil s'affiche correctement
- ✅ Le formulaire de diagnostic est opérationnel
- ✅ La connexion Supabase fonctionne (voir badge en bas de page)

**En cas de problème :** Consultez §7 (Stack Technique) et §13.11.3 (Variables d'environnement).

---

# 1. IDENTITÉ & PHILOSOPHIE

## 1.1 Définition Produit
**Valo-Syndic** est un **moteur d'ingénierie financière B2B** pour la rénovation énergétique en copropriété.

| Aspect | Description |
|--------|-------------|
| **Nom de code** | "Le Cheval de Troie" (The Trojan Horse) |
| **Positionnement** | L'anti-vendeur de rêve. On ne vend pas des "économies magiques", mais de la **sécurité patrimoniale** |
| **Objectif caché** | Infiltrer le marché des Syndics (Tapissier, Soclova, Citya) avec une technologie supérieure qui "close" les votes en AG |

## 1.2 Le Problème (Pain Point)
Le **Syndic** ne maîtrise pas l'ingénierie financière (Aides + Prêts + Fiscalité) et ne sait pas produire un plan de financement individuel pour ses copropriétaires. Il craint de proposer des travaux car les coûts semblent insupportables et les aides opaques.

## 1.3 La Solution
Un **générateur de "Preuves Financières"** (PDF/Rapport) qui transforme la dépense en investissement sécurisé via un calcul de **"Reste à charge" bancable**.

> Le PDF n'est pas un rapport, c'est un **bon de commande déguisé en audit**.

## 1.4 Cible
- **Gestionnaires de copropriété**
- **Directeurs d'agence/Immobilier**

## 1.5 La Philosophie : "Doomer Pragmatique"
Le monde s'effondre (crise immo, climat, inflation), donc on s'arme de **rigueur radicale** et de **data locale**. Pas de blabla marketing, que des faits vérifiables.

**Mantra :** *"Convaincre par l'émotion (Design), valider par le chiffre (Data)."*

### Psychologie du Créateur (JB)
- **Profil :** "Architecte Inquiet" & "Couteau Suisse" (Tech + Juridique + Finance)
- **Localisation :** Angers (49) — Le projet est ancré localement (Data 49 pré-chargée)
- **Aversion totale :** Les "Hallucinations IA" (Double Majuscules, textes génériques "lorem ipsum", flèches moches -->, pages de remplissage inutile)

## 1.6 Design System — "Stealth Wealth"
| Élément | Spécification |
|---------|---------------|
| **Direction Artistique** | Fintech Sombre / Editorial (Style Finary / Linear / Cron). **Stealth Wealth**. |
| **Ambiance** | Obsidian, Glass & Steel, Or Alchimique. "Luxe Discret". |
| **Dark Mode** | **OBLIGATOIRE** — Fond #020202 ou #0A0A0A. **INTERDICTION** des fonds bleus/slate "cheap". |
| **Matériaux** | `.glass-panel` (Bordure with/5), Glassmorphism prononcé (Backdrop Blur XL). |
| **Typographie** | Titres stylisés, corps de texte lisible, espacement généreux. |
| **Iconographie** | **Lucide React** uniquement. **INTERDICTION** formelle des Emojis dans l'UI pro. |

---

# 2. MOMENTUM D'USAGE

Le produit est conçu pour être utilisé à **3 moments clés** du cycle de décision :

| Phase | Moment | Usage |
|-------|--------|-------|
| **Avant AG** | Construction des résolutions de financement | Convocation — Préparer le terrain |
| **Pendant AG** | Traitement des objections en direct | Solvabilité, ROI — Répondre aux blocages |
| **Après AG** | Montage des dossiers bancaires | Prêts collectifs/individuels — Concrétiser |

---

# 3. ARCHITECTURE — LE MOTEUR "SUBSIDY SNIPER"

Le cœur du réacteur est une **librairie de fonctions pures** (`calculator.ts` & `subsidy-calculator.ts`) qui exécute la logique IOBSP.

## 3.1 Logique de Calcul & Conformité ANAH 2026 (V3)

> **Principe fondamental :** Distinction stricte entre **RÈGLES OFFICIELLES** (Loi — Hard-coded) et **ESTIMATIONS PRUDENTES** (Configurable).

### A. RÈGLES OFFICIELLES (LOI DE FINANCES 2026 — CONFIRMÉ)

#### MaPrimeRénov' Copropriété (Le Socle)

| Paramètre | Valeur | Source |
|-----------|--------|--------|
| **Assiette de calcul** | Plafond strict : **25 000 € HT par logement** | Loi de Finances 2026 |
| **Taux de subvention** | • 30% si gain énergétique entre 35% et 50%<br>• 45% si gain énergétique > 50% | ANAH 2026 |
| **Bonus "Sortie de Passoire"** | +10% additionnels si passage F/G → D minimum | ANAH 2026 |
| **Bonus AMO** | 50% du montant AMO<br>Plafond : 600 € HT/lot<br>Plancher : 3 000 € par copropriété | ANAH 2026 |

**Formule officielle :**

```
MPR = min(
  (Travaux HT × Taux MPR),
  (25 000 € × Nombre de logements)
)
```

#### Plafond d'Écrêtement (Capping Légal)

> **RÈGLE CRITIQUE** — Le cumul des aides publiques **ne peut JAMAIS dépasser 80% du montant TTC** des travaux pour le Syndicat des Copropriétaires.

```
Si (MPR + CEE + Aides Locales) > (Travaux TTC × 0.80)
  → Écrêter le montant MPR pour respecter le plafond
```

**Fichier source :** `src/lib/financialUtils.ts` — Fonction `applyCapping()`

#### Éco-PTZ Copropriété (Financement)

| Paramètre | Valeur | Règle |
|-----------|--------|-------|
| **Plafond capital** | 50 000 € par lot | Condition : Rénovation Globale avec gain > 35% |
| **Durée** | 20 ans (240 mois) | Fixe |
| **Taux nominal** | 0,00% | Garanti par l'État |
| **Mensualité** | `Capital Emprunté / 240` | Pas d'intérêts |

**Formule stricte :**

```
Éco-PTZ = min(
  Reste à Charge Après Aides,
  50 000 € × Nombre de logements
)

Mensualité = Éco-PTZ / 240
```

⚠️ **Attention :** La mensualité DOIT être calculée avec cette formule stricte. Toute autre méthode produit des résultats faux.

---

### B. RÈGLES DE GESTION PRUDENTE (ESTIMATIONS MARCHÉ)

#### CEE (Certificats d'Économies d'Énergie)

> **Ne pas utiliser de valeur fixe** — Estimation dynamique basée sur le type de travaux.

| Paramètre | Valeur par défaut | Configuration |
|-----------|------------------|---------------|
| **Estimation** | 8% à 10% du montant travaux HT | Rénovation Globale (BAR-TH-164) |
| **Override** | Surchargeable par l'utilisateur | Input manuel prioritaire |

**Implémentation :** `src/lib/financialUtils.ts` — `estimateCEE()`

#### Écrêtement Individuel (Profils Couleurs)

La grille **Bleu 100% / Jaune 90% / Violet 80% / Rose 50%** s'applique aux **dossiers individuels MPR**, pas à l'aide collective.

| Usage | Règle |
|-------|-------|
| **Aide Collective** | Ne PAS appliquer l'écrêtement | La copro reçoit le taux plein (30% ou 45%) |
| **Warning Simulator** | Utiliser pour calculer le Reste à Charge final **théorique** par copropriétaire | Scénario pessimiste pour information uniquement |

**Fichier source :** `src/lib/subsidy-calculator.ts`

---

### C. KPIs & FORMULES (ANTI-BULLSHIT)

#### Algorithme de calcul du Reste à Charge (Ordre immuable)

```
1. Montant Travaux TTC
2. MINUS CEE (Est. 8-10% HT)
3. MINUS MPR Copro (Calculé sur HT, plafonné 25k/lot, écrêté à 80% TTC)
4. EQUAL Reste à Charge Collectif
5. DIVIDED BY Tantièmes = Quote-part Reste à Charge
6. FINANCING : Quote-part couverte à 100% par Éco-PTZ (dans la limite de 50k€)
```

#### KPI 1 : Flux de Trésorerie (Cashflow)

> **Impact mensuel sur le budget**

```
Cashflow = Économie Énergie Mensuelle Estimée - Mensualité Éco-PTZ
```

**Type :** Flux de trésorerie (Cash) — Impact mensuel réel sur le budget du copropriétaire.

#### KPI 2 : Valeur Patrimoniale (Stock)

> **Plus-value latente du bien**

```
Valeur Verte = Prix m² × Surface × % Valeur Verte
```

**Type :** Valorisation patrimoniale (Stock) — Gain théorique de valeur vénale.

⚠️ **INTERDICTION FORMELLE** d'additionner ce montant au Cashflow ou de le soustraire du coût des travaux.

**Wording obligatoire :** "Votre bien prend de la valeur, mais cette plus-value se réalise à la vente."

---

### D. Fichiers d'Implémentation

| Fichier | Rôle |
|---------|------|
| `src/lib/financialConstants.ts` | Barèmes ANAH 2026 (MPR, CEE, Éco-PTZ) |
| `src/lib/financialUtils.ts` | Calculateur strict (applyCapping, calculateEcoPTZ) |
| `src/lib/calculator.ts` | Orchestrateur principal |
| `src/lib/constants.ts` | Constantes réglementaires (dates, taux) |

---

## 3.2 Fichiers Clés

| Fichier | Rôle |
|---------|------|
| `src/lib/calculator.ts` | **Orchestrateur principal** — Pipeline Input → Compliance → Financing → Valuation |
| `src/lib/subsidy-calculator.ts` | **Moteur granulaire** — Calcul des aides individuelles par profil |
| `src/lib/services/riskService.ts` | **Normalisation risques** — Gaspar/Géorisques en scores 0-3 |
| `src/lib/constants.ts` | **Source unique de vérité** — Taux, dates, barèmes 2026 |
| `src/lib/financialConstants.ts` | **Barèmes financiers ANAH 2026** — Plafonds MPR/CEE/Éco-PTZ |
| `src/lib/financialUtils.ts` | **Calculateur financier strict** — MPR/CEE/RAC/Éco-PTZ + KPI cash |
| `src/lib/schemas.ts` | **Validation Zod** — Types stricts DiagnosticInput/Result |

## 3.3 Flux de Données (Unidirectional)

```
[USER INPUT] (Adresse)
      │
      ▼
[HOOK: useAddressSearch] 
      │──▶ (1) GET api-adresse.data.gouv.fr (Autocomplete)
      │──▶ (2) SELECT supabase.reference_dpe (Enrichissement)
      ▼
[STATE: diagnosticInput] (Hydraté avec adresse, dpe, surface...)
      │
      │ (User complète : coût travaux, nb lots...)
      ▼
[EVENT: onCalculate / useEffect]
      │
      ▼
[ENGINE: calculator.ts] (Pure Functions)
      │──▶ Reads constants.ts (Taux 2026)
      │──▶ Reads market-data.ts (Indices BT01)
      ▼
[STATE: diagnosticResult]
      │
      ▼
[UI: Dashboard / Bento]
      │──▶ <FinancingCard data={result.financing} />
      │       │──▶ (Async) fetch market_benchmarks.json
      │──▶ <RisksCard lat={...} lon={...} />
      │       │──▶ (Async) fetch georisques.gouv.fr
      │──▶ <ValuationCard data={result.valuation} />
      │──▶ <TantiemeCalculator data={result.financing} />
```

### Diagramme visuel (Mermaid)

```mermaid
flowchart TD
    A[👤 Utilisateur] -->|Saisie Adresse| B[🔍 useAddressSearch]
    B -->|Autocomplete| C[(🗺️ API Adresse BAN)]
    B -->|Enrichissement DPE| D[(🗃️ Supabase reference_dpe)]
    B --> E[📋 DiagnosticInput]
    
    E -->|Complètement| F[⚡ onCalculate]
    F --> G[🧮 calculator.ts]
    
    G -->|Lecture| H[📊 constants.ts]
    G -->|Lecture| I[📈 market-data.ts]
    
    G --> J[📊 DiagnosticResult]
    
    J --> K[🎛️ Dashboard Bento]
    K --> L[💰 FinancingCard]
    K --> M[📈 ValuationCard]
    K --> N[⚠️ RisksCard]
    K --> O[🧮 TantiemeCalculator]
    
    L -->|Benchmark| P[(📉 market_benchmarks.json)]
    N -->|Risques| Q[(🌍 API Géorisques)]
    
    style G fill:#E0B976,stroke:#020202,stroke-width:3px
    style J fill:#4CAF50,stroke:#020202,stroke-width:2px
    style A fill:#2196F3,stroke:#020202,stroke-width:2px
```

---

# 4. DATA LAYER — LA VÉRITÉ DU MARCHÉ

**Principe :** Fin des constantes optimistes. Utilisation de données réelles et pessimistes si nécessaire.

## 4.1 Variables Macro (Automatisées via API/Supabase)

| Variable | Source | Valeur Réf. |
|----------|--------|-------------|
| **Inflation BTP** | Table `market_data` (Supabase) + Scraping BdF/Insee | 2.0% (BT01 Nov 2025) |
| **Taux Usure/OAT** | Table `market_data` | Temps réel |
| **Taux Crédits** | Table `market_data` | Temps réel |
| **Prix m² local** | API DVF (Valeurs Foncières) + `market_benchmarks_49.json` | Réel |
| **Tendance Immo** | Table `market_data` | Baissière (-0.4% à -1.3%) |
| **Risques Climatiques** | API Géorisques | Temps réel |

## 4.2 Variables Dossier (Inputs & Overrides)

Définies dans le schéma `DiagnosticInput` :

| Catégorie | Champs |
|-----------|--------|
| **Physique** | Surface, Nbre lots, DPE (Actuel vs Projeté), Année construction |
| **Source** | API Adresse (Autocomplétion) + `reference_dpe` (Supabase) OU Saisie Manuelle |
| **Finances Copro** | Fonds travaux ALUR, Trésorerie, Clé de répartition (Tantièmes) |
| **Travaux** | Montant Devis (Global ou par Poste), Honoraires (Syndic/Maître d'œuvre) |

## 4.3 Fiscalité & Cibles (Inputs Fins)

| Élément | Détail |
|---------|--------|
| **Barèmes** | Plafonds MPR Copro/Bonus, CEE, Aides Locales |
| **Profils** | RFR Copropriétaires, Composition foyer, Statut (Occupant/Bailleur) |

## 4.4 🎯 Ingestion Active — L'Extension "Valo-Syndic Ghost"

**Killer Feature pour l'onboarding.**

L'extension Chrome/Firefox permet d'**aspirer automatiquement les données** depuis l'extranet du syndic (Foncia, Citya, Tapissier, Procopi, etc.) pour pré-remplir Valo-Syndic.

### Comment ça marche

| Étape | Action | Résultat |
|-------|--------|----------|
| 1 | Le syndic ouvre son ERP (ICS, Thetrawin, Powimo...) dans Chrome | - |
| 2 | Clic sur l'icône Ghost → "Scanner" | Détection auto des tableaux de lots |
| 3 | L'extension extrait : lots, tantièmes, surfaces, types | JSON structuré |
| 4 | Copie dans le presse-papier | Prêt à coller dans Valo-Syndic |
| 5 | Import dans l'app | Formulaire pré-rempli à 80% |

### Données extraites

| Champ | Source ERP | Usage Valo-Syndic |
|-------|------------|-------------------|
| `id` | Numéro de lot | Identification |
| `tantiemes` | Quote-part /1000 | Calcul répartition financière |
| `surface` | m² | Benchmark DPE, valorisation |
| `type` | T2/T3/Studio... | Catégorisation |

### Avantage compétitif

> **Ce qui prend 15 min de saisie manuelle devient 30 secondes.**
> 
> Le syndic n'a plus d'excuse pour ne pas tester l'outil. C'est le "hook" d'acquisition.

### Fichiers concernés

- `extension/` (tout le dossier)
- `src/lib/schemas.ts` → `GhostExtensionImportSchema`
- `src/components/import/JsonImporter.tsx`

---

## 4.5 Modèles de Données Cœurs

> **Source de vérité TypeScript** — Extraits de `src/lib/schemas.ts`

Cette section documente les interfaces TypeScript principales utilisées dans le moteur de calcul. Elle sert de référence pour éviter les hallucinations sur les noms de champs.

### 4.5.1 DiagnosticInput

Données d'entrée fournies par l'utilisateur :

```typescript
interface DiagnosticInput {
  // Localisation
  address?: string;                    // Adresse normalisée
  postalCode?: string;                 // Code postal (5 chiffres)
  city?: string;                       // Ville
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // DPE
  currentDPE: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  targetDPE: "A" | "B" | "C" | "D" | "E" | "F" | "G";

  // Copropriété
  numberOfUnits: number;               // Nombre de lots (2-500)
  commercialLots?: number;             // Lots commerciaux (non éligibles MPR)
  averageUnitSurface?: number;         // Surface moyenne d'un lot (m²)

  // Finances
  estimatedCostHT: number;             // Coût travaux HT
  alurFund?: number;                   // Fonds ALUR disponible
  ceeBonus?: number;                   // Primes CEE estimées
  localAidAmount?: number;             // Aides locales
  currentEnergyBill?: number;          // Facture énergétique annuelle globale

  // Immobilier
  averagePricePerSqm?: number;         // Prix m² quartier
  priceSource?: string;                // Source du prix ("DVF", "Manuel")
  salesCount?: number;                 // Nombre de ventes (crédibilité)

  // Contexte
  heatingSystem?: "electrique" | "gaz" | "fioul" | "bois" | "urbain" | "autre";
  investorRatio?: number;              // % bailleurs (0-100)
}
```

### 4.5.2 FinancingPlan

Plan de financement calculé par le moteur :

```typescript
interface FinancingPlan {
  // Coûts de base
  worksCostHT: number;                 // Coût travaux HT (base)
  totalCostHT: number;                 // Total HT (Travaux + Honoraires + Aléas)
  totalCostTTC: number;                // Total TTC (TVA 5,5%)
  
  // Honoraires
  syndicFees: number;                  // Honoraires Syndic (3%)
  doFees: number;                      // Assurance DO (2%)
  contingencyFees: number;             // Aléas (3%)
  costPerUnit: number;                 // Coût par lot
  
  // Gain énergétique
  energyGainPercent: number;           // Gain énergétique estimé (%)
  
  // Aides
  mprAmount: number;                   // MaPrimeRénov' Copropriété
  mprRate: number;                     // Taux MPR appliqué (0.30 ou 0.45)
  amoAmount: number;                   // Aide AMO
  exitPassoireBonus: number;           // Bonus sortie passoire
  ceeAmount: number;                   // CEE
  localAidAmount: number;              // Aides locales
  
  // Financement
  remainingCost: number;               // Reste à charge après aides
  ecoPtzAmount: number;                // Montant Éco-PTZ disponible
  monthlyPayment: number;              // Mensualité Éco-PTZ (20 ans)
  
  // KPI Cash
  monthlyEnergySavings: number;        // Économies mensuelles estimées
  netMonthlyCashFlow: number;          // Flux net (économie - mensualité)
  
  remainingCostPerUnit: number;        // Reste à charge par lot
}
```

### 4.5.3 DiagnosticResult

Résultat complet retour né par `calculator.ts` :

```typescript
interface DiagnosticResult {
  input: DiagnosticInput;              // Entrée utilisateur (echo)
  compliance: ComplianceStatus;        // Statut réglementaire (Loi Climat)
  financing: FinancingPlan;            // Plan de financement détaillé
  inactionCost: InactionCost;          // Coût de l'inaction (projection 3 ans)
  valuation: ValuationResult;          // Valorisation patrimoniale
  generatedAt: Date;                   // Timestamp génération
}
```

**Usage :** Ces types garantissent la cohérence entre le moteur de calcul, l'UI et les exports PDF/PPTX.

**Fichier source :** [`src/lib/schemas.ts`](file:///Users/jb/Documents/01_Gestionnaire%20de%20copro/valo-syndic/src/lib/schemas.ts)

---

## 4.6 Stratégie de Résilience & Cache

> **Principe :** L'application ne doit jamais planter à cause d'un service externe indisponible.

### Contexte

L'application s'appuie sur plusieurs APIs gouvernementales et services externes :
- API Adresse (BAN) pour l'autocomplétion
- API Géorisques pour les risques climatiques
- Supabase pour l'enrichissement DPE
- API DVF pour les prix m²

### Règles de Résilience

| Scénario | Comportement | Implémentation |
|----------|-------------|----------------|
| **API BAN down** | Fallback sur saisie manuelle | Form affiche input texte simple |
| **API Géorisques down** | Carte risques masquée, warning utilisateur | Composant `RisksCard` affiche placeholder |
| **Supabase DPE indisponible** | Utilisation données locales fallback | `dpeLocalService.ts` + cache JSON |
| **API DVF timeout** | Prix m² manuel ou estimé par défaut | Input override toujours disponible |

### Stratégie de Cache

| Données | Durée cache | Invalidation |
|---------|-------------|--------------|
| **DPE local** | Permanent | Mise à jour mensuelle (script) |
| **Prix m² DVF** | 24h | Force refresh disponible |
| **Market benchmarks** | 7 jours | Mise à jour hebdo |
| **Risques Géorisques** | Session | Stockage sessionStorage |

### Mode Dégradé

Si l'application détecte plusieurs services down :
1. Affichage banner informatif (jaune)
2. Désactivation auto-complétion → Saisie manuelle activée
3. Calculs continuent avec données fournies par utilisateur

**Fichiers concernés :**
- `src/hooks/useAddressSearch.ts` — Fallback saisie manuelle
- `src/components/business/RisksCard.tsx` — Gestion erreur fetch
- `src/lib/data/dpeLocalService.ts` — Cache local
- `src/lib/api/*Service.ts` — Wrappers API avec try/catch

---

# 5. COMPONENT LAYER — UI BENTO

L'UI est construite en **composants isolés** (`src/components/business/`) prêts à être exportés en rapport PDF.

## 5.1 Composants Métier Principaux

| Composant | Props | Rôle |
|-----------|-------|------|
| `FinancingCard` | `financing: FinancingPlan`, `numberOfUnits` | Affiche le plan de financement + fetch benchmark marché |
| `TantiemeCalculator` | `financing` | Outil interactif — Slider/Saisie pour recalculer la quote-part individuelle |
| `ValuationCard` | `valuation: ValuationResult` | Affiche le Gain Patrimonial (Valeur Verte) et le ROI |
| `InactionCostCard` | `inaction: InactionCost` | Visualisation du coût du "Non" (Inflation + Pertes) |
| `TransparentReceipt` | `financing` | Tableau détaillé "Ticket de caisse" pour la transparence Syndic |
| `MprSuspensionAlert` | `regulation` | Alerte conditionnelle réglementaire (Rouge/Orange) |
| `MarketLiquidityAlert` | `marketData` | Widget "Part de marché Passoires" — Urgence commerciale |
| `ClimateRiskCard` | `compliance` | Timeline Loi Climat (Frise chronologique) |
| `RisksCard` | `lat`, `lon` | Fetch asynchrone Géorisques |
| **`ObjectionHandler`** | `scenario: string` | **🛡️ Module "Avocat du Diable" — Aide à la vente en temps réel** |

### 5.1.1 🛡️ Le "Avocat du Diable" (ObjectionHandler)

**Usage :** Pendant l'AG, quand le copropriétaire "Grognon" lève une objection.

**Problème résolu :** Le gestionnaire junior ne sait pas répondre aux blocages émotionnels. Ce module lui fournit les réponses clés en main, basées sur les données du diagnostic.

**Objections couvertes :**

| Objection | Réponse type | Données utilisées |
|-----------|--------------|-------------------|
| **"Ça coûte trop cher"** | "Pour vous, ça représente 47€/mois, et votre bien prend +15% de valeur" | Mensualité personnalisée, plus-value |
| **"Je vends bientôt, ça ne me concerne pas"** | "Un DPE F se vend 15% moins cher. Même en vendant, vous perdez de l'argent" | Décote passoire, Valeur Verte |
| **"Les aides c'est du pipeau, on ne les aura jamais"** | "L'Éco-PTZ est garanti par l'État. Le taux est à 0%, voici l'offre pré-remplie" | Éco-PTZ bancable, Prêt garanti |
| **"On attendra que ce soit obligatoire"** | "Location déjà interdite depuis 2025. En 2028, c'est l'interdiction totale" | Timeline réglementaire |
| **"Les travaux vont durer 2 ans"** | "Durée moyenne constatée : 8 mois. Voici le planning type" | Stats chantiers |

**Mode d'emploi AG :**
1. Le copropriétaire pose une objection
2. Le gestionnaire ouvre le module (bouton "Objections")
3. Il clique sur l'objection correspondante
4. La réponse s'affiche avec les **chiffres réels du projet**
5. Il peut projeter l'écran ou lire la réponse

**Fichier :** `src/components/business/ObjectionHandler.tsx`

## 5.2 Hiérarchie & Pattern

1. **Page (`page.tsx`)** : Orchestrateur — Gère State `diagnosticInput`/`Result`, Hooks pour fetch
2. **Layout Bento** : CSS Grid Container — Les cartes sont enfants directs (Stack vertical pour "My Pocket")
3. **Leaf Components** : `AnimatedCurrency`, `BenchmarkBadge` — UI Pures

---

# 6. LIVRABLES & ARGUMENTAIRES DE SORTIE

Le moteur produit **3 types de livrables** pour convertir l'AG, du plus détaillé au plus percutant.

---

## 6.1 📄 PDF — Le Rapport Complet

**Usage :** Remis aux copropriétaires avant/après l'AG (email, boîte aux lettres).

**Contenu :**
- Page de garde avec synthèse exécutive
- Plan de financement détaillé
- Graphiques Valeur Verte vs Inaction
- Comparatif par profil fiscal (Bleu/Jaune/Violet/Rose)
- Mentions légales et sources

**Tech :** `@react-pdf/renderer`

---

## 6.2 📊 PPTX — Le Support de Présentation AG

**Usage :** **Projeter à l'écran pendant l'AG.** Le gestionnaire ne lit pas un PDF de 20 pages, il projette des slides percutantes.

**Pourquoi c'est vital :**
- En AG, l'attention est fragmentée (80 personnes, 3h de réunion)
- Une slide bien faite = 1 message = 10 secondes de compréhension
- Le gestionnaire junior a un **fil conducteur** pour présenter

**Structure du deck (8-10 slides) :**

| Slide | Contenu | Hook |
|-------|---------|------|
| 1 | Titre + Adresse + "Vote en cours" | Contexte |
| 2 | **Le Choix** : Action vs Inaction (split screen) | Accroche émotionnelle |
| 3 | Situation actuelle : DPE + Interdiction location | Urgence légale |
| 4 | Objectif : DPE cible + Gain énergie | Vision positive |
| 5 | **Le Plan de Financement** (gros chiffres) | Rassurance financière |
| 6 | Ce que ça coûte VRAIMENT par mois (petit chiffre) | Désamorçage prix |
| 7 | Ce que vous gagnez en valeur (gros chiffre) | Avantage patrimonial |
| 8 | Timeline travaux + Phases | Concrétisation |
| 9 | QR Code Vote (engagement immédiat) | Call-to-action |

**Tech :** `pptxgenjs`

**Fichiers :**
- `src/lib/pptx-generator.ts` (moteur)
- `src/lib/pptx/slides.ts` (templates)
- `src/lib/pptx/theme.ts` (design Stealth Wealth)

---

## 6.3 🎯 Les 3 Formules KPI (Argumentaires Métier)

Le moteur transforme les variables en **3 formules décisives** pour convaincre :

## 6.1 Le Coût de l'Inaction (La Peur Rationnelle)
**Argument :** *"Si vous votez NON, voici ce que vous perdrez à coup sûr."*

```
Coût Inaction = (Travaux × Inflation BT01^années) + (Surcoût Énergie × années) + (Prix m² × Décote Passoire)
```

## 6.2 La Protection de Valeur (Le Bouclier)
**Argument :** *"Dans un marché qui baisse, votre bien rénové maintient son prix, le voisin (F) perd 15%."*

```
Gain Net = (Prix m² × Surface × %Valeur Verte) − (Reste à Charge Travaux)
```

## 6.3 Le Cashflow Mensuel (La Clarté)
**Argument :** *"En réel, cela ne pèse que X€ sur votre budget mensuel."*

```
Effort Réel = Mensualité Crédit − (Économie Énergie Mensuelle)
```

---

# 7. STACK TECHNIQUE

## 7.1 Core & Frontend

| Composant | Technologie | Usage |
|-----------|-------------|-------|
| **Framework** | Next.js 16+ (App Router) | SSR, performance, React Server Components |
| **UI Library** | React 19+ | Latest React features |
| **Langage** | TypeScript Strict | "Code is Law" — Pas de `any` |
| **Styling** | Tailwind CSS + Framer Motion | UI "Bento", animations fluides |
| **State Management** | Zustand | Stores simples (ViewMode, Simulation) |
| **Validation** | Zod | Validation stricte inputs API et Formulaires |
| **PDF Generation** | @react-pdf/renderer | Moteur de rendu côté client/serveur |
| **PPTX Generation** | pptxgenjs | Export PowerPoint pour AG |
| **Charts** | Recharts | Graphiques financiers |
| **Maps** | Leaflet / react-leaflet | Cartographie risques/audits |

## 7.2 Backend & Data

| Composant | Technologie | Usage |
|-----------|-------------|-------|
| **Database** | Supabase (PostgreSQL) | Stockage benchmarks, simulations, DPE |
| **Auth** | Supabase Auth | Protection dossiers B2B |
| **Compute** | Vercel Edge Functions | Scraping/mise à jour données |
| **Cache** | React Query (à ajouter) | Cache API intelligent |

## 7.3 Qualité & Tests (Le Garde-Fou)

| Type | Outil | Obligatoire sur |
|------|-------|-----------------|
| **Unit Testing** | Vitest / Jest | `calculator.ts`, `subsidy-calculator.ts` — Chaque formule financière |
| **E2E Testing** | Playwright | Parcours critiques |
| **Linting** | ESLint | Qualité code |
| **Type Checking** | TypeScript | `npx tsc --noEmit` |

## 7.4 Déploiement (CI/CD)

| Aspect | Configuration |
|--------|---------------|
| **Plateforme** | Vercel |
| **Trigger** | Push sur la branche `main` |
| **Pipeline GitHub Actions** | Tests (`npm run test`) + Linter (`npm run lint`) doivent passer avant déploiement |
| **Preview Deployments** | Créées automatiquement pour chaque Pull Request |
| **Production** | `main` branch uniquement |

### Workflow de mise en prod

```bash
# 1. Développement sur branche feature
git checkout -b feature/ma-nouvelle-fonctionnalite

# 2. Commit & Push
git add .
git commit -m "feat: ajout de X"
git push origin feature/ma-nouvelle-fonctionnalite

# 3. Créer une Pull Request (GitHub)
# → Vercel déploie une preview automatiquement
# → GitHub Actions exécute tests + lint

# 4. Merge sur main après review
# → Vercel déploie en production automatiquement
```

### Variables d'environnement Vercel

Configurez ces variables dans le dashboard Vercel :

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Clé anonyme Supabase (lecture) |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ | Clé service (écriture admin) — ne pas exposer côté client |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | Monitoring d'erreurs (optionnel) |

---

# 8. SÉCURITÉ, TESTS & GDPR

Manipuler des **revenus fiscaux (RFR)** et données financières exige une hygiène stricte.

## 8.1 Principe "Local First"
- Les simulations en cours restent dans le **localStorage** ou en **mémoire volatile**
- Aucune donnée fiscale n'est stockée en base par défaut
- Sauvegarde uniquement sur action explicite "Sauvegarder le dossier"

## 8.2 Anonymisation
- Les rapports PDF générés ne stockent pas les **noms des copropriétaires** en base
- Seuls les **IDs de lots** et les **profils fiscaux** (Couleur MPR) sont conservés

## 8.3 RLS (Row Level Security)
- Règles strictes sur Supabase
- Un utilisateur ne peut lire que **ses simulations**

## 8.4 Rétention
- Suppression automatique des simulations non finalisées après **30 jours**

## 8.5 Stratégie de Test (Sans coder)

| Méthode | Description |
|---------|-------------|
| **Tests Unitaires IA** | Génération auto de fichiers `.test.ts` par Claude Sonnet pour chaque fonction de calcul |
| **"Golden Master" Testing** | Scénarios de référence générés et validés par IA (Cross-check Kimi/Claude), pas de fichier Excel manuel |
| **Non-Régression** | Avant chaque commit : "Exécute les tests Vitest et confirme que le calcul de l'Éco-PTZ renvoie toujours 0% d'intérêts" |

**Processus Golden Master :**
1. L'IA génère des scénarios de test avec des paramètres réalistes
2. Cross-validation entre Kimi (mathématiques) et Claude (logique métier)
3. Résultats validés intégrés comme tests de référence dans `src/lib/__tests__/`
4. Toute modification du moteur de calcul doit passer ces tests

---

# 9. INFRASTRUCTURE DE DONNÉES (SUPABASE SQL)

## 9.1 Stockage de Masse (`reference_dpe`)
Base de données locale des DPE (Source ADEME) optimisée pour le benchmarking instantané.

| Attribut | Détail |
|----------|--------|
| **Contenu** | Données techniques (Conso kWh/m², Étiquette, Année construction) géolocalisées |
| **Performance** | Indexation lourde sur `code_postal`, `ville`, `annee_construction` — Requêtes < 50ms |
| **Usage** | Situer l'immeuble du client par rapport au parc existant ("Social Proof") |

## 9.2 Intelligence Statistique (Vues Matérialisées)

Pour éviter les latences, les statistiques sont **pré-calculées** :

| Vue | Usage |
|-----|-------|
| `analytics_dpe_distribution` | Répartition marché par étiquette ("15% sont F/G") — Alerte Liquidité |
| `analytics_benchmark_construction` | Consommation moyenne par décennie — Démonstration potentiel économie |

## 9.3 Automatisation (pg_cron)

| Job | Détail |
|-----|--------|
| `refresh_dpe_daily` | Exécution 04h00 quotidienne — Rafraîchissement vues matérialisées (Concurrently) |

## 9.4 Pilotage Dynamique (`market_data`)

Table clé-valeur (JSONB) — "Source of Truth" unique pour constantes financières.

| Clés gérées | Usage |
|-------------|-------|
| `bt01` | Inflation BTP |
| `market_trend` | Tendance immo |
| `regulation` | Statut Lois |
| **Sécurité** | Lecture publique (App), Écriture restreinte (Admin/Service Role) |

## 9.5 Audit Flash (`audits_flash`)

Table centrale du module Audit Flash — transforme une adresse en analyse financière.

| Attribut | Détail |
|----------|--------|
| **Statut** | Machine à états `DRAFT` → `READY` → `COMPLETED` (enum `audit_flash_status`) |
| **Golden Data** | 4 données critiques avec traçabilité : `surface_habitable`, `construction_year`, `dpe_current`, `price_per_sqm` |
| **Traçabilité** | Chaque Golden Data porte `_origin` (api/manual/estimated/fallback), `_source` (texte), `_confidence` (0-1) |
| **Résultats** | Colonne JSONB `computation` contient simulation, valuation, inaction_cost, compliance |
| **Audit trail** | `api_responses` (JSONB) et `enrichment_sources` (JSONB) tracent chaque appel API |
| **Sécurité** | RLS ouvert en dev (SELECT/INSERT/UPDATE publics) — à durcir en prod |
| **Vue** | `audits_flash_summary` : vue résumé avec les KPI extraits du JSONB |

**Colonnes enrichissement :** `number_of_units`, `heating_system`, `cadastre_parcel_id`, `cadastre_surface_terrain`, `target_dpe`

## 9.6 Paramétrage (`global_settings`)

Table clé-valeur pour les constantes métier modifiables sans redéploiement.

| Catégorie | Clés | Valeurs par défaut |
|-----------|------|-------------------|
| `aids` | `mpr_rate_standard`, `mpr_rate_high_perf`, `mpr_ceiling_per_lot`, `mpr_min_energy_gain`, `cee_rate`, `cee_max_per_lot`, `eco_ptz_max_per_lot`, `eco_ptz_duration_months` | 30%, 45%, 25000€, 35%, 8%, 5000€, 50000€, 240 mois |
| `technical` | `reno_cost_per_sqm`, `tva_renovation` | 180€/m², 5.5% |
| `inflation` | `bt01_inflation_rate` | 2% |
| `market` | `green_value_high`, `green_value_standard` | 12%, 8% |
| `pricing` | `base_price_per_sqm` | 3500€ |
| `regulation` | `mpr_copro_active` | false (MPR Copro suspendue) |

**Accès :** Fonction SQL `get_setting('cle')` retourne directement le JSONB.

## 9.7 Script SQL Unique : `reset_and_init.sql`

**Fichier :** `supabase/migrations/reset_and_init.sql`

Ce script est **idempotent** et conçu pour être copié-collé directement dans l'éditeur SQL de Supabase.

| Action | Détail |
|--------|--------|
| **GARDE** | `reference_dpe` (~4000 DPE dept 49), `coproperty_data` (RNIC), vues matérialisées, cron |
| **NETTOIE** | `market_data` (drop + recreate avec schema propre), `global_settings` (drop + recreate) |
| **CREE** | `audits_flash` + enums `audit_flash_status` / `data_origin` + vue `audits_flash_summary` |
| **INSERE** | Seed data dans `market_data` (bt01, tendances) et `global_settings` (constantes métier) |

**Usage :**
1. Ouvrir l'éditeur SQL Supabase
2. Copier-coller l'intégralité de `reset_and_init.sql`
3. Exécuter
4. Vérifier avec le SELECT commenté en bas du fichier

## 9.8 Module Audit Flash (Backend)

**Fichiers :**
- `src/lib/audit-flash/types.ts` — Types alignés 1:1 avec SQL
- `src/lib/audit-flash/engine.ts` — Orchestrateur (hunt API → checkpoint → calcul)
- `src/lib/audit-flash/index.ts` — Barrel export
- `src/app/api/audit/init/route.ts` — `POST /api/audit/init`
- `src/app/api/audit/complete/route.ts` — `POST /api/audit/complete`

**Flow :**
```
POST /api/audit/init { address, numberOfUnits?, targetDPE? }
  → BAN (géocodage) [séquentiel]
  → Cadastre + DVF + ADEME [parallèle, 10s timeout chacun]
  → Checkpoint de Vérité (4 Golden Data complètes ?)
    → OUI : calcul ValoSyndic → status: COMPLETED
    → NON : status: DRAFT + missingFields[]

POST /api/audit/complete { auditId, manualData, targetDPE? }
  → Lit le DRAFT depuis Supabase
  → Fusionne les données manuelles
  → Recalcule → status: COMPLETED
```

---

# 10. CATALOGUE DES WIDGETS (BENTO UI)

L'interface est modulaire. Chaque widget est indépendant.

## 10.1 Widgets "Alerte & Contexte" (Le Haut de Page)

| Widget | Déclencheur | Rendu |
|--------|-------------|-------|
| `MprSuspensionAlert` | `isMprCoproSuspended = true` | Banner rouge/orange — "Dispositif suspendu (Attente LdF)" |
| `MarketLiquidityAlert` | Tous les cas | Carte type "Bourse" — Part de marché passoires (ex: 15%) + tendance prix |
| `RiskRadar` | Coordonnées GPS | Hexagone visuel résumant risques climatiques (Argile, Inondation, Radon, Sismicité) |

## 10.2 Widgets "Preuve Financière" (Le Cœur)

| Widget | Rendu |
|--------|-------|
| `FinancingCard` (Synthèse) | Gros chiffres — Coût total vs Reste à charge global |
| `TransparentReceipt` (Ticket de Caisse) | **Star V2** — Liste verticale : Travaux > Aides > Emprunt > Cashflow = Effort Réel |
| `InactionCostCard` (La Peur) | Graphique barres — "Coût Travaux (fixe)" vs "Coût Inaction (exponentiel)" |
| `ValuationCard` (Le Gain) | "Bouclier Patrimonial" — Valeur future projetée (C) vs valeur dégradée (F) |

## 10.3 Widgets "Action & Interaction" (Le Bas de Page)

| Widget | Interaction |
|--------|-------------|
| `TantiemeCalculator` | Slider/Input — Chiffre personnel en temps réel |
| `ProfileSelector` | Boutons (Bleu/Jaune/Violet/Rose) — Changement simulation d'aides individuelles |
| `DownloadPdfButton` | Génération PDF brandé |
| `DownloadPptxButton` | Génération PowerPoint pour AG |

---

# 11. WORKFLOW DE DÉVELOPPEMENT (AI-AUGMENTED)

Le projet est développé sans écriture de code manuelle ("No-Code via Code"), en orchestrant plusieurs modèles d'IA selon leurs forces.

## 11.1 L'Orchestration (IDE)

| Outil | Usage |
|-------|-------|
| **Antigravity** (Cursor/Windsurf fork) | IDE principal — Génération de code en masse et intégration |
| **VS Code + Kimi Code** | Vérification mathématique complexe |

## 11.2 La "Stack IA" (Les Rôles)

| Rôle | Modèle | Usage | Fréquence |
|------|--------|-------|-----------|
| **Architecte** | Claude 3 Opus | Décisions d'architecture critiques, refontes structurelles majeures | 1x/jour max (coût élevé) |
| **Lead Dev** | Claude 3.5 Sonnet (via Antigravity/Thinking) | Raisonnement complexe, composants React, UX/UI | Quotidien |
| **Ouvrier** | Gemini 1.5 Pro | Génération code répétitif, documentation, refactoring de masse, SQL | Volume |
| **Mathématicien** | Kimi 2.5 Thinking (via extension VS Code) | **Seul autorisé** à toucher aux algorithmes de prêt et d'amortissement — Garantie précision logique | Contrôle |

### Diagramme de l'Usine IA (Mermaid)

```mermaid
flowchart LR
    subgraph IDE["🖥️ Environnement"]
        A[Antigravity<br/>Cursor/Windsurf] 
        B[VS Code + Kimi]
    end
    
    subgraph ROLES["🎭 Stack IA"]
        C[👑 Claude 3 Opus<br/>Architecte<br/>1x/jour]
        D[🔧 Claude 3.5 Sonnet<br/>Lead Dev<br/>Quotidien]
        E[⚡ Gemini 1.5 Pro<br/>Ouvrier<br/>Volume]
        F[🧮 Kimi 2.5 Thinking<br/>Mathématicien<br/>Contrôle]
    end
    
    subgraph OUTPUT["📦 Livrables"]
        G[Architecture]
        H[Composants React]
        I[SQL/Refactoring]
        J[Tests Maths]
    end
    
    A -->|Prompts Complexes| C
    A -->|Génération Code| D
    A -->|Tâches Massives| E
    B -->|Vérification| F
    
    C -->|Décisions| G
    D -->|Code| H
    E -->|Scripts| I
    F -->|Validation| J
    
    J -->|Feedback| D
    G -->|Contraintes| D
    
    style C fill:#E0B976,stroke:#020202,stroke-width:3px
    style F fill:#4CAF50,stroke:#020202,stroke-width:3px
    style A fill:#2196F3,stroke:#020202,stroke-width:2px
```

**Légende du flux :**
1. **Architecte** (Opus) valide les grandes orientations
2. **Lead Dev** (Sonnet) implémente avec les contraintes
3. **Ouvrier** (Gemini) gère le volume (docs, SQL)
4. **Mathématicien** (Kimi) valide les calculs et bloque si erreur
5. **Boucle de feedback** : Les tests de Kimi alimentent les corrections de Sonnet

---

# 12. ROADMAP & VISION

## 12.1 Phase V2.1 : L'Export "Closing" (P1)

| Feature | Description |
|---------|-------------|
| **PDF Haute-Fidélité** | Transformer grille Bento Web en rapport A4 PDF propre, brandé logo Syndic, prêt pour convocation AG |
| **Page de Garde "Offre de Prêt"** | Fiche standardisée (FISE) pré-remplie pour les banques |

## 12.2 Phase V3 : L'Écosystème Syndic (P2)

| Feature | Description |
|---------|-------------|
| **Dashboard Multi-Copro** | Vue "Gestionnaire" pour suivre 50 immeubles en parallèle (Qui est éligible ? Qui est urgent ?) |
| **Connexion Bancaire (API)** | Remplacer taux théoriques par offres de prêt réelles via API partenaires |

## 12.3 Phase V4 : Le "God Mode" (Prospection)

| Feature | Description |
|---------|-------------|
| **Mass Audit** | Scanner une ville entière (cadastre + data DPE) pour identifier les 100 copropriétés les plus rentables à rénover |
| **Ingest IA** | Drag & Drop PV d'AG (PDF) — L'IA extrait automatiquement travaux votés/refusés et budgets passés |
| **Auto-Prospection** | Génération courriers de prospection automatique |

## 12.4 Feature Ultime — L'Adresse Magique

> **Objectif :** Quand on tape juste une adresse d'immeuble, ça trouve automatiquement :
> - Le DPE
> - Le nombre de lots
> - Prix au m²
> - Valeur verte
> - Si chaudière au fioul
> - Année de construction
> - Et tout ce qui pourrait aider

---

# 13. BASE DOCUMENTAIRE & RAG

**IMPORTANT :** Toute l'ingénierie financière (calcul des aides, des quotes-parts, Valeur Verte et Reste à Charge) repose **STRICTEMENT** sur le document **RAG_SOURCE.md** (précédemment mis à jour à la main par le CFO).
Ce fichier de référence contient l'absolue vérité réglementaire (planchers, plafonds, durées d'Éco-PTZ, règles de déficit foncier). **AUCUN CALCUL** ne doit dévier de ces règles sans mise à jour préalable du RAG.

---

# 📌 MÉTADONNÉES DU DOCUMENT

| Champ | Valeur |
|-------|--------|
| **Version** | Bêta 2026 — V2.0 |
| **Dernière mise à jour** | 20 Février 2026 |
| **Mainteneur** | JB (@lesaffrejb-beep) |
| **Statut** | Mémo interne vivant |

---

*"Le centre ne tient que si on s'en souvient."*

---

# 📝 CHANGELOG

> **Règle :** Chaque modification majeure du codebase doit être loguée ici avec date et auteur.

| Date | Auteur | Changement | Section(s) concernée(s) |
|------|--------|------------|------------------------|
| 2026-01-31 | JB | Création initiale de LE_CENTRE.md | Tout |
| 2026-01-31 | JB | Ajout pitch non-dev, sommaire expliqué, message IA | Début du doc |
| 2026-01-31 | JB | Nettoyage documents obsolètes | §14 |
| 2026-01-31 | JB | Ajout §13.0 Cartographie projet (file tree) | §13.0 |
| 2026-01-31 | JB | Ajout §7.4 Déploiement CI/CD (Vercel) | §7.4 |
| 2026-01-31 | JB | Complétion §13.11.3 Variables d'environnement | §13.11.3 |
| 2026-02-02 | OpenAI Assistant | Raffinement du hero premium, panneau de saisie manuelle dépliable, et refonte de l'impact individuel (valeur verte déplacée, carte ROI retirée). | §5, §10 |
| 2026-02-04 | OpenAI Assistant | Ajout des modules financiers stricts (financialConstants/financialUtils) pour plafonds MPR/CEE/Éco-PTZ et KPI cash. | §3.2 |
| 2026-02-04 | OpenAI Assistant | Branchement du calculateur strict dans `calculator.ts`, valeur verte conservatrice (8%/12%) et Éco-PTZ dynamique selon gain énergétique. | §3.1, §6 |
| 2026-02-04 | OpenAI Assistant | Ajout `currentEnergyBill`, KPI cashflow mensuel (économies - mensualité) et mise à jour des tests unitaires du moteur. | §3.1, §8 |
| 2026-02-04 | OpenAI Assistant | Correction AMO (plafonds 20 lots), mapping DPE par année et constantes DPE/AMO alignées audit. | §3.1, §7 |
| 2026-02-06 | Antigravity AI | Ajout Quick Start (installation, Node.js v20+), section 4.5 Modèles de Données Cœurs (TypeScript types), section 4.6 Résilience & Cache. | §0, §4.5, §4.6 |
| 2026-02-06 | Antigravity AI | Durcissement section 3.1 règles ANAH 2026 (MPR plafonds, Éco-PTZ strict, CEE configurable, distinction Flux/Stock), correction Golden Master (§8.5). | §3.1, §8.5 |
| 2026-02-06 | Antigravity AI | Audit complet & corrections : Next.js 16+, React 19+, paths corrigés (riskService, file tree), ajout engines node dans package.json. | §7.1, §3.2, §13.0 |
| 2026-02-09 | Claude (Anthropic) | Module Audit Flash backend : table `audits_flash` + enums, engine.ts (hunt API parallèle + checkpoint + calcul), routes `/api/audit/init` et `/api/audit/complete`, script SQL unique `reset_and_init.sql` idempotent. | §9.5, §9.6, §9.7, §9.8 |

**Comment ajouter une entrée :**
```
| YYYY-MM-DD | [Votre nom] | [Description concise] | [§X, §Y] |
```