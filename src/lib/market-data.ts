import { supabase } from './supabaseClient';
import localData from '@/data/market_data.json';

// --- TYPES ---
export interface BT01Data {
    currentValue: number;
    annualChangePercent: number;
    referenceMonth: string;
    source: string;
}

export interface MarketTrendData {
    national: number;
    idf: number;
    province: number;
    comment: string;
}

export interface PassoiresData {
    shareOfSales: number;
    trendVs2023: number;
    source: string;
}

export interface RegulationData {
    isLdF2026Voted: boolean;
    isMprCoproSuspended: boolean;
    suspensionDate: string;
    comment: string;
    loiSpeciale?: string;
}

export interface MarketData {
    bt01: BT01Data;
    marketTrend: MarketTrendData;
    passoires: PassoiresData;
    regulation: RegulationData;
}

// --- FONCTION ASYNCHRONE (Récupération données dynamiques) ---
export async function fetchMarketData(): Promise<MarketData> {
    try {
        const { data, error } = await supabase
            .from('market_data')
            .select('key, data');

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Empty data');

        // Mapping des données (avec le JSON local comme base par sécurité)
        const result: MarketData = { ...localData } as any;

        data.forEach((row) => {
            if (row.key === 'bt01') result.bt01 = row.data;
            if (row.key === 'market_trend') result.marketTrend = row.data;
            if (row.key === 'passoires') result.passoires = row.data;
            if (row.key === 'regulation') result.regulation = row.data;
        });

        return result;

    } catch (e) {
        console.warn('⚠️ Supabase unreachable, using local fallback.');
        return localData as unknown as MarketData;
    }
}

// --- HELPERS SYNCHRONES (Pour affichage immédiat & Build Fix) ---
// Ces fonctions utilisent le JSON local build-time. 
// Elles sont indispensables car calculator.ts les appelle directement.

export const getLocalBT01Trend = () => localData.bt01.annualChangePercent;
export const getLocalPassoiresShare = () => localData.passoires.shareOfSales;
export const getLocalRegulationStatus = (): RegulationData => localData.regulation;

// 👇 CORRECTION : Ré-export des fonctions manquantes pour le build
export const getMarketTrend = () => localData.marketTrend;

// Note: Si calculator.ts demande aussi getGreenValueGain, on met une valeur par défaut ici
export const getGreenValueGain = () => 0.12;
export const getDataLastUpdate = () => "31/01/2026"; // Date statique pour l'instant
export const isMprCoproSuspended = () => localData.regulation.isMprCoproSuspended;
export const getRegulationStatus = (): RegulationData => localData.regulation;
