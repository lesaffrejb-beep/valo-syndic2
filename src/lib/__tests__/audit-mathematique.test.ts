/**
 * ============================================================================
 * AUDIT MATHÉMATIQUE - VALO-SYNDIC
 * ============================================================================
 * 
 * Objectif : Vérifier rigoureusement tous les calculs métier avec des cas
 * de test aléatoires et des vérifications manuelles indépendantes.
 * 
 * Approche : Calculs de référence faits "à la main" puis comparés au code.
 * 
 * Profil de l'auditeur: Mathématicien / Senior Dev
 * Date d'audit: 2026-01-30
 * ============================================================================
 */

import {
    simulateFinancing,
    calculateComplianceStatus,
    calculateInactionCost,
    calculateValuation,
    generateDiagnostic,
    formatCurrency,
} from "../calculator";

import {
    estimateEnergyGain,
    type DiagnosticInput,
} from "../schemas";

import {
    DPE_PROHIBITION_DATES,
    DPE_NUMERIC_VALUE,
    MPR_COPRO,
    ECO_PTZ_COPRO,
    AMO_PARAMS,
    PROJECT_FEES,
    TECHNICAL_PARAMS,
    VALUATION_PARAMS,
    type DPELetter,
} from "../constants";

import { calculateSubsidies, type SimulationInputs } from "../subsidy-calculator";

// Mock Supabase to prevent console warnings
jest.mock('../supabaseClient', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
                    data: null,
                })),
            })),
        })),
    },
}));

// ============================================================================
// UTILITAIRES D'ASSERTION PERSONNALISÉS
// ============================================================================

interface AuditResult {
    testCase: string;
    test: string;
    passed: boolean;
    expected: string | number | boolean;
    actual: string | number | boolean;
    severity: "CRITICAL" | "WARNING" | "INFO";
}

const auditResults: AuditResult[] = [];

function auditAssert(
    testCase: string,
    test: string,
    condition: boolean,
    expected: string | number | boolean,
    actual: string | number | boolean,
    severity: "CRITICAL" | "WARNING" | "INFO" = "CRITICAL"
): void {
    auditResults.push({
        testCase,
        test,
        passed: condition,
        expected,
        actual,
        severity,
    });
    expect(condition).toBe(true);
}

function auditApprox(
    testCase: string,
    test: string,
    actual: number,
    expected: number,
    tolerance: number = 0.01,
    severity: "CRITICAL" | "WARNING" | "INFO" = "CRITICAL"
): void {
    const diff = Math.abs(actual - expected);
    const passed = diff <= tolerance;
    auditResults.push({
        testCase,
        test,
        passed,
        expected: `${expected} (±${tolerance})`,
        actual,
        severity,
    });
    expect(diff).toBeLessThanOrEqual(tolerance);
}

