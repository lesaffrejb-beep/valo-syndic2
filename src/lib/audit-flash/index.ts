/**
 * VALO-SYNDIC — Module Audit Flash
 * =================================
 * Point d'entree unique pour le module Audit Flash.
 *
 * Usage:
 *   import { initAuditFlash, completeAuditFlash } from "@/lib/audit-flash";
 *   import type { AuditFlashInitRequest, AuditFlashInitResponse } from "@/lib/audit-flash";
 */

export { initAuditFlash, completeAuditFlash } from "./engine";
export type {
    AuditFlashStatus,
    DataOrigin,
    SourcedData,
    GoldenData,
    AuditFlashInitRequest,
    AuditFlashInitResponse,
    AuditFlashCompleteRequest,
    MissingField,
    AuditEnrichment,
    AuditComputation,
    APIHuntResult,
    HuntResults,
} from "./types";
