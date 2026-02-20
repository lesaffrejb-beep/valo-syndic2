"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export default function LegalNoticeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-oxford/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeInUp">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="font-serif text-xl font-bold text-oxford">
                        Mentions Légales &amp; RGPD
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate hover:text-oxford hover:bg-slate-50 rounded-full transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto text-sm text-slate space-y-6">
                    <section>
                        <h3 className="font-bold text-oxford uppercase tracking-wider text-xs mb-2">
                            Cadre Juridique et Protection des Données — ValoSyndic 2026
                        </h3>
                        <p className="mb-4">
                            Ce document précise les conditions d&apos;utilisation, les limites de responsabilité et la politique de protection des données inhérentes à l&apos;utilisation du simulateur ValoSyndic.
                        </p>
                    </section>

                    <section>
                        <h4 className="font-semibold text-oxford mb-2">1. Clause d&apos;exclusion de responsabilité (Disclaimer)</h4>

                        <h5 className="font-medium text-oxford mt-3 mb-1">1.1. Nature de l&apos;outil</h5>
                        <p className="mb-3">
                            Le simulateur ValoSyndic est un outil d&apos;aide à la décision à caractère prospectif. Les résultats (économies d&apos;énergie, reste à charge, effort de trésorerie) sont des estimations fondées sur les données saisies par l&apos;utilisateur et les barèmes légaux en vigueur au 1er février 2026. Ils ne constituent en aucun cas un engagement contractuel ou une garantie de performance financière.
                        </p>

                        <h5 className="font-medium text-oxford mt-3 mb-1">1.2. Incertitude législative et fiscale</h5>
                        <ul className="list-disc pl-5 space-y-2 mb-3">
                            <li><strong>Subventions :</strong> Le calcul de MaPrimeRénov&apos; Copropriété est effectué sous réserve de la validation définitive des crédits par la Loi de Finances 2026. Tout changement de réglementation entre la simulation et le dépôt du dossier est opposable au bénéficiaire.</li>
                            <li><strong>Fiscalité :</strong> Les projections de déficit foncier (Art. 31 et 156 du CGI) sont indicatives. L&apos;éligibilité réelle des travaux et la validation de la déduction relèvent de la responsabilité exclusive du contribuable face à l&apos;administration fiscale.</li>
                        </ul>

                        <h5 className="font-medium text-oxford mt-3 mb-1">1.3. Absence de Dol et Information des Copropriétaires</h5>
                        <p className="mb-3">
                            Le présent document ne dispense pas le syndic de présenter en Assemblée Générale les devis définitifs des entreprises ainsi que le contrat de prêt collectif, conformément au Décret n° 67-223 du 17 mars 1967. L&apos;indicateur « Effort de Trésorerie » est une grandeur théorique et n&apos;exonère pas le copropriétaire du paiement intégral des appels de fonds travaux décidés selon les majorités de la Loi du 10 juillet 1965 (Art. 24, 25 ou 26).
                        </p>
                    </section>

                    <section>
                        <h4 className="font-semibold text-oxford mb-2">2. Protection des Données Personnelles (RGPD)</h4>
                        <p className="mb-3">
                            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la Loi Informatique et Libertés, le cabinet précise les conditions de traitement des données saisies :
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mb-3">
                            <li><strong>Finalité du traitement :</strong> Les données collectées (Quote-part de charges, Revenu Fiscal de Référence, Taux Moyen d&apos;Imposition) ont pour unique finalité la réalisation de la simulation financière de rénovation énergétique de la copropriété.</li>
                            <li><strong>Base légale :</strong> Intérêt légitime du syndic dans l&apos;exécution de sa mission de conseil et de valorisation du patrimoine (Loi du 10 juillet 1965).</li>
                            <li>
                                <strong>Conservation :</strong>
                                <ul className="list-[circle] pl-5 mt-1 space-y-1 text-subtle">
                                    <li><em>Mode Simulation Seule :</em> Aucune donnée n&apos;est stockée sur nos serveurs après la fermeture de la session de navigation (traitement local "client-side").</li>
                                    <li><em>Mode Rapport PDF :</em> Les données sont conservées uniquement le temps de la génération du document.</li>
                                </ul>
                            </li>
                            <li><strong>Non-cession :</strong> Aucune donnée financière personnelle n&apos;est cédée à des tiers (banques, courtiers, entreprises de travaux) sans un consentement écrit, spécifique et préalable du copropriétaire concerné.</li>
                            <li><strong>Droits :</strong> Chaque copropriétaire dispose d&apos;un droit d&apos;accès, de rectification et de suppression de ses données auprès du Délégué à la Protection des Données (DPO) du cabinet à l&apos;adresse : lesaffrejb@gmail.com.</li>
                        </ul>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-oxford text-white text-sm font-semibold rounded-lg shadow hover:bg-oxford/90 hover:shadow-md transition-all active:scale-95"
                    >
                        Compris
                    </button>
                </div>
            </div>
        </div>
    );
}
