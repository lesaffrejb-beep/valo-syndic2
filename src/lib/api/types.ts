/**
 * Types pour les APIs gouvernementales françaises
 * Sources: api.gouv.fr
 */

// ============================================
// API ADRESSE (BAN - Base Adresse Nationale)
// https://api-adresse.data.gouv.fr
// ============================================

export interface AddressFeature {
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: [number, number]; // [longitude, latitude]
    };
    properties: {
        label: string;          // Adresse complète formatée
        score: number;          // Score de confiance (0-1)
        housenumber?: string;   // Numéro de rue
        street?: string;        // Nom de rue
        name?: string;          // Nom du lieu
        postcode: string;       // Code postal
        citycode: string;       // Code INSEE commune
        city: string;           // Nom de la ville
        context: string;        // Département, région
        type: "housenumber" | "street" | "locality" | "municipality";
        importance: number;
    };
}

export interface AddressSearchResponse {
    type: "FeatureCollection";
    version: string;
    features: AddressFeature[];
    attribution: string;
    licence: string;
    query: string;
    limit: number;
}

export interface AddressReverseResponse extends AddressSearchResponse {
    // Même structure que AddressSearchResponse
}

// ============================================
// API CADASTRE (Géoportail)
// https://api.gouv.fr/les-api/api-carto-cadastre
// ============================================

export interface CadastreParcel {
    type: "Feature";
    geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: number[][][];
    };
    properties: {
        id: string;              // Identifiant unique de la parcelle
        commune: string;         // Code INSEE commune
        prefixe: string;         // Préfixe de section
        section: string;         // Section cadastrale
        numero: string;          // Numéro de parcelle
        contenance: number;      // Surface en m² (selon cadastre)
        arpente: boolean;        // Si la parcelle a été arpentée
        created: string;         // Date de création
        updated: string;         // Date de mise à jour
    };
}

export interface CadastreResponse {
    type: "FeatureCollection";
    features: CadastreParcel[];
}

// ============================================
// API DVF (Demandes de Valeurs Foncières)
// https://api.dvf.etalab.gouv.fr
// ============================================

export interface DVFMutation {
    id_mutation: string;
    date_mutation: string;              // Format: YYYY-MM-DD
    nature_mutation: string;            // "Vente", "Vente en l'état futur d'achèvement", etc.
    valeur_fonciere: number;            // Prix de vente en euros
    adresse_numero?: string;
    adresse_suffixe?: string;
    adresse_nom_voie?: string;
    adresse_code_voie?: string;
    code_postal: string;
    code_commune: string;
    nom_commune: string;
    code_departement: string;
    ancien_code_commune?: string;
    ancien_nom_commune?: string;
    id_parcelle: string;
    ancien_id_parcelle?: string;
    numero_volume?: string;
    lot1_numero?: string;
    lot1_surface_carrez?: number;
    lot2_numero?: string;
    lot2_surface_carrez?: number;
    lot3_numero?: string;
    lot3_surface_carrez?: number;
    lot4_numero?: string;
    lot4_surface_carrez?: number;
    lot5_numero?: string;
    lot5_surface_carrez?: number;
    nombre_lots: number;
    code_type_local?: string;           // 1=Maison, 2=Appartement, 3=Dépendance, 4=Local
    type_local?: string;
    surface_reelle_bati?: number;       // Surface en m²
    nombre_pieces_principales?: number;
    code_nature_culture?: string;
    nature_culture?: string;
    code_nature_culture_speciale?: string;
    nature_culture_speciale?: string;
    surface_terrain?: number;
    longitude: number;
    latitude: number;
}

export interface DVFResponse {
    resultats: DVFMutation[];
    total: number;
    page: number;
    nb_resultats: number;
}

// ============================================
// API ADEME - DPE (Observatoire DPE)
// https://data.ademe.fr/datasets/dpe-v2-logements-existants
// Note: API publique mais volumineuse
// ============================================

export interface ADEMEDpe {
    numero_dpe: string;                          // N° ADEME du DPE
    date_etablissement_dpe: string;              // Date du diagnostic
    date_fin_validite_dpe: string;               // Date d'expiration
    etiquette_dpe: "A" | "B" | "C" | "D" | "E" | "F" | "G";
    etiquette_ges: "A" | "B" | "C" | "D" | "E" | "F" | "G";
    consommation_energie: number;                // kWh/m²/an
    emission_ges: number;                        // kg CO2/m²/an
    surface_habitable: number;                   // m²
    annee_construction?: number;
    type_batiment: string;                       // "appartement", "maison"
    code_postal: string;
    commune: string;
    // Coordonnées approximatives (centroïde IRIS)
    latitude?: number;
    longitude?: number;
}

// ============================================
// BDNB (Base de Données Nationale des Bâtiments)
// https://www.data.gouv.fr/fr/datasets/base-de-donnees-nationale-des-batiments/
// Note: Téléchargement bulk, pas d'API REST directe
// ============================================

export interface BDNBBuilding {
    batiment_groupe_id: string;
    code_departement: string;
    code_commune: string;
    adresse_principale: string;
    annee_construction?: number;
    nb_logements?: number;
    surface_habitable?: number;
    hauteur_batiment?: number;
    etiquette_dpe_predominante?: string;
    // Et beaucoup d'autres champs...
}

// ============================================
// Types unifiés pour l'application
// ============================================

export interface EnrichedProperty {
    // Données saisies par l'utilisateur
    address: string;
    postalCode: string;
    city: string;

    // Données enrichies (API Adresse)
    coordinates?: {
        longitude: number;
        latitude: number;
    };
    cityCode?: string;          // Code INSEE
    context?: string;           // "Maine-et-Loire, Pays de la Loire"

    // Données cadastrales (API Cadastre)
    cadastre?: {
        parcelId: string;       // Ex: "49007000AB0123"
        section: string;        // Ex: "AB"
        numero: string;         // Ex: "0123"
        surface: number;        // Surface terrain en m²
        fetchedAt: Date;
    };

    // Données de prix (API DVF)
    marketData?: {
        averagePricePerSqm: number;      // Prix moyen au m² dans le secteur
        transactionCount: number;         // Nombre de ventes analysées
        priceRange: {
            min: number;
            max: number;
        };
        lastTransactionDate: string;
        fetchedAt: Date;
    };

    // Estimation année de construction
    estimatedConstructionYear?: {
        year: number;
        source: "dvf" | "bdnb" | "cadastre" | "user";
        confidence: "high" | "medium" | "low";
    };

    // Métadonnées sur l'enrichissement
    enrichmentSources: EnrichmentSource[];
}

export interface EnrichmentSource {
    name: string;               // "API Adresse", "DVF", etc.
    url: string;                // URL de la source
    fetchedAt: Date;
    status: "success" | "partial" | "error";
    dataPoints: string[];       // Ce qui a été récupéré
}

// ============================================
// Types d'erreur API
// ============================================

export class APIError extends Error {
    constructor(
        public code: string,
        public message: string,
        public source: string,
        public httpStatus?: number
    ) {
        super(message);
        this.name = "APIError";
    }
}

export type APIResult<T> =
    | { success: true; data: T; source: EnrichmentSource }
    | { success: false; error: APIError };
