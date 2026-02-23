"use client";

/**
 * VALO-SYNDIC — Modal "Notre méthode d'ingénierie financière"
 * ===========================================================
 * Transparence totale sur les formules, valeurs et textes réglementaires
 * utilisés par le moteur de calcul. Destiné aux experts-comptables, syndics
 * professionnels et toute personne souhaitant vérifier la rigueur des calculs.
 *
 * Mise à jour : Février 2026
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

// ─── Accordion section ───────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = false }: SectionProps) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left gap-3"
            >
                <span className="text-xs font-bold uppercase tracking-[0.06em] text-oxford leading-snug">{title}</span>
                <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
                    strokeWidth={2}
                />
            </button>
            {open && (
                <div className="px-4 py-4 space-y-3 text-sm text-slate bg-white border-t border-border">
                    {children}
                </div>
            )}
        </div>
    );
}

// ─── Formula block ────────────────────────────────────────────────────────────

function Formula({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-2 px-4 py-3 bg-slate-50 border border-border rounded font-mono text-[11px] sm:text-[12px] text-oxford leading-relaxed overflow-x-auto">
            {children}
        </div>
    );
}

// ─── Ref badge ────────────────────────────────────────────────────────────────

function Ref({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-navy/10 text-navy border border-navy/20 font-mono">
            {children}
        </span>
    );
}

// ─── Value row ────────────────────────────────────────────────────────────────

function ValRow({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <div className="py-1.5 border-b border-dashed border-slate-200 last:border-0">
            <div className="flex items-start justify-between gap-3">
                <span className="text-[12px] text-slate leading-snug flex-1">{label}</span>
                <span className="text-[12px] font-semibold text-oxford tabular-nums flex-shrink-0 text-right">{value}</span>
            </div>
            {note && (
                <span className="block text-[10px] text-subtle italic leading-snug mt-0.5">{note}</span>
            )}
        </div>
    );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function MethodologieModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-oxford/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[92vh] animate-fadeInUp">

                {/* Header */}
                <div className="flex items-start justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-border bg-white flex-shrink-0 gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-0.5 h-5 bg-navy rounded-full flex-shrink-0" />
                            <h2 className="font-serif text-base sm:text-xl font-bold text-oxford leading-snug">
                                Notre méthode d&rsquo;ingénierie financière
                            </h2>
                        </div>
                        <p className="text-[11px] text-subtle ml-3.5">
                            Formules, valeurs réglementaires et textes de référence — Février 2026
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-1 -mt-1 text-slate hover:text-oxford hover:bg-slate-50 rounded-full transition-colors flex-shrink-0"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-4 sm:px-6 py-5 overflow-y-auto space-y-3 flex-1">

                    {/* ── Avertissement général ── */}
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800 leading-relaxed">
                        <strong>Simulation indicative.</strong> Les résultats sont des estimations fondées sur les
                        barèmes légaux en vigueur au 1er février 2026. Ils ne constituent pas un engagement
                        contractuel. Toute subvention est soumise à instruction de dossier par l&rsquo;ANAH.
                        Validation obligatoire auprès d&rsquo;un conseiller agréé OPQIBI 1905 avant engagement.
                    </div>

                    {/* ══════════════════════════════════════════════════════════
                        1. STRUCTURE DU BUDGET TTC
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="1. Structure du budget TTC — Ticket de caisse" defaultOpen>
                        <p className="text-[12px] leading-relaxed">
                            Le budget total TTC est la somme de <strong>six lignes distinctes</strong>, chacune
                            soumise à sa propre TVA. Le moteur n&rsquo;additionne jamais des montants HT et TTC
                            ensemble <Ref>BOI-TVA-LIQ-30-20-95</Ref>.
                        </p>

                        <Formula>
                            Total TTC = Travaux HT × 1,055<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ Honoraires Syndic HT × 1,20<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ Assurance DO HT × 1,09<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ Provision Aléas HT × 1,055<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ AMO Ingénierie HT × 1,20<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ Travaux amélioration HT × 1,10
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="TVA travaux énergétiques" value="5,5 %" note="Art. 279-0 bis A CGI — logements > 2 ans" />
                            <ValRow label="TVA travaux amélioration non-énergétiques" value="10 %" note="Art. 279-0 bis CGI" />
                            <ValRow label="TVA honoraires syndic / AMO" value="20 %" note="Régime normal" />
                            <ValRow label="TVA assurance Dommages-Ouvrage" value="9 %" note="Taxe sur conventions d'assurance — Art. 991 CGI" />
                            <ValRow label="Honoraires Syndic (forfait)" value="3 % HT des travaux" note="Loi 65-557, Art. 18-1 A — remplaçable par montant saisi" />
                            <ValRow label="Assurance DO (forfait)" value="2 % HT des travaux" note="Dommages-Ouvrage obligatoire" />
                            <ValRow label="Provision Aléas" value="5 % HT des travaux" note="Imprévus de chantier — TVA latente 5,5 % intégrée" />
                            <ValRow label="AMO Ingénierie" value="600 € HT / lot" note="Forfait moyen — plafond ANAH 500 €/lot (≤20 lots), 300 € (>20 lots)" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            Les honoraires syndic et les travaux d&rsquo;amélioration sont <strong>hors assiette MPR et Éco-PTZ</strong> :
                            ils ne peuvent pas être subventionnés ni inclus dans le prêt collectif.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        2. MAPRIMERENOV' COPROPRIÉTÉ
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="2. MaPrimeRénov' Copropriété (MPR) — ANAH 2026">
                        <p className="text-[12px] leading-relaxed">
                            Aide de l&rsquo;ANAH calculée sur les <strong>travaux HT purs (hors honoraires et
                                frais annexes)</strong>. Versée au syndicat après validation du dossier.
                        </p>

                        <Formula>
                            MPR = min(Travaux HT × Taux MPR, Plafond par lot × Nombre de lots résidentiels)<br /><br />
                            Taux MPR = Taux de base + Bonus Sortie Passoire + Bonus Copropriété Fragile<br />
                            Taux de base = 30 % si gain ≥ 35 % et gain &lt; 50 %<br />
                            Taux de base = 45 % si gain ≥ 50 %<br />
                            Taux de base =  0 % si gain &lt; 35 % (non éligible)<br />
                            Bonus Sortie Passoire = +10 % si DPE initial F ou G → D ou mieux<br />
                            Bonus Copropriété Fragile = +20 % (Impayés ≥ 8% ou NPNRU) — Cession CEE à l&apos;ANAH
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Taux standard (gain 35–50 %)" value="30 %" note="Art. D. 321-13 CCH" />
                            <ValRow label="Taux haute performance (gain > 50 %)" value="45 %" note="Art. D. 321-13 CCH" />
                            <ValRow label="Bonus sortie de passoire (F/G → D ou mieux)" value="+10 %" note="Décret n° 2022-510" />
                            <ValRow label="Bonus Copropriété Fragile" value="+20 %" note="Plafonné à 65% globalement (Instruction ANAH 2023 §6)" />
                            <ValRow label="Plafond assiette par lot résidentiel" value="25 000 € HT" note="Guide ANAH — Édition Février 2026" />
                            <ValRow label="Gain énergétique minimum d'éligibilité" value="≥ 35 %" note="Condition sine qua non" />
                        </div>

                        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                            <strong>Statut 2026 :</strong> MaPrimeRénov&rsquo; Copropriété techniquement
                            suspendue au 1er janvier 2026 (absence de Loi de Finances promulguée).
                            Le montant affiché en &laquo; Plan Optimisé &raquo; est conditionnel à la
                            publication des décrets d&rsquo;application.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        3. PRIMES INDIVIDUELLES ANAH
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="3. Primes individuelles ANAH (Profils Modestes)">
                        <p className="text-[12px] leading-relaxed">
                            Aides complémentaires versées au syndicat mais <strong>déduites individuellement</strong>{" "}
                            de la quote-part des copropriétaires éligibles (résidence principale uniquement).
                        </p>

                        <Formula>
                            Prime Profil Bleu (Très Modeste) = 3 000 € / logement<br />
                            Prime Profil Jaune (Modeste) = 1 500 € / logement<br />
                            Autres profils (Intermédiaire, Supérieur) = 0 €
                        </Formula>

                        <p className="text-[11px] font-semibold text-oxford uppercase tracking-wide mt-2">Barèmes RFR — Province (1 → 5 personnes)</p>
                        <div className="space-y-1">
                            <ValRow label="Très Modeste (Bleu) — 1 pers." value="≤ 17 363 €" note="Revenu Fiscal de Référence annuel" />
                            <ValRow label="Très Modeste (Bleu) — 2 pers." value="≤ 25 393 €" />
                            <ValRow label="Très Modeste (Bleu) — 3 pers." value="≤ 30 540 €" />
                            <ValRow label="Très Modeste (Bleu) — 4 pers." value="≤ 35 676 €" note="+5 151 € par personne supplémentaire" />
                            <ValRow label="Modeste (Jaune) — 1 pers." value="≤ 22 259 €" />
                            <ValRow label="Modeste (Jaune) — 2 pers." value="≤ 32 553 €" />
                            <ValRow label="Modeste (Jaune) — 3 pers." value="≤ 39 148 €" note="+6 598 € par personne supplémentaire" />
                        </div>

                        <p className="text-[11px] font-semibold text-oxford uppercase tracking-wide mt-2">Barèmes RFR — Île-de-France (1 → 3 personnes)</p>
                        <div className="space-y-1">
                            <ValRow label="Très Modeste (Bleu) — 1 pers." value="≤ 24 031 €" note="Revenu Fiscal de Référence annuel" />
                            <ValRow label="Très Modeste (Bleu) — 2 pers." value="≤ 35 270 €" />
                            <ValRow label="Très Modeste (Bleu) — 3 pers." value="≤ 42 357 €" note="+7 116 € par personne supplémentaire" />
                            <ValRow label="Modeste (Jaune) — 1 pers." value="≤ 29 253 €" />
                            <ValRow label="Modeste (Jaune) — 2 pers." value="≤ 42 933 €" />
                            <ValRow label="Modeste (Jaune) — 3 pers." value="≤ 51 564 €" note="+8 663 € par personne supplémentaire" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            Source : Guide des aides financières de l&rsquo;ANAH, Édition Février 2026.
                            Ces primes sont exclues si le propriétaire bénéficie d&rsquo;une aide type Loc&apos;Avantages
                            ou si le logement est une résidence secondaire.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        4. MAPRIMEADAPT' (PARTIES COMMUNES)
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="4. MaPrimeAdapt' (Parties communes)">
                        <p className="text-[12px] leading-relaxed">
                            Aide de l&rsquo;ANAH destinée à financer les travaux d&rsquo;<strong>accessibilité sur les parties communes</strong> (ascenseurs, rampes, élargissement de portes).
                        </p>

                        <Formula>
                            Subvention MaPrimeAdapt' = min(Coût des travaux d'accessibilité, 10 000 €)
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Aide maximale par copropriété" value="10 000 €" note="ANAH Panorama des aides 2025" />
                            <ValRow label="Cumulabilité" value="Oui" note="Cumulable avec MPR Copropriété" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            Nécessite la présence d&rsquo;au moins un bénéficiaire éligible : personne ≥ 70 ans, personne de 60–69 ans avec GIR 1–4, ou personne avec taux d&rsquo;incapacité ≥ 50%.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        5. PRÊT AVANCE MUTATION (PAR+)
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="5. Prêt Avance Mutation (PAR+)">
                        <p className="text-[12px] leading-relaxed">
                            Prêt hypothécaire à <strong>taux 0 %</strong> destiné aux copropriétaires modestes (Profils Bleu et Jaune) pour financer le reste à charge de leurs <strong>parties privatives</strong> sans effort de trésorerie immédiat.
                        </p>

                        <Formula>
                            Remboursement du capital = In fine (lors de la vente ou succession)<br />
                            Taux d'intérêt = 0 % (pendant 10 ans, pris en charge par l'État)
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Plafond (Rénovation globale)" value="50 000 €" note="CGI Art. 244 quater U" />
                            <ValRow label="Plafond (Bouquet 2 gestes)" value="25 000 €" note="" />
                            <ValRow label="Plafond (1 geste isol. autre)" value="15 000 €" note="" />
                            <ValRow label="Plafond (Parois vitrées seules)" value="7 000 €" note="" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            Incompatible avec l&rsquo;éco-PTZ sur les mêmes postes de travaux. Valable uniquement pour le financement des quotes-parts de travaux privatifs / intérêt collectif.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        6. LOTS COMMERCIAUX — EXCLUSION MPR
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="6. Lots commerciaux — Exclusion de l'assiette MPR">
                        <p className="text-[12px] leading-relaxed">
                            MaPrimeRénov&rsquo; Copropriété ne subventionne que les <strong>lots résidentiels</strong>.
                            Les lots commerciaux (bureaux, commerces, caves non aménagées) sont exclus de l&rsquo;assiette et
                            du plafond de calcul de l&rsquo;aide.
                        </p>

                        <Formula>
                            Lots résidentiels = Nombre de lots total − Lots commerciaux<br />
                            Assiette MPR = Travaux HT × Taux MPR (appliqué sur lots résidentiels uniquement)<br />
                            Plafond MPR = 25 000 € HT × Lots résidentiels
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Critère d'exclusion" value="Tout lot non-résidentiel" note="Bureaux, commerces, parkings seuls, caves non aménagées" />
                            <ValRow label="Impact" value="Réduction de l'assiette et du plafond MPR" note="Le RAC commercial est intégralement à la charge des copropriétaires concernés" />
                        </div>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        7. TRAVAUX D'AMÉLIORATION NON-ÉNERGÉTIQUE
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="7. Travaux d'amélioration non-énergétique (TVA 10 %)">
                        <p className="text-[12px] leading-relaxed">
                            Travaux d&rsquo;amélioration standard <strong>sans lien direct avec la performance énergétique</strong>{" "}
                            (ballons d&rsquo;eau chaude, ravalement sans isolation, escaliers…). Soumis à la TVA 10 % <Ref>Art. 279-0 bis CGI</Ref>.
                        </p>

                        <Formula>
                            Montant TTC = Travaux amélioration HT × 1,10<br />
                            → Non éligible à MPR Copropriété<br />
                            → Non éligible à l&apos;Éco-PTZ collectif<br />
                            → Appel de fonds direct en AG (Loi 65)
                        </Formula>

                        <p className="text-[11px] text-subtle italic">
                            Ces travaux ne peuvent pas être subventionnés ni inclus dans le prêt collectif.
                            Ils sont appelés immédiatement au comptant lors de l&rsquo;assemblée générale.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        8. FONDS DE TRAVAUX ALUR
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="8. Fonds de Travaux ALUR — Trésorerie utilisable">
                        <p className="text-[12px] leading-relaxed">
                            La Loi ALUR (2014) oblige les syndicats à constituer un <strong>fonds de travaux annuel</strong>{" "}
                            d&rsquo;au moins 5 % du budget prévisionnel. Ce fonds peut être mobilisé comme apport initial
                            et vient en déduction du Reste à Financer avant l&rsquo;Éco-PTZ.
                        </p>

                        <Formula>
                            Reste à Financer (RAF) = Reste à Charge Global<br />
                            &nbsp;&nbsp;− MaPrimeRénov&apos; (a posteriori)<br />
                            &nbsp;&nbsp;− CEE (a posteriori)<br />
                            &nbsp;&nbsp;− Subvention AMO<br />
                            &nbsp;&nbsp;− Aides locales<br />
                            &nbsp;&nbsp;− <strong>Fonds ALUR mobilisés</strong><br />
                            = Base Éco-PTZ (solde à financer par le prêt collectif)
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Obligation légale" value="≥ 5 % du budget prévisionnel / an" note="Loi ALUR — Art. 14-2, Loi 65-557" />
                            <ValRow label="Utilisation" value="Apport immédiat avant Éco-PTZ" note="Réduit le capital emprunté → mensualités allégées" />
                        </div>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        9. HONORAIRES SYNDIC
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="9. Honoraires Syndic — Hors subventions et prêt collectif">
                        <p className="text-[12px] leading-relaxed">
                            Les honoraires syndic liés au suivi du chantier (coordination, AG extraordinaires, avances de trésorerie)
                            sont soumis à la <strong>TVA 20 %</strong> et sont <strong>strictement exclus</strong> de toute
                            subvention et de l&rsquo;Éco-PTZ <Ref>Loi 65-557 Art. 18-1 A</Ref>.
                        </p>

                        <Formula>
                            Honoraires Syndic TTC = Honoraires HT × 1,20<br />
                            Forfait par défaut = 3 % des Travaux HT<br />
                            → Toujours appelé au comptant (appel de fonds direct AG)
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="TVA applicable" value="20 %" note="Régime normal — Art. 256 CGI" />
                            <ValRow label="Forfait par défaut" value="3 % des travaux HT" note="Remplaçable par le montant réel saisi dans le formulaire" />
                            <ValRow label="Éligibilité MPR" value="Non" note="Hors assiette ANAH" />
                            <ValRow label="Éligibilité Éco-PTZ" value="Non" note="CGI Art. 244 quater U — seuls les travaux et l'AMO sont éligibles" />
                        </div>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        10. SYSTÈME DE CHAUFFAGE — RISQUE FOSSILE
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="10. Système de chauffage — Signal de risque fossile">
                        <p className="text-[12px] leading-relaxed">
                            Le moteur détecte si le bâtiment utilise un chauffage au <strong>gaz ou au fioul</strong>.
                            Ces énergie fossiles exposent la copropriété à un risque de double dépréciation :{" "}
                            prix de l&rsquo;énergie et décote DPE cumulés.
                        </p>

                        <div className="space-y-1">
                            <ValRow label="Chauffage gaz / fioul" value="Signal risque fossile activé" note="Mention explicite dans le rapport — vigilance renforcée" />
                            <ValRow label="Impact valorisation" value="Décote additionnelle estimée" note="Les acheteurs pénalisent les logements à chaudière fossile au-delà du DPE seul" />
                            <ValRow label="Chauffage électrique / bois / réseau" value="Pas de signal négatif" note="" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            En cas de rénovation globale, le remplacement du vecteur énergétique (gaz → pompe à chaleur)
                            peut déclencher des bonus CEE supplémentaires non captés dans cette estimation conservatrice.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        11. GAIN ÉNERGÉTIQUE (DPE)
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="11. Gain énergétique — Calcul DPE">
                        <p className="text-[12px] leading-relaxed">
                            Le gain est estimé à partir des <strong>consommations moyennes par classe DPE</strong>
                            (kWh/m²/an en énergie primaire), conformément au référentiel 3CL-DPE 2021.
                        </p>

                        <Formula>
                            Gain énergétique % = (Conso DPE actuel − Conso DPE cible) / Conso DPE actuel
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="DPE G — consommation moyenne" value="450 kWh/m²/an" />
                            <ValRow label="DPE F" value="350 kWh/m²/an" />
                            <ValRow label="DPE E" value="280 kWh/m²/an" />
                            <ValRow label="DPE D" value="210 kWh/m²/an" />
                            <ValRow label="DPE C" value="150 kWh/m²/an" />
                            <ValRow label="DPE B" value="90 kWh/m²/an" />
                            <ValRow label="DPE A" value="50 kWh/m²/an" />
                        </div>
                        <p className="text-[11px] text-subtle italic">
                            Exemple : F → C = (350 − 150) / 350 = <strong>57 %</strong> de gain → taux MPR 45 % + bonus sortie passoire +10 % = <strong>55 % de subvention</strong>.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        12. CEE
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="12. CEE — Certificats d'Économie d'Énergie">
                        <p className="text-[12px] leading-relaxed">
                            Les CEE sont des primes versées par des fournisseurs d&rsquo;énergie (obligés) en
                            contrepartie de la réalisation de travaux d&rsquo;efficacité énergétique. Le
                            montant est contractualisé avec un opérateur selon les fiches standardisées
                            ATEE / PNCEE.
                        </p>

                        <Formula>
                            CEE = min(Travaux HT × 8 %, Plafond par lot × Nombre de lots)
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Taux estimé conservateur" value="8 % des travaux HT" note="Taux moyen de marché 2025-2026" />
                            <ValRow label="Plafond par lot (rénovation globale)" value="5 000 €" note="Source PNCEE 2026" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            Le montant réel des CEE n&rsquo;est fixé qu&rsquo;au moment de la signature du
                            contrat avec l&rsquo;opérateur, en fonction du volume de kWh cumac générés
                            par les travaux. L&rsquo;estimation à 8 % est conservatrice. En cas de Copropriété Fragile, les CEE sont cédés à l&apos;ANAH (valeur 0 € pour le syndicat).
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        13. AMO
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="13. AMO — Assistance à Maîtrise d'Ouvrage">
                        <p className="text-[12px] leading-relaxed">
                            L&rsquo;AMO accompagne le syndicat dans le montage du dossier ANAH,
                            la coordination des travaux et le suivi financier. L&rsquo;ANAH subventionne
                            50 % du coût AMO <Ref>Art. L. 321-1 CCH</Ref>.
                        </p>

                        <Formula>
                            Coût AMO HT = 600 € × Nombre de lots<br />
                            Assiette subventionnable = min(Coût AMO, Plafond global)<br />
                            Subvention AMO = min(Assiette × 50 %, Coût AMO réel)
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Forfait AMO par lot" value="600 € HT" note="Coût marché moyen" />
                            <ValRow label="Taux de prise en charge ANAH" value="50 %" note="Art. L. 321-1 CCH" />
                            <ValRow label="Plafond par lot (≤ 20 lots)" value="500 € HT" note="Guide ANAH — Fév. 2026" />
                            <ValRow label="Plafond par lot (> 20 lots)" value="300 € HT" note="Guide ANAH — Fév. 2026" />
                            <ValRow label="Montant minimum global" value="3 000 €" note="Plancher garantie ANAH" />
                        </div>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        14. ÉCO-PTZ COPROPRIÉTÉ
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="14. Éco-PTZ Copropriété — Prêt collectif à taux zéro">
                        <p className="text-[12px] leading-relaxed">
                            Prêt sans intérêts souscrit par le syndicat et remboursé par les copropriétaires
                            via les charges. Il finance le <strong>Reste à Financer après subventions</strong>,
                            dans la limite des plafonds légaux <Ref>CGI Art. 244 quater U</Ref>.
                        </p>

                        <Formula>
                            Assiette Éco-PTZ TTC = (Travaux HT + AMO nette HT) × 1,055<br />
                            RAC éligible = min(RAC total, Assiette Éco-PTZ − MPR − CEE)<br />
                            Montant Éco-PTZ = min(RAC éligible, Plafond total − Frais garantie)<br />
                            Mensualité = Montant Éco-PTZ / 240<br />
                            Reste au comptant = RAC total − Montant Éco-PTZ
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Taux d'intérêt" value="0 %" note="Taux bonifié État" />
                            <ValRow label="Durée maximale" value="240 mois (20 ans)" note="Rénovation globale" />
                            <ValRow label="Plafond par lot — gain ≥ 35 %" value="50 000 €" note="Rénovation globale — CGI Art. 244 quater U" />
                            <ValRow label="Plafond par lot — gain < 35 %" value="30 000 €" note="Rénovation partielle" />
                            <ValRow label="Frais de garantie forfaitaires" value="500 €" note="Art. R. 312-11 Code Consommation — banques conventionnées" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            L&rsquo;assiette Éco-PTZ exclut les honoraires syndic (TVA 20 %), l&rsquo;assurance
                            Dommages-Ouvrage (9 %) et les provisions aléas — ces postes sont couverts
                            uniquement par l&rsquo;appel de fonds direct en AG.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        15. RESTE À CHARGE — WATERFALL
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="15. Calcul du Reste à Charge — Cascade financière">
                        <p className="text-[12px] leading-relaxed">
                            Le moteur applique une <strong>cascade (waterfall)</strong> pour répartir le
                            financement dans un ordre logique réglementaire et budgétaire.
                        </p>

                        <Formula>
                            Appel de fonds AG = Total TTC (préfinancement Loi 65)<br /><br />
                            − MaPrimeRénov&apos; Copropriété (versée a posteriori par ANAH)<br />
                            − CEE (versés par l&apos;opérateur)<br />
                            − Subvention AMO (50 % du coût AMO)<br />
                            − Aides locales (ex. Mieux chez moi, ALM)<br />
                            − Fonds travaux ALUR (trésorerie dormante)<br />
                            = Reste à Financer (RAF)<br /><br />
                            RAF = Éco-PTZ collectif + Reste au comptant (appel immédiat)
                        </Formula>

                        <p className="text-[11px] text-subtle italic">
                            Les aides (MPR, CEE, AMO) sont versées <strong>a posteriori</strong>.
                            Le syndicat préfinance la totalité via l&rsquo;appel de fonds initial (Loi du
                            10 juillet 1965, Art. 14-2). Aucune déduction anticipée n&rsquo;est possible
                            sans accord explicite de l&rsquo;assemblée générale.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        16. DÉFICIT FONCIER
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="16. Déficit Foncier — Avantage fiscal Bailleurs">
                        <p className="text-[12px] leading-relaxed">
                            Mécanisme fiscal réservé aux <strong>bailleurs au régime réel</strong>
                            (propriétaires qui louent et déclarent leurs revenus fonciers réels,
                            pas le micro-foncier). Permet de déduire le coût des travaux de rénovation
                            du revenu global ou des revenus fonciers <Ref>CGI Art. 156-I-3°</Ref>.
                        </p>

                        <Formula>
                            Assiette déductible / lot = (HT Éligible − Subventions reçues) / Nombre de lots<br /><br />
                            HT Éligible (Exclusion stricte de la TVA)<br />
                            &nbsp;&nbsp;= Travaux HT + Assurance DO HT + AMO HT<br />
                            Subventions reçues<br />
                            &nbsp;&nbsp;= MPR reçue + CEE reçus + Subvention AMO + Aides locales<br /><br />
                            Imputation revenu global = min(Assiette, Plafond applicable)<br />
                            Économie fiscale (revenu global) = Imputation × TMI<br />
                            Économie fiscale (revenus fonciers) = Excédent × (TMI + 17,2 %)
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Plafond standard" value="10 700 € / an / lot" note="CGI Art. 156-I-3° — droit commun" />
                            <ValRow label="Plafond dérogatoire LdF 2026" value="21 400 € / an / lot" note="DPE F ou G → D ou mieux + devis avant 31/12/2026 (3 conditions cumulatives)" />
                            <ValRow label="TMI retenu par défaut" value="30 %" note="Tranche marginale d'imposition — ajustable" />
                            <ValRow label="Prélèvements sociaux (revenus fonciers)" value="17,2 %" note="CSG, CRDS, prélèvements divers" />
                            <ValRow label="Taux effectif total (TMI + PS)" value="47,2 %" note="Sur revenus fonciers : TMI 30 % + PS 17,2 %" />
                            <ValRow label="Conditions plafond dérogatoire" value="3 cumulatives" note="① DPE initial F ou G ② DPE cible A/B/C/D ③ Devis signé avant 31/12/2026" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            L&rsquo;excédent non imputé sur le revenu global est reportable sur les
                            revenus fonciers des <strong>10 années suivantes</strong>.
                            Source BOFiP : BOI-RFPI-BASE-20-60.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        17. VALEUR VERTE
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="17. Valeur Verte — Valorisation patrimoniale">
                        <p className="text-[12px] leading-relaxed">
                            La &laquo; Valeur Verte &raquo; est la <strong>plus-value patrimoniale</strong>
                            apportée par l&rsquo;amélioration du DPE, documentée par les études des Notaires
                            de France sur les transactions immobilières.
                        </p>

                        <Formula>
                            Valeur actuelle = Surface totale (m²) × Prix moyen au m²<br />
                            Gain Valeur Verte = Valeur actuelle × Taux de valorisation<br />
                            Valeur projetée = Valeur actuelle + Gain Valeur Verte<br /><br />
                            ROI net = Gain Valeur Verte − Reste au comptant
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Valorisation haute performance (gain &gt; 50 %)" value="+12 %" note="Passage F → C ou mieux — Notaires de France" />
                            <ValRow label="Valorisation standard (gain 35–50 %)" value="+8 %" note="Rénovation significative" />
                            <ValRow label="Valorisation faible (gain &lt; 35 %)" value="0 %" note="Non significatif" />
                            <ValRow label="Prix m² par défaut (fallback)" value="3 500 € / m²" note="Moyenne conservatrice Angers/Nantes — remplaçable par prix saisi" />
                            <ValRow label="Surface par lot (fallback)" value="65 m²" note="Estimée si non renseignée" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            Hypothèse conservatrice. Les transactions réelles peuvent s&rsquo;écarter
                            significativement selon la localisation. Le taux de 12 % est documenté en
                            zones tendues (Île-de-France, métropoles) pour les biens énergivores.
                            Source : Études des Notaires de France, décembre 2025.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        18. COÛT DE L'INACTION
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="18. Coût de l'inaction — Impact du report à 3 ans">
                        <p className="text-[12px] leading-relaxed">
                            Si le syndicat ne vote pas les travaux aujourd&rsquo;hui, deux effets cumulatifs
                            s&rsquo;aggravent : l&rsquo;<strong>inflation des coûts BTP</strong> et
                            l&rsquo;<strong>érosion de la valeur verte</strong> par rapport aux biens
                            déjà rénovés sur le marché.
                        </p>

                        <Formula>
                            Surcoût travaux (3 ans) = Budget × [(1 + 2 %)³ − 1]<br />
                            Érosion valeur verte (DPE F ou G uniquement) = Valeur actuelle × 12 % × [(1 + 1,5 %)³ − 1]
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Inflation annuelle BTP (Indice BT01)" value="2,0 % / an" note="INSEE — Série 001710986, Nov. 2025 + marge de sécurité" />
                            <ValRow label="Drift Valeur Verte (aggravation décote)" value="1,5 % / an" note="Écart de valorisation qui se creuse" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            L&rsquo;érosion de valeur verte s&rsquo;applique uniquement aux DPE F et G
                            (passoires thermiques). Pour les DPE E, D et mieux, le bâtiment n&rsquo;est
                            pas encore soumis à cette dynamique de &laquo; double peine &raquo;.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        19. CALENDRIER LOI CLIMAT
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="19. Loi Climat & Résilience — Calendrier d'interdictions">
                        <p className="text-[12px] leading-relaxed">
                            La Loi Climat &amp; Résilience du 22 août 2021 <Ref>n° 2021-1104</Ref> instaure
                            un calendrier progressif d&rsquo;interdiction de location des logements
                            énergivores, renforcé par les décrets d&rsquo;application 2022-2023.
                        </p>

                        <div className="space-y-1">
                            <ValRow label="DPE G" value="Interdit depuis le 1er janv. 2025" note="Location nouvelle et renouvellement" />
                            <ValRow label="DPE F" value="Interdiction au 1er janv. 2028" note="" />
                            <ValRow label="DPE E" value="Interdiction au 1er janv. 2034" note="" />
                            <ValRow label="DPE D et mieux" value="Conforme — pas d'échéance" note="" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            En copropriété, l&rsquo;interdiction s&rsquo;applique lot par lot.
                            Un syndicat avec des logements G peut perdre des locataires avant la
                            fin des travaux — risque de vacance locative et de perte de valeur.
                        </p>
                    </Section>

                    {/* ══════════════════════════════════════════════════════════
                        20. ESTIMATION AUTOMATIQUE DU BUDGET
                        ══════════════════════════════════════════════════════════ */}
                    <Section title="20. Estimation automatique du budget travaux">
                        <p className="text-[12px] leading-relaxed">
                            Si aucun budget n&rsquo;est saisi dans le formulaire, le moteur estime
                            automatiquement le coût des travaux à partir de la surface totale.
                        </p>

                        <Formula>
                            Budget auto HT = (Nombre de lots × Surface moyenne / lot) × Coût au m²<br />
                            Surface par lot par défaut = 65 m²<br />
                            Coût au m² (Rénovation globale) = 1 350 € HT / m²
                        </Formula>

                        <div className="space-y-1">
                            <ValRow label="Surface moyenne par lot (fallback)" value="65 m²" note="Si non renseignée" />
                            <ValRow label="Coût rénovation globale au m²" value="1 350 € HT" note="Estimation marché 2026 — Rénovation globale copropriété" />
                        </div>

                        <p className="text-[11px] text-subtle italic">
                            Cette estimation est conservatrice. Elle peut être remplacée par le
                            montant réel issu d&rsquo;un devis ou d&rsquo;une étude thermique.
                            Pour les petites copropriétés urbaines en zone tendue, le coût réel
                            peut atteindre 1 800–2 200 € HT / m².
                        </p>
                    </Section>

                    {/* Footer source */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] text-subtle leading-relaxed">
                        <strong className="text-slate-600">Sources réglementaires de référence :</strong><br />
                        CGI — Code Général des Impôts (Art. 156-I-3°, 244 quater U, 279-0 bis, 991) ·
                        CCH — Code de la Construction et de l&rsquo;Habitation (Art. D. 321-13, L. 321-1) ·
                        Loi n° 65-557 du 10 juillet 1965 (Statut de la copropriété) ·
                        Loi n° 2021-1104 du 22 août 2021 (Loi Climat &amp; Résilience) ·
                        BOFiP — Bulletin Officiel des Finances Publiques ·
                        Guide des aides financières ANAH, Édition Février 2026 ·
                        INSEE — Indice BT01 (Novembre 2025) ·
                        Notaires de France — Études de marché Décembre 2025.
                    </div>

                </div>

                {/* Footer */}
                <div className="px-4 sm:px-6 py-4 border-t border-border bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between flex-shrink-0 gap-3">
                    <p className="text-[10px] text-subtle leading-snug">
                        Simulation indicative — Ne remplace pas un audit réglementaire OPQIBI 1905.
                    </p>
                    <button
                        onClick={onClose}
                        className="self-end sm:self-auto px-5 py-2.5 bg-oxford text-white text-sm font-semibold rounded-lg shadow hover:bg-oxford/90 transition-all active:scale-95 flex-shrink-0"
                    >
                        Compris
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
