/**
 * Service DPE - Hybride API ADEME + JSON Local
 * 
 * 🎯 AUDIT CONNECTIVITÉ - Phase 1:
 * - Source primaire: API ADEME (temps réel)
 * - Fallback: JSON local dpe-49.json
 * - Stratégie: API first, local backup si indisponible
 */

import { type DPELetter } from "@/lib/constants";
import {
    searchDPEByAddress as searchAdemeByAddress,
    searchDPEByLocation as searchAdemeByLocation,
    type AdemeDPEEntry,
} from "@/lib/api/ademeDpeService";

// =============================================================================
// TYPES
// =============================================================================

export interface DPEEntry {
    id: string;
    dpe: DPELetter;
    ges: string;
    conso: number;
    annee: number;
    surface: number;
    date: string;
    adresse: string;
    /** 🆕 Source de la donnée */
    source?: "ademe_api" | "local_json";
    /** 🆕 Date de récupération */
    fetchedAt?: string;
}

export interface APIAddressResult {
    address: string;
    postalCode: string;
    city: string;
    cityCode?: string;
    coordinates?: {
        longitude: number;
        latitude: number;
    };
    sourceType: 'api';
    score?: number;
}

export interface HybridSearchResult {
    address: string;
    postalCode: string;
    city: string;
    cityCode?: string;
    coordinates?: {
        longitude: number;
        latitude: number;
    };
    sourceType: 'local' | 'api' | 'ademe_api';
    dpeData?: DPEEntry;
    score?: number;
}

export interface DecennaleStatus {
    isActive: boolean;
    anneeConstruction: number;
    expirationYear: number;
    yearsRemaining: number;
    buildingAge: number;
    urgencyLevel: 'critical' | 'warning' | 'info';
}

export interface QuarterlyStats {
    averageConso: number;
    targetConso: number;
    percentDiff: number;
    sampleSize: number;
    isAboveAverage: boolean;
    estimatedYearlyCost: number;
    averageYearlyCost: number;
    potentialSavings: number;
    source: 'quartier' | 'all_database' | 'ademe_api';
}

export interface DPESearchOptions {
    /** Priorité API ADEME (défaut: true) */
    preferLiveData?: boolean;
    /** Forcer l'utilisation du JSON local */
    forceLocal?: boolean;
    /** Rayon de recherche pour l'API géo (mètres, défaut: 500) */
    searchRadius?: number;
}

// =============================================================================
// CACHE
// =============================================================================

let cachedLocalData: DPEEntry[] | null = null;
let cachedAdemeData: Map<string, AdemeDPEEntry[]> = new Map();

// =============================================================================
// PRIVATE FUNCTIONS
// =============================================================================

/**
 * Convertit une entrée ADEME au format local DPEEntry
 */
function ademeToLocalEntry(ademeEntry: AdemeDPEEntry): DPEEntry {
    return {
        id: ademeEntry.numero_dpe,
        dpe: ademeEntry.etiquette_dpe,
        ges: ademeEntry.etiquette_ges,
        conso: Math.round(ademeEntry.consommation_energie_finale),
        annee: ademeEntry.annee_construction || 0,
        surface: Math.round(ademeEntry.surface_habitable),
        date: ademeEntry.date_etablissement_dpe,
        adresse: ademeEntry.adresse_brute,
        source: "ademe_api",
        fetchedAt: new Date().toISOString(),
    };
}

/**
 * Récupère les données DPE locales (JSON)
 */
async function fetchLocalData(): Promise<DPEEntry[]> {
    if (cachedLocalData) return cachedLocalData;

    try {
        const response = await fetch("/data/dpe-49.json");
        if (!response.ok) {
            throw new Error("Failed to fetch DPE data");
        }
        const data: DPEEntry[] = await response.json();
        
        // Taguer la source
        const taggedData = data.map(entry => ({
            ...entry,
            source: "local_json" as const,
        }));
        
        cachedLocalData = taggedData;
        return taggedData;
    } catch (error) {
        console.error("Error loading local DPE data:", error);
        return [];
    }
}

/**
 * Recherche via API ADEME (temps réel)
 */
