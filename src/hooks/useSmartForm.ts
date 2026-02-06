/**
 * USE SMART FORM — Hook de gestion du formulaire intelligent
 * =============================================================
 * Machine à états pour le flux d'onboarding premium.
 * 
 * Architecture:
 * - IDLE → TYPING → SEARCHING → SELECTED → ENRICHING → READY → SUBMITTING → RESULT
 * 
 * @author JB (Dev Senior Full Stack)
 * @date 2026-02-03
 * @version 1.0.0
 */

"use client";

import { useState, useCallback, useMemo, useReducer, useEffect, useRef } from "react";
import { type DPELetter } from "@/lib/constants";
import { type DiagnosticInput, DiagnosticInputSchema } from "@/lib/schemas";
import { dpeService, type DPEEntry, type HybridSearchResult } from "@/services/dpeService";
import { type AddressFeature } from "@/lib/api";

// =============================================================================
// TYPES & ÉTATS
// =============================================================================

/** États de la machine à états */
export type FormState =
  | "IDLE"           // Attente initiale
  | "TYPING"         // Saisie en cours (debounce)
  | "SEARCHING"      // Recherche adresse
  | "SELECTED"       // Adresse sélectionnée
  | "ENRICHING"      // Enrichissement données
  | "READY"          // Formulaire actif, prêt à compléter
  | "SUBMITTING"     // Soumission en cours
  | "ERROR"
  | "RESULT";         // État d'erreur

/** Statut d'un champ du formulaire */
export type FieldStatus = "empty" | "auto-filled" | "verified" | "manual" | "error";

/** Métadonnées d'un champ */
export interface FieldMeta {
  status: FieldStatus;
  source?: string | undefined;      // Source de la donnée (DPE, DVF, etc.)
  confidence?: number | undefined;  // Niveau de confiance 0-100
  touched: boolean;
  error?: string;
}

/** Données du formulaire avec métadonnées */
export interface SmartFormData {
  values: Partial<DiagnosticInput>;
  meta: Record<string, FieldMeta>;
}

/** Sources d'enrichissement trouvées */
export interface EnrichmentSources {
  dpe?: DPEEntry | undefined;
  cadastre?: { section: string; numero: string; surface: number };
  marketData?: { averagePricePerSqm: number; transactionCount: number };
  coordinates?: { latitude: number; longitude: number };
}

/** Configuration du hook */
export interface UseSmartFormOptions {
  initialData?: Partial<DiagnosticInput> | undefined;
  onSubmit?: (data: DiagnosticInput) => void;
  onError?: (error: Error) => void;
}

/** Retour du hook */
export interface UseSmartFormReturn {
  // État global
  state: FormState;
  formData: SmartFormData;
  progress: number;
  error: string | null;

  // Enrichissement
  enrichmentSources: EnrichmentSources;
  isEnriching: boolean;

  // Recherche d'adresse
  searchQuery: string;
  searchResults: HybridSearchResult[];
  selectedAddress: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setSearchQuerySilent: (query: string) => void;
  selectAddress: (result: HybridSearchResult) => void;
  updateField: <K extends keyof DiagnosticInput>(field: K, value: DiagnosticInput[K]) => void;
  verifyField: (field: keyof DiagnosticInput) => void;
  submit: () => Promise<void>;
  reset: () => void;