// ============================================================================
// CAS DE TEST 1: PETITE COPROPRIÉTÉ F → C (SORTIE DE PASSOIRE)
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #1: Petite copropriété F → C", () => {
    const input: DiagnosticInput = {
        address: "12 Rue des Lilas, 49000 Angers",
        postalCode: "49000",
        city: "Angers",
        currentDPE: "F",
        targetDPE: "C",
        numberOfUnits: 8,
        commercialLots: 0,
        estimatedCostHT: 180_000,
        averagePricePerSqm: 3200,
        priceSource: "DVF",
        salesCount: 45,
        averageUnitSurface: 55,
        localAidAmount: 0,
        alurFund: 5000,
        ceeBonus: 0,
        currentEnergyBill: 3000,
        investorRatio: 30,
        isCostTTC: true,
        includeHonoraires: true,
        devisValide: false,
        revenusFonciersExistants: 0,
        montantTravauxAmeliorationHT: 0,
        statutLot: 'occupant',
        optionLocAvantages: false,
        ecoPtzDuration: 20,
    };

    const result = generateDiagnostic(input);

    it("vérifie les paramètres de base", () => {
    });

    it("calcule correctement les frais de projet", () => {
        // Frais sur Travaux HT uniquement
        const syndicFees = input.estimatedCostHT * PROJECT_FEES.syndicRate; // 5,400€
        const doFees = input.estimatedCostHT * PROJECT_FEES.doRate; // 3,600€
        const contingencyFees = input.estimatedCostHT * PROJECT_FEES.contingencyRate; // 9,000€

        auditAssert("Cas#1", "Frais syndic (3%)",
            result.financing.syndicFees === Math.round(syndicFees),
            Math.round(syndicFees), result.financing.syndicFees);
        auditAssert("Cas#1", "Frais DO (2%)",
            result.financing.doFees === Math.round(doFees),
            Math.round(doFees), result.financing.doFees);
        auditAssert("Cas#1", "Frais aléas (5%)",
            result.financing.contingencyFees === Math.round(contingencyFees),
            Math.round(contingencyFees), result.financing.contingencyFees);
    });

    it("calcule correctement l'AMO", () => {
        // Le coût AMO réel est de 600€/lot (forfait moyen)
        // Le plafond est de 1000€/lot pour ≤20 lots, 600€ pour >20 lots
        // Avec 8 lots : coût = 4,800€, plafond = 8,000€ → éligible = 4,800€
        // Aide calculée = 4,800€ × 50% = 2,400€
        // MAIS : le plancher minimum de 3,000€ s'applique !
        const amoCostHT = AMO_PARAMS.costPerLot * input.numberOfUnits; // 4,800€
        const amoCeilingPerLot = input.numberOfUnits <= AMO_PARAMS.smallCoproThreshold
            ? AMO_PARAMS.ceilingPerLotSmall  // 1,000€
            : AMO_PARAMS.ceilingPerLotLarge; // 600€
        const amoCeiling = amoCeilingPerLot * input.numberOfUnits; // 8,000€
        const eligibleBaseAMO = Math.min(amoCostHT, amoCeiling); // 4,800€
        const amoAidCalculated = eligibleBaseAMO * AMO_PARAMS.aidRate; // 2,400€
        const amoAid = Math.max(amoAidCalculated, AMO_PARAMS.minTotal); // 3,000€ (plancher!)

        auditAssert("Cas#1", "Aide AMO avec plancher 3000€",
            result.financing.amoAmount === Math.round(amoAid),
            Math.round(amoAid), result.financing.amoAmount);
    });

    it("calcule correctement le gain énergétique F→C", () => {
        // F→C = 3 sauts = 55%
        const expectedGain = estimateEnergyGain("F", "C"); // = 0.55

        auditAssert("Cas#1", "Gain énergétique F→C = 55%",
            result.financing.energyGainPercent === expectedGain,
            expectedGain, result.financing.energyGainPercent);
    });

    it("applique correctement le taux MPR avec bonus sortie passoire (F→C)", () => {
        // Gain ~57.1% > 50% → taux haute performance 45% + bonus sortie passoire +10% = 55%
        // F ∈ {F, G} et C ∈ {A, B, C, D} → bonus sortie de passoire applicable
        // FIX AUDIT FEV 2026 (F6) : le test précédent attendait 0.45 (sans bonus), erreur corrigée
        const expectedMprRate = MPR_COPRO.rates.performance + MPR_COPRO.exitPassoireBonus; // 0.55

        auditApprox("Cas#1", "Taux MPR avec bonus passoire (55%)",
            result.financing.mprRate, expectedMprRate, 0.001);
        auditAssert("Cas#1", "Bonus passoire appliqué (+10%)",
            result.financing.exitPassoireBonus === MPR_COPRO.exitPassoireBonus,
            MPR_COPRO.exitPassoireBonus, result.financing.exitPassoireBonus);
    });

    it("calcule correctement le montant MPR avec bonus passoire", () => {
        // MPR = min(worksHT × mprRate, plafond par lot résidentiel)
        // FIX AUDIT FEV 2026 (F6) : base = worksHT (pas totalCostTTC), mprRate avec bonus
        // mprRate = taux haute perf (45%) + bonus sortie passoire (10%) = 55%
        // = min(180,000 × 0.55, 8 × 25,000€) = min(99,000, 200,000) = 99,000€
        const mprRate = MPR_COPRO.rates.performance + MPR_COPRO.exitPassoireBonus; // 0.55
        const mprCeiling = input.numberOfUnits * MPR_COPRO.ceilingPerUnit; // 200,000
        const expectedMPR = Math.min(input.estimatedCostHT * mprRate, mprCeiling); // 99,000

        auditAssert("Cas#1", "Montant MPR calculé (base worksHT, avec bonus passoire)",
            result.financing.mprAmount === Math.round(expectedMPR),
            Math.round(expectedMPR), result.financing.mprAmount);
    });

    it("calcule correctement l'Éco-PTZ", () => {
        // Recalcul ligne par ligne (FIX AUDIT FEV 2026 : TVA multi-taux, pas uniforme à 5.5%)
        const mprRate = MPR_COPRO.rates.performance + MPR_COPRO.exitPassoireBonus; // 0.55
        const mprCeiling = input.numberOfUnits * MPR_COPRO.ceilingPerUnit;
        const mprAmount = Math.min(input.estimatedCostHT * mprRate, mprCeiling); // 99,000
        const ceeAmount = Math.min(input.estimatedCostHT * 0.08, input.numberOfUnits * 5_000); // 14,400
        const amoCostHT = AMO_PARAMS.costPerLot * input.numberOfUnits; // 4,800
        const amoSubvention = Math.min(Math.max(amoCostHT * AMO_PARAMS.aidRate, AMO_PARAMS.minTotal), amoCostHT); // 3,000
        const amoNetCostHT = Math.max(0, amoCostHT - amoSubvention); // 1,800

        // TTC ligne par ligne (TVA 5.5% travaux, 20% honoraires, 9% DO, 5.5% aléas)
        const syndicFees = input.estimatedCostHT * PROJECT_FEES.syndicRate; // 5,400
        const doFees = input.estimatedCostHT * PROJECT_FEES.doRate; // 3,600
        const contingencyFees = input.estimatedCostHT * PROJECT_FEES.contingencyRate; // 9,000
        const totalCostTTC =
            input.estimatedCostHT * 1.055 +    // travaux HT × (1 + 5.5%)
            syndicFees * 1.20 +                 // honoraires syndic × (1 + 20%)
            doFees * 1.09 +                     // assurance DO × (1 + 9%)
            contingencyFees * 1.055 +           // aléas × (1 + 5.5%) TVA latente
            amoCostHT * 1.20;                   // AMO × (1 + 20%)

        const totalSubsidies = mprAmount + ceeAmount + amoSubvention; // 116,400
        const initialRac = Math.max(0, totalCostTTC - totalSubsidies - (input.alurFund ?? 0)); // 94,159

        // Assiette Éco-PTZ = travaux HT + AMO nette HT (CGI Art. 244 quater U)
        const ecoPtzEligibleHT = input.estimatedCostHT + amoNetCostHT; // 181,800
        // FORMULE CORRECTE : eligibleTTC − (mprAmount + ceeAmount)
        // Raisonnement : l'artisan facture la TVA sur la TOTALITÉ des travaux HT.
        // Les subventions (MPR, CEE) sont des chèques nets versés à la copro — pas des montants HT.
        // Reste à financer par Éco-PTZ = Facture TTC − Chèques reçus
        // eligibleTTC = 181,800 × 1,055 = 191,799
        // racEligible = Min(94,159 ; 191,799 − 113,400) = Min(94,159 ; 78,399) = 78,399
        const eligibleTTC = ecoPtzEligibleHT * 1.055; // 191,799
        const racEligible = Math.max(0, Math.min(initialRac, eligibleTTC - (mprAmount + ceeAmount))); // 78,399

        const GUARANTEE_FEE = 500;
        const ecoPtzCeiling = input.numberOfUnits * ECO_PTZ_COPRO.ceilingPerUnit; // 400,000
        const loanPrincipal = Math.min(racEligible, ecoPtzCeiling - GUARANTEE_FEE);
        const expectedEcoPTZ = loanPrincipal + GUARANTEE_FEE; // 78,899

        auditApprox("Cas#1", "Montant Éco-PTZ (eligibleTTC − subsidies)", result.financing.ecoPtzAmount, expectedEcoPTZ, 10);
    });

    it("calcule correctement le reste à charge (avant Éco-PTZ) et l'apport comptant", () => {
        // FIX AUDIT FEV 2026 (F6) : remainingCost = initialRac = besoin de financement AVANT Éco-PTZ
        // Il n'est pas nul : le prêt couvre la partie éligible, le solde est le cashDownPayment
        // cashDownPayment = la vraie sortie de trésorerie immédiate (Appel de Fonds)
        auditAssert("Cas#1", "Reste à charge (initialRac) >= 0",
            result.financing.remainingCost >= 0,
            ">= 0", result.financing.remainingCost);
        auditAssert("Cas#1", "Apport comptant (cashDownPayment) >= 0",
            result.financing.cashDownPayment >= 0,
            ">= 0", result.financing.cashDownPayment);
        // Le prêt ne peut pas dépasser le besoin de financement + frais de garantie
        auditAssert("Cas#1", "Éco-PTZ ≤ remainingCost + frais garantie",
            result.financing.ecoPtzAmount <= result.financing.remainingCost + 500,
            "<= RAC + 500", result.financing.ecoPtzAmount);
    });

    it("calcule correctement la mensualité Éco-PTZ", () => {
        // Mensualité = Capital / 240 mois
        // Capital = ecoPtzAmount calculé précédemment (~97,054€ avec plancher AMO)
        const durationMonths = ECO_PTZ_COPRO.maxDurationYears * 12;
        const expectedMonthly = result.financing.ecoPtzAmount / durationMonths;

        auditApprox("Cas#1", "Mensualité Éco-PTZ",
            result.financing.monthlyPayment, expectedMonthly, 1);
    });

    it("calcule correctement la valorisation", () => {
        // Surface totale = 8 × 55 = 440m²
        const totalSurface = input.numberOfUnits * (input.averageUnitSurface || 65);
        const basePricePerSqm = input.averagePricePerSqm!;
        const currentValue = totalSurface * basePricePerSqm;
        // Gain 55% → bonus valeur verte 12%
        const greenValueGain = currentValue * 0.12;
        const projectedValue = currentValue + greenValueGain;

        auditApprox("Cas#1", "Valeur actuelle",
            result.valuation.currentValue, currentValue, 100);
        auditApprox("Cas#1", "Valeur projetée",
            result.valuation.projectedValue, projectedValue, 100);
        auditApprox("Cas#1", "Gain Valeur Verte",
            result.valuation.greenValueGain, greenValueGain, 100);
    });

    it("calcule correctement le ROI net", () => {
        // Gain Valeur Verte ≈ 211,200€ - Reste à charge 0€ = +211,200€
        const isPositiveROI = result.valuation.netROI > 0;
        auditAssert("Cas#1", "ROI net positif",
            isPositiveROI,
            "positif", result.valuation.netROI);
    });
});

