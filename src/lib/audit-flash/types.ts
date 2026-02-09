/**
 * VALO-SYNDIC — Audit Flash Types
 * ================================
 * Types stricts pour le module Audit Flash.
 *
 * DOCTRINE:
 * - Chaque Golden Data porte sa source (api | manual | estimated | fallback)
 * - Le statut est une machine a etats: DRAFT -> READY -> COMPLETED
 * - Le systeme ne ment jamais: si une donnee manque, il le dit.
 */

import type { DPELetter } from "@/lib/constants";
import type { EnrichmentSource } from "@/lib/api/types";

// =============================================================================
// 1. ENUMS & LITERALS
// =============================================================================

/** Statut du pipeline Audit Flash */
export type AuditFlashStatus = "DRAFT" | "READY" | "COMPLETED";

/** Origine d'une donnee: prouvee ou declaree */
export type DataOrigin = "api" | "manual" | "estimated" | "fallback";

// =============================================================================
// 2. GOLDEN DATA — La donnee sourcee
// =============================================================================

/** Une donnee accompagnee de sa provenance */
export interface SourcedData<T> {
    value: T | null;
    origin: DataOrigin | null;
    source: string | null;        // Ex: "API Cadastre IGN", "Saisie manuelle"
    confidence: number | null;    // 0.0 a 1.0
}

/** Les 4 Golden Datas requises pour un Audit Flash */
export interface GoldenData {
    /** Surface habitable en m2 */
    surfaceHabitable: SourcedData<number>;
    /** Annee de construction */
    constructionYear: SourcedData<number>;
    /** Classe DPE actuelle (A-G) */
    dpe: SourcedData<DPELetter> & {
        numeroDpe?: string;
        dateEtablissement?: string;
        consommation?: number;        // kWh/m2/an
        ges?: string;                 // Classe GES
    };
    /** Prix au m2 du quartier */
    pricePerSqm: SourcedData<number> & {
        transactionCount?: number;
        dateRange?: { from: string; to: string };
    };
}

// =============================================================================
// 3. INPUT / OUTPUT du endpoint POST /api/audit/init
// =============================================================================

/** Requete d'initialisation d'un Audit Flash */
export interface AuditFlashInitRequest {
    /** L'adresse brute (seul input obligatoire) */
    address: string;
    /** Nombre de lots (optionnel, enrichi via RNIC) */
    numberOfUnits?: number;
    /** DPE cible (defaut: C) */
    targetDPE?: DPELetter;
}

/** Reponse du endpoint /api/audit/init */
export interface AuditFlashInitResponse {
    /** ID unique de l'audit */
    auditId: string;
    /** Statut du pipeline */
    status: AuditFlashStatus;
    /** Adresse normalisee par BAN */
    normalizedAddress: string | null;
    /** Coordonnees GPS */
    coordinates: { latitude: number; longitude: number } | null;
    /** Code postal */
    postalCode: string | null;
    /** Ville */
    city: string | null;
    /** Code INSEE */
    cityCode: string | null;
    /** Les 4 Golden Datas (avec indicateur sourcee/manquante) */
    goldenData: GoldenData;
    /** Champs manquants (si status = DRAFT) */
    missingFields: MissingField[];
    /** Donnees complementaires recuperees */
    enrichment: AuditEnrichment;
    /** Resultat du calcul ValoSyndic (si status = READY ou COMPLETED) */
    computation: AuditComputation | null;
    /** Sources des donnees */
    sources: EnrichmentSource[];
    /** Timestamp */
    createdAt: string;
}

/** Description d'un champ manquant (Plan B) */
export interface MissingField {
    /** Nom du champ */
    field: "surface_habitable" | "construction_year" | "dpe_current" | "price_per_sqm";
    /** Label humain */
    label: string;
    /** Pourquoi il manque */
    reason: string;
    /** Type d'input attendu pour la saisie manuelle */
    inputType: "number" | "select" | "text";
    /** Placeholder/hint */
    placeholder?: string;
    /** Options (pour select) */
    options?: string[];
}

// =============================================================================
// 4. ENRICHMENT — Donnees complementaires
// =============================================================================

export interface AuditEnrichment {
    /** Reference cadastrale */
    cadastreParcelId: string | null;
    /** Surface terrain (cadastre) */
    cadastreSurfaceTerrain: number | null;
    /** Nombre de lots (RNIC) */
    numberOfUnits: number | null;
    /** Type de chauffage */
    heatingSystem: string | null;
}

// =============================================================================
// 5. COMPUTATION — Resultat du moteur ValoSyndic
// =============================================================================

export interface AuditComputation {
    simulation: {
        worksCostHT: number;
        worksCostTTC: number;
        mprAmount: number;
        ceeAmount: number;
        remainingCost: number;
        ecoPtzAmount: number;
        monthlyPayment: number;
        monthlyEnergySavings: number;
        netMonthlyCashFlow: number;
    };
    valuation: {
        currentValue: number;
        projectedValue: number;
        greenValueGain: number;
        greenValuePercent: number;
        netROI: number;
    };
    inactionCost: {
        projectedCost3y: number;
        inflationCost: number;
        valueDepreciation: number;
        total: number;
    };
    compliance: {
        isProhibited: boolean;
        prohibitionDate: string | null;
        urgencyLevel: "low" | "medium" | "high" | "critical";
        statusLabel: string;
    };
}

// =============================================================================
// 6. REQUEST pour completer les donnees manquantes (Plan B - Step 2)
// =============================================================================

/** Requete de completion manuelle */
export interface AuditFlashCompleteRequest {
    auditId: string;
    /** Donnees fournies manuellement */
    manualData: {
        surfaceHabitable?: number;
        constructionYear?: number;
        dpeCurrent?: DPELetter;
        pricePerSqm?: number;
        numberOfUnits?: number;
    };
}

// =============================================================================
// 7. API HUNT RESULTS — Resultats bruts de la chasse aux donnees
// =============================================================================

/** Resultat d'un tir API individuel */
export interface APIHuntResult {
    source: string;
    status: "success" | "partial" | "error" | "timeout";
    fetchedAt: string;
    durationMs: number;
    data: Record<string, unknown> | null;
    error?: string;
}

/** Resultat global de la chasse (tir de barrage) */
export interface HuntResults {
    ban: APIHuntResult;
    cadastre: APIHuntResult;
    dvf: APIHuntResult;
    ademe: APIHuntResult;
    rnic: APIHuntResult;
}