  // Dérivés
  autoFilledFields: string[];
  missingRequiredFields: string[];
  isReadyToSubmit: boolean;
  fieldStatus: (field: keyof DiagnosticInput) => FieldMeta;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const REQUIRED_FIELDS: (keyof DiagnosticInput)[] = [
  "address",
  "postalCode",
  "city",
  "currentDPE",
  "targetDPE",
  "numberOfUnits",
  "estimatedCostHT",
];

const FIELD_WEIGHTS: Record<string, number> = {
  address: 20,
  postalCode: 5,
  city: 5,
  currentDPE: 10,
  targetDPE: 10,
  numberOfUnits: 15,
  estimatedCostHT: 15,
  averagePricePerSqm: 10,
  averageUnitSurface: 5,
  commercialLots: 2,
  localAidAmount: 2,
  alurFund: 2,
  ceeBonus: 2,
  investorRatio: 2,
};

// =============================================================================
// REDUCER
// =============================================================================

interface FormStateReducer {
  state: FormState;
  formData: SmartFormData;
  error: string | null;
  enrichmentSources: EnrichmentSources;
  searchQuery: string;
  searchResults: HybridSearchResult[];
  selectedAddress: string | null;
  isEnriching: boolean;
}

type FormAction =
  | { type: "SET_STATE"; payload: FormState }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_SEARCH_QUERY_SILENT"; payload: string }
  | { type: "SET_SEARCH_RESULTS"; payload: HybridSearchResult[] }
  | { type: "SELECT_ADDRESS"; payload: { address: string; result: HybridSearchResult } }
  | { type: "START_ENRICHING" }
  | { type: "ENRICHMENT_COMPLETE"; payload: EnrichmentSources }
  | { type: "UPDATE_FIELD"; payload: { field: keyof DiagnosticInput; value: unknown; source?: string } }
  | { type: "VERIFY_FIELD"; payload: keyof DiagnosticInput }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET"; payload?: Partial<DiagnosticInput> };

function createInitialState(initialData?: Partial<DiagnosticInput>): FormStateReducer {
  const defaultValues: Partial<DiagnosticInput> = {
    commercialLots: 0,
    localAidAmount: 0,
    alurFund: 0,
    ceeBonus: 0,
    investorRatio: 0,
    ...initialData,
  };

  const meta: Record<string, FieldMeta> = {};
  Object.keys(defaultValues).forEach((key) => {
    meta[key] = {
      status: defaultValues[key as keyof DiagnosticInput] !== undefined ? "manual" : "empty",
      touched: false,
    };
  });

  return {
    state: "IDLE",
    formData: { values: defaultValues, meta },
    error: null,
    enrichmentSources: {},
    searchQuery: initialData?.address || "",
    searchResults: [],
    selectedAddress: null,
    isEnriching: false,
  };
}

function formReducer(state: FormStateReducer, action: FormAction): FormStateReducer {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, state: action.payload };

    case "SET_SEARCH_QUERY":
      return {
        ...state,
        searchQuery: action.payload,
        state: action.payload.length > 0 ? "TYPING" : "IDLE",
      };

    case "SET_SEARCH_QUERY_SILENT":
      return {
        ...state,
        searchQuery: action.payload,
      };

    case "SET_SEARCH_RESULTS":
      return {
        ...state,
        searchResults: action.payload,
        state: action.payload.length > 0 ? "SEARCHING" : state.state,
      };

    case "SELECT_ADDRESS": {
      const { address, result } = action.payload;
      const newValues = { ...state.formData.values };
      const newMeta = { ...state.formData.meta };

      // Mise à jour des champs d'adresse
      newValues.address = address;
      newValues.postalCode = result.postalCode;
      newValues.city = result.city;

      if (result.coordinates) {
        newValues.coordinates = result.coordinates;
      }

      newMeta.address = { status: "verified", source: result.sourceType, touched: true };
      newMeta.postalCode = { status: "verified", source: result.sourceType, touched: true };
      newMeta.city = { status: "verified", source: result.sourceType, touched: true };

      // Si DPE trouvé, l'enregistrer, sinon valeur par défaut
      if (result.dpeData) {
        newValues.currentDPE = result.dpeData.dpe as DPELetter;
        newMeta.currentDPE = {
          status: "auto-filled",
          source: "DPE Local",
          confidence: 95,
          touched: false
        };
      } else {
        newValues.currentDPE = "F";
        newMeta.currentDPE = { status: "manual", touched: false };
      }

      // Initialiser DPE Cible par défaut
      if (!newValues.targetDPE) {
        newValues.targetDPE = "C";
        newMeta.targetDPE = { status: "auto-filled", confidence: 100, touched: false };
      }

      return {
        ...state,
        state: "SELECTED",
        selectedAddress: address,
        searchResults: [],
        formData: { values: newValues, meta: newMeta },
      };
    }

    case "START_ENRICHING":
      return { ...state, isEnriching: true, state: "ENRICHING" };

    case "ENRICHMENT_COMPLETE": {
      const sources = action.payload;
      const newValues = { ...state.formData.values };
      const newMeta = { ...state.formData.meta };

      // Mise à jour avec les données enrichies
      if (sources.dpe && !newValues.currentDPE) {
        newValues.currentDPE = sources.dpe.dpe as DPELetter;
        newMeta.currentDPE = { status: "auto-filled", source: "DPE ADEME", confidence: 90, touched: false };
      }

      if (sources.marketData?.averagePricePerSqm) {
        newValues.averagePricePerSqm = sources.marketData.averagePricePerSqm;
        newMeta.averagePricePerSqm = {
          status: "auto-filled",
          source: "DVF",
          confidence: sources.marketData.transactionCount > 10 ? 85 : 70,
          touched: false
        };
      }

      if (sources.coordinates) {
        newValues.coordinates = sources.coordinates;
      }

      return {
        ...state,
        isEnriching: false,
        state: "READY",
        enrichmentSources: sources,
        formData: { values: newValues, meta: newMeta },
      };
    }

