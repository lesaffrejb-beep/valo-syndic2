"use client";

import { useState } from "react";
import { type DiagnosticResult } from "@/lib/schemas";
import { formatCurrency, formatPercent } from "@/lib/calculator";
import { useBrandStore } from "@/stores/useBrandStore";
import { Presentation } from "lucide-react";

interface DownloadPptxButtonProps {
    result: DiagnosticResult;
    className?: string;
}

/**
 * BOUTON DÉSACTIVÉ — V2 Feature
 * 
 * Ce bouton sera activé dans la V2 avec :
 * - Génération PowerPoint complète
 * - Templates personnalisables par cabinet
 * - Export vers Google Slides / Office 365
 * 
 * TODO: Réactiver après stabilisation pptxgenjs
 * ISSUE: Dépendance lourde, problèmes de build SSR
 */
// Theme colors
const COLORS = {
    gold: "D4B679",
    slate: "1E293B",
    white: "FFFFFF",
    danger: "DC2626",
    success: "16A34A",
    warning: "F59E0B",
    muted: "9CA3AF",
    bg: "0B0C0E",
};

// DPE color mapping
const DPE_COLORS: Record<string, string> = {
    G: "DC2626", F: "EA580C", E: "F59E0B",
    D: "EAB308", C: "84CC16", B: "22C55E", A: "16A34A"
};

