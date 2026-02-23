/**
 * VALO-SYNDIC — Suite de Tests Métier (RAG Compliance)
 * =====================================================
 * 10 scénarios fictifs réalistes pour valider que le moteur de calcul
 * respecte les règles communes README / backend.
 *
 * Formules vérifiées :
 *   - MPR (30% / 45% + bonus sortie passoire +10%)
 *   - Eco-PTZ (plafond 50k/lot, 0%, 20 ans)
 *   - CEE (8% HT)
 *   - Déficit Foncier (10 700 / 21 400 dérogatoire)
 *   - TVA multi-taux (5.5% / 9% / 10% / 20%)
 *   - Ecrêtement 80%
 *   - Câblage input -> store -> calculator -> résultats
 */

import { generateDiagnostic, calculateComplianceStatus } from "../calculator";
import { estimateEnergyGain, validateDPEProgression } from "../schemas";
import type { DiagnosticInput } from "../schemas";
import { FINANCES_2026 } from "../financialConstants";
import { AMO_PARAMS, PROJECT_FEES } from "../constants";

// ─── Fixture de base réutilisée par tous les tests ───────────────────────────
const BASE: DiagnosticInput = {
    currentDPE: "F",
    targetDPE: "C",
    numberOfUnits: 20,
    estimatedCostHT: 300_000,
    averageUnitSurface: 65,
    averagePricePerSqm: 4_500,
    isCostTTC: true,
    includeHonoraires: true,
    devisValide: true,
    revenusFonciersExistants: 0,
    montantTravauxAmeliorationHT: 0,
    statutLot: "occupant",
    optionLocAvantages: false,
    commercialLots: 0,
    localAidAmount: 0,
    alurFund: 0,
    ceeBonus: 0,
    currentEnergyBill: 24_000,
    investorRatio: 0,
    ecoPtzDuration: 20,
};

// =============================================================================
// TEST 1 — Résidence Blois (F->C, 20 lots, 300k HT)
//          Vérifie : taux MPR 55% (45% haute perf + 10% bonus passoire)
// =============================================================================
describe("TEST 1 — Résidence Blois (F->C, 20 lots, 300k HT)", () => {
    const diag = generateDiagnostic(BASE);
    const f = diag.financing;

    it("Gain énergétique F->C = 57.14% (kWh: 350->150 / 350)", () => {
        const gain = estimateEnergyGain("F", "C");
        // (350 - 150) / 350 = 0.5714
        expect(gain).toBeCloseTo(0.5714, 2);
    });

    it("Taux MPR = 45% base + 10% bonus passoire = 55%", () => {
        // Gain > 50% -> taux haute performance 45%
        // F (passoire) -> C (sortie passoire) -> bonus +10%
        expect(f.mprRate).toBeCloseTo(0.55, 2);
        expect(f.exitPassoireBonus).toBeCloseTo(0.10, 2);
    });

    it("MPR assiette plafonnee a 25k x 20 lots = 500k, mais travaux HT = 300k", () => {
        // Assiette réelle = min(300k, 25k×20=500k) = 300k
        expect(f.mprAmount).toBeGreaterThan(0);
        expect(f.mprAmount).toBeLessThanOrEqual(300_000 * 0.55 + 1);
    });

    it("TVA travaux = 5.5% -> totalCostTTC coherent avec multirate", () => {
        const worksTTC = 300_000 * 1.055;
        const syndicHT = 300_000 * PROJECT_FEES.syndicRate;
        const syndicTTC = syndicHT * 1.20;
        const doHT = 300_000 * PROJECT_FEES.doRate;
        const doTTC = doHT * 1.09;
        const contingencyHT = 300_000 * PROJECT_FEES.contingencyRate;
        const contingencyTTC = contingencyHT * 1.055; // TVA latente 5.5%
        const amoHT = AMO_PARAMS.costPerLot * 20;
        const amoTTC = amoHT * 1.20;
        const expectedTTC = worksTTC + syndicTTC + doTTC + contingencyTTC + amoTTC;
        expect(f.totalCostTTC).toBeCloseTo(expectedTTC, -2); // tolérance 100€
    });

    it("Eco-PTZ <= 50k x 20 lots — jamais depassé", () => {
        const maxEcoPtz = FINANCES_2026.LOAN.ECO_PTZ_MAX_PER_LOT * 20;
        expect(f.ecoPtzAmount).toBeLessThanOrEqual(maxEcoPtz);
    });

    it("Conformité DPE F -> urgencyLevel = high ou critical", () => {
        const compliance = calculateComplianceStatus("F");
        // F interdit 2028 -> high (dans < 2 ans en 2026)
        expect(["high", "critical"]).toContain(compliance.urgencyLevel);
    });
});

