/**
 * SMART ADDRESS FORM — Formulaire intelligent principal
 * =====================================================
 * Formulaire unifié avec autocomplete, enrichissement auto,
 * et indicateurs de statut premium.
 * 
 * @author JB
 * @date 2026-02-03
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Euro, Users, TrendingUp, ChevronDown, ChevronUp, FileUp } from "lucide-react";
import { useSmartForm } from "@/hooks/useSmartForm";
import { type DiagnosticInput } from "@/lib/schemas";
import { type DPELetter } from "@/lib/constants";
import { DPE_COLORS } from "@/lib/constants";

// Sub-components
import { AddressSearch } from "./AddressSearch";

import { SmartField } from "./SmartField";
import { DataSourcePills } from "./DataSourcePills";

// =============================================================================
// TYPES
// =============================================================================

const parseOptionalNumber = (v: any) => Number(v) || 0;

interface SmartAddressFormProps {
  initialData?: Partial<DiagnosticInput>;
  onSubmit: (data: DiagnosticInput, opts?: { userInitiated?: boolean }) => void;
  onAddressSelected?: (data: {
    address: string;
    postalCode: string;
    city: string;
    cityCode?: string;
    coordinates?: { latitude: number; longitude: number };
  }) => void;
  onCsvImport?: () => void;
  className?: string;
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export function SmartAddressForm({
  initialData,
  onSubmit,
  onAddressSelected,
  onCsvImport,
  className = "",
}: SmartAddressFormProps) {
  const form = useSmartForm({ initialData });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await form.submit();
    if (form.formData.values && Object.keys(form.formData.values).length > 0) {
      const validated = validateFormData(form.formData.values);
      if (validated) {
        onSubmit(validated, { userInitiated: true });
      }
    }
  };

  const triggerSubmit = async (userInitiated = false) => {
    const result = await form.submit();
    if (form.formData.values && Object.keys(form.formData.values).length > 0) {
      const validated = validateFormData(form.formData.values);
      if (validated) {
        onSubmit(validated, { userInitiated });
      }
    }
  };

  const validateFormData = (values: Partial<DiagnosticInput>): DiagnosticInput | null => {
    // Validation basique - dans une vraie app, utiliser Zod
    if (!values.address || !values.postalCode || !values.city) return null;
    if (!values.currentDPE || !values.targetDPE) return null;
    if (!values.numberOfUnits || !values.estimatedCostHT) return null;

    return {
      ...values,
      currentEnergyBill: values.currentEnergyBill ?? 0,
    } as DiagnosticInput;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className={`w-full max-w-3xl mx-auto ${className}`}
    >
      {/* Header avec titre et progression */}
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3"
        >
          Évaluez votre copropriété
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted mb-6"
        >
          Analyse complète en 60 secondes • Gratuit • Sans engagement
        </motion.p>


      </div>
      {/* Formulaire */}
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* ÉTAPE 1: Adresse (toujours visible) */}
        <div className="space-y-4">
          <AddressSearch
            value={form.searchQuery}
            onChange={form.setSearchQuery}
            onSelect={async (result) => {
              form.setSearchQuerySilent(result.address);
              await form.selectAddress(result);
              onAddressSelected?.({
                address: result.address,
                postalCode: result.postalCode,
                city: result.city,
                ...(result.cityCode ? { cityCode: result.cityCode } : {}),
                ...(result.coordinates ? { coordinates: result.coordinates } : {}),
              });
            }}
            results={form.searchResults}
            isSearching={form.state === "SEARCHING"}
            placeholder="12 rue de la Paix, 75002 Paris..."
          />

          {/* Import CSV (visible quand pas d'adresse sélectionnée) */}
          <AnimatePresence>
            {!form.selectedAddress && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-center"
              >
                <button
                  type="button"
                  onClick={onCsvImport}
                  className="text-sm text-gold/60 hover:text-gold transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <FileUp className="w-4 h-4" />
                  Importer un portefeuille (CSV)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ÉTAPE 2: Formulaire détaillé (apparaît après sélection) */}
        <AnimatePresence>
          {(!!form.selectedAddress || (form.state !== "IDLE" && form.state !== "TYPING" && form.state !== "SEARCHING")) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-sm">
                {/* Adresse sélectionnée */}
                {form.selectedAddress && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 pb-4 border-b border-white/10"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {form.selectedAddress}
                      </p>
                      <p className="text-xs text-muted">
                        {form.enrichmentSources.dpe ? "Données certifiées trouvées" : "Saisie manuelle"}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Pills des sources de données */}
                <DataSourcePills sources={form.enrichmentSources} isLoading={form.isEnriching} />

                {/* Grid des champs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* DPE Actuel */}
                  <SmartField
                    label="DPE Actuel"
                    name="currentDPE"
                    status={form.fieldStatus("currentDPE").status}
                    source={form.fieldStatus("currentDPE").source}
                    confidence={form.fieldStatus("currentDPE").confidence}
                    onVerify={() => form.verifyField("currentDPE")}
                  >
                    <select
                      name="currentDPE"
                      value={form.formData.values.currentDPE || ""}
                      onChange={(e) => form.updateField("currentDPE", e.target.value as DPELetter)}
                      className="w-full bg-transparent px-4 py-3 text-white focus:outline-none appearance-none cursor-pointer"
                    >
                      {["A", "B", "C", "D", "E", "F", "G"].map((dpe) => (
                        <option key={dpe} value={dpe} className="bg-deep">
                          Classe {dpe}
                          {dpe === "F" && " (Passoire)"}
                          {dpe === "G" && " (Passoire)"}
                        </option>
                      ))}
                    </select>
                  </SmartField>

                  {/* DPE Cible */}
                  <SmartField
                    label="DPE Cible"
                    name="targetDPE"
                    status={form.fieldStatus("targetDPE").status}
                    hint="Objectif recommandé: C"
                  >
                    <select
                      name="targetDPE"
                      value={form.formData.values.targetDPE || ""}
                      onChange={(e) => form.updateField("targetDPE", e.target.value as DPELetter)}
                      className="w-full bg-transparent px-4 py-3 text-white focus:outline-none appearance-none cursor-pointer"
                    >
                      {["A", "B", "C", "D", "E"].map((dpe) => (
                        <option key={dpe} value={dpe} className="bg-deep">
                          Classe {dpe}
                          {dpe === "C" && " (Recommandé)"}
                        </option>
                      ))}
                    </select>
                  </SmartField>

                  {/* Nombre de lots */}
                  <SmartField
                    label="Nombre de lots"
                    name="numberOfUnits"
                    status={form.fieldStatus("numberOfUnits").status}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Users className="w-4 h-4 text-muted" />
                      <input
                        type="number"
                        name="numberOfUnits"
                        value={form.formData.values.numberOfUnits || ""}
                        onChange={(e) => form.updateField("numberOfUnits", parseInt(e.target.value) || 0)}
                        min={2}
                        max={500}
                        className="flex-1 bg-transparent text-white focus:outline-none"
                        placeholder="20"
                      />
                    </div>
                  </SmartField>

                  {/* Budget travaux */}
                  <SmartField
                    label="Budget travaux HT"
                    name="estimatedCostHT"
                    status={form.fieldStatus("estimatedCostHT").status}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Euro className="w-4 h-4 text-muted" />
                      <input
                        type="number"
                        name="estimatedCostHT"
                        value={form.formData.values.estimatedCostHT || ""}
                        onChange={(e) => form.updateField("estimatedCostHT", parseInt(e.target.value) || 0)}
                        min={0}
                        step={1000}
                        className="flex-1 bg-transparent text-white focus:outline-none"
                        placeholder="400000"
                      />
                      <span className="text-muted text-sm">€</span>
                    </div>
                  </SmartField>
                </div>

                {/* Options avancées (collapsible) */}
                <AdvancedOptions form={form} />

                {/* Analyse automatique : suppression du bouton explicite 'Calculer' */}
                <div className="w-full py-3 px-4 rounded-xl text-sm text-center">
                  {form.state === "SUBMITTING" ? (
                    <div className="text-muted">Calcul en cours…</div>
                  ) : form.progress < 100 ? (
                    <div className="text-muted">Complétez le formulaire ({form.progress}%)</div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => void triggerSubmit(true)}
                        className="px-6 py-3 rounded-full bg-gold hover:bg-gold-light text-black font-semibold"
                      >
                        Lancer le diagnostic
                      </button>
                    </div>
                  )}
                </div>

                {/* Message d'erreur */}
                <AnimatePresence>
                  {form.error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm text-center"
                    >
                      {form.error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>
    </motion.div>
  );
}

