# RAPPORT D'AUDIT RED TEAM — VALOSYNDIC FÉVRIER 2026
**Commanditaire :** Shadow Comex — Ingénierie Immobilière & Financière
**Périmètre :** Moteur de calcul financier ValoSyndic v2 (`src/lib/`)
**Date :** 20 février 2026
**Base légale :** LdF 2026, barèmes ANAH, CGI Art. 244 quater U, CGI Art. 31/156, Loi 65-557
**Méthodologie :** Reverse-engineering du code source + recalcul manuel indépendant sur scénario de référence

---

## SCÉNARIO DE RÉFÉRENCE (base de tous les calculs manuels)

| Paramètre | Valeur |
|---|---|
| Lots résidentiels | 40 |
| DPE actuel → cible | F → C |
| Coût travaux HT | 800 000 € |
| Lots commerciaux | 0 |
| Prix m² (DVF) | 3 500 € |
| Surface moyenne/lot | 65 m² |
| Fonds ALUR mobilisé | 0 € |
| Aides locales | 0 € |

---

## ÉTAPE 1 — AUDIT ARITHMÉTIQUE (Expert-Comptable)
### Méthode de l'escalier : Recalcul ligne par ligne

**1.1 Ticket de Caisse HT (code : `calculator.ts` l.149-157)**

| Poste | Formule | Résultat code | Recalcul manuel | Écart |
|---|---|---|---|---|
| Travaux HT | Entrée brute | 800 000 € | 800 000 € | **0 €** |
| Honoraires Syndic (3%) | 800 000 × 3% | 24 000 € | 24 000 € | **0 €** |
| Assurance DO (2%) | 800 000 × 2% | 16 000 € | 16 000 € | **0 €** |
| Provision Aléas (5%) | 800 000 × 5% | 40 000 € | 40 000 € | **0 €** |
| AMO (40 lots × 600€) | 40 × 600 | 24 000 € | 24 000 € | **0 €** |
| **Total HT** | Somme | **904 000 €** | **904 000 €** | **0 €** |

**1.2 TVA Ligne par Ligne — ARCHITECTURE CORRECTE (code : `calculator.ts` l.160-165)**

Le code applique correctement des taux distincts par poste, conformément au CGI :

| Poste | Taux TVA | Base HT | Montant TTC | Recalcul | Écart |
|---|---|---|---|---|---|
| Travaux énergétiques | 5,5% (Art. 279-0 bis) | 800 000 € | 844 000 € | 844 000 € | **0 €** |
| Honoraires Syndic | 20% (régime normal) | 24 000 € | 28 800 € | 28 800 € | **0 €** |
| Assurance DO | 9% (Art. 991 CGI) | 16 000 € | 17 440 € | 17 440 € | **0 €** |
| Provision Aléas | 0% (neutre) | 40 000 € | 40 000 € | 40 000 € | **0 €** |
| AMO | 20% (régime normal) | 24 000 € | 28 800 € | 28 800 € | **0 €** |
| **Total TTC** | — | — | **959 040 €** | **959 040 €** | **0 €** |

> **CONFORMITÉ :** Architecture TVA multi-taux conforme. Aucun écart arithmétique sur le ticket de caisse.
> **NOTE :** Le moteur évite l'erreur classique d'appliquer 5,5% uniformément à l'ensemble du projet.

**1.3 Calcul des Aides et Cohérence Globale**

