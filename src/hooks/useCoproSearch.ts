
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface CoproSearchResult {
    address: string;
    postalCode: string;
    city: string;
    cityCode?: string;
    numberOfLots?: number;
    constructionYear?: number;
    syndicName?: string;
    source: 'rnic';
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    dpeData?: {
        dpe: string;
        surface: number;
    };
}

export function useCoproSearch() {
    const [results, setResults] = useState<CoproSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const searchCopro = useCallback(async (query: string) => {
        if (!query || query.length < 3) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('coproperty_data')
                .select('*')
                .ilike('address', `%${query}%`)
                .limit(5);

            if (error) {
                console.error('Error searching copro data:', error);
                setResults([]);
                return;
            }

            const mappedResults: CoproSearchResult[] = (data || []).map((item: any) => ({
                address: item.address,
                postalCode: item.postal_code,
                city: item.city,
                ...(item.city_code ? { cityCode: item.city_code } : {}),
                ...(item.total_units ? { numberOfLots: Number(item.total_units) } : {}),
                ...(item.construction_year ? { constructionYear: Number(item.construction_year) } : {}),
                ...(item.syndic_name ? { syndicName: item.syndic_name } : {}),
                source: 'rnic',
                ...(item.latitude && item.longitude ? {
                    coordinates: {
                        latitude: item.latitude,
                        longitude: item.longitude
                    }
                } : {}),
                ...(item.dpe_label && item.living_area ? {
                    dpeData: {
                        dpe: item.dpe_label,
                        surface: Number(item.living_area)
                    }
                } : {})
            }));

            setResults(mappedResults);
        } catch (err) {
            console.error('Unexpected error searching copro:', err);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearResults = useCallback(() => {
        setResults([]);
    }, []);

    return {
        results,
        isLoading,
        searchCopro,
        clearResults
    };
}
