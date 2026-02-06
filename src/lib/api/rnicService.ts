/**
 * Service RNIC (Registre National des Copropriétés)
 * 
 * 🎯 AUDIT CONNECTIVITÉ - Phase 3:
 * Objectif: Récupérer automatiquement les données des copropriétés
 * (nombre de lots, syndic, etc.) à partir d'une adresse.
 * 
 * ⚠️ COMPLEXITÉ: Il n'existe pas d'API ouverte et gratuite du RNIC.
 * Les données sont disponibles sur data.gouv.fr en CSV mais volumineuses.
 * 
 * STRATÉGIES IMPLEMENTÉES:
 * 1. Supabase (recommandé): Données importées dans la table coproperty_data
 * 2. API Entreprise (fallback): Si vous avez une habilitation
 * 3. Sirene API (fallback): Recherche par NAF des syndics
 * 4. Saisie manuelle (fallback actuel): Conservé si tout échoue
 */

import type { APIResult, EnrichmentSource, APIError } from "./types";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Données d'une copropriété (format RNIC simplifié)
 */
export interface CopropertyData {
    /** Identifiant unique */
    id: string;

    // Adresse
    address: string;
    postalCode: string;
    city: string;
    cityCode: string; // Code INSEE

    // Identification
    name?: string | undefined; // Nom de la résidence/copro
    referenceCadastrale?: string | undefined;

    // Données clés RNIC
    numberOfUnits: number; // Nombre total de lots
    commercialLots?: number | undefined; // Locaux commerciaux
    residentialLots?: number | undefined; // Lots d'habitation
    parkingLots?: number | undefined; // Stationnements

    // Syndic
    syndicName?: string | undefined;
    syndicSiret?: string | undefined;

    // Caractéristiques
    constructionYear?: number | undefined;
    totalSurface?: number | undefined; // Surface totale en m²
    numberOfFloors?: number | undefined;
    hasElevator?: boolean | undefined;
    hasParking?: boolean | undefined;

    // Métadonnées
    source: "rnic" | "supabase" | "api_entreprise" | "user" | "estimated";
    confidence: "high" | "medium" | "low";
    fetchedAt: Date;
    lastUpdated?: Date | undefined;
}

/**
 * Options de recherche
 */
export interface RNICSearchOptions {
    /** Recherche exacte par adresse normalisée */
    exactAddress?: string | undefined;
    /** Recherche par code postal */
    postalCode?: string | undefined;
    /** Recherche par code INSEE */
    cityCode?: string | undefined;
    /** Rayon de recherche en mètres (si coordonnées disponibles) */
    radius?: number | undefined;
}

/**
 * Résultat d'enrichissement
 */
export interface RNICEnrichmentResult {
    coproperty: CopropertyData | null;
    suggestions: CopropertyData[];
    source: EnrichmentSource;
    errors: string[];
}

// =============================================================================
// STRATÉGIE 1: SUPABASE (Recommandé)
// =============================================================================

/**
 * Recherche dans Supabase (données RNIC importées)
 * C'est la méthode la plus rapide et fiable.
 * 
 * PRÉREQUIS: Importer le CSV RNIC dans la table coproperty_data
 * (voir migration SQL 003_coproperty_data.sql)
 */
async function searchSupabase(
    address: string,
    options?: RNICSearchOptions
): Promise<APIResult<CopropertyData[]>> {
    try {
        const { createClient } = await import("@supabase/supabase-js");

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase non configuré");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Recherche par adresse (fuzzy match avec ilike)
        const { data, error } = await supabase
            .from('coproperty_data')
            .select('*')
            .ilike('address', `%${address}%`)
            .limit(5);

        if (error) {
            throw error;
        }

        const results: CopropertyData[] = (data || []).map(item => ({
            id: item.id,
            address: item.address,
            postalCode: item.postal_code,
            city: item.city,
            cityCode: item.city_code,
            name: item.name,
            referenceCadastrale: item.reference_cadastrale,
            numberOfUnits: item.number_of_units,
            commercialLots: item.commercial_lots,
            residentialLots: item.residential_lots,
            parkingLots: item.parking_lots,
            syndicName: item.syndic_name,
            syndicSiret: item.syndic_siret,
            constructionYear: item.construction_year,
            totalSurface: item.total_surface,
            numberOfFloors: item.number_of_floors,
            hasElevator: item.has_elevator,
            hasParking: item.has_parking,
            source: "supabase",
            confidence: item.is_verified ? "high" : "medium",
            fetchedAt: new Date(),
            lastUpdated: item.updated_at ? new Date(item.updated_at) : undefined,
        }));

        const source: EnrichmentSource = {
            name: "RNIC Supabase",
            url: "https://data.gouv.fr/fr/datasets/registre-national-des-coproprietes/",
            fetchedAt: new Date(),
            status: results.length > 0 ? "success" : "partial",
            dataPoints: results.length > 0
                ? ["number_of_units", "syndic", "construction_year"]
                : [],
        };

        return {
            success: true,
            data: results,
            source,
        };
    } catch (error) {
        const apiError: APIError = {
            name: "APIError",
            code: "RNIC_SUPABASE_SEARCH_FAILED",
            message: error instanceof Error ? error.message : "Erreur inconnue",
            source: "RNIC Supabase",
        };

        return {
            success: false,
            error: apiError,
        };
    }
}