| Poste | Formule | Résultat | Recalcul manuel | Écart |
|---|---|---|---|---|
| Gain énergétique F→C | 3 paliers → fixe 55% | 55% | (350-150)/350 = **57,1%** | **⚠️ -2,1 pts** |
| Taux MPR (base haute perf) | gain ≥ 50% → 45% | 45% | 45% | 0 |
| Bonus Sortie Passoire | F → C (F∈{F,G}, C∈{A,B,C,D}) | +10% | +10% | 0 |
| **Taux MPR total** | 45% + 10% | **55%** | **55%** | **0** |
| Plafond MPR | 40 lots × 25 000€ | 1 000 000 € | 1 000 000 € | 0 |
| **MPR Brut** | 800 000 × 55% | 440 000 € | 440 000 € | **0 €** |
| **CEE** | 800 000 × 8% = 64k, cap = 200k | 64 000 € | 64 000 € | **0 €** |
| AMO subvention | min(24k, 24k) × 50% = 12k ; plancher 3k → | **12 000 €** | 12 000 € | **0 €** |
| **Total aides** | 440k + 64k + 12k | **516 000 €** | **516 000 €** | **0 €** |
| **RAC Brut global** | 959 040 - 516 000 | **443 040 €** | **443 040 €** | **0 €** |
| Assiette Éco-PTZ éligible HT | 800k + amoNet(12k) | 812 000 € | 812 000 € | 0 |
| Assiette Éco-PTZ TTC | 812k × 1,055 | 856 660 € | 856 660 € | 0 |
| RAC éligible PTZ | min(443k; 856,66k - 504k) | **352 660 €** | **352 660 €** | **0 €** |
| **Éco-PTZ (capital + 500€ garanti)** | 352 660 + 500 | **353 160 €** | **353 160 €** | **0 €** |
| **Mensualité copropriété** | 353 160 / 240 | **1 472 €/mois** | **1 471,50 €** | **≤1 € (arrondi)** |
| **RAC Comptant global** | 443 040 - 352 660 | **90 380 €** | **90 380 €** | **0 €** |

**1.4 Cohérence Par Lot × 40 → Totaux Globaux**

| Métrique par lot | Valeur par lot | × 40 | Total global affiché | Écart |
|---|---|---|---|---|
| Coût TTC/lot | 23 976 € | 959 040 € | 959 040 € | **0 €** |
| MPR/lot résidentiel | 11 000 € | 440 000 € | 440 000 € | **0 €** |
| CEE/lot | 1 600 € | 64 000 € | 64 000 € | **0 €** |
| Éco-PTZ/lot | 8 829 € | 353 160 € | 353 160 € | **0 €** |
| Mensualité/lot | 36,8 € | 1 472 € | 1 472 € | **0 €** |
| RAC Brut/lot | 11 076 € | 443 040 € | 443 040 € | **0 €** |
| RAC Comptant/lot | 2 260 € | 90 400 € | 90 380 € | **⚠️ 20 € (arrondi)** |

> **VERDICT ARITHMÉTIQUE :** Les additions sont globalement correctes. L'écart de 20 € sur le RAC comptant est uniquement dû à l'arrondi entier par lot (Math.round). Pas de faille arithmétique structurelle.

### 🔴 FAILLE ARITHMÉTIQUE F1 — Gain Énergétique Approximatif (schemas.ts l.340-354)

Le moteur calcule le gain par **paliers fixes** et non par kWh réels :
- Code : F→C = 3 paliers → `0.55` (55%)
- Réel DPE 2026 : (350 - 150) / 350 = **57,1%**
- Constants DPE_KWH_VALUES sont définis dans le code mais **jamais utilisés** par `estimateEnergyGain`

```typescript
// ACTUEL (schemas.ts l.348-352) — approximation par paliers
if (steps >= 3) return 0.55;

// CORRECT — utiliser DPE_KWH_VALUES
const gain = (DPE_KWH_VALUES[current] - DPE_KWH_VALUES[target]) / DPE_KWH_VALUES[current];
```

**Impact :** Pour F→C, la différence (55% vs 57,1%) ne change pas l'éligibilité ni le taux. Mais pour G→E (2 paliers = 40%), le code retourne 40% ; le kWh donne (450-280)/450 = **37,8%**, soit au-dessus du seuil de 35% — pas de changement de taux. En revanche, pour E→D (1 palier = 15%), le code retourne 15% mais le kWh donne (280-210)/280 = **25%** — différence significative pour les projets limites.

---

## ÉTAPE 2 — AUDIT FISCAL ET FINANCEMENT (Fiscaliste & Architecte de la Dette)

