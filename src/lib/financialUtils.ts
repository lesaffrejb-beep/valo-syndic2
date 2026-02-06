/**
 * VALO-SYNDIC — Financial Utils
 * =============================
 * Calculs financiers stricts et conservateurs (ANAH/BDF 2026).
 *
 * REFONTE 2026-02-06 :
 * - MPR/CEE calcules sur HT (pas TTC)
 * - Ecretement 80% TTC implemente (applyCapping)
 * - Signature clarifiee : worksHT + totalTTC separes
 */

import { FINANCES_2026 } from "./financialConstants";

export interface FinancialResult {
    subsidies: {
        mpr: number;
        cee: number;
        total: number;
        /** true si l'ecretement 80% TTC a ete applique */
        cappingApplied: boolean;
    };
    financing: {
        /** Reste a charge AVANT emprunt (besoin de financement bancaire) */
        initialRac: number;
        /** Montant Eco-PTZ (plafonne) */
        loanAmount: number;
        /** Apport cash immediat si pret insuffisant */
        cashDownPayment: number;
        /** Mensualite reelle (Eco-PTZ a 0% = capital/duree) */
        monthlyLoanPayment: number;
    };
    kpi: {
        /** Economies mensuelles estimees sur facture energetique */
        monthlyEnergySavings: number;
        /** Flux net mensuel (economie - mensualite) */
        netMonthlyCashFlow: number;
        /** Valorisation patrimoniale (Valeur Verte) */
        greenValueIncrease: number;
    };
    /** Alertes de conformite ou incoherences detectees */
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
        // Eco-PTZ: taux 0%, mensualite = capital / duree
        return principal / durationMonths;
    }

    // Formule des annuites constantes (taux > 0)
    const monthlyRate = annualRate / 12;
    const discountFactor = 1 - Math.pow(1 + monthlyRate, -durationMonths);

    if (discountFactor <= 0) return principal / durationMonths;

    return principal * (monthlyRate / discountFactor);
};

/**
 * Ecretement legal : le cumul des aides publiques ne peut pas depasser
 * 80% du montant TTC des travaux pour le syndicat des coproprietaires.
 *
 * Si le cumul depasse, on reduit MPR en premier (aide variable).
 *
 * @returns Le montant MPR apres ecretement
 */
function applyCapping(
    mprAmount: number,
    ceeAmount: number,
    extraSubsidies: number,
    totalTTC: number,
    alerts: string[]
): { mprCapped: number; cappingApplied: boolean } {
    const cappingLimit = totalTTC * 0.80;
    const totalAids = mprAmount + ceeAmount + extraSubsidies;

    if (totalAids <= cappingLimit) {
        return { mprCapped: mprAmount, cappingApplied: false };
    }

    // Ecretement : reduire MPR pour respecter le plafond 80% TTC
    const excess = totalAids - cappingLimit;
    const mprCapped = Math.max(0, mprAmount - excess);
    alerts.push(
        `Écrêtement appliqué : cumul aides (${Math.round(totalAids)}€) dépasse 80% TTC (${Math.round(cappingLimit)}€). ` +
        `MPR réduit de ${Math.round(mprAmount)}€ à ${Math.round(mprCapped)}€.`
    );

    return { mprCapped, cappingApplied: true };
}

/**
 * Calcule les metriques financieres principales d'un projet de renovation.
 *
 * REFONTE 2026-02-06 : Distinction stricte HT / TTC
 * - worksHT : assiette pour le calcul MPR et CEE (regle ANAH)
 * - totalTTC : base du financement reel et de l'ecretement 80%
 *
 * @param worksHT - Montant des travaux HT (assiette MPR/CEE)
 * @param totalTTC - Cout total TTC du projet (travaux + honoraires + TVA)
 * @param numberOfLots - Nombre de lots residentiels eligibles
 * @param energyGainPercent - Gain energetique (0.45 = 45%)
 * @param currentEnergyBill - Facture energetique annuelle globale (€)
 * @param totalSurface - Surface totale (m2)
 * @param averagePricePerSqm - Prix moyen au m2
 * @param additionalSubsidies - Aides complementaires (AMO + locales)
 * @param cashContribution - Apport cash (fonds ALUR, tresorerie)
 */
