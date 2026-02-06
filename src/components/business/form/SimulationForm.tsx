"use client";

import { Building2, Euro, Users, FileUp, Sparkles, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";
import { enrichCoproperty } from "@/lib/api";
import { useSimulationForm } from "@/hooks/useSimulationForm";
import { type DiagnosticInput } from "@/lib/schemas";
import { type SimulationApiData, DEFAULT_VALUES } from "@/lib/simulationDefaults";

interface SimulationFormProps {
    onSubmit: (data: DiagnosticInput) => void;
    onCsvImport?: () => void;
    isLoading?: boolean;
}

export function SimulationForm({ onSubmit, onCsvImport, isLoading = false }: SimulationFormProps) {
    const [addressData, setAddressData] = useState<SimulationApiData | null>(null);
    const [rnicLoading, setRnicLoading] = useState(false);

    const {
        form,
        numberOfLots,
        totalLivingArea,
        autoFlags,
        budgetManuallySet,
        surfaceManuallySet,
        markBudgetManual,
        markSurfaceManual,
    } = useSimulationForm(addressData);

    const workBudget = useWatch({ control: form.control, name: "workBudget" });

    const estimatedBudget = useMemo(() => {
        if (!totalLivingArea || totalLivingArea <= 0) return 0;
        return Math.round(totalLivingArea * DEFAULT_VALUES.renoCostPerSqm);
    }, [totalLivingArea]);

    const surfaceEstimated = !autoFlags.totalLivingArea && !surfaceManuallySet;
    const budgetEstimated = !budgetManuallySet;

    const isSubmitEnabled = Boolean(numberOfLots && numberOfLots > 0 && workBudget && workBudget > 0);

    const autoInputClass = (isAuto: boolean) =>
        `w-full bg-white/[0.03] border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all ${isAuto ? "ring-1 ring-amber-400/30 border-amber-400/30" : ""
        }`;

    const estimatedInputClass = (isEstimated: boolean) =>
        `w-full bg-white/[0.03] border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all ${isEstimated ? "text-white/40 bg-white/5 italic" : ""
        }`;

    const handleAddressSelect = async (data: {
        address: string;
        postalCode: string;
        city: string;
        cityCode?: string;
        coordinates?: { longitude: number; latitude: number };
        dpeData?: { dpe: string; surface: number };
        rnicData?: {
            numberOfLots?: number;
            syndicName?: string;
            constructionYear?: number;
        };
    }) => {
        setAddressData((prev) => {
            const base = prev || {};
            // Prioriser les données RNIC selectionnées directement
            const rnicLots = data.rnicData?.numberOfLots;

            return {
                ...base,
                address: data.address,
                postalCode: data.postalCode,
                city: data.city,
                cityCode: data.cityCode || "",
                coordinates: data.coordinates
                    ? { latitude: data.coordinates.latitude, longitude: data.coordinates.longitude }
                    : base.coordinates,
                dpe_label: data.dpeData?.dpe as SimulationApiData["dpe_label"],
                living_area: data.dpeData?.surface,
                // Si on a le nombre de lots depuis la recherche, on l'utilise direct
                total_units: rnicLots || base.total_units,
                // On peut aussi stocker le syndic si on veut (pas dans SimulationApiData pour l'instant)
            } as SimulationApiData;
        });

        setRnicLoading(true);
        try {
            const result = await enrichCoproperty(data.address, {
                exactAddress: data.address,
                postalCode: data.postalCode,
                cityCode: data.cityCode,
            });

            if (result.coproperty) {
                setAddressData((prev) => ({
                    ...prev,
                    total_units: result.coproperty?.numberOfUnits || 0,
                    total_surface: result.coproperty?.totalSurface || 0,
                }));
            }
        } finally {
            setRnicLoading(false);
        }
    };

    const handleEnriched = (property: any) => {
        if (!property?.marketData?.averagePricePerSqm) return;
        setAddressData((prev) => ({
            ...prev,
            price_per_sqm: property.marketData.averagePricePerSqm,
        }));
    };

    const handleFormSubmit = form.handleSubmit((values: any) => {
        const averageUnitSurface =
            values.numberOfLots && values.totalLivingArea
                ? values.totalLivingArea / values.numberOfLots
                : undefined;

        const diagnosticInput: DiagnosticInput = {
            address: addressData?.address,
            postalCode: addressData?.postalCode,
            city: addressData?.city,
            coordinates: addressData?.coordinates,
            currentDPE: values.currentDpeLabel,
            targetDPE: values.targetDpeLabel,
            numberOfUnits: values.numberOfLots,
            commercialLots: 0,
            estimatedCostHT: values.workBudget,
            averagePricePerSqm: values.pricePerSqm,
            priceSource: addressData?.price_per_sqm ? "DVF (Etalab)" : "Estimé",
            salesCount: undefined,
            averageUnitSurface,
            localAidAmount: 0,
            alurFund: 0,
            ceeBonus: 0,
            currentEnergyBill: 0,
            investorRatio: 0,
        };

        onSubmit(diagnosticInput);
    });

    return (
        <form onSubmit={handleFormSubmit} className="space-y-8">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-gold/80 flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        Localisation de l&apos;immeuble
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gold/5 blur-xl group-hover:bg-gold/10 transition-all duration-500 rounded-2xl" />
                        <AddressAutocomplete
                            placeholder="Ex: 12 rue de la Paix, Paris"
                            className="relative w-full bg-white/[0.05] border-white/10 rounded-2xl p-1 backdrop-blur-md"
                            onSelect={handleAddressSelect}
                            onEnriched={handleEnriched}
                        />
                    </div>
                </div>

                {!addressData?.address && onCsvImport && (
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={onCsvImport}
                            className="text-[10px] uppercase tracking-widest text-gold/60 hover:text-gold transition-colors flex items-center gap-2"
                        >
                            <FileUp className="w-3 h-3" />
                            Ou importer un portefeuille (CSV)
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] backdrop-blur-sm">
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60 mb-1 flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        Nombre de lots
                        {autoFlags.numberOfLots && (
                            <span className="text-[9px] text-amber-300 bg-amber-300/10 px-2 py-0.5 rounded-full border border-amber-300/20 flex items-center gap-1">
                                <Sparkles className="w-2 h-2" />
                                ✨ Auto
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min={2}
                            step={1}
                            placeholder="Ex: 24"
                            className={autoInputClass(autoFlags.numberOfLots)}
                            {...form.register("numberOfLots", { valueAsNumber: true })}
                        />
                    </div>
                    {form.formState.errors.numberOfLots && (
                        <p className="text-[10px] text-danger mt-1 uppercase tracking-wider">{form.formState.errors.numberOfLots.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60 mb-1 flex items-center gap-2">
                        <Building2 className="w-3 h-3" />
                        Surface habitable (m²)
                        {autoFlags.totalLivingArea && (
                            <span className="text-[9px] text-amber-300 bg-amber-300/10 px-2 py-0.5 rounded-full border border-amber-300/20 flex items-center gap-1">
                                <Sparkles className="w-2 h-2" />
                                ✨ Auto
                            </span>
                        )}
                        {surfaceEstimated && numberOfLots && (
                            <span className="text-[9px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                Estimé (lots x 62m²)
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min={10}
                            step={5}
                            placeholder="Ex: 1500"
                            className={estimatedInputClass(surfaceEstimated)}
                            {...form.register("totalLivingArea", {
                                valueAsNumber: true,
                                onChange: () => markSurfaceManual(),
                            })}
                        />
                    </div>
                    {form.formState.errors.totalLivingArea && (
                        <p className="text-[10px] text-danger mt-1 uppercase tracking-wider">{form.formState.errors.totalLivingArea.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60 mb-1 flex items-center gap-2">
                        DPE actuel
                        {autoFlags.currentDpeLabel && (
                            <span className="text-[9px] text-amber-300 bg-amber-300/10 px-2 py-0.5 rounded-full border border-amber-300/20 flex items-center gap-1">
                                <Sparkles className="w-2 h-2" />
                                ✨ Auto
                            </span>
                        )}
                    </label>
                    <select
                        className={autoInputClass(autoFlags.currentDpeLabel)}
                        {...form.register("currentDpeLabel")}
                    >
                        {["A", "B", "C", "D", "E", "F", "G"].map((label) => (
                            <option key={label} value={label} className="bg-deep text-white">
                                Classe {label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60 mb-1">
                        Objectif réglementaire (DPE)
                    </label>
                    <select className="input rounded-xl bg-white/[0.03] border-white/10" {...form.register("targetDpeLabel")}>
                        {["A", "B", "C", "D", "E"].map((label) => (
                            <option key={label} value={label} className="bg-deep text-white">
                                {label === "C" ? `Classe ${label} (Recommandé)` : `Classe ${label}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60 mb-1 flex items-center gap-2">
                        <Euro className="w-3 h-3" />
                        Prix du marché (€/m²)
                        {autoFlags.pricePerSqm && (
                            <span className="text-[9px] text-amber-300 bg-amber-300/10 px-2 py-0.5 rounded-full border border-amber-300/20 flex items-center gap-1">
                                <Sparkles className="w-2 h-2" />
                                ✨ Auto
                            </span>
                        )}
                        {!autoFlags.pricePerSqm && (
                            <span className="text-[9px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 italic">
                                Défaut 3500 €/m²
                            </span>
                        )}
                    </label>
                    <input
                        type="number"
                        min={500}
                        step={50}
                        placeholder="3500"
                        className={estimatedInputClass(!autoFlags.pricePerSqm)}
                        {...form.register("pricePerSqm", { valueAsNumber: true })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60 mb-1 flex items-center gap-2">
                        <Euro className="w-3 h-3" />
                        Budget prévisionnel (HT)
                        {budgetEstimated && (
                            <span className="text-[9px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 italic">
                                Estimé {estimatedBudget.toLocaleString("fr-FR")} €
                            </span>
                        )}
                    </label>
                    <input
                        type="number"
                        min={1000}
                        step={500}
                        placeholder="Ex: 450000"
                        className={estimatedInputClass(budgetEstimated)}
                        {...form.register("workBudget", {
                            valueAsNumber: true,
                            onChange: () => markBudgetManual(),
                        })}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={!isSubmitEnabled || isLoading}
                className="w-full py-3 px-6 bg-primary hover:bg-primary-600 text-gray-900 font-bold rounded-lg shadow-glow hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
                {isLoading ? "Analyse en cours..." : "Lancer l'analyse"}
            </button>

            <p className="text-xs text-muted text-center">
                Mode dégradé actif: le formulaire reste utilisable même sans données d&apos;adresse.
            </p>
        </form>
    );
}
