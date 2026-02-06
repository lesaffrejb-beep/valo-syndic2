/**
 * VALO-SYNDIC — AI Module (V2 Placeholder)
 * =========================================
 * Préparation pour future feature "Upload PV d'AG" avec RAG.
 * 
 * Ce fichier est intentionnellement minimal — il définit l'interface
 * que le futur module AI devra implémenter.
 * 
 * // AI DECISION: Placeholder structuré pour future intégration
 */

// Types pour l'analyse de documents
export interface DocumentAnalysisResult {
    /** Texte extrait du document */
    extractedText: string;
    /** Métadonnées détectées */
    metadata: {
        documentType: 'pv_ag' | 'audit_energetique' | 'devis' | 'unknown';
        date?: Date;
        copropriete?: string;
    };
    /** Points clés identifiés */
    keyPoints: string[];
    /** Montants détectés */
    amounts: { label: string; value: number }[];
    /** Votes détectés (pour PV AG) */
    votes?: { motion: string; pour: number; contre: number; abstention: number }[];
}

// Interface du service AI
export interface AIService {
    /** Analyse un document uploadé */
    analyzeDocument(file: File): Promise<DocumentAnalysisResult>;
    /** Génère un argumentaire de persuasion */
    generatePitchArguments(context: {
        currentDPE: string;
        targetDPE: string;
        remainingCost: number;
        inactionCost: number;
    }): Promise<string[]>;
}

/**
 * Placeholder — sera implémenté en V2 avec OpenAI/Claude + RAG
 */
export class PlaceholderAIService implements AIService {
    async analyzeDocument(_file: File): Promise<DocumentAnalysisResult> {
        throw new Error('AI Service not implemented. Coming in V2.');
    }

    async generatePitchArguments(_context: {
        currentDPE: string;
        targetDPE: string;
        remainingCost: number;
        inactionCost: number;
    }): Promise<string[]> {
        // Pour MVP, retourne des arguments statiques
        return [
            "L'inaction coûte plus cher que l'action.",
            "Les aides actuelles sont au plus haut historique.",
            "Agir maintenant protège la valeur de votre patrimoine.",
        ];
    }
}

// Export singleton
export const aiService = new PlaceholderAIService();
