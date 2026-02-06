"use client";

import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { AngersMap } from "./AngersMap";
import { type BuildingAuditResult } from "@/lib/calculator";
import { batchProcessBuildings } from "@/lib/mocks";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Interface pour les lignes CSV importées
 * Supporte différentes conventions de nommage (français/anglais)
 */
interface CSVRow {
    adresse?: string;
    Address?: string;
    lots?: string;
    Units?: string;
    annee?: string;
    Year?: string;
    [key: string]: string | undefined;
}

/**
 * Données traitées et validées
 */
interface ProcessedBuilding {
    adresse: string;
    lots: number;
    annee: number;
    isValid: boolean;
    error?: string;
}

export function MassAudit() {
    const [results, setResults] = useState<BuildingAuditResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleProcess(file);
    };

    /**
     * Valide et transforme une ligne CSV en données traitées
     */
    const validateAndTransformRow = (row: CSVRow, index: number): ProcessedBuilding => {
        const adresse = (row.adresse || row.Address || "").trim();
        const lotsRaw = row.lots || row.Units || "0";
        const anneeRaw = row.annee || row.Year || "0";

        // Validation adresse
        if (!adresse || adresse.length < 3) {
            return {
                adresse: "Adresse inconnue",
                lots: 0,
                annee: 0,
                isValid: false,
                error: `Ligne ${index + 1}: Adresse invalide ou manquante`
            };
        }

        // Validation lots (doit être un nombre positif)
        const lots = parseInt(lotsRaw, 10);
        if (isNaN(lots) || lots <= 0 || lots > 1000) {
            return {
                adresse,
                lots: 0,
                annee: 0,
                isValid: false,
                error: `Ligne ${index + 1}: Nombre de lots invalide "${lotsRaw}"`
            };
        }

        // Validation année (doit être raisonnable)
        const annee = parseInt(anneeRaw, 10);
        const currentYear = new Date().getFullYear();
        if (isNaN(annee) || annee < 1800 || annee > currentYear) {
            return {
                adresse,
                lots,
                annee: 1970, // Valeur par défaut raisonnable
                isValid: true, // On accepte avec valeur par défaut
                error: `Ligne ${index + 1}: Année invalide "${anneeRaw}", valeur par défaut 1970 utilisée`
            };
        }

        return {
            adresse,
            lots,
            annee,
            isValid: true
        };
    };

    const handleProcess = (file: File) => {
        setIsProcessing(true);
        setError(null);
        setValidationErrors([]);
        setProgress(0);

        Papa.parse<CSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim().toLowerCase(),
            complete: (parseResults) => {
                const rawData = parseResults.data;

                // Validation des données
                const processed: ProcessedBuilding[] = rawData.map((row, index) =>
                    validateAndTransformRow(row, index)
                );

                const validBuildings = processed.filter(p => p.isValid);
                const errors = processed
                    .filter(p => p.error)
                    .map(p => p.error!);

                if (errors.length > 0) {
                    setValidationErrors(errors.slice(0, 5)); // Limite à 5 erreurs affichées
                }

                if (validBuildings.length === 0) {
                    setError("Aucune donnée valide trouvée dans le fichier CSV. Vérifiez le format.");
                    setIsProcessing(false);
                    return;
                }

                // Cleanup précédent si existe
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }

                // Simulation d'attente "WOW EFFECT" avec cleanup proper
                intervalRef.current = setInterval(() => {
                    setProgress((prev) => {
                        if (prev >= 100) {
                            if (intervalRef.current) {
                                clearInterval(intervalRef.current);
                                intervalRef.current = null;
                            }
                            const auditResults = batchProcessBuildings(validBuildings.map(b => ({
                                adresse: b.adresse,
                                lots: b.lots,
                                annee: b.annee
                            })));
                            setResults(auditResults);
                            setIsProcessing(false);
                            return 100;
                        }
                        return prev + 1;
                    });
                }, 100);
            },
            error: (err: Error) => {
                setError(`Erreur lors de la lecture du fichier CSV: ${err.message}`);
                setIsProcessing(false);
            }
        });
    };

    const downloadTemplate = () => {
        const csvContent = "adresse,lots,annee\n12 Rue de la Paix,24,1968\n45 Boulevard Foch,12,1982\n8 Avenue de Messine,40,2010";
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "modele_audit_parc.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            <div className="card-bento p-8 group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-bold text-main mb-2">Mass Audit &quot;God View&quot;</h2>
                        <p className="text-muted max-w-xl">
                            Analysez l&apos;ensemble de votre parc en 10 secondes. Identifiez les copropriétés en risque de gel locatif (2025-2028).
                        </p>
                    </div>

                    <button
                        onClick={downloadTemplate}
                        className="btn-secondary text-sm"
                        type="button"
                    >
                        📥 Télécharger le modèle CSV
                    </button>
                </div>

                {/* Affichage des erreurs de validation */}
                {validationErrors.length > 0 && (
                    <div className="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-xl">
                        <h4 className="text-sm font-semibold text-warning-500 mb-2">⚠️ Avertissements de validation</h4>
                        <ul className="text-xs text-muted space-y-1">
                            {validationErrors.map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Erreur fatale */}
                {error && (
                    <div className="mt-6 p-4 bg-danger/10 border border-danger/30 rounded-xl">
                        <p className="text-sm text-danger-500 font-medium">{error}</p>
                    </div>
                )}

                <div className="mt-8">
                    {!isProcessing && results.length === 0 && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-boundary rounded-2xl p-12 text-center cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/5 transition-all group"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".csv,text/csv"
                                className="hidden"
                                aria-label="Importer un fichier CSV"
                            />
                            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-boundary group-hover:scale-110 transition-transform">
                                <span className="text-4xl">📊</span>
                            </div>
                            <p className="text-lg font-bold text-main">Glissez votre fichier CSV ici</p>
                            <p className="text-sm text-muted mt-2">Prise en charge jusqu&apos;à 500 copropriétés</p>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="py-12 text-center">
                            <h3 className="text-xl font-bold text-main mb-6 italic font-serif">
                                Audit de parc en cours...
                            </h3>
                            <div className="max-w-md mx-auto h-2 bg-boundary rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-sm text-muted mt-4 font-mono">{progress}% - Analyse des données DPE & Juridiques</p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* Map View */}
                        <div className="lg:col-span-2">
                            <AngersMap results={results} />
                        </div>

                        {/* Summary View */}
                        <div className="space-y-6">
                            <div className="card-bento p-6 group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
                                <h3 className="text-lg font-bold text-main mb-4">Synthèse du Parc</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-danger/10 rounded-xl border border-danger/20">
                                        <span className="text-sm font-medium text-danger">🚨 Risque Immédiat (G)</span>
                                        <span className="text-xl font-bold text-danger">
                                            {results.filter(r => r.currentDPE === 'G').length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                        <span className="text-sm font-medium text-amber-400">⚠️ Attention (F/E)</span>
                                        <span className="text-xl font-bold text-amber-500">
                                            {results.filter(r => r.currentDPE === 'F' || r.currentDPE === 'E').length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                        <span className="text-sm font-medium text-emerald-400">✅ Conforme (A-D)</span>
                                        <span className="text-xl font-bold text-emerald-500">
                                            {results.filter(r => ['A', 'B', 'C', 'D'].includes(r.currentDPE)).length}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setResults([])}
                                    className="w-full mt-6 btn-ghost text-xs py-2"
                                    type="button"
                                >
                                    🔄 Réinitialiser l&apos;audit
                                </button>
                            </div>

                            <div className="card-bento p-6 group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
                                <h3 className="text-sm font-bold text-muted uppercase mb-4 tracking-wider">Top Priorities</h3>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                    {results
                                        .filter(r => r.compliance.status === 'danger')
                                        .slice(0, 5)
                                        .map(r => (
                                            <div key={r.id} className="p-3 bg-surface rounded-xl border border-boundary flex items-center justify-between group hover:border-danger/30 transition-colors">
                                                <div>
                                                    <p className="text-xs font-bold text-main truncate max-w-[150px]">{r.address}</p>
                                                    <p className="text-[10px] text-danger">Gel locatif : {r.compliance.deadline || 'Immédiat'}</p>
                                                </div>
                                                <span className="text-xs font-black text-danger bg-danger/10 px-2 py-0.5 rounded">G</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
