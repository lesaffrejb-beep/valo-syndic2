/**
 * DiagnosticForm — Formulaire de saisie des données
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { type DPELetter } from "@/lib/constants";
import { DiagnosticInputSchema, type DiagnosticInput } from "@/lib/schemas";
import { usePropertyEnrichment } from "@/hooks/usePropertyEnrichment";
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";
import { DataSourceBadge, EnrichedDataCard, EnrichmentProgress } from "@/components/ui/DataSourceBadge";
import { motion, AnimatePresence } from "framer-motion";
import { type DPEEntry, dpeService, type DecennaleStatus, type QuarterlyStats } from "@/services/dpeService";
import { DecennaleAlert } from "@/components/business/DecennaleAlert";
import { EnergyBenchmark } from "@/components/business/EnergyBenchmark";

interface DiagnosticFormProps {
    onSubmit: (data: DiagnosticInput) => void;
    isLoading?: boolean;
    initialData?: Partial<DiagnosticInput> & {
        dpeData?: DPEEntry;
    };
}



const DPE_OPTIONS: DPELetter[] = ["A", "B", "C", "D", "E", "F", "G"];

export function DiagnosticForm({ onSubmit, isLoading = false, initialData }: DiagnosticFormProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const formRef = useRef<HTMLFormElement>(null);

    // REFONTE 2026-02-06 : toggles HT/TTC et Honoraires
    const [isCostTTC, setIsCostTTC] = useState(false);
    const [includeHonoraires, setIncludeHonoraires] = useState(true);

    // Initialisation avec initialData
    useEffect(() => {
        if (initialData && formRef.current) {
            const form = formRef.current;
            if (initialData.address) (form.elements.namedItem("address") as HTMLInputElement).value = initialData.address;
            if (initialData.postalCode) {
                (form.elements.namedItem("postalCode") as HTMLInputElement).value = initialData.postalCode;
                checkLocalZone(initialData.postalCode);
            }
            if (initialData.city) (form.elements.namedItem("city") as HTMLInputElement).value = initialData.city;
            if (initialData.currentDPE) (form.elements.namedItem("currentDPE") as HTMLSelectElement).value = initialData.currentDPE;
            if (initialData.targetDPE) (form.elements.namedItem("targetDPE") as HTMLSelectElement).value = initialData.targetDPE;

            // DPE Data
            if (initialData.dpeData) {
                setLocalDpeData(initialData.dpeData);
            }
        }
    }, [initialData]);

    // State pour la gestion des zones locales (49/44)
    const [localZone, setLocalZone] = useState<string | null>(null);

    // State pour DPE local trouvé
    const [localDpeData, setLocalDpeData] = useState<DPEEntry | null>(null);

    // State pour les coordonnées GPS (V3)
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | undefined>(undefined);

    // V2 Quick Wins State
    const [decennaleStatus, setDecennaleStatus] = useState<DecennaleStatus | null>(null);
    const [quarterlyStats, setQuarterlyStats] = useState<QuarterlyStats | null>(null);

    // V2 Enrichment Hook
    const {
        property: enrichedProperty,
        sources: enrichmentSources,
        isEnriching,
        enrichFromAddress
    } = usePropertyEnrichment();

    // V2: Calculate DecennaleAlert and QuarterlyStats when localDpeData changes
    useEffect(() => {
        if (localDpeData) {
            // Decennale Check
            const status = dpeService.checkDecennale(localDpeData.annee);
            setDecennaleStatus(status);

            // Get postal code from address and fetch quarterly stats
            const postalCodeMatch = localDpeData.adresse.match(/(\d{5})/);
            const postalCode = postalCodeMatch?.[1] || '49000';

            dpeService.getQuarterlyStats(postalCode, localDpeData.conso).then(stats => {
                setQuarterlyStats(stats);
            });
        } else {
            setDecennaleStatus(null);
            setQuarterlyStats(null);
        }
    }, [localDpeData]);

    // Reset local zone when postal code changes via enrichment
    useEffect(() => {
        if (enrichedProperty?.postalCode) {
            checkLocalZone(enrichedProperty.postalCode);
        }
    }, [enrichedProperty?.postalCode]);

    const checkLocalZone = (cp: string) => {
        if (cp.startsWith("49")) {
            setLocalZone("ANGERS");
        } else if (cp.startsWith("44")) {
            setLocalZone("NANTES");
        } else {
            setLocalZone(null);
        }
    };

    // Détection auto du Code Postal (Manuel)
    const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        checkLocalZone(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors({});

        const formData = new FormData(e.currentTarget);

        const rawData = {
            address: formData.get("address") as string || undefined,
            postalCode: formData.get("postalCode") as string || undefined,
            city: formData.get("city") as string || undefined,
            coordinates: coordinates, // V3: GPS coordinates from address selection
            currentDPE: formData.get("currentDPE") as DPELetter,
            targetDPE: formData.get("targetDPE") as DPELetter,
            numberOfUnits: parseInt(formData.get("numberOfUnits") as string, 10),
            commercialLots: formData.get("commercialLots")
                ? parseInt(formData.get("commercialLots") as string, 10)
                : 0,
            estimatedCostHT: parseFloat(formData.get("estimatedCostHT") as string),
            isCostTTC: isCostTTC,
            includeHonoraires: includeHonoraires,
            currentEnergyBill: formData.get("currentEnergyBill")
                ? parseFloat(formData.get("currentEnergyBill") as string)
                : 0,
            localAidAmount: formData.get("localAidAmount")
                ? parseFloat(formData.get("localAidAmount") as string)
                : 0,
            alurFund: formData.get("alurFund")
                ? parseFloat(formData.get("alurFund") as string)
                : 0,
            ceeBonus: formData.get("ceeBonus")
                ? parseFloat(formData.get("ceeBonus") as string)
                : 0,
            investorRatio: formData.get("investorRatio")
                ? parseFloat(formData.get("investorRatio") as string)
                : 0,
            averagePricePerSqm: formData.get("averagePricePerSqm")
                ? parseFloat(formData.get("averagePricePerSqm") as string)
                : undefined,
            averageUnitSurface: formData.get("averageUnitSurface")
                ? parseFloat(formData.get("averageUnitSurface") as string)
                : undefined,
        };

        const result = DiagnosticInputSchema.safeParse(rawData);

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.errors.forEach((err) => {
                const path = err.path.join(".");
                fieldErrors[path] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        onSubmit(result.data);
    };



    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">


            {/* Adresse (optionnelle) */}
            {/* Adresse (Autocomplete & Enrichissement) */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-main flex items-center gap-2">
                        Adresse de la copropriété
                        {enrichmentSources.length > 0 && (
                            <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                                ✓ Vérifiée
                            </span>
                        )}
                    </label>
                    <AddressAutocomplete
                        placeholder="Ex: 12 rue de la Paix, Paris"
                        className="w-full"
                        onSelect={(data) => {
                            // Update hidden fields
                            if (formRef.current) {
                                const form = formRef.current;
                                (form.elements.namedItem("address") as HTMLInputElement).value = data.address;
                                (form.elements.namedItem("postalCode") as HTMLInputElement).value = data.postalCode;
                                (form.elements.namedItem("city") as HTMLInputElement).value = data.city;

                                // V3: Store coordinates from address selection
                                if (data.coordinates) {
                                    setCoordinates(data.coordinates);
                                }

                                // Auto-fill DPE from local data if available
                                if (data.dpeData && DPE_OPTIONS.includes(data.dpeData.dpe as any)) {
                                    (form.elements.namedItem("currentDPE") as HTMLSelectElement).value = data.dpeData.dpe;

                                    // Check if we have full DPE data (ADEME/JSON) or just partial (RNIC)
                                    // enriched data requires 'conso' and 'adresse' to function
                                    if ('conso' in data.dpeData && 'adresse' in data.dpeData) {
                                        setLocalDpeData(data.dpeData as DPEEntry);
                                    } else {
                                        setLocalDpeData(null);
                                    }
                                } else {
                                    setLocalDpeData(null);
                                }

                                checkLocalZone(data.postalCode);
                            }
                        }}
                        onEnriched={(prop) => {
                            if (!prop) return;

                            // Update form limits/defaults based on enriched data
                            if (formRef.current && prop.marketData?.averagePricePerSqm) {
                                (formRef.current.elements.namedItem("averagePricePerSqm") as HTMLInputElement).value =
                                    String(prop.marketData.averagePricePerSqm);
                            }
                        }}
                    />

                    {/* Hidden fields required for native form submission */}
                    <input type="hidden" name="address" />
                    <input type="hidden" name="postalCode" />
                    <input type="hidden" name="city" />
                </div>

                {/* Enrichment Status & Cards */}
                <EnrichmentProgress isEnriching={isEnriching} />

                <AnimatePresence>
                    {(enrichedProperty || localDpeData) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden"
                        >
                            {/* Local DPE Card */}
                            {localDpeData && (
                                <EnrichedDataCard
                                    icon="⚡"
                                    title="DPE Local (49)"
                                    value={`Classe ${localDpeData.dpe}`}
                                    description={`Construit en ${localDpeData.annee} • ${localDpeData.surface} m²`}
                                    source={{
                                        name: "ADEME 49 (Local)",
                                        url: "/data/dpe-49.json",
                                        status: "success",
                                        fetchedAt: new Date(),
                                        dataPoints: ["DPE", "Année construction"]
                                    }}
                                />
                            )}

                            {enrichedProperty?.cadastre && (
                                <EnrichedDataCard
                                    icon="📐"
                                    title="Cadastre"
                                    value={`${enrichedProperty.cadastre.section} ${enrichedProperty.cadastre.numero}`}
                                    description={`Parcelle de ${enrichedProperty.cadastre.surface} m²`}
                                    source={enrichmentSources.find(s => s.name.includes("Cadastre"))!}
                                />
                            )}

                            {enrichedProperty?.marketData && (
                                <EnrichedDataCard
                                    icon="📈"
                                    title="Marché Local"
                                    value={enrichedProperty.marketData.averagePricePerSqm}
                                    unit="€/m²"
                                    description={`${enrichedProperty.marketData.transactionCount} ventes analysées`}
                                    source={enrichmentSources.find(s => s.name.includes("DVF"))!}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {enrichmentSources.length > 0 && (
                    <DataSourceBadge sources={enrichmentSources} />
                )}

                {/* V2 Quick Wins: Decennale Alert */}
                {decennaleStatus && decennaleStatus.isActive && (
                    <DecennaleAlert status={decennaleStatus} />
                )}

                {/* V2 Quick Wins: Energy Benchmark */}
                {quarterlyStats && localDpeData && (
                    <EnergyBenchmark
                        stats={quarterlyStats}
                        surface={localDpeData.surface || 100}
                    />
                )}
            </div>

            {/* Aides Locales Badge (Conditionnel) */}
            {localZone && (
                <div className="bg-primary-900/10 border border-primary-500/20 rounded-lg p-3 flex items-start gap-3 animate-fade-in">
                    <span className="text-xl">📍</span>
                    <div>
                        <p className="text-sm font-bold text-main">
                            Zone {localZone === "ANGERS" ? "Angers Loire Métropole" : "Nantes Métropole"} détectée
                        </p>
                        <p className="text-xs text-muted mt-1">
                            Pensez à vérifier les aides locales spécifiques (Mieux Chez Moi, etc.).
                        </p>
                    </div>
                </div>
            )}

            {/* DPE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                        DPE actuel <span className="text-danger-500">*</span>
                    </label>
                    <select
                        name="currentDPE"
                        required
                        defaultValue="F"
                        className="input appearance-none"
                    >
                        {DPE_OPTIONS.map((dpe) => (
                            <option key={dpe} value={dpe}>
                                Classe {dpe}
                            </option>
                        ))}
                    </select>
                    {errors.currentDPE && (
                        <p className="text-danger-500 text-xs mt-1">{errors.currentDPE}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                        DPE cible après travaux <span className="text-danger-500">*</span>
                    </label>
                    <select
                        name="targetDPE"
                        required
                        defaultValue="C"
                        className="input appearance-none"
                    >
                        {DPE_OPTIONS.map((dpe) => (
                            <option key={dpe} value={dpe}>
                                Classe {dpe}
                            </option>
                        ))}
                    </select>
                    {errors.targetDPE && (
                        <p className="text-danger-500 text-xs mt-1">{errors.targetDPE}</p>
                    )}
                </div>
            </div>

            {/* Données financières */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                        Montant travaux ({isCostTTC ? 'TTC' : 'HT'}) (€) <span className="text-danger-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="estimatedCostHT"
                        required
                        min={1000}
                        step={1000}
                        defaultValue={300000}
                        className="input"
                    />
                    <div className="flex items-center gap-3 mt-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                            <input
                                type="checkbox"
                                checked={isCostTTC}
                                onChange={(e) => setIsCostTTC(e.target.checked)}
                                className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 w-3.5 h-3.5"
                            />
                            <span className="text-muted">Montant saisi en TTC</span>
                        </label>
                        <span className="text-[10px] text-muted/50">
                            {isCostTTC ? '(Conversion auto HT via TVA 5,5%)' : '(TVA 5,5% ajoutée au total)'}
                        </span>
                    </div>
                    {errors.estimatedCostHT && (
                        <p className="text-danger-500 text-xs mt-1">{errors.estimatedCostHT}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                        Nombre total de lots <span className="text-danger-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="numberOfUnits"
                        required
                        min={2}
                        max={500}
                        defaultValue={20}
                        className="input"
                    />
                    {errors.numberOfUnits && (
                        <p className="text-danger-500 text-xs mt-1">{errors.numberOfUnits}</p>
                    )}
                </div>
            </div>

            {/* Honoraires & Facture Énergie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col justify-center">
                    <label className="inline-flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeHonoraires}
                            onChange={(e) => setIncludeHonoraires(e.target.checked)}
                            className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 w-4 h-4"
                        />
                        <div>
                            <span className="text-sm font-medium text-main">Inclure Honoraires & Aléas</span>
                            <p className="text-[10px] text-muted mt-0.5">
                                Syndic (3%) + Assurance DO (2%) + Aléas (5%) = +10% sur le devis
                            </p>
                        </div>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                        Facture énergétique annuelle (€)
                    </label>
                    <input
                        type="number"
                        name="currentEnergyBill"
                        min={0}
                        step={500}
                        placeholder="Ex: 45000"
                        className="input"
                    />
                    <p className="text-[10px] text-muted mt-1">
                        Charge énergie globale copro/an (pour calcul du cashflow).
                    </p>
                </div>
            </div>

            {/* Options Avancées (Structure & Aides) */}
            <details className="bg-surface-highlight rounded-lg p-4 border border-boundary group">
                <summary className="text-sm font-medium text-main cursor-pointer hover:text-primary transition-colors flex items-center justify-between">
                    <span>⚙️ Options Techniques & Aides Locales</span>
                    <span className="text-xs text-muted group-open:rotate-180 transition-transform">▼</span>
                </summary>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">
                            Dont lots commerciaux
                        </label>
                        <input
                            type="number"
                            name="commercialLots"
                            min={0}
                            placeholder="0"
                            className="input"
                        />
                        <p className="text-[10px] text-muted mt-1">
                            Exclus des aides MaPrimeRénov&apos;.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">
                            Montant Aides Locales (€)
                        </label>
                        <input
                            type="number"
                            name="localAidAmount"
                            min={0}
                            step={100}
                            placeholder="0"
                            className="input"
                        />
                        <p className="text-[10px] text-muted mt-1">
                            Subventions ville/région (ex: Mieux Chez Moi).
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">
                            💰 Fonds Travaux ALUR (€)
                        </label>
                        <input
                            type="number"
                            name="alurFund"
                            min={0}
                            step={1000}
                            placeholder="0"
                            className="input"
                        />
                        <p className="text-[10px] text-muted mt-1">
                            Trésorerie dormante disponible.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">
                            ⚡ Primes CEE (€)
                        </label>
                        <input
                            type="number"
                            name="ceeBonus"
                            min={0}
                            step={500}
                            placeholder="0"
                            className="input"
                        />
                        <p className="text-[10px] text-muted mt-1">
                            Certificats d&apos;Économie d&apos;Énergie.
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-muted mb-2">
                            👔 Part de Bailleurs Investisseurs: <span className="text-primary font-bold" id="investor-ratio-display">0%</span>
                        </label>
                        <input
                            type="range"
                            name="investorRatio"
                            min={0}
                            max={100}
                            step={5}
                            defaultValue={0}
                            className="w-full h-2 bg-boundary rounded-lg appearance-none cursor-pointer accent-primary"
                            onChange={(e) => {
                                const display = document.getElementById("investor-ratio-display");
                                if (display) display.textContent = `${e.target.value}%`;
                            }}
                        />
                        <p className="text-[10px] text-muted mt-1">
                            Si &gt; 40%, affiche l&apos;avantage fiscal (déficit foncier).
                        </p>
                    </div>
                </div>
            </details>

            {/* Données optionnelles pour valeur verte */}
            <details className="bg-surface-highlight rounded-lg p-4 border border-boundary group">
                <summary className="text-sm font-medium text-main cursor-pointer hover:text-primary transition-colors flex items-center justify-between">
                    <span>📊 Données Valorisation (Optionnel)</span>
                    <span className="text-xs text-muted group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">
                            Prix moyen m² quartier (€)
                        </label>
                        <input
                            type="number"
                            name="averagePricePerSqm"
                            min={500}
                            step={100}
                            placeholder="3200"
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">
                            Surface moyenne lot (m²)
                        </label>
                        <input
                            type="number"
                            name="averageUnitSurface"
                            min={10}
                            step={5}
                            placeholder="65"
                            className="input"
                        />
                    </div>
                </div>
            </details>

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-primary hover:bg-primary-600 text-gray-900 font-bold rounded-lg shadow-glow hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
                {isLoading ? "Analyse en cours..." : "🚀 Lancer le Diagnostic Flash"}
            </button>

            <p className="text-xs text-muted text-center">
                Calcul 100% local — Aucune donnée envoyée à un serveur
            </p>
        </form>
    );
}
