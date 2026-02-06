"use server";

interface RealEstateData {
    averagePriceSqm: number;
    salesCount: number;
    period: string;
}

interface DvfMutationsResponse {
    features: Array<{
        properties: {
            date_mutation: string;
            nature_mutation: string;
            type_local: string;
            valeur_fonciere: number;
            surface_reelle_bati: number;
            nombre_lots: number;
        };
    }>;
}

export async function getLocalRealEstatePrice(lat: number, lon: number): Promise<RealEstateData | null> {
    const DISTANCE = 500; // 500 meters
    const MIN_PRICE_MD = 1000;
    const MAX_PRICE_MD = 10000;
    const API_URL = "https://api.cquest.org/dvf";

    try {
        // 1. Construct URL params
        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lon.toString(),
            dist: DISTANCE.toString(),
            nature_mutation: "Vente",
            type_local: "Appartement",
        });

        // 2. Fetch data
        const response = await fetch(`${API_URL}?${params.toString()}`, {
            // Revalidate every 24 hours
            next: { revalidate: 86400 },
        });

        if (!response.ok) {
            console.error("DVF API Error:", response.statusText);
            return null;
        }

        const data: DvfMutationsResponse = await response.json();

        if (!data.features || data.features.length === 0) {
            return null;
        }

        // 3. Filter data
        const now = new Date();
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(now.getFullYear() - 3);

        const validSales = data.features.filter((feature) => {
            const props = feature.properties;

            // Check filtering conditions again to be sure (API sometimes returns loose matches)
            if (props.nature_mutation !== "Vente") return false;
            if (props.type_local !== "Appartement") return false;

            // Date filter (last 3 years)
            const saleDate = new Date(props.date_mutation);
            if (saleDate < threeYearsAgo) return false;

            // Data integrity check
            if (!props.valeur_fonciere || !props.surface_reelle_bati || props.surface_reelle_bati <= 0) {
                return false;
            }

            // Calculate Price per Sqm
            const priceSqm = props.valeur_fonciere / props.surface_reelle_bati;

            // Outlier filter
            if (priceSqm < MIN_PRICE_MD || priceSqm > MAX_PRICE_MD) return false;

            return true;
        });

        if (validSales.length === 0) {
            return null;
        }

        // 4. Calculate Average Price/m²
        // "Moyenne : Somme(Valeur Foncière / Surface Réelle) / Nombre de ventes"
        const sumPriceSqm = validSales.reduce((acc, feature) => {
            const p = feature.properties;
            return acc + (p.valeur_fonciere / p.surface_reelle_bati);
        }, 0);

        const averagePriceSqm = Math.round(sumPriceSqm / validSales.length);

        // Determines the period string
        const oldestSale = validSales.reduce((oldest, current) => {
            return current.properties.date_mutation < oldest ? current.properties.date_mutation : oldest;
        }, validSales[0]!.properties.date_mutation);

        const newestSale = validSales.reduce((newest, current) => {
            return current.properties.date_mutation > newest ? current.properties.date_mutation : newest;
        }, validSales[0]!.properties.date_mutation);

        const formatDate = (dateStr: string) => {
            const d = new Date(dateStr);
            return d.toLocaleDateString("fr-FR", { year: "numeric" }); // Just Year for brevity? Or Month/Year?
        }

        // Using year ranges for period string
        const startYear = new Date(oldestSale).getFullYear();
        const endYear = new Date(newestSale).getFullYear();
        const period = startYear === endYear ? `${startYear}` : `${startYear}-${endYear}`;

        return {
            averagePriceSqm,
            salesCount: validSales.length,
            period, // e.g., "2023-2025"
        };

    } catch (error) {
        console.error("Error fetching Real Estate Data:", error);
        return null;
    }
}
