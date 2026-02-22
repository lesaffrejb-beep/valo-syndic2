/**
 * VALO-SYNDIC — Financial Utils
 * =============================
 * Calculs financiers stricts et conservateurs (ANAH/BDF 2026).
 */

import { FINANCES_2026 } from "./financialConstants";
import { TECHNICAL_PARAMS } from "./constants";

export interface FinancialResult {
    subsidies: {
        mpr: number;
        cee: number;
        total: number;
    };
    financing: {
        /** Reste à charge AVANT emprunt (besoin de financement bancaire) */
        initialRac: number;
        /** Montant Éco-PTZ (plafonné) */
        loanAmount: number;
        /** Apport cash immédiat si prêt insuffisant */
        cashDownPayment: number;
        /** Mensualité réelle (Éco-PTZ à 0% = capital/durée) */
        monthlyLoanPayment: number;
    };
    kpi: {
        /** Économies mensuelles estimées sur facture énergétique */
        monthlyEnergySavings: number;
        /** Flux net mensuel (économie - mensualité) */
        netMonthlyCashFlow: number;
        /** Valorisation patrimoniale (Valeur Verte) */
        greenValueIncrease: number;
    };
    /** Alertes de conformité ou incohérences détectées */
    alerts: string[];
}

const roundEuro = (value: number): number => Math.round(value);

const normalizePositiveNumber = (value: number, label: string, alerts: string[]): number => {
    if (!Number.isFinite(value)) {
        alerts.push(`${label} invalide: valeur manquante ou non numérique.`);
        return 0;
    }
    if (value < 0) {
        alerts.push(`${label} négatif: ramené à 0 pour sécurité.`);
        return 0;
    }
    return value;
};

const normalizeLots = (value: number, alerts: string[]): number => {
    if (!Number.isFinite(value)) {
        alerts.push("Nombre de lots invalide: valeur manquante ou non numérique.");
        return 0;
    }
    const floored = Math.floor(value);
    if (floored <= 0) {
        alerts.push("Nombre de lots doit être supérieur à 0.");
        return 0;
    }
    if (floored !== value) {
        alerts.push("Nombre de lots non entier: arrondi à l'entier inférieur.");
    }
    return floored;
};

const normalizeEnergyGain = (value: number, alerts: string[]): number => {
    if (!Number.isFinite(value)) {
        alerts.push("Gain énergétique invalide: valeur manquante ou non numérique.");
        return 0;
    }
    if (value > 1 && value <= 100) {
        alerts.push("Gain énergétique reçu en pourcentage: conversion en décimal (ex: 45 -> 0.45).");
        return value / 100;
    }
    if (value < 0) {
        alerts.push("Gain énergétique négatif: ramené à 0.");
        return 0;
    }
    if (value > 1) {
        alerts.push("Gain énergétique supérieur à 100%: plafonné à 100%.");
        return 1;
    }
    return value;
};

const calculateMonthlyPayment = (principal: number, annualRate: number, durationMonths: number): number => {
    if (principal <= 0 || durationMonths <= 0) return 0;

    if (annualRate <= 0) {
        // Éco-PTZ: taux 0%, mensualité = capital / durée
        return principal / durationMonths;
    }

    // Formule des annuités constantes (taux > 0)
    const monthlyRate = annualRate / 12;
    const discountFactor = 1 - Math.pow(1 + monthlyRate, -durationMonths);

    if (discountFactor <= 0) return principal / durationMonths;

    return principal * (monthlyRate / discountFactor);
};

/**
 * Calcule les métriques financières principales d'un projet de rénovation.
 * Entrées attendues:
 * - costHT: montant des travaux purs HT (assiette MPR et CEE)
 * - totalCostTTC: coût global TTC exact (lignes TVA distinctes additionnées)
 * - ecoPtzEligibleHT: assiette éligible Éco-PTZ (CGI Art. 244 quater U) = costHT + AMO nette
 *   (exclut honoraires syndic (V 20%), DO (9%), et aléas)
 * - numberOfLots: nombre de lots
 * - energyGainPercent: gain énergétique (0.45 = 45%)
 */