// =============================================================================
// SOUS-COMPOSANT: Options avancées
// =============================================================================

import type { UseSmartFormReturn } from "@/hooks/useSmartForm";

function AdvancedOptions({ form }: { form: UseSmartFormReturn }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm text-muted hover:text-white hover:bg-white/5 transition-colors"
      >
        <span>Options avancées</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-white/[0.02]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prix au m² */}
                <SmartField
                  label="Prix moyen m²"
                  name="averagePricePerSqm"
                  status={form.fieldStatus("averagePricePerSqm").status}
                  source={form.fieldStatus("averagePricePerSqm").source}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Euro className="w-4 h-4 text-muted" />
                    <input
                      type="number"
                      value={form.formData.values.averagePricePerSqm || ""}
                      onChange={(e) => form.updateField("averagePricePerSqm", parseInt(e.target.value) || 0)}
                      className="flex-1 bg-transparent text-white focus:outline-none"
                      placeholder="3200"
                    />
                    <span className="text-muted text-sm">€/m²</span>
                  </div>
                </SmartField>

                {/* Surface moyenne */}
                <SmartField
                  label="Surface moyenne lot"
                  name="averageUnitSurface"
                  status={form.fieldStatus("averageUnitSurface").status}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Building2 className="w-4 h-4 text-muted" />
                    <input
                      type="number"
                      value={form.formData.values.averageUnitSurface || ""}
                      onChange={(e) => form.updateField("averageUnitSurface", parseInt(e.target.value) || 0)}
                      className="flex-1 bg-transparent text-white focus:outline-none"
                      placeholder="65"
                    />
                    <span className="text-muted text-sm">m²</span>
                  </div>
                </SmartField>

                {/* Lots commerciaux */}
                <SmartField
                  label="Lots commerciaux"
                  name="commercialLots"
                  status={form.fieldStatus("commercialLots").status}
                  hint="Non éligibles aux aides"
                >
                  <input
                    type="number"
                    value={form.formData.values.commercialLots ?? ""}
                    onChange={(e) => form.updateField("commercialLots", parseOptionalNumber(e.target.value) as number)}
                    className="w-full bg-transparent px-4 py-3 text-white focus:outline-none"
                    min={0}
                  />
                </SmartField>

                {/* Fonds ALUR */}
                <SmartField
                  label="Fonds travaux ALUR"
                  name="alurFund"
                  status={form.fieldStatus("alurFund").status}
                  hint="Trésorerie disponible"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Euro className="w-4 h-4 text-muted" />
                    <input
                      type="number"
                      value={form.formData.values.alurFund ?? ""}
                      onChange={(e) => form.updateField("alurFund", parseOptionalNumber(e.target.value) as number)}
                      className="flex-1 bg-transparent text-white focus:outline-none"
                      step={1000}
                    />
                  </div>
                </SmartField>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Helper: Auto-submit when ready (debounced)
// =============================================================================
// Auto-submit removed: replaced by explicit 'Lancer le diagnostic' button in the form