async function searchAdemeAPI(
    query: string,
    options?: { codePostal?: string; limit?: number }
): Promise<DPEEntry[]> {
    try {
        // Essayer d'abord la recherche par adresse
        const addressResult = await searchAdemeByAddress({
            query,
            codePostal: options?.codePostal,
            limit: options?.limit ?? 10,
        });

        if (addressResult.success && addressResult.data.length > 0) {
            return addressResult.data.map(ademeToLocalEntry);
        }

        return [];
    } catch (error) {
        console.warn("API ADEME search failed:", error);
        return [];
    }
}

/**
 * Recherche via API ADEME par coordonnées
 */
async function searchAdemeByCoords(
    lat: number,
    lon: number,
    radius: number = 500
): Promise<DPEEntry[]> {
    try {
        const result = await searchAdemeByLocation({
            latitude: lat,
            longitude: lon,
            radius,
            limit: 20,
        });

        if (result.success && result.data.length > 0) {
            return result.data.map(ademeToLocalEntry);
        }

        return [];
    } catch (error) {
        console.warn("API ADEME geo search failed:", error);
        return [];
    }
}

/**
 * Calcule la distance de Levenshtein
 */
function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    const firstRow = matrix[0];
    if (firstRow) {
        for (let j = 0; j <= a.length; j++) {
            firstRow[j] = j;
        }
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
            const currentRow = matrix[i];
            const prevRow = matrix[i - 1];
            if (currentRow && prevRow) {
                const substitution = (prevRow[j - 1] ?? Infinity) + cost;
                const insertion = (currentRow[j - 1] ?? Infinity) + 1;
                const deletion = (prevRow[j] ?? Infinity) + 1;
                currentRow[j] = Math.min(substitution, insertion, deletion);
            }
        }
    }

    return matrix[b.length]?.[a.length] ?? Infinity;
}

// =============================================================================
// PUBLIC API
// =============================================================================