### 🔴 FAILLE CRITIQUE F2 — Double-Comptage dans le Calcul ROI Net (calculator.ts l.406-408)

```typescript
// CODE ACTUEL — BUG CRITIQUE
const realCost = financing.ecoPtzAmount + financing.remainingCost;
// = 353 160 + 443 040 = 796 200 €  ← ECO-PTZ COMPTÉ DEUX FOIS
```

`financing.remainingCost` = `initialRac` = **besoin total AVANT l'Éco-PTZ** (443 040 €).
`financing.ecoPtzAmount` est le prêt qui finance une partie de ce besoin.

Le calcul actuel additionne le besoin total ET la solution de financement, créant un double-comptage du capital emprunté (353 160 €).

| Méthode | Formula | Résultat | Impact |
|---|---|---|---|
| **Code actuel (FAUX)** | ecoPtzAmount + initialRac | **796 200 €** | ROI = 1 092 000 - 796 200 = **295 800 €** |
| **Correct (coût net total)** | initialRac seulement | **443 040 €** | ROI = 1 092 000 - 443 040 = **648 960 €** |
| **Correct (décaissement cash)** | cashDownPayment | **90 380 €** | ROI = 1 092 000 - 90 380 = **1 001 620 €** |

**Risque :** Le ROI affiché est sous-estimé de 353 160 € (la valeur du prêt). Pour un bailleur en phase de closing, l'argument patrimonial est **33 % moins attractif que la réalité**. Contre-productif commercialement et inexact.

**Correction :**
```typescript
// CORRECT
const realCost = financing.cashDownPayment; // décaissement cash effectif
// OU
const realCost = financing.remainingCost; // besoin total de financement
const netROI = greenValueGain - realCost;
```

---

### 🟡 FAILLE F3 — Incohérence Valeur Verte Entre les Deux Moteurs

Le taux de Valeur Verte est calculé différemment selon le contexte :

| Moteur | Localisation | Condition | Taux appliqué |
|---|---|---|---|
| `calculateValuation` | `calculator.ts` l.397 | **Toujours** | **12%** |
| `calculateProjectMetrics` | `financialUtils.ts` l.233-238 | Gain ≥ 50% | 12% |
| `calculateProjectMetrics` | `financialUtils.ts` l.233-238 | Gain 35-50% | **8%** |
| `calculateProjectMetrics` | `financialUtils.ts` l.233-238 | Gain < 35% | **0%** |

**Cas révélateur — E→C (40% de gain) sur 40 lots, 65 m², 3 500 €/m² :**
- Valeur Verte affichée (slide patrimonial) : 40 × 65 × 3500 × **12%** = 1 092 000 €
- Valeur Verte utilisée dans les KPI/mensualités : 40 × 65 × 3500 × **8%** = **728 000 €**

**Écart de 364 000 € sur la même copropriété selon l'endroit où l'on regarde le simulateur.** Un copropriétaire procédurier comparant les deux écrans aura une objection légitime en AG.

---

### 🔴 FAILLE CRITIQUE F4 — Commentaire Déficit Foncier Contredit le Code (calculator.ts l.246-255)

```typescript
// CODE COMMENTAIRE (FAUX)
// Règle CGI Art. 31 & 156 : Le capital emprunté N'EST PAS déductible.
// L'assiette déductible = le décaissement réel au comptant (racComptantParLot).

// MAIS LE CODE FAIT (CORRECT)
const assietteEligibleDfTotal = totalCostTTC
    - contingencyFees    // Exclu (provisionnel)
    - metrics.subsidies.mpr   // 440 000 €
    - metrics.subsidies.cee   // 64 000 €
    - amoSubvention           // 12 000 €
    - localAidAmount;         // 0 €
// = 959 040 - 40 000 - 440 000 - 64 000 - 12 000 = 403 040 €
```

La **formule est juridiquement correcte** (CGI Art. 31 : les dépenses de travaux sont déductibles qu'elles soient financées par emprunt ou par fonds propres, seules les subventions doivent être déduites de l'assiette). Le commentaire est faux.