// ============================================================================
// CAS DE TEST 2: GRANDE COPROPRIÉTÉ G → A AVEC LOTS COMMERCIAUX
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #2: Grande copropriété G → A", () => {
    const input: DiagnosticInput = {
        address: "45 Avenue du Grand Large, 44100 Nantes",
        postalCode: "44100",
        city: "Nantes",
        currentDPE: "G",
        targetDPE: "A",
        numberOfUnits: 45,
        commercialLots: 3,
        estimatedCostHT: 1_200_000,
        averagePricePerSqm: 3800,
        priceSource: "DVF",
        salesCount: 120,
        averageUnitSurface: 62,
        localAidAmount: 25_000,
        alurFund: 0,
        ceeBonus: 15_000,
        currentEnergyBill: 3000,
        investorRatio: 40,
        isCostTTC: true,
        includeHonoraires: true,
        devisValide: false,
        revenusFonciersExistants: 0,
        montantTravauxAmeliorationHT: 0,
        statutLot: 'occupant',
        optionLocAvantages: false,
        ecoPtzDuration: 20,
    };

    const result = generateDiagnostic(input);

    it("vérifie les paramètres", () => {
    });

    it("exclut correctement les lots commerciaux du calcul MPR", () => {
        // Lots résidentiels = 45 - 3 = 42
        const residentialLots = input.numberOfUnits - (input.commercialLots || 0);
        // Plafond MPR = 42 × 25k€ = 1,050,000€
        const mprCeiling = residentialLots * MPR_COPRO.ceilingPerUnit;

        // FIX AUDIT FEV 2026 (F6) : MPR = min(worksHT, plafond résidentiel) × mprRate
        // G→A = passoire exit (G ∈ {F,G}, A ∈ {A,B,C,D}) → bonus +10%
        // mprRate = taux haute perf (45%) + bonus passoire (10%) = 55%
        // eligibleBase = min(1,200,000, 1,050,000) = 1,050,000€
        // expectedMPR = 1,050,000 * 0.55 = 577,500€
        const mprRate = MPR_COPRO.rates.performance + MPR_COPRO.exitPassoireBonus; // 0.55
        const eligibleBase = Math.min(input.estimatedCostHT, mprCeiling);
        const expectedMPR = eligibleBase * mprRate;

        auditAssert("Cas#2", "MPR avec exclusion lots commerciaux",
            result.financing.mprAmount === Math.round(expectedMPR),
            Math.round(expectedMPR), result.financing.mprAmount, "CRITICAL");
    });

    it("calcule correctement le gain énergétique G→A", () => {
        // G→A = 5 sauts = 55% (max)
        const expectedGain = estimateEnergyGain("G", "A");
        auditAssert("Cas#2", "Gain énergétique G→A = 55%",
            result.financing.energyGainPercent === expectedGain,
            expectedGain, result.financing.energyGainPercent);
    });

    it("applique le taux MPR maximum avec bonus passoire (G→A)", () => {
        // G→A = passoire exit → taux haute perf (45%) + bonus passoire (10%) = 55%
        // FIX AUDIT FEV 2026 (F6) : G→A qualifie aussi pour le bonus sortie passoire
        const expectedRate = MPR_COPRO.rates.performance + MPR_COPRO.exitPassoireBonus; // 0.55
        auditApprox("Cas#2", "Taux MPR avec bonus passoire (55%)",
            result.financing.mprRate, expectedRate, 0.001);
    });

    it("intègre correctement les aides externes (CEE + locales)", () => {
        const residentialLots = input.numberOfUnits - (input.commercialLots || 0);
        // FIX AUDIT FEV 2026 (F6) : CEE = min(worksHT × 8%, plafond résidentiel)
        // Base de calcul = worksHT (pas totalCostTTC)
        // = min(1,200,000 × 8%, 42 × 5,000€) = min(96,000, 210,000) = 96,000€
        const expectedCee = Math.min(input.estimatedCostHT * 0.08, residentialLots * 5_000);

        auditAssert("Cas#2", "Aides locales présentes",
            result.financing.localAidAmount === input.localAidAmount,
            input.localAidAmount, result.financing.localAidAmount);
        auditAssert("Cas#2", "Primes CEE calculées (base worksHT)",
            result.financing.ceeAmount === Math.round(expectedCee),
            Math.round(expectedCee), result.financing.ceeAmount);
    });
});

