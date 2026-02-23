import {
    DiagnosticResult,
    DiagnosticResultSchema,
    DiagnosticInput,
    DiagnosticInputSchema,
    DPELetterSchema
} from "@/lib/schemas";
import { generateDiagnostic } from "@/lib/calculator";

// Définition supposée du retour backend (AuditFlashResult)
// Basée sur les instructions de mapping "Le Grand Branchement"
export interface AuditFlashResult {
    // Champs principaux
    valuation_projected: number; // -> valuation.projectedValue
    valuation_current: number; // -> valuation.currentValue
    renovation_cost: number; // -> financing.totalCostHT
    subventions_mpr: number; // -> financing.mprAmount
    energy_gain_percent: number; // -> financing.energyGainPercent

    // Champs input (pour reconstruire DiagnosticInput)
    address: string;
    city: string;
    postal_code: string;
    number_of_units: number;
    surface_habitable: number; // -> input.totalLivingArea / averageUnitSurface
    current_dpe: string;
    target_dpe: string;

    // Champs optionnels ou calculés
    works_cost_ht?: number; // -> financing.worksCostHT
    syndic_fees?: number;
    do_fees?: number;
    contingency_fees?: number;
    local_aid?: number;
    cee_amount?: number;
    eco_ptz_amount?: number;

    // Metadata
    audit_id: string;
    created_at: string;
}

export type AuditInitResponse =
    | { status: 'COMPLETED'; result: AuditFlashResult }
    | { status: 'MANUAL_REQ'; missingFields: string[]; tempId: string }
    | { status: 'ERROR'; message: string };

/**
 * Mappe le résultat du backend (snake_case) vers le format frontend (DiagnosticResult/User-friendly)
 * NOTE: Cette fonction est critique pour l'affichage correct des jauges et cartes.
 */
export function mapBackendToFrontend(backendData: AuditFlashResult): DiagnosticResult {
    // 1. Reconstruction de l'Input
    const input: DiagnosticInput = {
        address: backendData.address,
        postalCode: backendData.postal_code,
        city: backendData.city,
        // Estimation surface moyenne si non fournie explicitement par lot
        averageUnitSurface: backendData.surface_habitable / backendData.number_of_units,
        numberOfUnits: backendData.number_of_units,
        currentDPE: DPELetterSchema.parse(backendData.current_dpe),
        targetDPE: DPELetterSchema.parse(backendData.target_dpe),
        // Valeurs par défaut ou mappées
        estimatedCostHT: backendData.renovation_cost, // Simplification pour l'input
        localAidAmount: backendData.local_aid || 0,
        ceeBonus: backendData.cee_amount || 0,
        alurFund: 0, // Valeur par défaut manquante
        commercialLots: 0,
        averagePricePerSqm: 0, // Sera recalculé ou override
        priceSource: "Audit Flash",
        currentEnergyBill: 0,
        investorRatio: 30, // Défaut
        includeHonoraires: true,
        isCostTTC: true,
        devisValide: false,
        revenusFonciersExistants: 0,
        montantTravauxAmeliorationHT: 0,
        statutLot: 'occupant',
        optionLocAvantages: false,
        ecoPtzDuration: 20 // Added for build pass
    };

    // 2. Génération d'une base cohérente via le calculateur existant
    // Cela permet de remplir les trous (inaction cost, monthly calculations...)
    const baseDiagnostic = generateDiagnostic(input);

    // 3. Hydratation avec les valeurs RÉELLES du backend (La Vérité)
    const valuation = {
        ...baseDiagnostic.valuation,
        currentValue: backendData.valuation_current,
        projectedValue: backendData.valuation_projected,
        greenValueGain: backendData.valuation_projected - backendData.valuation_current,
        greenValueGainPercent: ((backendData.valuation_projected - backendData.valuation_current) / backendData.valuation_current) * 100,
        netROI: (backendData.valuation_projected - backendData.valuation_current) - (baseDiagnostic.financing.remainingCost || 0) // Approximation
    };

    const financing = {
        ...baseDiagnostic.financing,
        totalCostHT: backendData.renovation_cost,
        worksCostHT: backendData.works_cost_ht || (backendData.renovation_cost * 0.85), // Fallback si non séparé
        mprAmount: backendData.subventions_mpr,
        energyGainPercent: backendData.energy_gain_percent || baseDiagnostic.financing.energyGainPercent,
        // Recalcul des dépendants si nécessaire, sinon on garde ceux du calculateur FE
    };

    return {
        ...baseDiagnostic,
        valuation,
        financing
    };
}

/**
 * Appelle l'API /api/audit/init
 */
export async function initAudit(address: string): Promise<AuditInitResponse> {
    try {
        const response = await fetch('/api/audit/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });

        if (!response.ok) {
            throw new Error(`Erreur serveur: ${response.status}`);
        }

        const data = await response.json();
        return data; // Le backend renvoie déjà { status: 'COMPLETED' | 'MANUAL_REQ', ... }
    } catch (error) {
        console.error("Erreur initAudit:", error);
        return { status: 'ERROR', message: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}

/**
 * Appelle l'API /api/audit/complete (Plan B)
 */
export async function completeAudit(tempId: string, missingData: Record<string, any>): Promise<AuditInitResponse> {
    try {
        const response = await fetch('/api/audit/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempId, data: missingData })
        });

        if (!response.ok) {
            throw new Error(`Erreur serveur: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur completeAudit:", error);
        return { status: 'ERROR', message: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}
