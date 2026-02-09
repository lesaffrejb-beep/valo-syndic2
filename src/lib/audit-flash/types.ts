/**
 * VALO-SYNDIC — Audit Flash Types
 * ================================
 * Types stricts pour le module Audit Flash.
 * ALIGNES 1:1 avec les colonnes SQL de reset_and_init.sql.
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

/** Statut du pipeline — SQL: audit_flash_status ENUM */
export type AuditFlashStatus = "DRAFT" | "READY" | "COMPLETED";

/** Origine d'une donnee — SQL: data_origin ENUM */
export type DataOrigin = "api" | "manual" | "estimated" | "fallback";

// =============================================================================
// 2. GOLDEN DATA — La donnee sourcee
// =============================================================================

/** Une donnee accompagnee de sa provenance (mappe vers les colonnes _origin/_source/_confidence) */
export interface SourcedData<T> {
    value: T | null;
    origin: DataOrigin | null;
    source: string | null;
    confidence: number | null;
}

/** Les 4 Golden Datas requises pour un Audit Flash */
export interface GoldenData {
    surfaceHabitable: SourcedData<number>;
    constructionYear: SourcedData<number>;
    dpe: SourcedData<DPELetter> & {
        numeroDpe?: string;
        dateEtablissement?: string;
        consommation?: number;
        ges?: string;
    };
    pricePerSqm: SourcedData<number> & {
        transactionCount?: number;
        dateRange?: { from: string; to: string };
    };
}

// =============================================================================
// 3. INPUT / OUTPUT
// =============================================================================

export interface AuditFlashInitRequest {
    address: string;
    numberOfUnits?: number | undefined;
    targetDPE?: DPELetter | undefined;
}

/** Reponse du endpoint /api/audit/init */
export interface AuditFlashInitResponse {
    auditId: string;
    status: AuditFlashStatus;
    normalizedAddress: string | null;
    coordinates: { latitude: number; longitude: number } | null;
    postalCode: string | null;
    city: string | null;
    cityCode: string | null;
    goldenData: GoldenData;
    missingFields: MissingField[];
    enrichment: AuditEnrichment;
    computation: AuditComputation | null;
    sources: EnrichmentSource[];
    apiResponses: Record<string, APIHuntResult>;
    createdAt: string;
}

export interface MissingField {
    field: "surface_habitable" | "construction_year" | "dpe_current" | "price_per_sqm";
    label: string;
    reason: string;
    inputType: "number" | "select" | "text";
    placeholder?: string;
    options?: string[];
}

// =============================================================================
// 4. ENRICHMENT
// =============================================================================

export interface AuditEnrichment {
    cadastreParcelId: string | null;
    cadastreSurfaceTerrain: number | null;
    numberOfUnits: number | null;
    heatingSystem: string | null;
}

// =============================================================================
// 5. COMPUTATION — Mappe vers la colonne JSONB "computation" en SQL
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
// 6. COMPLETE REQUEST (Plan B Step 2)
// =============================================================================

export interface AuditFlashCompleteRequest {
    auditId: string;
    manualData: {
        surfaceHabitable?: number;
        constructionYear?: number;
        dpeCurrent?: DPELetter;
        pricePerSqm?: number;
        numberOfUnits?: number;
    };
    targetDPE?: DPELetter;
}

// =============================================================================
// 7. API HUNT RESULTS
// =============================================================================

export interface APIHuntResult {
    source: string;
    status: "success" | "partial" | "error" | "timeout";
    fetchedAt: string;
    durationMs: number;
    data: Record<string, unknown> | null;
    error?: string;
}

// =============================================================================
// 8. ROW SUPABASE — Mappe 1:1 avec la table audits_flash
// =============================================================================

export interface AuditFlashRow {
    id: string;
    raw_address: string;
    normalized_address: string | null;
    postal_code: string | null;
    city: string | null;
    city_code: string | null;
    latitude: number | null;
    longitude: number | null;
    status: AuditFlashStatus;
    missing_fields: string[];
    surface_habitable: number | null;
    surface_origin: DataOrigin | null;
    surface_source: string | null;
    surface_confidence: number | null;
    construction_year: number | null;
    construction_year_origin: DataOrigin | null;
    construction_year_source: string | null;
    construction_year_confidence: number | null;
    dpe_current: string | null;
    dpe_origin: DataOrigin | null;
    dpe_source: string | null;
    dpe_numero: string | null;
    dpe_date: string | null;
    dpe_conso: number | null;
    dpe_ges: string | null;
    price_per_sqm: number | null;
    price_origin: DataOrigin | null;
    price_source: string | null;
    price_transaction_count: number | null;
    price_date_range: { from: string; to: string } | null;
    number_of_units: number | null;
    heating_system: string | null;
    cadastre_parcel_id: string | null;
    cadastre_surface_terrain: number | null;
    target_dpe: string;
    computation: AuditComputation | null;
    api_responses: Record<string, APIHuntResult>;
    enrichment_sources: EnrichmentSource[];
    user_id: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}