// =============================================================================
// STRATÉGIE 2: API ENTREPRISE (Fallback - Nécessite habilitation)
// =============================================================================

/**
 * Recherche via API Entreprise (si habilitation)
 * Permet de récupérer les infos du syndic via SIRET.
 * 
 * DOC: https://api.gouv.fr/les-api/api-entreprise
 * HABILITATION: Nécessite une demande sur api.gouv.fr
 */
async function searchApiEntreprise(
    siret: string
): Promise<APIResult<Partial<CopropertyData>>> {
    // Cette fonction est un placeholder
    // Elle nécessite une clé API Entreprise (non publique)

    const apiError: APIError = {
        name: "APIError",
        code: "RNIC_API_ENTREPRISE_NOT_CONFIGURED",
        message: "API Entreprise non configurée. Nécessite une habilitation.",
        source: "API Entreprise",
    };

    return {
        success: false,
        error: apiError,
    };
}

// =============================================================================
// STRATÉGIE 3: API SIRENE (Fallback - Recherche syndics)
// =============================================================================

/**
 * Recherche les syndics de copropriété via API Sirene
 * Code NAF: 94.99Z (Autres organisations fonctionnant par adhésion volontaire)
 * ou recherche par mot-clé "syndic" + "copropriété"
 * 
 * DOC: https://api.insee.fr/catalogue/site/themes/wso2/subthemes/insee/pages/item-info.jag?name=Sirene&version=V3&provider=insee
 */