// ============================================================================
// CAS DE TEST 3: PROJET NON ÉLIGIBLE MPR (gain < 35%)
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #3: Projet non éligible MPR", () => {
    // FIX AUDIT FEV 2026 (F1+F6) : Le scénario C→B a été remplacé par D→C.
    // Avec le calcul kWh réel, C→B donne (150-90)/150 = 40% — ÉLIGIBLE au MPR.
    // D→C donne (210-150)/210 = 28.6% — INÉLIGIBLE (< seuil 35%) comme attendu.
    const input: DiagnosticInput = {
        address: "8 Rue Moderne, 49100 Angers",
        postalCode: "49100",
        city: "Angers",
        currentDPE: "D",
        targetDPE: "C", // D→C = gain kWh = (210-150)/210 = 28.6% < 35% → non éligible
        numberOfUnits: 12,
        commercialLots: 0,
        estimatedCostHT: 80_000,
        averagePricePerSqm: 3400,
        averageUnitSurface: 58,
        localAidAmount: 5000,
        alurFund: 0,
        ceeBonus: 0,
        currentEnergyBill: 3000,
        investorRatio: 0,
        isCostTTC: true,
        includeHonoraires: true,
        devisValide: false,
        revenusFonciersExistants: 0,
        montantTravauxAmeliorationHT: 0,
        statutLot: 'occupant',
        optionLocAvantages: false,
        ecoPtzDuration: 20,
    };

    const result = generateDiagnostic(input);

    it("vérifie les paramètres", () => {
    });

    it("calcule correctement le faible gain énergétique (D→C)", () => {
        // D→C : (210 - 150) / 210 = 28.6% < seuil MPR de 35%
        const expectedGain = estimateEnergyGain("D", "C"); // ≈ 0.2857
        auditAssert("Cas#3", "Gain D→C ≈ 28.6%",
            result.financing.energyGainPercent === expectedGain,
            expectedGain, result.financing.energyGainPercent);
    });

    it("déclare le projet non éligible MPR (gain < 35%)", () => {
        // Gain 28.6% < 35% minimum → MPR = 0
        const isEligible = result.financing.energyGainPercent >= MPR_COPRO.minEnergyGain;
        auditAssert("Cas#3", "Projet non éligible (28.6% < 35%)",
            !isEligible, false, isEligible);
    });

    it("attribue MPR = 0 pour projet non éligible", () => {
        auditAssert("Cas#3", "MPR = 0€ si non éligible",
            result.financing.mprAmount === 0,
            0, result.financing.mprAmount, "CRITICAL");
    });

    it("n'applique pas de bonus passoire (D n'est pas une passoire)", () => {
        // Le bonus passoire ne s'applique que si currentDPE ∈ {F, G}
        auditAssert("Cas#3", "Pas de bonus passoire pour D",
            result.financing.exitPassoireBonus === 0,
            0, result.financing.exitPassoireBonus);
    });
});

