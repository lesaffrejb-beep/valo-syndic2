/**
 * VALO-SYNDIC — Service Géorisques
 * =================================
 * Récupération des risques naturels via l'API Open Data du gouvernement
 */

export interface GeoRisk {
    /** Niveau de risque argile (retrait-gonflement) : 0=Nul, 1=Faible, 2=Moyen, 3=Fort */
    argile: number;
    /** Zone inondable identifiée */
    inondation: boolean;
    /** Niveau de radon : 1=Faible, 2=Moyen, 3=Elevé */
    radon: number;
    /** Niveau de sismicité : 1=Très faible, 2=Faible, 3=Modérée, 4=Moyenne, 5=Forte */
    sismicite: number;
    /** Libellé du risque argile */
    argileLabel?: string;

    /** Nouveaux champs pour affichage "Full Data" */
    mouvementTerrain: boolean;
    technologique: boolean;
    minier: boolean;
    feuxForet: boolean;
}

/**
 * Structure d'une entrée de risque dans la réponse Géorisques API v1
 * @see https://georisques.gouv.fr/api/v1
 */
interface GeoRisquesRiskEntry {
    libelle_risque_long?: string;
    num_risque?: number;
    niveau_exposition?: string;
    niveau_exposition_label?: string;
}

interface GeoRisquesApiResponse {
    data?: GeoRisquesRiskEntry[];
}

export const riskService = {
    /**
     * Récupère les risques naturels pour une position GPS donnée
     * API OPEN DATA : https://georisques.gouv.fr/api/v1/gaspar/risques
     */
    async fetchRisks(lat: number, lon: number, retries = 2): Promise<GeoRisk | null> {
        // Timeout de sécurité (8 secondes) pour ne pas bloquer l'app
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch(
                `https://georisques.gouv.fr/api/v1/gaspar/risques?lat=${lat}&long=${lon}`,
                { signal: controller.signal }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Si erreur 500 et qu'il reste des retries, on réessaie
                if (response.status === 500 && retries > 0) {
                    console.warn(`Géorisques API 500, retrying... (${retries} attempts left)`);
                    return this.fetchRisks(lat, lon, retries - 1);
                }

                console.warn(`Géorisques API failed: ${response.status}`);
                return null;
            }

            const data = await response.json();
            return this.normalizeData(data);
        } catch (error) {
            console.error("Erreur fetch risques:", error);
            return null; // On renvoie null pour afficher "Indisponible" au lieu de crasher
        }
    },

    /**
     * Normalise les données de l'API Géorisques
     */
    normalizeData(data: GeoRisquesApiResponse): GeoRisk {
        // Helper to find risk by keyword within the raw data
        const checkRisk = (keyword: string) =>
            data.data?.some((risk: GeoRisquesRiskEntry) =>
                risk.libelle_risque_long?.toLowerCase().includes(keyword)
            );

        // Detailed parsing
        const argileData = data.data?.find((r: GeoRisquesRiskEntry) =>
            r.libelle_risque_long?.toLowerCase().includes('argile'));
        const sismiciteData = data.data?.find((r: GeoRisquesRiskEntry) =>
            r.libelle_risque_long?.toLowerCase().includes('sismi'));
        const radonData = data.data?.find((r: GeoRisquesRiskEntry) =>
            r.libelle_risque_long?.toLowerCase().includes('radon'));

        return {
            // Argiles
            argile: argileData?.num_risque || (argileData?.niveau_exposition === 'Moyen' ? 2 : argileData?.niveau_exposition === 'Fort' ? 3 : 1),
            argileLabel: argileData?.niveau_exposition_label || (argileData ? 'Identifié' : 'Non concerné'),

            // Inondation (tous types : débordement, submersion, remontée nappe)
            inondation: (checkRisk('inondation') ?? false) || (checkRisk('submersion') ?? false),

            // Sismicité
            sismicite: sismiciteData?.num_risque || 1,

            // Radon
            radon: radonData?.num_risque || 1,

            // Autres risques
            mouvementTerrain: (checkRisk('mouvement de terrain') ?? false) || (checkRisk('cavité') ?? false),
            technologique: (checkRisk('industriel') ?? false) || (checkRisk('technologique') ?? false) || (checkRisk('usine') ?? false),
            minier: checkRisk('minier') ?? false,
            feuxForet: (checkRisk('feu de forêt') ?? false) || (checkRisk('feux de forêt') ?? false),
        };
    },

    /**
     * Retourne un objet de risque par défaut (pas de données)
     */
    getDefaultRisk(): GeoRisk {
        return {
            argile: 0,
            inondation: false,
            radon: 0,
            sismicite: 0,
            mouvementTerrain: false,
            technologique: false,
            minier: false,
            feuxForet: false,
            argileLabel: 'Données indisponibles',
        };
    },

    /**
     * Détermine si un risque argile est significatif (>= Moyen)
     */
    hasSignificantArgileRisk(risk: GeoRisk): boolean {
        return risk.argile >= 2;
    },

    /**
     * Retourne le niveau d'urgence global
     */
    getUrgencyLevel(risk: GeoRisk): 'high' | 'medium' | 'low' {
        let score = 0;
        if (risk.inondation) score += 2;
        if (risk.argile >= 2) score += 2;
        if (risk.radon >= 3) score += 1;
        if (risk.sismicite >= 3) score += 1;
        if (risk.technologique) score += 2;

        if (score >= 2) return 'high';
        if (score >= 1) return 'medium';
        return 'low';
    },
};