export function DownloadPptxButton({ result, className = "" }: DownloadPptxButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const brand = useBrandStore((state) => state.brand);

    const generatePptx = async () => {
        setIsGenerating(true);
        setError(null);

        try {
                // Import dynamique pour éviter d'alourdir le bundle initial
                const { default: PptxGenJS } = await import('pptxgenjs');
                const pptx = new PptxGenJS();

            // Metadata
            pptx.author = brand.agencyName;
            pptx.title = `Diagnostic Patrimonial - ${result.input.address || result.input.city}`;
            pptx.subject = "Audit énergétique et plan de financement";
            pptx.company = brand.agencyName;

            // Define master slide
            pptx.defineSlideMaster({
                title: "MAIN",
                background: { color: COLORS.bg },
                objects: [
                    // Gold accent bar at top
                    { rect: { x: 0, y: 0, w: "100%", h: 0.15, fill: { color: COLORS.gold } } },
                    // Footer
                    {
                        text: {
                            text: `${brand.agencyName} — Diagnostic Patrimonial 2026`,
                            options: { x: 0.5, y: 5.3, w: 9, h: 0.3, fontSize: 8, color: COLORS.muted }
                        }
                    },
                ],
            });

            // ========== SLIDE 1: Title ==========
            const slide1 = pptx.addSlide({ masterName: "MAIN" });

            // Title
            slide1.addText("DIAGNOSTIC PATRIMONIAL", {
                x: 0.5, y: 1.5, w: 9, h: 0.8,
                fontSize: 36, fontFace: "Arial", bold: true, color: COLORS.white,
            });

            // Address
            slide1.addText(result.input.address || `${result.input.postalCode} ${result.input.city}`, {
                x: 0.5, y: 2.3, w: 9, h: 0.5,
                fontSize: 20, fontFace: "Arial", color: COLORS.gold,
            });

            // Key info
            slide1.addText(`${result.input.numberOfUnits} lots • DPE ${result.input.currentDPE} → ${result.input.targetDPE}`, {
                x: 0.5, y: 3, w: 9, h: 0.4,
                fontSize: 16, fontFace: "Arial", color: COLORS.muted,
            });

            // Date
            slide1.addText(new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), {
                x: 0.5, y: 4, w: 9, h: 0.3,
                fontSize: 12, fontFace: "Arial", color: COLORS.muted,
            });

            // ========== SLIDE 2: Situation Actuelle ==========
            const slide2 = pptx.addSlide({ masterName: "MAIN" });

            slide2.addText("SITUATION ACTUELLE", {
                x: 0.5, y: 0.4, w: 9, h: 0.6,
                fontSize: 24, fontFace: "Arial", bold: true, color: COLORS.white,
            });

            // DPE Boxes
            const currentDPEColor = DPE_COLORS[result.input.currentDPE] || COLORS.slate;
            const targetDPEColor = DPE_COLORS[result.input.targetDPE] || COLORS.slate;

            // Current DPE
            slide2.addShape(PptxGenJS.ShapeType.roundRect, {
                x: 1.5, y: 1.5, w: 1.5, h: 1.5,
                fill: { color: currentDPEColor },
                line: { color: currentDPEColor },
            });
            slide2.addText(result.input.currentDPE, {
                x: 1.5, y: 1.7, w: 1.5, h: 1.2,
                fontSize: 48, fontFace: "Arial", bold: true, color: COLORS.white, align: "center",
            });
            slide2.addText("ACTUEL", {
                x: 1.5, y: 1.2, w: 1.5, h: 0.3,
                fontSize: 10, fontFace: "Arial", color: COLORS.muted, align: "center",
            });

            // Arrow
            slide2.addText("→", {
                x: 3.5, y: 1.8, w: 1, h: 1,
                fontSize: 40, fontFace: "Arial", color: COLORS.success, align: "center",
            });

            // Target DPE
            slide2.addShape(PptxGenJS.ShapeType.roundRect, {
                x: 5, y: 1.5, w: 1.5, h: 1.5,
                fill: { color: targetDPEColor },
                line: { color: targetDPEColor },
            });
            slide2.addText(result.input.targetDPE, {
                x: 5, y: 1.7, w: 1.5, h: 1.2,
                fontSize: 48, fontFace: "Arial", bold: true, color: COLORS.white, align: "center",
            });
            slide2.addText("OBJECTIF", {
                x: 5, y: 1.2, w: 1.5, h: 0.3,
                fontSize: 10, fontFace: "Arial", color: COLORS.muted, align: "center",
            });

            // Compliance status
            const complianceColor = result.compliance.isProhibited ? COLORS.danger :
                result.compliance.daysUntilProhibition && result.compliance.daysUntilProhibition < 1095 ? COLORS.warning :
                    COLORS.success;

            slide2.addText(result.compliance.statusLabel, {
                x: 0.5, y: 3.5, w: 9, h: 0.5,
                fontSize: 16, fontFace: "Arial", bold: true, color: complianceColor, align: "center",
            });

            if (result.compliance.prohibitionDate) {
                slide2.addText(`Interdiction de location : ${result.compliance.prohibitionDate.toLocaleDateString("fr-FR")}`, {
                    x: 0.5, y: 4, w: 9, h: 0.4,
                    fontSize: 14, fontFace: "Arial", color: COLORS.muted, align: "center",
                });
            }

            // ========== SLIDE 3: Financement ==========
            const slide3 = pptx.addSlide({ masterName: "MAIN" });

            slide3.addText("PLAN DE FINANCEMENT", {
                x: 0.5, y: 0.4, w: 9, h: 0.6,
                fontSize: 24, fontFace: "Arial", bold: true, color: COLORS.white,
            });

            // Monthly payment hero
            const monthlyPayment = Math.round((result.financing.ecoPtzAmount * 0.1) / (20 * 12));

            slide3.addShape(PptxGenJS.ShapeType.roundRect, {
                x: 2, y: 1.2, w: 6, h: 1.8,
                fill: { color: "1a4d1a" },
                line: { color: COLORS.success, pt: 2 },
            });

            slide3.addText(`${monthlyPayment} €/mois`, {
                x: 2, y: 1.4, w: 6, h: 0.8,
                fontSize: 36, fontFace: "Arial", bold: true, color: COLORS.success, align: "center",
            });
            slide3.addText("pour 100 tantièmes (Éco-PTZ 0% sur 20 ans)", {
                x: 2, y: 2.2, w: 6, h: 0.5,
                fontSize: 12, fontFace: "Arial", color: COLORS.white, align: "center",
            });

            // Financing table
            const tableData = [
                [
                    { text: "Poste", options: { color: COLORS.white, bold: true } },
                    { text: "Montant Global", options: { color: COLORS.white, bold: true, align: "right" } },
                    { text: "Par Lot", options: { color: COLORS.white, bold: true, align: "right" } }
                ],
                [
                    "Coût total travaux HT",
                    formatCurrency(result.financing.totalCostHT),
                    formatCurrency(result.financing.costPerUnit)
                ],
                [
                    "MaPrimeRénov'",
                    `-${formatCurrency(result.financing.mprAmount)}`,
                    `-${formatCurrency(result.financing.mprAmount / result.input.numberOfUnits)}`
                ],
                [
                    "Éco-PTZ (prêt 0%)",
                    formatCurrency(result.financing.ecoPtzAmount),
                    formatCurrency(result.financing.ecoPtzAmount / result.input.numberOfUnits)
                ],
                [
                    "Reste à charge",
                    formatCurrency(result.financing.remainingCost),
                    formatCurrency(result.financing.remainingCostPerUnit)
                ],
            ] as any[];

            slide3.addTable(tableData, {
                x: 0.5, y: 3.3, w: 9,
                fontFace: "Arial",
                fontSize: 11,
                color: COLORS.white,
                fill: { color: "1E293B" },
                border: { pt: 0.5, color: "3E4A5B" },
                colW: [4, 2.5, 2.5],
                rowH: 0.4,
                align: "left",
                valign: "middle",
            });

            // ========== SLIDE 4: Argumentaire ==========
            const slide4 = pptx.addSlide({ masterName: "MAIN" });

            slide4.addText("ARGUMENTAIRE DÉCISIONNEL", {
                x: 0.5, y: 0.4, w: 9, h: 0.6,
                fontSize: 24, fontFace: "Arial", bold: true, color: COLORS.white,
            });

            // Inaction cost box
            slide4.addShape(PptxGenJS.ShapeType.roundRect, {
                x: 0.5, y: 1.2, w: 4.2, h: 2,
                fill: { color: "4a1515" },
                line: { color: COLORS.danger, pt: 2 },
            });
            slide4.addText("⚠️ COÛT DE L'INACTION", {
                x: 0.5, y: 1.3, w: 4.2, h: 0.4,
                fontSize: 12, fontFace: "Arial", bold: true, color: COLORS.danger, align: "center",
            });
            slide4.addText(formatCurrency(result.inactionCost.totalInactionCost), {
                x: 0.5, y: 1.7, w: 4.2, h: 0.8,
                fontSize: 28, fontFace: "Arial", bold: true, color: COLORS.danger, align: "center",
            });
            slide4.addText("sur 3 ans si vous attendez", {
                x: 0.5, y: 2.5, w: 4.2, h: 0.4,
                fontSize: 10, fontFace: "Arial", color: COLORS.muted, align: "center",
            });

            // Green value box
            slide4.addShape(PptxGenJS.ShapeType.roundRect, {
                x: 5.3, y: 1.2, w: 4.2, h: 2,
                fill: { color: "1a4d1a" },
                line: { color: COLORS.success, pt: 2 },
            });
            slide4.addText("📈 GAIN VALEUR VERTE", {
                x: 5.3, y: 1.3, w: 4.2, h: 0.4,
                fontSize: 12, fontFace: "Arial", bold: true, color: COLORS.success, align: "center",
            });
            slide4.addText(`+${formatCurrency(result.valuation.greenValueGain)}`, {
                x: 5.3, y: 1.7, w: 4.2, h: 0.8,
                fontSize: 28, fontFace: "Arial", bold: true, color: COLORS.success, align: "center",
            });
            slide4.addText(`plus-value estimée (${formatPercent(result.valuation.greenValueGainPercent)})`, {
                x: 5.3, y: 2.5, w: 4.2, h: 0.4,
                fontSize: 10, fontFace: "Arial", color: COLORS.muted, align: "center",
            });

            // ROI box
            const roiColor = result.valuation.netROI >= 0 ? COLORS.success : COLORS.danger;
            slide4.addShape(PptxGenJS.ShapeType.roundRect, {
                x: 2, y: 3.5, w: 6, h: 1.2,
                fill: { color: COLORS.slate },
                line: { color: COLORS.gold, pt: 2 },
            });
            slide4.addText("RETOUR SUR INVESTISSEMENT NET", {
                x: 2, y: 3.6, w: 6, h: 0.3,
                fontSize: 10, fontFace: "Arial", color: COLORS.gold, align: "center",
            });
            slide4.addText(`${result.valuation.netROI >= 0 ? "+" : ""}${formatCurrency(result.valuation.netROI)}`, {
                x: 2, y: 3.9, w: 6, h: 0.6,
                fontSize: 28, fontFace: "Arial", bold: true, color: roiColor, align: "center",
            });

            // ========== SLIDE 5: Call to Action ==========
            const slide5 = pptx.addSlide({ masterName: "MAIN" });

            slide5.addText("PROCHAINES ÉTAPES", {
                x: 0.5, y: 0.4, w: 9, h: 0.6,
                fontSize: 24, fontFace: "Arial", bold: true, color: COLORS.white,
            });

            // Key phrase
            slide5.addShape(PptxGenJS.ShapeType.roundRect, {
                x: 0.5, y: 1.2, w: 9, h: 1.8,
                fill: { color: "2d2a1a" },
                line: { color: COLORS.gold, pt: 2 },
            });
            slide5.addText("💡 L'ARGUMENT CLÉ", {
                x: 0.5, y: 1.3, w: 9, h: 0.3,
                fontSize: 10, fontFace: "Arial", bold: true, color: COLORS.gold, align: "center",
            });
            slide5.addText(
                "\"En votant cette résolution aujourd'hui, vous sécurisez la valeur locative de vos biens et bénéficiez d'aides qui ne seront plus disponibles demain. C'est un investissement patrimonial, pas une dépense.\"",
                {
                    x: 0.7, y: 1.7, w: 8.6, h: 1.1,
                    fontSize: 14, fontFace: "Arial", italic: true, color: COLORS.white, align: "center",
                }
            );

            // Steps
            const steps = [
                "1. Voter la résolution de lancement des travaux",
                "2. Mandater le syndic pour le dépôt MaPrimeRénov' Copro",
                "3. Solliciter l'Éco-PTZ collectif auprès de la banque partenaire",
            ];

            steps.forEach((step, i) => {
                slide5.addText(step, {
                    x: 1, y: 3.3 + i * 0.5, w: 8, h: 0.4,
                    fontSize: 14, fontFace: "Arial", color: COLORS.white,
                });
            });

            // Contact
            slide5.addText(`${brand.agencyName} — ${brand.contactEmail}`, {
                x: 0.5, y: 4.8, w: 9, h: 0.3,
                fontSize: 12, fontFace: "Arial", color: COLORS.gold, align: "center",
            });

            // Data sources attribution
            slide5.addText("Sources : DVF Etalab (prix) • API Adresse data.gouv.fr • ADEME (DPE) • BDNB CSTB (bâti)", {
                x: 0.5, y: 5.2, w: 9, h: 0.2,
                fontSize: 8, fontFace: "Arial", color: COLORS.muted, align: "center",
            });

            // Generate and download
            await pptx.writeFile({ fileName: `diagnostic-${result.input.postalCode}-${Date.now()}.pptx` });

        } catch (err) {
            console.error("Erreur génération PPTX:", err);
            setError("Erreur lors de la génération. Veuillez réessayer.");
        } finally {
            setIsGenerating(false);
        }
    };



    const v2Badge = (
        <span className="absolute -top-1.5 -right-1.5 rounded-full bg-black text-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.35)]">
            V2
        </span>
    );

    return (
        <div className="relative">
            <button
                onClick={generatePptx}
                disabled={isGenerating}
                className={`relative btn-secondary flex items-center justify-center gap-3 ${className}`}
                title="Télécharger présentation PowerPoint"
            >
                {isGenerating ? (
                    <>
                        <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="hidden sm:inline">Génération...</span>
                        {v2Badge}
                    </>
                ) : (
                    <>
                        <Presentation className="w-5 h-5 text-current" />
                        <span className="hidden sm:inline">PowerPoint</span>
                        {v2Badge}
                    </>
                )}
            </button>
            {error && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-danger/20 border border-danger/30 rounded-lg text-xs text-danger-500 text-center">
                    {error}
                </div>
            )}
        </div>
    );
}
