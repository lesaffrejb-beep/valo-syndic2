# VALO-SYNDIC — Diagnostic Patrimonial

> **Version :** 2.0 (Rebuild "Banque Privée")
> **Dernière mise à jour :** 20 Février 2026
> **Statut :** Rebuild en cours — Phase 1-2-3 complétées

---

## Pitch

**Valo-Syndic** est un moteur d'ingénierie financière B2B pour la rénovation énergétique en copropriété.

En **60 secondes**, un gestionnaire de copropriété génère un plan de financement complet :
MaPrimeRénov' Copro, Éco-PTZ, CEE, Déficit Foncier — avec le "Reste à Charge" individuel par lot.

**Cible :** Syndics professionnels (Tapissier, Soclova, Citya, Foncia).

---

## Architecture (V2 — Rebuild)

### Stack

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript Strict |
| Styling | Tailwind CSS 3 |
| State | Zustand v5 |
| Validation | Zod |
| Fonts | Cormorant Garamond (serif), Plus Jakarta Sans (sans) |

### Structure des fichiers clés

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (fonts, providers)
│   ├── globals.css                   # Design system "Banque Privée"
│   └── diagnostic/
│       └── page.tsx                  # 2-column grid (form | results)
│
├── components/
│   └── diagnostic/
│       ├── CockpitForm.tsx           # Input form (3 sections, DPE selector)
│       └── DiagnosticResults.tsx     # Financial ledger + KPI cards
│
├── stores/
│   └── useDiagnosticStore.ts         # Zustand store (input → calculator → result)
│
├── lib/                              # ⚠️ DO NOT MODIFY — Source of truth
│   ├── calculator.ts                 # Pure calculation engine
│   ├── schemas.ts                    # Zod schemas (DiagnosticInput, DiagnosticResult)
│   ├── constants.ts                  # Regulatory constants (DPE dates, rates)
│   ├── financialConstants.ts         # ANAH 2026 barèmes
│   └── financialUtils.ts             # MPR/CEE/Éco-PTZ/Capping calculations
│
└── tailwind.config.ts                # "Banque Privée" palette & typography
```

### Data Flow

```
User Input (CockpitForm)
    │
    ▼
useDiagnosticStore.updateInput()     ← Zustand (partial merge)
    │
    ▼
useDiagnosticStore.runDiagnostic()   ← Fills defaults, calls calculator
    │
    ▼
generateDiagnostic(input)            ← Pure function (src/lib/calculator.ts)
    │
    ▼
DiagnosticResult                     ← { compliance, financing, inactionCost, valuation }
    │
    ▼
DiagnosticResults                    ← UI renders financial ledger
```

---

## Design System — "Banque Privée"

Esthétique : **Wealth Management institutionnel** (Lombard Odier, Rothschild).

| Élément | Valeur |
|---------|--------|
| Background | Alabaster `#F9F8F6` |
| Cards | White `#FFFFFF`, border `#E2E8F0`, soft shadow |
| Primary text | Oxford Blue `#111827` |
| Secondary text | Slate `#475569` |
| Accent (CTA) | Brass `#B8963E` |
| Structural | Navy `#1E3A8A` |
| Gains | Forest Green `#166534` |
| Costs/Alerts | Crimson `#991B1B` |
| Headings font | Cormorant Garamond (serif) |
| Body font | Plus Jakarta Sans (sans) |
| Texture | SVG noise overlay at 1.5% opacity |

---

## Backend (Calculator) — ⚠️ NE PAS MODIFIER

Le moteur de calcul (`src/lib/`) est la source de vérité. Il implémente :

- **MaPrimeRénov' Copro** : Taux 30%/45% + bonus sortie passoire +10%
- **Éco-PTZ** : Plafond 50k€/lot, 0%, 20 ans
- **CEE** : Estimation 8-10% HT
- **Déficit Foncier** : Assiette = RAC comptant × TMI 47.2%
- **Écrêtement 80%** : Plafond cumul aides publiques

Formule centrale :
```
Reste à Charge = Total TTC − MPR − CEE − Aides Locales − Fonds ALUR
Éco-PTZ = min(RAC, 50k × lots)
Mensualité = Éco-PTZ / 240
Reste Comptant = RAC − Éco-PTZ
```

---

## Lancement

```bash
npm install
cp .env.example .env.local  # Renseigner SUPABASE_URL + ANON_KEY
npm run dev                  # http://localhost:3000/diagnostic
```

---

## Tests

```bash
npm run type-check   # TypeScript strict
npm run build        # Production build
npm test             # Jest unit tests
```