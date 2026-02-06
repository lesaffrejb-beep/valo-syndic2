/**
 * VALO-SYNDIC — Mocks & Simulation Data
 * =====================================
 * Données fictives et utilitaires de simulation pour le développement/démo.
 * NE PAS UTILISER en production pour des calculs réels.
 */

import { DPELetter } from "./constants";
import { BuildingAuditResult, calculateComplianceStatus, estimateDPEByYear as calcEstimateDPE, formatDate } from "./calculator";

export const ANGERS_CENTER = { lat: 47.47, lng: -0.55 };

/**
 * Génère des coordonnées aléatoires autour d'un point central.
 * @param center - Point central {lat, lng}
 * @param spread - Dispersion (défaut 0.05)
 */
export function generateRandomCoordinates(center = ANGERS_CENTER, spread = 0.05) {
    return [
        center.lat + (Math.random() - 0.5) * spread,
        center.lng + (Math.random() - 0.5) * spread,
    ] as [number, number];
}

/**
 * Estime le DPE probable d'une copropriété en fonction de son année de construction
 */
export function estimateDPEByYear(year: number): DPELetter {
    if (year < 1948) return "G";
    if (year < 1975) return "F";
    if (year < 1982) return "E";
    if (year < 2000) return "D";
    if (year < 2012) return "C";
    if (year < 2020) return "B";
    return "A";
}

/**
 * Traitement par lot de plusieurs bâtiments pour le "God View" (SIMULATION)
 */
export function batchProcessBuildings(buildings: Array<{
    adresse: string;
    lots: number;
    annee: number;
}>): BuildingAuditResult[] {
    return buildings.map((b, index) => {
        const dpe = calcEstimateDPE(b.annee);
        const compliance = calculateComplianceStatus(dpe);
        const coords = generateRandomCoordinates();

        return {
            id: `build-${index}`,
            address: b.adresse,
            numberOfUnits: b.lots,
            constructionYear: b.annee,
            currentDPE: dpe,
            compliance: {
                status: compliance.statusColor as "danger" | "warning" | "success",
                label: compliance.statusLabel,
                ...(compliance.prohibitionDate ? { deadline: formatDate(compliance.prohibitionDate) } : {})
            },
            coordinates: coords
        };
    });
}
