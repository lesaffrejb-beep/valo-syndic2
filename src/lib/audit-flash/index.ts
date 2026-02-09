/**
 * VALO-SYNDIC — Module Audit Flash
 * =================================
 * Point d'entree unique.
 *
 * Usage:
 *   import { initAuditFlash, completeAuditFlash, toSupabaseRow } from "@/lib/audit-flash";
 */

export { initAuditFlash, completeAuditFlash, toSupabaseRow } from "./engine";
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
    AuditFlashRow,
} from "./types";