export function calculateProjectMetrics(
    worksHT: number,
    totalTTC: number,
    numberOfLots: number,
    energyGainPercent: number,
    currentEnergyBill: number,
    totalSurface: number,
    averagePricePerSqm: number,
    additionalSubsidies: number = 0,
    cashContribution: number = 0
): FinancialResult {
    const alerts: string[] = [];

    const htAmount = normalizePositiveNumber(worksHT, "Montant travaux HT", alerts);
    const ttcAmount = normalizePositiveNumber(totalTTC, "Montant total TTC", alerts);
    const lots = normalizeLots(numberOfLots, alerts);
    const energyGain = normalizeEnergyGain(energyGainPercent, alerts);
    const annualEnergyBill = normalizePositiveNumber(currentEnergyBill, "Facture énergétique", alerts);
    const surface = normalizePositiveNumber(totalSurface, "Surface totale", alerts);
    const pricePerSqm = normalizePositiveNumber(averagePricePerSqm, "Prix moyen au m²", alerts);
    const extraSubsidies = normalizePositiveNumber(additionalSubsidies, "Aides complémentaires", alerts);
    const cashInput = normalizePositiveNumber(cashContribution, "Apport cash", alerts);

    if (htAmount === 0 || ttcAmount === 0 || lots === 0) {
        return {
            subsidies: { mpr: 0, cee: 0, total: 0, cappingApplied: false },
            financing: { initialRac: 0, loanAmount: 0, cashDownPayment: 0, monthlyLoanPayment: 0 },
            kpi: { monthlyEnergySavings: 0, netMonthlyCashFlow: 0, greenValueIncrease: 0 },
            alerts,
        };
    }

    // ==============================
    // 1. MPR Copropriete (ANAH 2026)
    //    Assiette = Travaux HT (LE_CENTRE.md §3.1)
    // ==============================
    let mprRate = 0;
    if (energyGain >= FINANCES_2026.MPR.MIN_ENERGY_GAIN) {
        mprRate =
            energyGain >= FINANCES_2026.MPR.HIGH_PERF_THRESHOLD
                ? FINANCES_2026.MPR.RATE_HIGH_PERF
                : FINANCES_2026.MPR.RATE_STANDARD;
    } else {
        alerts.push("MPR non éligible: gain énergétique < 35%.");
    }

    const mprCeiling = FINANCES_2026.MPR.CEILING_PER_LOT * lots;
    const mprRaw = htAmount * mprRate;
    let mprAmount = Math.min(mprRaw, mprCeiling);
    if (mprRaw > mprCeiling) {
        alerts.push("Attention, plafond MPR atteint.");
    }

    // ==============================
    // 2. CEE (estimation conservatrice)
    //    Assiette = Travaux HT (LE_CENTRE.md §3.1)
    // ==============================
    const ceeRaw = htAmount * FINANCES_2026.CEE.AVG_RATE_WORKS;
    const ceeCeiling = FINANCES_2026.CEE.MAX_PER_LOT * lots;
    const ceeAmount = Math.min(ceeRaw, ceeCeiling);
    if (ceeRaw > ceeCeiling) {
        alerts.push("Plafond CEE atteint (max 5 000€ par lot).");
    }

    // ==============================
    // 2b. ECRETEMENT 80% TTC (Regle d'or)
    //     Le cumul des aides ne peut pas depasser 80% du TTC
    // ==============================
    const { mprCapped, cappingApplied } = applyCapping(
        mprAmount, ceeAmount, extraSubsidies, ttcAmount, alerts
    );
    mprAmount = mprCapped;

    const totalSubsidies = mprAmount + ceeAmount + extraSubsidies;

    // ==============================
    // 3. Reste a charge (besoin bancaire)
    //    Base = TTC (ce que la copro doit reellement financer)
    // ==============================
    const initialRac = Math.max(0, ttcAmount - totalSubsidies - cashInput);
    if (totalSubsidies + cashInput > ttcAmount) {
        alerts.push("Subventions + apport supérieurs au TTC: RAC ramené à 0.");
    }
    if (cashInput > 0) {
        alerts.push("Apport cash déduit du reste à financer.");
    }

    // ==============================
    // 4. Eco-PTZ (pret collectif)
    // ==============================
    const ecoPtzCapPerLot =
        energyGain >= FINANCES_2026.MPR.MIN_ENERGY_GAIN
            ? FINANCES_2026.LOAN.ECO_PTZ_MAX_PER_LOT
            : FINANCES_2026.LOAN.ECO_PTZ_MAX_PER_LOT_STANDARD;
    const ecoPtzCapTotal = ecoPtzCapPerLot * lots;
    const loanAmount = Math.min(initialRac, ecoPtzCapTotal);

    if (loanAmount < initialRac) {
        alerts.push("Prêt Éco-PTZ plafonné: un apport cash est requis.");
    }

    if (ecoPtzCapPerLot === FINANCES_2026.LOAN.ECO_PTZ_MAX_PER_LOT_STANDARD) {
        alerts.push("Plafond Éco-PTZ limité à 30 000€/lot (gain énergétique < 35%).");
    }

    const cashDownPayment = Math.max(0, initialRac - loanAmount);
    const monthlyLoanPayment = calculateMonthlyPayment(
        loanAmount,
        FINANCES_2026.LOAN.RATE_ECO_PTZ,
        FINANCES_2026.LOAN.ECO_PTZ_DURATION_MONTHS
    );

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
                ? 0.12
                : energyGain >= FINANCES_2026.MPR.MIN_ENERGY_GAIN
                    ? 0.08
                    : 0;
        greenValueIncrease = totalPropertyValue * greenRate;
    } else if (energyGain >= FINANCES_2026.MPR.MIN_ENERGY_GAIN) {
        alerts.push("Valeur verte non calculable: surface/prix m² manquants.");
    }

    return {
        subsidies: {
            mpr: roundEuro(mprAmount),
            cee: roundEuro(ceeAmount),
            total: roundEuro(totalSubsidies),
            cappingApplied,
        },
        financing: {
            initialRac: roundEuro(initialRac),
            loanAmount: roundEuro(loanAmount),
            cashDownPayment: roundEuro(cashDownPayment),
            monthlyLoanPayment: roundEuro(monthlyLoanPayment),
        },
        kpi: {
            monthlyEnergySavings: roundEuro(monthlyEnergySavings),
            netMonthlyCashFlow: roundEuro(netMonthlyCashFlow),
            greenValueIncrease: roundEuro(greenValueIncrease),
        },
        alerts,
    };
}
