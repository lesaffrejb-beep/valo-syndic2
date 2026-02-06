/**
 * VALO-SYNDIC — Regulations Service
 * ==================================
 * Pattern "Provider" pour découpler le moteur de calcul des constantes.
 * En V2, ce service pourra être connecté à Supabase ou un RAG.
 * 
 * // AI DECISION: Architecture Provider pour future scalabilité
 */

import * as staticConstants from '../constants';

// Types exportés
export type RegulationConfig = {
  dpe: typeof staticConstants.DPE_PROHIBITION_DATES;
  dpeStatus: typeof staticConstants.DPE_STATUS_LABELS;
  dpeNumeric: typeof staticConstants.DPE_NUMERIC_VALUE;
  dpeOrder: typeof staticConstants.DPE_ORDER;
  mprCopro: typeof staticConstants.MPR_COPRO;
  ecoPtzCopro: typeof staticConstants.ECO_PTZ_COPRO;
  technical: typeof staticConstants.TECHNICAL_PARAMS;
  legal: typeof staticConstants.LEGAL;
};

// Provider abstrait (pour future implémentation async)
export interface RegulationProvider {
  getRegulations(): Promise<RegulationConfig>;
  getRegulationsSync(): RegulationConfig;
}

/**
 * Provider par défaut : lit les constantes statiques locales
 * En V2, on pourra créer un SupabaseRegulationProvider
 */
class StaticRegulationProvider implements RegulationProvider {
  async getRegulations(): Promise<RegulationConfig> {
    return this.getRegulationsSync();
  }

  getRegulationsSync(): RegulationConfig {
    return {
      dpe: staticConstants.DPE_PROHIBITION_DATES,
      dpeStatus: staticConstants.DPE_STATUS_LABELS,
      dpeNumeric: staticConstants.DPE_NUMERIC_VALUE,
      dpeOrder: staticConstants.DPE_ORDER,
      mprCopro: staticConstants.MPR_COPRO,
      ecoPtzCopro: staticConstants.ECO_PTZ_COPRO,
      technical: staticConstants.TECHNICAL_PARAMS,
      legal: staticConstants.LEGAL,
    };
  }
}

// Instance singleton (peut être remplacée par injection de dépendance)
let currentProvider: RegulationProvider = new StaticRegulationProvider();

/**
 * Fonction principale pour récupérer les réglementations
 * Le moteur de calcul appelle cette fonction au lieu d'importer constants.ts directement
 */
export function getRegulations(): RegulationConfig {
  return currentProvider.getRegulationsSync();
}

export async function getRegulationsAsync(): Promise<RegulationConfig> {
  return currentProvider.getRegulations();
}

/**
 * Permet de changer le provider (utile pour les tests ou future V2)
 */
export function setRegulationProvider(provider: RegulationProvider): void {
  currentProvider = provider;
}

// Export du provider par défaut pour les tests
export { StaticRegulationProvider };