async function searchSyndicsNearby(
    cityCode: string
): Promise<APIResult<Array<{ name: string; siret: string; address: string }>>> {
    try {
        // Note: L'API Sirene nécessite une clé (gratuite sur api.insee.fr)
        const INSEE_API_KEY = process.env.INSEE_API_KEY;

        if (!INSEE_API_KEY) {
            throw new Error("Clé API INSEE non configurée");
        }

        // Recherche par code NAF et localisation
        const response = await fetch(
            `https://api.insee.fr/entreprises/sirene/V3/siret?q=codeActivitePrincipaleEtablissement:94.99Z AND codeCommuneEtablissement:${cityCode}`,
            {
                headers: {
                    "Accept": "application/json",
                    "X-INSEE-Api-Key-Integration": INSEE_API_KEY,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Mapper les résultats
        const syndics = (data.etablissements || []).map((etab: any) => ({
            name: String(etab.uniteLegale?.denominationUniteLegale || "Nom inconnu"),
            siret: String(etab.siret || ""),
            address: `${etab.adresseEtablissement?.numeroVoieEtablissement || ""} ${etab.adresseEtablissement?.typeVoieEtablissement || ""} ${etab.adresseEtablissement?.libelleVoieEtablissement || ""}, ${etab.adresseEtablissement?.codePostalEtablissement || ""} ${etab.adresseEtablissement?.libelleCommuneEtablissement || ""}`.trim(),
        }));

        const source: EnrichmentSource = {
            name: "API Sirene (Syndics)",
            url: "https://api.insee.fr",
            fetchedAt: new Date(),
            status: syndics.length > 0 ? "success" : "partial",
            dataPoints: syndics.length > 0 ? ["syndic_name", "siret", "address"] : [],
        };

        return {
            success: true,
            data: syndics,
            source,
        };
    } catch (error) {
        const apiError: APIError = {
            name: "APIError",
            code: "RNIC_SIRENE_SEARCH_FAILED",
            message: error instanceof Error ? error.message : "Erreur inconnue",
            source: "API Sirene",
        };

        return {
            success: false,
            error: apiError,
        };
    }
}

// =============================================================================
// API PUBLIQUE
// =============================================================================

/**
 * 🎯 ENRICHISSEMENT RNIC PRINCIPAL
 * 
 * Stratégie:
 * 1. Cherche dans Supabase (données importées du RNIC)
 * 2. Si pas trouvé, suggère les syndics du quartier (API Sirene)
 * 3. Retourne une structure complète même si partielle
 * 
 * @param address - Adresse de la copropriété
 * @param options - Options de recherche
 */
export async function enrichCoproperty(
    address: string,
    options?: RNICSearchOptions
): Promise<RNICEnrichmentResult> {
    const errors: string[] = [];

    // 1. Essayer Supabase d'abord
    const supabaseResult = await searchSupabase(address, options);

    if (supabaseResult.success && supabaseResult.data.length > 0) {
        return {
            coproperty: supabaseResult.data[0] || null,
            suggestions: supabaseResult.data.slice(1),
            source: supabaseResult.source,
            errors: [],
        };
    }

    if (!supabaseResult.success) {
        errors.push(`Supabase: ${supabaseResult.error.message}`);
    } else {
        errors.push("Aucune copropriété trouvée dans la base locale");
    }

    // 2. Fallback: chercher les syndics du quartier
    if (options?.cityCode) {
        const syndicsResult = await searchSyndicsNearby(options.cityCode);

        if (syndicsResult.success && syndicsResult.data.length > 0) {
            // Créer une entrée partielle avec les syndics trouvés
            const partialData: CopropertyData = {
                id: `temp-${Date.now()}`,
                address,
                postalCode: options.postalCode || "",
                city: "",
                cityCode: options.cityCode,
                numberOfUnits: 0, // Inconnu
                syndicName: syndicsResult.data[0]?.name,
                syndicSiret: syndicsResult.data[0]?.siret,
                source: "estimated",
                confidence: "low",
                fetchedAt: new Date(),
            };

            return {
                coproperty: partialData,
                suggestions: [],
                source: {
                    name: "RNIC Partiel (Syndics)",
                    url: "https://api.insee.fr",
                    fetchedAt: new Date(),
                    status: "partial",
                    dataPoints: ["syndic_suggested"],
                },
                errors: [...errors, "Données copropriété incomplètes - syndic suggéré"],
            };
        }
    }

    // 3. Échec complet - retourner structure vide
    return {
        coproperty: null,
        suggestions: [],
        source: {
            name: "RNIC",
            url: "https://data.gouv.fr",
            fetchedAt: new Date(),
            status: "error",
            dataPoints: [],
        },
        errors: [...errors, "Aucune donnée RNIC disponible - saisie manuelle requise"],
    };
}

/**
 * Recherche simple de copropriétés
 */
export async function searchCoproperty(
    query: string,
    limit = 5
): Promise<APIResult<CopropertyData[]>> {
    // Pour l'instant, seul Supabase est implémenté
    return await searchSupabase(query, { exactAddress: query });
}

/**
 * Récupère une copropriété par ID
 */
export async function getCopropertyById(
    id: string
): Promise<APIResult<CopropertyData | null>> {
    try {
        const { createClient } = await import("@supabase/supabase-js");

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase non configuré");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('coproperty_data')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            return {
                success: true,
                data: null,
                source: {
                    name: "RNIC Supabase",
                    url: "https://data.gouv.fr",
                    fetchedAt: new Date(),
                    status: "partial",
                    dataPoints: [],
                },
            };
        }

        const result: CopropertyData = {
            id: data.id,
            address: data.address,
            postalCode: data.postal_code,
            city: data.city,
            cityCode: data.city_code,
            name: data.name,
            referenceCadastrale: data.reference_cadastrale,
            numberOfUnits: data.number_of_units,
            commercialLots: data.commercial_lots,
            residentialLots: data.residential_lots,
            parkingLots: data.parking_lots,
            syndicName: data.syndic_name,
            syndicSiret: data.syndic_siret,
            constructionYear: data.construction_year,
            totalSurface: data.total_surface,
            numberOfFloors: data.number_of_floors,
            hasElevator: data.has_elevator,
            hasParking: data.has_parking,
            source: "supabase",
            confidence: data.is_verified ? "high" : "medium",
            fetchedAt: new Date(),
            lastUpdated: data.updated_at ? new Date(data.updated_at) : undefined,
        };

        return {
            success: true,
            data: result,
            source: {
                name: "RNIC Supabase",
                url: "https://data.gouv.fr",
                fetchedAt: new Date(),
                status: "success",
                dataPoints: ["number_of_units", "syndic", "construction_year"],
            },
        };
    } catch (error) {
        const apiError: APIError = {
            name: "APIError",
            code: "RNIC_GET_FAILED",
            message: error instanceof Error ? error.message : "Erreur inconnue",
            source: "RNIC Supabase",
        };

        return {
            success: false,
            error: apiError,
        };
    }
}

// =============================================================================
// UTILITAIRES
// =============================================================================

/**
 * Estime le nombre de lots à partir de la surface et du type de bâtiment
 * (Fallback quand les données RNIC ne sont pas disponibles)
 */
export function estimateNumberOfUnits(
    totalSurface: number,
    averageUnitSize: number = 80
): { estimated: number; confidence: "low" | "medium" | "high" } {
    const estimated = Math.round(totalSurface / averageUnitSize);

    return {
        estimated: Math.max(1, estimated),
        confidence: "low",
    };
}

/**
 * Vérifie si Supabase est configuré pour le RNIC
 */
export function isRnicConfigured(): boolean {
    return !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}

/**
 * Retourne le statut des différentes sources RNIC
 */
export async function checkRNICStatus(): Promise<{
    supabase: boolean;
    apiEntreprise: boolean;
    sirene: boolean;
}> {
    const supabaseOk = isRnicConfigured();

    // API Entreprise: toujours false sans habilitation
    const apiEntrepriseOk = false;

    // Sirene: vérifie si clé configurée
    const sireneOk = !!process.env.INSEE_API_KEY;

    return {
        supabase: supabaseOk,
        apiEntreprise: apiEntrepriseOk,
        sirene: sireneOk,
    };
}