// ============================================================================
// CAS DE TEST 4: TEST DE STRESS - PLAFONNEMENTS MAXIMUMS
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #4: Test de stress plafonnements", () => {
    const input: DiagnosticInput = {
        address: "1 Rue du Test, 75000 Paris",
        postalCode: "75000",
        city: "Paris",
        currentDPE: "G",
        targetDPE: "A",
        numberOfUnits: 100,
        commercialLots: 0,
        estimatedCostHT: 10_000_000, // 100k€/lot!
        averagePricePerSqm: 12000,
        averageUnitSurface: 85,
        localAidAmount: 500_000,
        alurFund: 200_000,
        ceeBonus: 100_000,
        currentEnergyBill: 3000,
        investorRatio: 0,
        isCostTTC: true,
        includeHonoraires: true,
        devisValide: false,
        revenusFonciersExistants: 0,
        montantTravauxAmeliorationHT: 0,
        statutLot: 'occupant',
        optionLocAvantages: false,
        ecoPtzDuration: 20,
    };

    const result = generateDiagnostic(input);

    it("vérifie les paramètres", () => {
    });

    it("respecte le plafond MPR par lot (25k€)", () => {
        // MPR max = 100 lots × 25k€ = 2,500,000€
        const maxMPR = input.numberOfUnits * MPR_COPRO.ceilingPerUnit;
        auditAssert("Cas#4", "MPR respecte plafond",
            result.financing.mprAmount <= maxMPR + 1,
            `≤ ${maxMPR}`, result.financing.mprAmount, "CRITICAL");
    });

    it("respecte le plafond Éco-PTZ par lot (50k€)", () => {
        // Éco-PTZ max = 100 lots × 50k€ = 5,000,000€
        const maxEcoPTZ = input.numberOfUnits * ECO_PTZ_COPRO.ceilingPerUnit;
        auditAssert("Cas#4", "Éco-PTZ respecte plafond",
            result.financing.ecoPtzAmount <= maxEcoPTZ,
            `≤ ${maxEcoPTZ}`, result.financing.ecoPtzAmount, "CRITICAL");
    });

    it("garde le reste à charge toujours positif ou nul", () => {
        auditAssert("Cas#4", "Reste à charge global ≥ 0",
            result.financing.remainingCost >= 0,
            "≥ 0", result.financing.remainingCost, "CRITICAL");
        auditAssert("Cas#4", "Reste à charge par lot ≥ 0",
            result.financing.remainingCostPerUnit >= 0,
            "≥ 0", result.financing.remainingCostPerUnit, "CRITICAL");
    });

    it("maintient la cohérence des totaux HT", () => {
        // totalCostHT = worksCostHT + syndicFees + doFees + contingencyFees + AMO
        const amoTotal = input.numberOfUnits * AMO_PARAMS.costPerLot;
        const expectedTotalHT = result.financing.worksCostHT + result.financing.syndicFees
            + result.financing.doFees + result.financing.contingencyFees + amoTotal;

        auditApprox("Cas#4", "Cohérence total HT",
            result.financing.totalCostHT, expectedTotalHT, 10, "CRITICAL");
    });

    it("calcule un coût par lot TTC cohérent", () => {
        // FIX AUDIT FEV 2026 (F6) : avec TVA multi-taux ligne par ligne, le taux effectif
        // n'est pas uniforme à 5.5%. Le mix travaux(5.5%)+honoraires(20%)+DO(9%)+aléas(5.5%)+AMO(20%)
        // donne un taux effectif d'environ 6.0% sur le HT total. Bornes élargies en conséquence.
        const costPerUnitHT = result.financing.totalCostHT / input.numberOfUnits;
        const minCostPerUnit = costPerUnitHT * 1.055; // borne basse (pur TVA 5.5%)
        const maxCostPerUnit = costPerUnitHT * 1.07;  // borne haute (mix avec 20% honoraires)

        auditAssert("Cas#4", "Coût par lot TTC cohérent (TVA effective 5.5%-7%)",
            result.financing.costPerUnit >= minCostPerUnit && result.financing.costPerUnit <= maxCostPerUnit,
            `${formatCurrency(minCostPerUnit)}-${formatCurrency(maxCostPerUnit)}`,
            formatCurrency(result.financing.costPerUnit), "WARNING");
    });
});