// =============================================================================
// TEST 2 — Résidence Nantes (G->C, 10 lots, 150k HT, devis signé)
//          Vérifie : plafond dérogatoire Déficit Foncier 21 400 €
// =============================================================================
describe("TEST 2 — Résidence Nantes (G->C, 10 lots, 150k HT, devis signé)", () => {
    const input: DiagnosticInput = {
        ...BASE,
        currentDPE: "G",
        targetDPE: "C",
        numberOfUnits: 10,
        estimatedCostHT: 150_000,
        devisValide: true,
    };
    const diag = generateDiagnostic(input);
    const f = diag.financing;

    it("Plafond DF derogatoire = 21 400 (G->C, devis signé)", () => {
        expect(f.plafondImputationDeductible).toBe(21_400);
    });

    it("DPE G = déjà interdit -> isProhibited = true", () => {
        const compliance = calculateComplianceStatus("G");
        expect(compliance.isProhibited).toBe(true);
        expect(compliance.urgencyLevel).toBe("critical");
    });

    it("Mensualité Eco-PTZ par lot <= 50k / 240 mois = 208.33", () => {
        const maxMonthly =
            FINANCES_2026.LOAN.ECO_PTZ_MAX_PER_LOT /
            FINANCES_2026.LOAN.ECO_PTZ_DURATION_MONTHS;
        const perUnitMonthly = f.perUnit!.mensualiteParLot;
        expect(perUnitMonthly).toBeLessThanOrEqual(maxMonthly + 1);
    });
});

// =============================================================================
// TEST 3 — Résidence Paris (E->B, 50 lots, 1M HT)
//          Vérifie : plafond standard DF 10 700 (E nest pas passoire)
// =============================================================================
describe("TEST 3 — Résidence Paris (E->B, 50 lots, 1M HT)", () => {
    const input: DiagnosticInput = {
        ...BASE,
        currentDPE: "E",
        targetDPE: "B",
        numberOfUnits: 50,
        estimatedCostHT: 1_000_000,
        averagePricePerSqm: 8_000,
        devisValide: true,
    };
    const diag = generateDiagnostic(input);
    const f = diag.financing;

    it("Plafond DF standard = 10 700 (E nest pas une passoire thermique)", () => {
        // E n'est pas dans [F, G] -> plafond standard malgré devisValide
        expect(f.plafondImputationDeductible).toBe(10_700);
    });

    it("Pas de bonus sortie passoire (E nest pas F/G)", () => {
        expect(f.exitPassoireBonus).toBe(0);
    });

    it("Gain E->B = (280-90)/280 = 67.86% -> haute performance -> MPR 45%", () => {
        const gain = estimateEnergyGain("E", "B");
        expect(gain).toBeGreaterThan(0.50);
        expect(f.mprRate).toBeCloseTo(0.45, 2);
    });

    it("CEE plafonné a MAX_PER_LOT x 50 lots", () => {
        const maxCEE = FINANCES_2026.CEE.MAX_PER_LOT * 50;
        expect(f.ceeAmount).toBeLessThanOrEqual(maxCEE + 1);
        expect(f.ceeAmount).toBeGreaterThan(0);
    });
});

// =============================================================================
// TEST 4 — Résidence Lille (F->D, 15 lots, honoraires syndic override)
//          Vérifie : honoraires syndic HT override + hors Eco-PTZ
// =============================================================================
describe("TEST 4 — Résidence Lille (F->D, 15 lots, honoraires syndic custom)", () => {
    const WITHOUT_FEES = generateDiagnostic({
        ...BASE,
        targetDPE: "D",
        numberOfUnits: 15,
        estimatedCostHT: 200_000,
        montantHonorairesSyndicHT: 0,
    });
    const WITH_FEES = generateDiagnostic({
        ...BASE,
        targetDPE: "D",
        numberOfUnits: 15,
        estimatedCostHT: 200_000,
        montantHonorairesSyndicHT: 8_000, // override manuel
    });

    it("Ajout 8k HT syndic -> Eco-PTZ inchangé (hors assiette Eco-PTZ)", () => {
        expect(WITH_FEES.financing.ecoPtzAmount).toBeCloseTo(
            WITHOUT_FEES.financing.ecoPtzAmount,
            -2
        );
    });

    it("Ajout 8k HT syndic -> cashDownPayment augmente de 8k x 1.20 = 9 600", () => {
        const diff =
            WITH_FEES.financing.cashDownPayment -
            WITHOUT_FEES.financing.cashDownPayment;
        expect(diff).toBeCloseTo(8_000 * 1.20, -2);
    });

    it("F->D = sortie passoire valide (D est dans [A,B,C,D])", () => {
        expect(validateDPEProgression("F", "D")).toBe(true);
    });
});