    case "UPDATE_FIELD": {
      const { field, value, source } = action.payload;
      const newValues = { ...state.formData.values, [field]: value };
      const newMeta = { ...state.formData.meta };

      newMeta[field as string] = {
        status: source ? "auto-filled" : "manual",
        source,
        touched: true,
      };

      return {
        ...state,
        formData: { values: newValues, meta: newMeta },
      };
    }

    case "VERIFY_FIELD": {
      const field = action.payload;
      const currentMeta = state.formData.meta[field as string];

      if (!currentMeta) return state;

      return {
        ...state,
        formData: {
          ...state.formData,
          meta: {
            ...state.formData.meta,
            [field]: { ...currentMeta, status: "verified", touched: true },
          },
        },
      };
    }

    case "SET_ERROR":
      return { ...state, state: "ERROR", error: action.payload };

    case "CLEAR_ERROR":
      return { ...state, error: null, state: state.state === "ERROR" ? "READY" : state.state };

    case "RESET":
      return createInitialState(action.payload);

    default:
      return state;
  }
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useSmartForm(options: UseSmartFormOptions = {}): UseSmartFormReturn {
  const { initialData, onSubmit, onError } = options;

  const [reducerState, dispatch] = useReducer(formReducer, createInitialState(initialData));
  const stateRef = useRef(reducerState.state);
  const searchVersionRef = useRef(0);

  // Debounce timer pour la recherche
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // =============================================================================
  // CALCULS DÉRIVÉS (useMemo)
  // =============================================================================

  /** Progression du formulaire (0-100) */
  const progress = useMemo(() => {
    let total = 0;
    let filled = 0;

    REQUIRED_FIELDS.forEach((field) => {
      const weight = FIELD_WEIGHTS[field] || 5;
      total += weight;

      const value = reducerState.formData.values[field];
      if (value !== undefined && value !== null && value !== "") {
        filled += weight;
      }
    });

    // Bonus pour les champs optionnels remplis
    const optionalFields = ["averagePricePerSqm", "averageUnitSurface"];
    optionalFields.forEach((field) => {
      const meta = reducerState.formData.meta[field];
      if (meta?.status === "auto-filled" || meta?.status === "verified") {
        filled += 2;
      }
    });

    return Math.min(Math.round((filled / total) * 100), 100);
  }, [reducerState.formData]);

  /** Champs auto-remplis */
  const autoFilledFields = useMemo(() => {
    return Object.entries(reducerState.formData.meta)
      .filter(([, meta]) => meta.status === "auto-filled")
      .map(([key]) => key);
  }, [reducerState.formData.meta]);

  /** Champs requis manquants */
  const missingRequiredFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((field) => {
      const value = reducerState.formData.values[field];
      return value === undefined || value === null || value === "";
    });
  }, [reducerState.formData.values]);

  /** Prêt à soumettre ? */
  const isReadyToSubmit = useMemo(() => {
    return missingRequiredFields.length === 0 && progress >= 80;
  }, [missingRequiredFields, progress]);

  // =============================================================================
  // ACTIONS (useCallback)
  // =============================================================================

  /** Met à jour la recherche avec debounce */
  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: query });

    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    if (query.length >= 3) {
      const version = searchVersionRef.current + 1;
      searchVersionRef.current = version;
      const timer = setTimeout(async () => {
        if (searchVersionRef.current !== version) return;
        if (["SELECTED", "ENRICHING", "READY", "SUBMITTING", "RESULT"].includes(stateRef.current)) {
          return;
        }
        try {
          let results = await dpeService.hybridSearch(query, 6);

          // Fallback direct vers l'API Adresse (data.gouv.fr) si la recherche hybride ne retourne rien
          if ((!results || results.length === 0)) {
            try {
              const resp = await fetch(
                `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=6`
              );
              if (resp.ok) {
                const data = await resp.json();
                const apiResults = (data.features || []).map((f: any) => ({
                  address: f.properties.label,
                  postalCode: f.properties.postcode,
                  city: f.properties.city,
                  cityCode: f.properties.citycode,
                  coordinates: f.geometry ? { latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] } : undefined,
                  sourceType: 'api',
                  score: f.properties.score,
                }));
                results = apiResults as any;
              }
            } catch (err) {
              console.warn('Fallback API Adresse failed', err);
            }
          }

          dispatch({ type: "SET_SEARCH_RESULTS", payload: results });
        } catch (error) {
          console.error("Erreur recherche:", error);
          dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
        }
      }, 120);

      setSearchTimer(timer);
    } else {
      dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
    }
  }, [searchTimer]);

  const setSearchQuerySilent = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY_SILENT", payload: query });
  }, []);

  /** Sélectionne une adresse et lance l'enrichissement */
  const selectAddress = useCallback(async (result: HybridSearchResult) => {
    if (searchTimer) {
      clearTimeout(searchTimer);
      setSearchTimer(null);
    }
    searchVersionRef.current += 1;
    dispatch({
      type: "SELECT_ADDRESS",
      payload: { address: result.address, result }
    });

    // Lancer l'enrichissement en arrière-plan
    dispatch({ type: "START_ENRICHING" });

    try {
      const sources: EnrichmentSources = {};

      // Récupérer DPE si pas déjà présent
      if (result.dpeData) {
        sources.dpe = result.dpeData;
      } else if (result.postalCode) {
        const dpeResults = await dpeService.searchLocal(result.address);
        if (dpeResults.length > 0) {
          sources.dpe = dpeResults[0]!;
        }
      }

      // Coordonnées
      if (result.coordinates) {
        sources.coordinates = result.coordinates;
      }

      dispatch({ type: "ENRICHMENT_COMPLETE", payload: sources });
    } catch (error) {
      console.error("Erreur enrichissement:", error);
      // On passe quand même en READY même si l'enrichissement échoue
      dispatch({ type: "ENRICHMENT_COMPLETE", payload: {} });
    }
  }, [searchTimer]);

  /** Met à jour un champ */
  const updateField = useCallback(<K extends keyof DiagnosticInput>(
    field: K,
    value: DiagnosticInput[K]
  ) => {
    dispatch({
      type: "UPDATE_FIELD",
      payload: { field, value }
    });
  }, []);

  /** Marque un champ comme vérifié */
  const verifyField = useCallback((field: keyof DiagnosticInput) => {
    dispatch({ type: "VERIFY_FIELD", payload: field });
  }, []);

  /** Soumet le formulaire */
  const submit = useCallback(async () => {
    if (!isReadyToSubmit) {
      dispatch({
        type: "SET_ERROR",
        payload: `Champs manquants: ${missingRequiredFields.join(", ")}`
      });
      return;
    }

    dispatch({ type: "SET_STATE", payload: "SUBMITTING" });

    try {
      const result = DiagnosticInputSchema.safeParse(reducerState.formData.values);

      if (!result.success) {
        throw new Error(result.error.errors.map(e => e.message).join(", "));
      }

      onSubmit?.(result.data);
      dispatch({ type: "SET_STATE", payload: "RESULT" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      dispatch({ type: "SET_ERROR", payload: message });
      onError?.(error as Error);
    }
  }, [isReadyToSubmit, missingRequiredFields, reducerState.formData.values, onSubmit, onError]);

  /** Réinitialise le formulaire */
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  /** Récupère le statut d'un champ */
  const fieldStatus = useCallback((field: keyof DiagnosticInput): FieldMeta => {
    return reducerState.formData.meta[field as string] || { status: "empty", touched: false };
  }, [reducerState.formData.meta]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  useEffect(() => {
    stateRef.current = reducerState.state;
  }, [reducerState.state]);

  return {
    state: reducerState.state,
    formData: reducerState.formData,
    progress,
    error: reducerState.error,
    enrichmentSources: reducerState.enrichmentSources,
    isEnriching: reducerState.isEnriching,
    searchQuery: reducerState.searchQuery,
    searchResults: reducerState.searchResults,
    selectedAddress: reducerState.selectedAddress,
    setSearchQuery,
    setSearchQuerySilent,
    selectAddress,
    updateField,
    verifyField,
    submit,
    reset,
    autoFilledFields,
    missingRequiredFields,
    isReadyToSubmit,
    fieldStatus,
  };
}