// ============================================================================
// CAS DE TEST 5: STATUT DE CONFORMITÉ DPE
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #5: Statut de conformité DPE", () => {
    const referenceDate = new Date("2026-01-27");

    it("vérifie que DPE G est déjà INTERDIT en 2026", () => {
        const compliance = calculateComplianceStatus("G", referenceDate);

        auditAssert("Cas#5", "DPE G isProhibited = true",
            compliance.isProhibited === true, true, compliance.isProhibited, "CRITICAL");
        auditAssert("Cas#5", "DPE G urgencyLevel = critical",
            compliance.urgencyLevel === "critical", "critical", compliance.urgencyLevel, "CRITICAL");
        auditAssert("Cas#5", "DPE G daysUntilProhibition = 0",
            compliance.daysUntilProhibition === 0, 0, compliance.daysUntilProhibition!, "CRITICAL");
        auditAssert("Cas#5", "DPE G label = INTERDIT",
            compliance.statusLabel === "INTERDIT", "INTERDIT", compliance.statusLabel, "CRITICAL");
    });

    it("vérifie que DPE F est urgent mais pas encore interdit", () => {
        const compliance = calculateComplianceStatus("F", referenceDate);

        auditAssert("Cas#5", "DPE F isProhibited = false (jan 2026)",
            compliance.isProhibited === false, false, compliance.isProhibited, "CRITICAL");
        auditAssert("Cas#5", "DPE F urgencyLevel = high",
            compliance.urgencyLevel === "high", "high", compliance.urgencyLevel, "CRITICAL");
        // F interdit en 2028, donc ~2 ans = ~730 jours
        auditAssert("Cas#5", "DPE F daysUntilProhibition ≈ 730",
            compliance.daysUntilProhibition! > 700 && compliance.daysUntilProhibition! < 800,
            "700-800", compliance.daysUntilProhibition!, "WARNING");
    });

    it("vérifie que DPE E est en alerte moyenne", () => {
        const compliance = calculateComplianceStatus("E", referenceDate);

        auditAssert("Cas#5", "DPE E isProhibited = false",
            compliance.isProhibited === false, false, compliance.isProhibited, "CRITICAL");
        // E interdit en 2034, donc > 2 ans → medium
        auditAssert("Cas#5", "DPE E urgencyLevel = medium",
            compliance.urgencyLevel === "medium", "medium", compliance.urgencyLevel, "WARNING");
    });

    it("vérifie que DPE D/C/B/A sont conformes", () => {
        ["D", "C", "B", "A"].forEach((dpe) => {
            const compliance = calculateComplianceStatus(dpe as DPELetter, referenceDate);
            auditAssert(`Cas#5`, `DPE ${dpe} isProhibited = false`,
                compliance.isProhibited === false, false, compliance.isProhibited, "CRITICAL");
            auditAssert(`Cas#5`, `DPE ${dpe} urgencyLevel = low`,
                compliance.urgencyLevel === "low", "low", compliance.urgencyLevel, "WARNING");
        });
    });
});