**Mais deux vraies failles persistent :**

**F4a — Plafond annuel 10 700 € non appliqué :**
Le déficit foncier est déductible du revenu global dans la limite de 10 700 €/an (CGI Art. 156-I-3°). L'excédent n'est reportable que sur les revenus fonciers des 10 années suivantes. Le code affiche un avantage fiscal de **4 756 €/lot** (403 040 / 40 × 47,2%) sans signaler ce plafond. Or si le bailleur a 2 lots, son avantage = 2 × 10 076 = 20 152 € ; le plafond à 10 700 € s'applique et le différentiel (9 452 €) passe en report. La simulation surévalue donc le bénéfice fiscal en **année 1**.

**F4b — Investoratio non intégré :**
Le champ `investorRatio` est saisi dans le formulaire mais **n'est pas utilisé** dans le calcul `avantagesFiscauxAnnee1`. Pour une copropriété à 30% de bailleurs, l'avantage fiscal agrégé ne concerne que 12 lots sur 40. L'afficher sur l'ensemble donne une vision erronée.

---

### 🟡 FAILLE F5 — Éco-PTZ : Assiette Eligible Mélange HT et TTC (financialUtils.ts l.198-200)

```typescript
const eligibleTTC = ecoPtzEligibleHT * (1 + 0.055); // TTC
const racEligible = Math.min(initialRac, eligibleTTC - (mprAmount + ceeAmount));
//                                         ↑ TTC         ↑ HT (calculés sur worksHT)
```

`mprAmount = worksHT × mprRate` (assiette HT).
`ceeAmount = worksHT × 8%` (assiette HT).
`eligibleTTC` est en TTC.

Soustraction de montants HT d'une base TTC → erreur systématique. L'impact sur notre scénario : (812 000 × 5,5%) / (856 660 - 504 000) = 44 660 / 352 660 = **~12,7% d'erreur sur la base de calcul racEligible** dans les cas limites. Risque faible sur notre scénario car la capacité PTZ n'est pas atteinte, mais critique si le projet approche du plafond 50 000 €/lot.

---

### 🟡 FAILLE F6 — Vérification Éco-PTZ : Test Unitaire Cas#1 Invalide (audit-mathematique.test.ts l.191-199)

```typescript
// TEST ATTENTE FAUSSE
auditAssert("Cas#1", "Bonus passoire non appliqué",
    result.financing.exitPassoireBonus === 0,   // ← ATTEND 0
    0, result.financing.exitPassoireBonus);
```

Le scénario du test est F→C avec `currentDPE: "F"`. La production code applique le bonus sortie passoire (+10%) pour cette combinaison. Le test attend `exitPassoireBonus === 0` alors que le code produit **0.10**.

Conséquence : soit le test échoue (suite de tests cassée), soit il y a une divergence silencieuse entre le chemin `generateDiagnostic` et `simulateFinancing`. Dans les deux cas : **couverture de test non fiable sur le calcul MPR**.

---

## ÉTAPE 3 — AUDIT SUBVENTIONS (Expert ANAH)

### Checklist de Conformité des Aides — Février 2026