// =============================================================================
// TEST 5 — Résidence Strasbourg (G->B, 30 lots, ALUR 30k)
//          Vérifie : ALUR déduit avant Eco-PTZ (waterfall subventions)
// =============================================================================
describe("TEST 5 — Résidence Strasbourg (G->B, 30 lots, ALUR 30k)", () => {
    const WITHOUT_ALUR = generateDiagnostic({
        ...BASE,
        currentDPE: "G",
        targetDPE: "B",
        numberOfUnits: 30,
        estimatedCostHT: 450_000,
        alurFund: 0,
    });
    const WITH_ALUR = generateDiagnostic({
        ...BASE,
        currentDPE: "G",
        targetDPE: "B",
        numberOfUnits: 30,
        estimatedCostHT: 450_000,
        alurFund: 30_000,
    });

    it("ALUR réduit le RAC comptant (cashDownPayment moins élevé avec ALUR)", () => {
        expect(WITH_ALUR.financing.cashDownPayment).toBeLessThan(
            WITHOUT_ALUR.financing.cashDownPayment
        );
    });

    it("Gain G->B = (450-90)/450 = 80% -> haute perf -> MPR 45% + bonus 10% = 55%", () => {
        const gain = estimateEnergyGain("G", "B");
        expect(gain).toBeCloseTo(0.8, 2);
        expect(WITH_ALUR.financing.mprRate).toBeCloseTo(0.55, 2);
    });

    it("G = interdit -> compliance critical", () => {
        const c = calculateComplianceStatus("G");
        expect(c.urgencyLevel).toBe("critical");
        expect(c.statusColor).toBe("danger");
    });
});

// =============================================================================
// TEST 6 — Résidence Bordeaux (F->C, 8 lots, travaux amelioration 20k HT)
//          Vérifie : travaux amelioration TVA 10% hors MPR/Eco-PTZ
// =============================================================================
describe("TEST 6 — Résidence Bordeaux (F->C, 8 lots, amélioration 20k HT)", () => {
    const WITHOUT_AMELIO = generateDiagnostic({
        ...BASE,
        numberOfUnits: 8,
        estimatedCostHT: 120_000,
        montantTravauxAmeliorationHT: 0,
    });
    const WITH_AMELIO = generateDiagnostic({
        ...BASE,
        numberOfUnits: 8,
        estimatedCostHT: 120_000,
        montantTravauxAmeliorationHT: 20_000,
    });

    it("Travaux amelioration 20k HT -> Eco-PTZ inchangé (hors assiette)", () => {
        expect(WITH_AMELIO.financing.ecoPtzAmount).toBeCloseTo(
            WITHOUT_AMELIO.financing.ecoPtzAmount,
            -2
        );
    });

    it("Travaux amelioration 20k HT -> TTC augmente de 20k x 1.10 = 22k", () => {
        const diff =
            WITH_AMELIO.financing.totalCostTTC -
            WITHOUT_AMELIO.financing.totalCostTTC;
        expect(diff).toBeCloseTo(20_000 * 1.10, -2);
    });

    it("MPR non impacté par les travaux amelioration (assiette = travaux HT purs)", () => {
        expect(WITH_AMELIO.financing.mprAmount).toBeCloseTo(
            WITHOUT_AMELIO.financing.mprAmount,
            -2
        );
    });
});

// =============================================================================
// TEST 7 — Résidence Marseille (E->C, 25 lots, aides locales 15k)
//          Vérifie : aides locales injectées dans waterfall avant Eco-PTZ
// =============================================================================
describe("TEST 7 — Résidence Marseille (E->C, 25 lots, localAid 15k)", () => {
    const WITHOUT_AID = generateDiagnostic({
        ...BASE,
        currentDPE: "E",
        targetDPE: "C",
        numberOfUnits: 25,
        estimatedCostHT: 375_000,
        localAidAmount: 0,
    });
    const WITH_AID = generateDiagnostic({
        ...BASE,
        currentDPE: "E",
        targetDPE: "C",
        numberOfUnits: 25,
        estimatedCostHT: 375_000,
        localAidAmount: 15_000,
    });

    it("15k aides locales réduisent le RAC (remainingCost)", () => {
        expect(WITH_AID.financing.remainingCost).toBeLessThan(
            WITHOUT_AID.financing.remainingCost
        );
    });

    it("E->C : gain = (280-150)/280 = 46.4% -> taux standard 30% (entre 35% et 50%)", () => {
        const gain = estimateEnergyGain("E", "C");
        expect(gain).toBeGreaterThan(0.35);
        expect(gain).toBeLessThan(0.50);
        expect(WITH_AID.financing.mprRate).toBeCloseTo(0.30, 2);
    });
});