// ============================================================================
// CAS DE TEST 6: VÉRIFICATIONS DE BUGS POTENTIELS
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #6: Détection de bugs potentiels", () => {
    it("vérifie que le calcul MPR n'excède pas 100%", () => {
        const result = simulateFinancing(100_000, 5, "G", "A");
        auditAssert("Bug#1", "MPR rate ≤ 100%",
            result.mprRate <= 1.0, "≤ 1.0", result.mprRate, "CRITICAL");
    });

    it("vérifie que le coût par lot TTC > coût par lot HT", () => {
        const result = simulateFinancing(300_000, 20, "F", "C");
        const costPerUnitHT = result.totalCostHT / 20;
        auditAssert("Bug#2", "CostPerUnit TTC > CostPerUnit HT",
            result.costPerUnit > costPerUnitHT,
            `> ${costPerUnitHT}`, result.costPerUnit, "CRITICAL");
    });

    it("vérifie que les années de construction correspondent aux DPE", () => {
        // Vérification des estimations DPE par année
        const { estimateDPEByYear } = require("../calculator");

        auditAssert("Bug#3a", "Avant 1948 = G", estimateDPEByYear(1900) === "G", "G", estimateDPEByYear(1900));
        auditAssert("Bug#3b", "1960 = F", estimateDPEByYear(1960) === "F", "F", estimateDPEByYear(1960));
        auditAssert("Bug#3c", "1985 = E", estimateDPEByYear(1985) === "E", "E", estimateDPEByYear(1985));
        auditAssert("Bug#3d", "2015 = B", estimateDPEByYear(2015) === "B", "B", estimateDPEByYear(2015));
        auditAssert("Bug#3e", "2022 = A", estimateDPEByYear(2022) === "A", "A", estimateDPEByYear(2022));
    });

    it("vérifie la cohérence du coût de l'inaction", () => {
        const result = calculateInactionCost(300_000, 20, "F", 3500, 65);

        // Le coût projeté doit être supérieur au coût actuel (inflation)
        auditAssert("Bug#4a", "Coût 2029 > Coût 2026",
            result.projectedCost3Years > result.currentCost,
            "> current", result.projectedCost3Years, "CRITICAL");

        // DPE F doit avoir une décote
        auditAssert("Bug#4b", "Décote pour DPE F",
            result.valueDepreciation > 0,
            "> 0", result.valueDepreciation, "WARNING");
    });

    it("vérifie que DPE C n'a pas de décote", () => {
        const result = calculateInactionCost(300_000, 20, "C", 3500, 65);
        auditAssert("Bug#5", "Pas de décote pour DPE C",
            result.valueDepreciation === 0,
            0, result.valueDepreciation, "WARNING");
    });
});

// ============================================================================
// RAPPORT FINAL
// ============================================================================

afterAll(() => {

    const critical = auditResults.filter(r => r.severity === "CRITICAL");
    const warnings = auditResults.filter(r => r.severity === "WARNING");

    const criticalPassed = critical.filter(r => r.passed).length;
    const criticalFailed = critical.filter(r => !r.passed).length;
    const warningPassed = warnings.filter(r => r.passed).length;
    const warningFailed = warnings.filter(r => !r.passed).length;


    if (criticalFailed > 0) {
        critical.filter(r => !r.passed).forEach(r => {
        });
    }

    if (warningFailed > 0) {
        warnings.filter(r => !r.passed).forEach(r => {
        });
    }

    if (criticalFailed === 0 && warningFailed === 0) {
    } else if (criticalFailed === 0) {
    } else {
    }
});