export function calculateProjectMetrics(
    costHT: number,
    totalCostTTC: number,
    numberOfLots: number,
    energyGainPercent: number,
    currentEnergyBill: number,
    totalSurface: number,
    averagePricePerSqm: number,
    additionalSubsidies: number = 0,
    cashContribution: number = 0,
    ecoPtzEligibleHT: number = costHT,
    forcedMprRate?: number // Utilisé si un bonus externe (ex: Sortie passoire) s'applique
): FinancialResult {
    const alerts: string[] = [];

    const worksHT = normalizePositiveNumber(costHT, "Montant travaux HT", alerts);
    const totalTTC = normalizePositiveNumber(totalCostTTC, "Coût total TTC", alerts);
    const lots = normalizeLots(numberOfLots, alerts);
    const energyGain = normalizeEnergyGain(energyGainPercent, alerts);
    const annualEnergyBill = normalizePositiveNumber(currentEnergyBill, "Facture énergétique", alerts);
    const surface = normalizePositiveNumber(totalSurface, "Surface totale", alerts);
    const pricePerSqm = normalizePositiveNumber(averagePricePerSqm, "Prix moyen au m²", alerts);
    const extraSubsidies = normalizePositiveNumber(additionalSubsidies, "Aides complémentaires", alerts);
    const cashInput = normalizePositiveNumber(cashContribution, "Apport cash", alerts);

    if (worksHT === 0 || totalTTC === 0 || lots === 0) {
        return {
            subsidies: { mpr: 0, cee: 0, total: 0 },
            financing: { initialRac: 0, loanAmount: 0, cashDownPayment: 0, monthlyLoanPayment: 0 },
            kpi: { monthlyEnergySavings: 0, netMonthlyCashFlow: 0, greenValueIncrease: 0 },
            alerts,
        };
    }

    // ==============================
    // 1. MPR Copropriété (ANAH 2026)
    // ==============================
    let mprRate = 0;
    if (forcedMprRate !== undefined) {
        mprRate = forcedMprRate;
    } else if (energyGain >= FINANCES_2026.MPR.MIN_ENERGY_GAIN) {
        mprRate =
            energyGain >= FINANCES_2026.MPR.HIGH_PERF_THRESHOLD
                ? FINANCES_2026.MPR.RATE_HIGH_PERF
                : FINANCES_2026.MPR.RATE_STANDARD;
    } else {
        alerts.push("MPR non éligible: gain énergétique < 35%.");
    }

    const maxEligibleBase = FINANCES_2026.MPR.CEILING_PER_LOT * lots;
    const eligibleBase = Math.min(worksHT, maxEligibleBase);
    const mprAmount = eligibleBase * mprRate;
    if (worksHT > maxEligibleBase) {
        alerts.push("Attention, le coût des travaux dépasse l'assiette maximale éligible MPR plafonnée à 25 000 € par lot.");
    }

    // ==============================
    // 2. CEE (estimation conservatrice)
    // ==============================
    const ceeRaw = worksHT * FINANCES_2026.CEE.AVG_RATE_WORKS;
    const ceeCeiling = FINANCES_2026.CEE.MAX_PER_LOT * lots;
    const ceeAmount = Math.min(ceeRaw, ceeCeiling);
    if (ceeRaw > ceeCeiling) {
        alerts.push("Plafond CEE atteint (max 5 000€ par lot).");
    }

    const totalSubsidies = mprAmount + ceeAmount + extraSubsidies;

    // ==============================
    // 3. Reste à charge total (base TTC complète)
    // ==============================
    const initialRac = Math.max(0, totalTTC - totalSubsidies - cashInput);
    if (totalSubsidies > totalTTC) alerts.push("Subventions supérieures au projet TTC: RAC ramené à 0.");
    if (cashInput > 0) alerts.push("Apport cash déduit du reste à financer.");

    // ==============================
    // 4. Éco-PTZ (CGI Art. 244 quater U — seuls travauxéligibles)
    // ==============================
    const ecoPtzCapPerLot =
        energyGain >= FINANCES_2026.MPR.MIN_ENERGY_GAIN
            ? FINANCES_2026.LOAN.ECO_PTZ_MAX_PER_LOT
            : FINANCES_2026.LOAN.ECO_PTZ_MAX_PER_LOT_STANDARD;
    const ecoPtzCapTotal = ecoPtzCapPerLot * lots;

    // Assiette éligible Éco-PTZ (CGI Art. 244 quater U)
    // FORMULE CORRECTE : eligibleTTC − (mprAmount + ceeAmount)
    //
    // Raisonnement financier :
    //   1. L'artisan facture la TVA (5,5%) sur la TOTALITÉ des travaux HT — sans exception.
    //      Facture TTC = ecoPtzEligibleHT × 1,055
    //   2. Les subventions (MPR, CEE) sont versées à la copropriété sous forme de chèques
    //      en euros nets. Ce sont des flux de trésorerie, pas des "montants HT".
    //   3. La copropriété utilise ces chèques pour payer une partie de la facture TTC.
    //      Reste à financer par Éco-PTZ = Facture TTC − Chèques reçus
    //      = eligibleTTC − (mprAmount + ceeAmount)
    //
    // La formule (eligibleHT − subsidies) × 1,055 serait fausse : elle "défiscalise"
    // la part couverte par les aides, alors que l'artisan a toujours facturé la TVA dessus.
    const eligibleTTC = normalizePositiveNumber(ecoPtzEligibleHT, "Assiette Éco-PTZ", alerts) * (1 + FINANCES_2026.TVA.TRAVAUX);
    const racEligible = Math.max(0, Math.min(initialRac, eligibleTTC - (mprAmount + ceeAmount)));

    // Frais de garantie forfaitaires (art. R. 312-11 Code Consommation — forfait fixe, pas un %)
    const GUARANTEE_FEE = FINANCES_2026.LOAN.GUARANTEE_FEE_FIXED;
    const loanPrincipal = Math.min(racEligible, ecoPtzCapTotal - GUARANTEE_FEE);
    const loanAmount = loanPrincipal > 0 ? loanPrincipal + GUARANTEE_FEE : 0;

    if (racEligible > ecoPtzCapTotal) alerts.push("Prêt Éco-PTZ plafonné: un apport cash est requis.");
    if (ecoPtzCapPerLot === FINANCES_2026.LOAN.ECO_PTZ_MAX_PER_LOT_STANDARD) alerts.push("Plafond Éco-PTZ limité à 30 000€/lot.");

    // RAC comptant = partie inéligible + écart si plafond atteint
    const cashDownPayment = Math.max(0, initialRac - loanPrincipal);

    const monthlyLoanPayment = calculateMonthlyPayment(
        loanAmount,
        FINANCES_2026.LOAN.RATE_ECO_PTZ,
        FINANCES_2026.LOAN.ECO_PTZ_DURATION_MONTHS
    );

    if (loanAmount > 0 && FINANCES_2026.LOAN.ECO_PTZ_DURATION_MONTHS === 240) {
        alerts.push("Durée 240 mois appliquée (Rénovation Globale) — vérification éligibilité Art. 244 quater U requise avant dossier bancaire.");
    }

    // ==============================
    // 5. KPI Flux (Cash) vs Patrimoine
    // ==============================
    const monthlyEnergySavings = (annualEnergyBill * energyGain) / 12;
    const netMonthlyCashFlow = monthlyEnergySavings - monthlyLoanPayment;

    let greenValueIncrease = 0;
    if (surface > 0 && pricePerSqm > 0) {
        const totalPropertyValue = surface * pricePerSqm;
        const greenRate =
            energyGain >= FINANCES_2026.MPR.HIGH_PERF_THRESHOLD
                ? TECHNICAL_PARAMS.greenValueAppreciation         // 12% (haute performance)
                : energyGain >= FINANCES_2026.MPR.MIN_ENERGY_GAIN
                    ? TECHNICAL_PARAMS.greenValueAppreciationStandard // 8% (standard)
                    : 0;
        greenValueIncrease = totalPropertyValue * greenRate;
    } else if (energyGain >= FINANCES_2026.MPR.MIN_ENERGY_GAIN) {
        alerts.push("Valeur verte non calculable: surface/prix m² manquants.");
    }

    // FIX AUDIT FEV 2026 : Pas d'arrondi intermédiaire.
    // Les valeurs sont retournées en flottants bruts.
    // L'arrondi final (Math.round) est appliqué dans calculator.ts à la sortie.
    return {
        subsidies: {
            mpr: mprAmount,
            cee: ceeAmount,
            total: totalSubsidies,
        },
        financing: {
            initialRac: initialRac,
            loanAmount: loanAmount,
            cashDownPayment: cashDownPayment,
            monthlyLoanPayment: monthlyLoanPayment,
        },
        kpi: {
            monthlyEnergySavings: monthlyEnergySavings,
            netMonthlyCashFlow: netMonthlyCashFlow,
            greenValueIncrease: greenValueIncrease,
        },
        alerts,
    };
}