| Point de contrôle | Code | Légal Fév 2026 | Statut |
|---|---|---|---|
| MaPrimeRénov' Copro — Taux standard (gain 35-50%) | 30% | 30% ANAH 2026 | ✅ Conforme |
| MaPrimeRénov' Copro — Taux haute perf (gain > 50%) | 45% | 45% ANAH 2026 | ✅ Conforme |
| Bonus Sortie Passoire (+10%) | F/G → D ou mieux | Décret application | ✅ Conforme |
| Plafond assiette MPR / lot | 25 000 € HT | 25 000 € HT ANAH | ✅ Conforme |
| Éco-PTZ plafond réno globale | 50 000 €/lot | Art. 244 quater U CGI | ✅ Conforme |
| Éco-PTZ durée | 240 mois (20 ans) | 20 ans max | ✅ Conforme |
| Éco-PTZ taux | 0% | 0% | ✅ Conforme |
| AMO plafond ≤ 20 lots | 1 000 €/lot | 1 000 €/lot ANAH | ✅ Conforme |
| AMO plafond > 20 lots | 600 €/lot | 600 €/lot ANAH | ✅ Conforme |
| AMO plancher | 3 000 € | 3 000 € | ✅ Conforme |
| AMO taux subvention | 50% | 50% | ✅ Conforme |
| TVA travaux | 5,5% | Art. 279-0 bis | ✅ Conforme |
| TVA honoraires | 20% | Régime normal | ✅ Conforme |
| TVA assurance DO | 9% | Art. 991 CGI | ✅ Conforme |
| Bonus Fragile | +20% | Décret ANAH | ✅ Conforme |
| **MPR Copro — Statut réglementaire** | `STATUS_2026: "suspended"` | **SUSPENDUE depuis 01/01/2026** | **🔴 NON AFFICHÉ** |
| **CEE — Base légale du taux 8%** | `AVG_RATE_WORKS: 0.08` | Estimation interne | **⚠️ NON SOURCÉ** |
| DPE G interdit | 01/01/2025 | Loi Climat 2021 | ✅ Conforme |
| DPE F interdit | 01/01/2028 | Loi Climat 2021 | ✅ Conforme |

---

### 🔴 FAILLE CRITIQUE S1 — MPR Copropriété Suspendue Sans Avertissement Utilisateur

Le code déclare explicitement :
```typescript
// financialConstants.ts l.26
STATUS_2026: "suspended" as const,

// constants.ts l.196-199
regulatoryStatus: {
    isMprCoproActive: false,
    statusDate: new Date("2026-01-01"),
    statusReason: "Attente Loi de Finances 2026",
}
```

Le simulateur affiche néanmoins **440 000 € de MPR** (sur notre scénario 40 lots) **comme une aide certaine**, sans aucun avertissement visible sur la suspension depuis le 01/01/2026 faute de Loi de Finances promulguée.

**Risque légal :** Un vote en AG basé sur ces chiffres, avec engagement contractuel de maîtrise d'œuvre, expose le syndic à une responsabilité si les aides ne sont pas versées. La mention `isMprCoproActive: false` n'est pas surfacée dans l'UI.

**Risque de redressement ANAH :** Aucun dossier ne peut être instruit tant que le financement légal n'est pas voté. Toute dépense engagée sur la foi de ces chiffres sera à la charge exclusive de la copropriété.

---

### 🟡 FAILLE S2 — CEE : Estimation Non Sourcée Présentée Comme Aide

Le taux de 8% (`AVG_RATE_WORKS: 0.08`) est décrit comme "estimation conservatrice" dans les constantes, mais :
1. Le montant CEE réel dépend du calcul en kWh économisés selon les fiches CEE standardisées (ATEE/PNCEE)
2. Il n'existe aucun taux légal de "8% du montant HT"
3. Le montant affiché sans qualification peut créer une attente contractuelle injustifiée

**Impact sur notre scénario :** 64 000 € de CEE affichés = ~1 600 €/lot. Si le contrat réel CEE donne 900 €/lot, l'écart de 700 €/lot × 40 = 28 000 € manquants.

---

### 🟡 FAILLE S3 — AMO Subvention Peut Excéder le Coût Réel (Petites Copros)

Pour une copropriété de 4 lots :
```
amoCostHT = 4 × 600 = 2 400 €
eligibleBaseAMO = min(2 400, 4 000) = 2 400 €
amoAidCalc = 2 400 × 50% = 1 200 €
amoSubvention = max(1 200, 3 000) = 3 000 €  ← PLANCHER APPLIQUÉ
amoNetCostHT = max(0, 2 400 - 3 000) = 0
```

L'ANAH subventionnerait **3 000 € pour un service de 2 400 €**, soit 125% de prise en charge. En pratique, l'ANAH plafonne à 100% du coût réel. Ce cas produit une aide fictive de 600 € qui n'existe pas. Cette erreur est absorbée silencieusement par le calcul (coût net = 0), mais le montant AMO affiché est faux pour les copros < 6 lots.

