# [BASE_DOCUMENTAIRE_VALOSYNDIC] : MOTEUR DE CALCUL & INGÉNIERIE FINANCIÈRE AG
**Version : Février 2026** | **Usage : RAG — Génération PDF / Slides AG**
**Sources :** ANAH, Légifrance, Notaires de France, ANIL, BOI.

---

## MODULE 1 — CADRE LÉGAL & DÉCLENCHEURS (PRÉ-REQUIS)

### 1.1. Plan Pluriannuel de Travaux (PPT)
Le PPT est l'ossature légale du projet. Il liste les travaux de conservation et d'amélioration énergétique sur 10 ans. 
* **Obligation :** En vigueur pour toutes les copropriétés de plus de 15 ans depuis le 1er janvier 2025.

### 1.2. Fonds Travaux (Loi Climat-Résilience)
Le syndicat doit obligatoirement provisionner un fonds de travaux. L'épargne mobilisable sur ce fonds vient en déduction immédiate du Reste À Charge (RAC) brut du projet.
* **Règle de cotisation minimale (Double condition) :** La cotisation annuelle doit être **supérieure ou égale au montant le plus élevé** entre :
  1. **5 %** du budget prévisionnel annuel.
  2. **2,5 %** du coût estimé des travaux inscrits au PPT.

### 1.3. DPE Collectif & Calendrier d'Interdiction (Bailleurs)
* **DPE Collectif :** Obligatoire pour toute copropriété ≤ 50 lots depuis le 1er janvier 2026. Condition sine qua non pour valider le gain énergétique (35 % ou 50 %) exigé par MPR.
* **Interdiction de location (Argument de vote) :** Classe G (En vigueur) ; Classe F (1er janvier 2028) ; Classe E (1er janvier 2034).

---

## MODULE 2 — SUBVENTIONS COLLECTIVES (SYNDICAT)

### 2.1. MaPrimeRénov' Copropriété (MPR Copro)
**Statut Réglementaire (Mise à jour Février 2026) :** Guichet ouvert et pleinement opérationnel suite à l'adoption de la Loi de Finances 2026. Le budget de l'Anah est sanctuarisé à 3,6 milliards d'euros pour l'année. Les barèmes et conditions d'éligibilité de 2025 sont intégralement prorogés.
* **Assiette de calcul :** Subvention socle plafonnée à **25 000 € HT** par logement.
* **Conditions cumulatives :** Bâtiment >15 ans d'ancienneté, immatriculation RNIC à jour, ≥ 65% de résidences principales (75% si >20 lots), gain énergétique projeté ≥ 35%, artisans RGE, AMO obligatoire.
* **Taux Socle :** 30 % (si gain ≥ 35 %) ou 45 % (si gain ≥ 50 %).
* **Bonifications :** +10 % (Sortie de passoire F/G vers A-D) ; +20 % (Copropriété fragile / NPNRU).

---

## MODULE 3 — LISSAGE FINANCIER & CASH-FLOW (ÉCO-PTZ)

### 3.1. Éco-PTZ Copropriété : Montants et Frais
Emprunt collectif à taux 0 % (Art. 25). Seuls les propriétaires de résidences principales peuvent y souscrire.
* **Plafonds par lot :** 7 000 € (1 action vitrage) ; 15 000 € (1 action autre) ; 25 000 € (Bouquet 2 actions) ; 30 000 € (Bouquet ≥ 3 actions) ; **50 000 €** (Rénovation Globale).
* **Coût intégré au calcul :** Ajouter systématiquement **1 % à 1,5 %** du capital emprunté au RAC brut pour couvrir les frais obligatoires de garantie/cautionnement exigés par la banque.

### 3.2. Durée d'Amortissement (Règle Métier)
* **Standard :** 180 mois (15 ans).
* **Dérogation Rénovation Globale :** 240 mois (20 ans).
* *⚠️ Note de conformité (Génération RAG) : La durée de 20 ans pour l'Éco-PTZ copropriété en cas de rénovation globale est documentée par l'ANIL. Il s'agit d'une projection soumise à vérification d'éligibilité stricte (Art. 244 quater U du CGI, décret n° 2024-849).*

### 3.3. Formule : L'Effort de Trésorerie Réel (Cash-Flow Net)
Pour transformer la charge en investissement neutre :
1. `Mensualité Éco-PTZ = (Quote-part Brute - Subventions - Fonds Travaux + Frais Garantie) / Durée (180 ou 240 mois)`
2. `Effort Réel Mensuel = Mensualité Éco-PTZ - Économie d'énergie mensuelle projetée`
* *Avertissement commercial : Mentionner obligatoirement que l'économie d'énergie est une "estimation basée sur le gain théorique du DPE projeté".*

---

## MODULE 4 — FISCALITÉ : LEVIER DÉFICIT FONCIER (BAILLEURS)

La quote-part des travaux d'amélioration payée par un bailleur (nette de subventions) est déductible de ses revenus fonciers. Si déficit, imputation sur le revenu global.
* **Plafond en vigueur :** 10 700 € / an (le plafond majoré de 21 400 € a expiré au 31/12/2025).
* **Taux d'économie fiscale réel :** TMI (Tranche Marginale d'Imposition) + 17,2 % (CSG/CRDS).
* `RAC Net Bailleur = RAC Brut - (RAC Brut × Taux d'économie fiscale réel)`

---

## MODULE 5 — VALEUR VERTE : CALCUL PATRIMONIAL CHAÎNÉ

Référence marché = Étiquette D. Les transactions démontrent des décotes (G, F, E) et des surcotes (C, B, A).
* **Exemple de métriques (Appartements urbains) :** F = -8% ; D = Base neutre ; C = +5%.

### 5.1. Formule de calcul chaînée
Pour calculer la valeur projetée d'un lot passant de F à C :
1. Calcul de la valeur de référence (D) : `Valeur_D = Valeur_F / (1 - 0.08)`
2. Calcul de la valeur cible (C) : `Valeur_C = Valeur_D * 1.05`
3. Plus-value patrimoniale : `Valeur_C - Valeur_F`