export const dpeService = {
    // ========================================================================
    // Données Locales (Legacy - gardé pour fallback)
    // ========================================================================

    /**
     * Récupère les données DPE locales (JSON)
     * @deprecated Utiliser search() pour bénéficier de l'API ADEME
     */
    async fetchData(): Promise<DPEEntry[]> {
        return fetchLocalData();
    },

    /**
     * Recherche locale uniquement (JSON)
     * @deprecated Utiliser search() pour bénéficier de l'API ADEME
     */
    async searchLocal(query: string, limit = 5): Promise<DPEEntry[]> {
        if (!query || query.length < 3) return [];

        const data = await fetchLocalData();
        const normalizedQuery = query.toLowerCase().trim();

        // 1. Exact match
        const exactMatches = data.filter(item =>
            item.adresse.toLowerCase().includes(normalizedQuery)
        );

        if (exactMatches.length >= limit) {
            return exactMatches.slice(0, limit);
        }

        // 2. Fuzzy match
        const fuzzyMatches = data
            .map(item => {
                const normalizedAddress = item.adresse.toLowerCase();
                const distance = levenshteinDistance(normalizedQuery, normalizedAddress);
                return { item, distance };
            })
            .filter(result => result.distance <= Math.max(3, normalizedQuery.length * 0.4))
            .sort((a, b) => a.distance - b.distance)
            .map(result => result.item);

        const uniqueResults = new Set([...exactMatches, ...fuzzyMatches]);
        return Array.from(uniqueResults).slice(0, limit);
    },

    // ========================================================================
    // 🆕 NOUVELLE API - Hybride ADEME + Local
    // ========================================================================

    /**
     * 🎯 RECHERCHE INTELLIGENTE
     * 
     * Stratégie:
     * 1. Essaye l'API ADEME d'abord (temps réel)
     * 2. Si échec ou pas de résultats → fallback JSON local
     * 3. Fusionne et déduplique les résultats
     * 
     * @param query - Texte de recherche (adresse, rue, etc.)
     * @param limit - Nombre max de résultats
     * @param options - Options de recherche
     */
    async search(
        query: string, 
        limit = 5, 
        options?: DPESearchOptions
    ): Promise<DPEEntry[]> {
        if (!query || query.length < 3) return [];

        const { preferLiveData = true, forceLocal = false } = options || {};

        // Mode local forcé (utile pour tests ou offline)
        if (forceLocal) {
            return this.searchLocal(query, limit);
        }

        let results: DPEEntry[] = [];

        // 1. Essayer l'API ADEME si activée
        if (preferLiveData) {
            try {
                const ademeResults = await searchAdemeAPI(query, { limit: limit * 2 });
                results = [...results, ...ademeResults];
            } catch (error) {
                console.warn("ADEME API failed, using local fallback:", error);
            }
        }

        // 2. Compléter avec le JSON local si besoin
        if (results.length < limit) {
            const localResults = await this.searchLocal(query, limit);
            
            // Dédupliquer par ID
            const existingIds = new Set(results.map(r => r.id));
            const uniqueLocal = localResults.filter(r => !existingIds.has(r.id));
            
            results = [...results, ...uniqueLocal];
        }

        return results.slice(0, limit);
    },

    /**
     * 🎯 RECHERCHE PAR COORDONNÉES GÉOGRAPHIQUES
     * 
     * Utilise l'API ADEME pour trouver les DPE autour d'un point GPS
     * Fallback sur recherche par code postal dans le JSON local
     * 
     * @param lat - Latitude
     * @param lon - Longitude
     * @param options - Options de recherche
     */
    async searchByLocation(
        lat: number,
        lon: number,
        options?: DPESearchOptions & { postalCode?: string }
    ): Promise<DPEEntry[]> {
        const { preferLiveData = true, forceLocal = false, searchRadius = 500, postalCode } = options || {};
        const limit = 10;

        // Mode local forcé
        if (forceLocal && postalCode) {
            const localData = await fetchLocalData();
            return localData
                .filter(item => item.adresse.includes(postalCode))
                .slice(0, limit);
        }

        // 1. Essayer l'API ADEME par coordonnées
        if (preferLiveData) {
            try {
                const ademeResults = await searchAdemeByCoords(lat, lon, searchRadius);
                if (ademeResults.length > 0) {
                    return ademeResults.slice(0, limit);
                }
            } catch (error) {
                console.warn("ADEME geo search failed:", error);
            }
        }

        // 2. Fallback: recherche par code postal dans le JSON local
        if (postalCode) {
            const localData = await fetchLocalData();
            return localData
                .filter(item => item.adresse.includes(postalCode))
                .slice(0, limit);
        }

        return [];
    },

    /**
     * 🎯 ENRICHISSEMENT COMPLET
     * 
     * Pour une adresse donnée, retourne:
     * - Le DPE le plus récent
     * - Les statistiques de consommation du quartier
     * - La comparaison avec la moyenne
     * 
     * @param address - Adresse complète
     * @param options - Options d'enrichissement
     */
    async enrichAddress(
        address: string,
        options?: DPESearchOptions & { 
            postalCode?: string;
            coordinates?: { lat: number; lon: number };
        }
    ): Promise<{
        dpe: DPEEntry | null;
        similarBuildings: DPEEntry[];
        stats: {
            averageConso: number;
            medianConso: number;
            sampleSize: number;
            predominantClass: DPELetter | null;
        } | null;
        source: "ademe_api" | "local_json" | "none";
    }> {
        const { coordinates, postalCode } = options || {};

        // 1. Chercher les DPE pour cette adresse
        let results: DPEEntry[] = [];
        let source: "ademe_api" | "local_json" | "none" = "none";

        // Priorité 1: Recherche par coordonnées si disponibles
        if (coordinates) {
            results = await this.searchByLocation(
                coordinates.lat, 
                coordinates.lon, 
                { ...options, searchRadius: 200 }
            );
            if (results.length > 0) source = "ademe_api";
        }

        // Priorité 2: Recherche textuelle
        if (results.length === 0) {
            results = await this.search(address, 20, options);
            if (results.length > 0) {
                source = results.some(r => r.source === "ademe_api") 
                    ? "ademe_api" 
                    : "local_json";
            }
        }

        // Priorité 3: Recherche par code postal seul
        if (results.length === 0 && postalCode) {
            const localData = await fetchLocalData();
            results = localData.filter(item => 
                item.adresse.includes(postalCode)
            ).slice(0, 20);
            if (results.length > 0) source = "local_json";
        }

        if (results.length === 0) {
            return {
                dpe: null,
                similarBuildings: [],
                stats: null,
                source: "none",
            };
        }

        // 2. Trier par date (plus récent d'abord)
        const sortedByDate = [...results].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // 3. Calculer les stats
        const consos = results.map(r => r.conso).filter(c => c > 0);
        const sortedConsos = [...consos].sort((a, b) => a - b);
        const medianConso = sortedConsos[Math.floor(sortedConsos.length / 2)] || 0;

        // DPE prédominant
        const classCounts: Record<string, number> = {};
        results.forEach(r => {
            classCounts[r.dpe] = (classCounts[r.dpe] || 0) + 1;
        });
        const predominantClass = Object.entries(classCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] as DPELetter | null;

        return {
            dpe: sortedByDate[0] || null,
            similarBuildings: results,
            stats: {
                averageConso: Math.round(
                    consos.reduce((a, b) => a + b, 0) / consos.length
                ),
                medianConso,
                sampleSize: results.length,
                predominantClass,
            },
            source,
        };
    },

    // ========================================================================
    // API Adresse (BAN) - Conservé pour compatibilité
    // ========================================================================

    async searchAPIGouv(query: string, limit = 3): Promise<APIAddressResult[]> {
        if (!query || query.length < 3) return [];

        try {
            const response = await fetch(
                `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=${limit}`
            );

            if (!response.ok) {
                console.error("API Gouv search failed:", response.status);
                return [];
            }

            const data = await response.json();

            return data.features?.map((feature: { 
                properties: { 
                    label: string; 
                    postcode: string; 
                    city: string; 
                    citycode?: string; 
                    score?: number; 
                    context?: string 
                }; 
                geometry: { coordinates: number[] } 
            }) => ({
                address: feature.properties.label,
                postalCode: feature.properties.postcode,
                city: feature.properties.city,
                cityCode: feature.properties.citycode,
                coordinates: {
                    longitude: feature.geometry.coordinates[0],
                    latitude: feature.geometry.coordinates[1]
                },
                score: feature.properties.score,
                sourceType: 'api' as const
            })) || [];
        } catch (error) {
            console.error("Error fetching from API Gouv:", error);
            return [];
        }
    },

    async hybridSearch(query: string, limit = 5): Promise<HybridSearchResult[]> {
        if (!query || query.length < 3) return [];

        // 🆕 NOUVEAU: Utilise la recherche hybride ADEME + local
        const [dpeResults, apiResults] = await Promise.all([
            this.search(query, 3, { preferLiveData: true }),
            this.searchAPIGouv(query, 3)
        ]);

        // Transformer les résultats DPE
        const dpeHybrid: HybridSearchResult[] = dpeResults.map(entry => {
            const match = entry.adresse.match(/(\d{5})\s*(.+)$/);
            const postalCode = match?.[1] || '49000';
            const city = match?.[2] || entry.adresse.split(' ').pop() || 'Angers';

            return {
                address: entry.adresse,
                postalCode,
                city,
                sourceType: entry.source === "ademe_api" ? 'ademe_api' : 'local',
                dpeData: entry,
                score: 0.9 // Haut score pour les données DPE
            };
        });

        // Transformer les résultats API
        const apiHybrid: HybridSearchResult[] = apiResults.map(result => ({
            ...result,
            sourceType: 'api' as const
        }));

        // Fusion et déduplication
        const resultMap = new Map<string, HybridSearchResult>();
        dpeHybrid.forEach(item => resultMap.set(item.address, item));
        apiHybrid.forEach(item => {
            if (!resultMap.has(item.address)) {
                resultMap.set(item.address, item);
            }
        });

        const combined = Array.from(resultMap.values());

        // Tri par pertinence
        combined.sort((a, b) => {
            const queryNum = query.trim().match(/^(\d+)/)?.[1];

            if (queryNum) {
                const aNum = a.address.trim().match(/^(\d+)/)?.[1];
                const bNum = b.address.trim().match(/^(\d+)/)?.[1];

                const aExact = aNum === queryNum;
                const bExact = bNum === queryNum;

                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
            }

            const scoreA = a.score || 0;
            const scoreB = b.score || 0;

            return scoreB - scoreA;
        });

        return combined;
    },

    // ========================================================================
    // Utilitaires
    // ========================================================================

    checkDecennale(anneeConstruction: number): DecennaleStatus {
        const currentYear = new Date().getFullYear();
        const buildingAge = currentYear - anneeConstruction;
        const isActive = buildingAge <= 10;
        const expirationYear = anneeConstruction + 10;
        const yearsRemaining = Math.max(0, expirationYear - currentYear);

        return {
            isActive,
            anneeConstruction,
            expirationYear,
            yearsRemaining,
            buildingAge,
            urgencyLevel: yearsRemaining <= 2 ? 'critical' : yearsRemaining <= 5 ? 'warning' : 'info'
        };
    },

    async getQuarterlyStats(postalCode: string, targetConso: number): Promise<QuarterlyStats> {
        // 🆕 AMÉLIORATION: Essayer d'abord l'API ADEME pour les stats de quartier
        try {
            const ademeResults = await searchAdemeAPI("", { 
                codePostal: postalCode, 
                limit: 100 
            });
            
            if (ademeResults.length >= 5) {
                const consos = ademeResults.map(r => r.conso).filter(c => c > 0);
                const avgConso = consos.reduce((a, b) => a + b, 0) / consos.length;
                
                return {
                    averageConso: avgConso,
                    targetConso,
                    percentDiff: ((targetConso - avgConso) / avgConso) * 100,
                    sampleSize: ademeResults.length,
                    isAboveAverage: targetConso > avgConso,
                    estimatedYearlyCost: targetConso * 100 * 0.25,
                    averageYearlyCost: avgConso * 100 * 0.25,
                    potentialSavings: Math.max(0, (targetConso - avgConso) * 100 * 0.25),
                    source: 'ademe_api'
                };
            }
        } catch (error) {
            console.warn("ADEME stats failed, using local fallback:", error);
        }

        // Fallback JSON local
        const data = await fetchLocalData();
        const quartierBuildings = data.filter(b =>
            b.adresse.includes(postalCode) ||
            b.adresse.toLowerCase().includes(postalCode.toLowerCase())
        );

        if (quartierBuildings.length === 0) {
            const allAvg = data.reduce((sum, b) => sum + b.conso, 0) / data.length;
            return {
                averageConso: allAvg,
                targetConso,
                percentDiff: ((targetConso - allAvg) / allAvg) * 100,
                sampleSize: data.length,
                isAboveAverage: targetConso > allAvg,
                estimatedYearlyCost: targetConso * 100 * 0.25,
                averageYearlyCost: allAvg * 100 * 0.25,
                potentialSavings: Math.max(0, (targetConso - allAvg) * 100 * 0.25),
                source: 'all_database'
            };
        }

        const avgConso = quartierBuildings.reduce((sum, b) => sum + b.conso, 0) / quartierBuildings.length;

        return {
            averageConso: avgConso,
            targetConso,
            percentDiff: ((targetConso - avgConso) / avgConso) * 100,
            sampleSize: quartierBuildings.length,
            isAboveAverage: targetConso > avgConso,
            estimatedYearlyCost: targetConso * 100 * 0.25,
            averageYearlyCost: avgConso * 100 * 0.25,
            potentialSavings: Math.max(0, (targetConso - avgConso) * 100 * 0.25),
            source: 'quartier'
        };
    },

    /**
     * 🆕 Vérifie si l'API ADEME est disponible
     */
    async checkAdemeAPIStatus(): Promise<boolean> {
        try {
            const { checkAdemeAPIStatus } = await import("@/lib/api/ademeDpeService");
            return await checkAdemeAPIStatus();
        } catch {
            return false;
        }
    },

    /**
     * 🆕 Invalide le cache local
     */
    invalidateCache(): void {
        cachedLocalData = null;
        cachedAdemeData.clear();
    },
};

// Export des types pour rétrocompatibilité
export type { AdemeDPEEntry };