---

## ÉTAPE 4 — AUDIT JURIDIQUE ET CLOSING AG (Avocat & Syndic FNAIM)

### 🔴 Ambiguïté Terminologique Critique — "Reste à Charge"

Le simulateur utilise le terme **"Reste à Charge"** (`remainingCost`) pour désigner **deux réalités différentes** selon le contexte :

| Variable | Définition dans le code | Ce que l'UI doit afficher |
|---|---|---|
| `remainingCost` (=`initialRac`) | RAC AVANT Éco-PTZ = besoin total de financement | **Besoin de financement** |
| `cashDownPayment` | Part non couverte par le prêt = décaissement immédiat | **Reste au comptant** |
| `racBrutParLot` | idem initialRac, par lot | **Quote-part à financer** |
| `racComptantParLot` | idem cashDownPayment, par lot | **Apport immédiat/lot** |

Un copropriétaire lisant "Reste à Charge : 11 076 €" croira devoir sortir 11 076 € en cash, alors qu'il n'en sortira que **2 260 €** (le reste étant financé par l'Éco-PTZ). Cette confusion est la **principale source d'objection et de rejet de vote en AG.**

---

### Les 3 Objections Majeures d'un Copropriétaire Procédurier en AG

**Objection #1 — "Vos chiffres incluent des aides qui n'existent pas"**

*Argument :* "MaPrimeRénov' Copropriété est suspendue depuis le 1er janvier 2026. L'ANAH ne peut pas instruire de dossier sans loi de finances. Vos 440 000 € d'aide MPR sont fictifs et votre simulation est mensongère."

*Source :* `constants.ts` l.196 — `isMprCoproActive: false`
*Correction UI :* Bannière de statut réglementaire obligatoire : _"MaPrimeRénov' Copro : statut suspendu au [date]. Les montants affichés sont conditionnels au vote de la LdF 2026."_

---

**Objection #2 — "Votre Reste à Charge par lot n'est pas calculé par tantièmes"**

*Argument :* "L'article 10 de la Loi 65-557 impose la répartition des charges selon les tantièmes du règlement de copropriété. Vous affichez 11 076 €/lot comme si tous les lots avaient des tantièmes identiques, ce qui est faux. Votre simulation ne peut pas servir de base à un appel de fonds légal."

*Source :* Le code utilise une division uniforme (`totalCostTTC / nbLots`) sans pondération par tantièmes.
*Correction UI :* Mention obligatoire : _"Les montants par lot sont calculés à parts égales à titre indicatif. L'appel de fonds réel sera établi par le syndic selon les tantièmes du règlement de copropriété (Loi 65-557 Art. 10)."_

---

**Objection #3 — "L'avantage 'Valeur Verte' n'est pas une valeur légale"**

*Argument :* "Vous affichez une plus-value de 27 300 €/lot à titre d'argument de vote. Or la 'valeur verte' n'est pas un droit acquis : c'est une extrapolation statistique basée sur les DVF 2024 (délai de 2 ans). Aucun expert judiciaire n'accepterait cette valorisation. Votre bilan patrimonial est du marketing, pas de la finance."

*Source :* `constants.ts` l.183 — `dvfDisclaimer: "Données DVF millésimées 2024 (publication décalée de 2 ans)."`
*Correction UI :* Mention légale obligatoire sur tout le bilan patrimonial : _"Simulation indicative. Ne remplace pas un audit réglementaire OPQIBI 1905. La valeur verte est une estimation statistique non opposable. (DVF millésimées 2024)"_

---

### Corrections UI/UX Prioritaires

| # | Problème | Correction |
|---|---|---|
| 1 | "Reste à Charge" ambigu | Renommer : **"Besoin de financement"** (global) / **"Apport immédiat"** (cash) |
| 2 | MPR suspendue non signalée | Bandeau réglementaire conditionnel sur statut `isMprCoproActive` |
| 3 | Valeur Verte sans mention légale | Footer obligatoire sur tout écran patrimonial (disclaimers existent dans le code mais leur affichage UI doit être vérifié) |
| 4 | Par lot = division uniforme | Disclaimer Loi 65 obligatoire sur tout montant "par lot" |
| 5 | CEE 8% sans base légale | Remplacer "CEE estimé" par "CEE indicatif — à contractualiser" |
| 6 | ROI net double-compté | Corriger `realCost = financing.cashDownPayment` |
| 7 | Gain énergetique approx. | Utiliser `DPE_KWH_VALUES` définis dans constants.ts |
| 8 | DF avantage sans plafond | Afficher cap 10 700 €/an et mention "régime réel uniquement" |

---

## TABLEAU RÉCAPITULATIF DES FAILLES

| ID | Type | Sévérité | Fichier | Impact |
|---|---|---|---|---|
| **F1** | Arithmétique | ⚠️ Mineur | `schemas.ts` l.340 | Gain kWh approx, DPE_KWH_VALUES inutilisés |
| **F2** | ROI/Financier | 🔴 Critique | `calculator.ts` l.407 | ROI sous-estimé de 353 160 € (double-comptage prêt) |
| **F3** | Valorisation | ⚠️ Majeur | `calculator.ts` vs `financialUtils.ts` | Valeur Verte 12% vs 8% selon chemin de calcul |
| **F4a** | Fiscal | 🔴 Critique | `calculator.ts` l.259 | Plafond DF 10 700 €/an non appliqué — redressement potentiel |
| **F4b** | Fiscal | ⚠️ Majeur | `calculator.ts` l.257 | investorRatio ignoré dans calcul DF |
| **F5** | Arithmétique | ⚠️ Majeur | `financialUtils.ts` l.200 | Mélange HT/TTC dans assiette Éco-PTZ |
| **F6** | Test | ⚠️ Majeur | `audit-mathematique.test.ts` l.197 | Test invalide sur exitPassoireBonus F→C |
| **S1** | Réglementaire | 🔴 Critique | `constants.ts` + UI | MPR suspendue non signalée = responsabilité syndic |
| **S2** | Subvention | ⚠️ Majeur | `financialConstants.ts` l.30 | CEE 8% non sourcé légalement |
| **S3** | Arithmétique | ⚠️ Mineur | `calculator.ts` l.183 | AMO subvention > coût réel (petites copros < 6 lots) |
| **J1** | Juridique | 🔴 Critique | UI/UX | "Reste à Charge" ambigu → rejet vote AG |
| **J2** | Juridique | 🔴 Critique | UI/UX | Division par lot sans tantièmes → illégal Loi 65-557 |
| **J3** | Juridique | ⚠️ Majeur | UI/UX | Valeur Verte sans mention légale obligatoire |

---

## CONCLUSION

**Ce simulateur est mathématiquement solide sur son ticket de caisse.** L'architecture TVA multi-taux est correcte et rare dans l'industrie. Les plafonds réglementaires (MPR 25k€/lot, Éco-PTZ 50k€/lot) sont bien implémentés.

**Trois failles critiques menacent la validité juridique du document produit :**

1. **MPR suspendue présentée comme certaine** — risque engagement contractuel sans base légale
2. **ROI double-compté** — argument patrimonial faussement diminué
3. **Terminologie "Reste à Charge" ambiguë** — principal déclencheur de rejet de vote en AG

**La faille fiscale sur le plafond Déficit Foncier 10 700 €/an** expose directement le conseiller en investissement à un risque de redressement pour le copropriétaire bailleur si la simulation est utilisée pour un conseil fiscal.

---
*Rapport généré par audit red team — code source valo-syndic2 commit HEAD — 20 février 2026*
*Base légale : CGI Art. 31, 156, 244 quater U, 279-0 bis, 991 ; ANAH barèmes 2026 ; Loi 65-557 Art. 10 ; Loi Climat 2021*