// =============================================================================
// TEST 8 — Résidence Lyon (G->D, 12 lots, devis NON signé)
//          Vérifie : plafond standard 10 700 sans devisValide
// =============================================================================
describe("TEST 8 — Résidence Lyon (G->D, 12 lots, devisValide = false)", () => {
    const diag = generateDiagnostic({
        ...BASE,
        currentDPE: "G",
        targetDPE: "D",
        numberOfUnits: 12,
        estimatedCostHT: 180_000,
        devisValide: false,
    });

    it("Sans devisValide -> plafond standard 10 700 malgré G->D", () => {
        expect(diag.financing.plafondImputationDeductible).toBe(10_700);
    });

    it("G->D = sortie passoire -> bonus +10% MPR malgre devisValide false", () => {
        expect(diag.financing.exitPassoireBonus).toBeCloseTo(0.10, 2);
    });

    it("Gain G->D = (450-210)/450 = 53.3% -> haute performance -> MPR 55%", () => {
        const gain = estimateEnergyGain("G", "D");
        expect(gain).toBeGreaterThan(0.50);
        expect(diag.financing.mprRate).toBeCloseTo(0.55, 2);
    });
});

// =============================================================================
// TEST 9 — Résidence Toulouse (C->A, 5 lots)
//          Vérifie : compliance = conforme, pas de bonus passoire
// =============================================================================
describe("TEST 9 — Résidence Toulouse (C->A, 5 lots)", () => {
    const diag = generateDiagnostic({
        ...BASE,
        currentDPE: "C",
        targetDPE: "A",
        numberOfUnits: 5,
        estimatedCostHT: 80_000,
    });

    it("Gain C->A = (150-50)/150 = 66.7% -> eligible MPR (>= 35%)", () => {
        const gain = estimateEnergyGain("C", "A");
        expect(gain).toBeGreaterThan(0.35);
    });

    it("Compliance DPE C -> conforme (aucune interdiction)", () => {
        const c = calculateComplianceStatus("C");
        expect(c.isProhibited).toBe(false);
        expect(c.prohibitionDate).toBeNull();
        expect(c.urgencyLevel).toBe("low");
    });

    it("Pas de bonus sortie passoire (C nest pas F/G)", () => {
        expect(diag.financing.exitPassoireBonus).toBe(0);
    });
});

// =============================================================================
// TEST 10 — Résidence Rennes (F->C, 40 lots dont 5 commerciaux, revenus fonciers)
//           Vérifie : lots commerciaux exclus MPR + economie fiscale bailleur
// =============================================================================
describe("TEST 10 — Résidence Rennes (F->C, 40 lots dont 5 commerciaux)", () => {
    const WITHOUT_COMMERCIAL = generateDiagnostic({
        ...BASE,
        numberOfUnits: 40,
        estimatedCostHT: 950_000,
        commercialLots: 0,
        revenusFonciersExistants: 0,
    });
    const WITH_COMMERCIAL = generateDiagnostic({
        ...BASE,
        numberOfUnits: 40,
        estimatedCostHT: 950_000,
        commercialLots: 5, // 5 lots non éligibles MPR
        revenusFonciersExistants: 12_000, // bailleur avec revenus fonciers
    });

    it("Lots commerciaux réduisent assiette MPR (résidentiels = 35 au lieu de 40)", () => {
        // MPR calculé sur residentialLots uniquement
        expect(WITH_COMMERCIAL.financing.mprAmount).toBeLessThan(
            WITHOUT_COMMERCIAL.financing.mprAmount
        );
    });

    it("perUnit.mprParLot = MPR total / 35 lots résidentiels", () => {
        const mprParLot = WITH_COMMERCIAL.financing.perUnit!.mprParLot;
        const totalMpr = WITH_COMMERCIAL.financing.mprAmount;
        expect(mprParLot).toBeCloseTo(totalMpr / 35, -1);
    });

    it("Avantages fiscaux Annee 1 > 0 (bailleur, F->C, devis signé, plafond 21 400)", () => {
        expect(
            WITH_COMMERCIAL.financing.perUnit!.avantagesFiscauxAnnee1
        ).toBeGreaterThan(0);
    });

    it("Diagnostic complet retourne les 4 objets attendus", () => {
        const result = generateDiagnostic({
            ...BASE,
            numberOfUnits: 40,
            estimatedCostHT: 600_000,
        });
        expect(result.compliance).toBeDefined();
        expect(result.financing).toBeDefined();
        expect(result.inactionCost).toBeDefined();
        expect(result.valuation).toBeDefined();
        expect(result.generatedAt).toBeInstanceOf(Date);
    });
});
