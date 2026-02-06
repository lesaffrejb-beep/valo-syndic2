/**
 * InvestorTaxCard - Affiche l'avantage fiscal quand % bailleurs > 40%
 */

"use client";

interface InvestorTaxCardProps {
    investorRatio: number;
    remainingCostPerUnit: number;
}

export function InvestorTaxCard({ investorRatio, remainingCostPerUnit }: InvestorTaxCardProps) {
    if (investorRatio <= 40) return null;

    return (
        <div className="card-bento p-6 border-l-4 border-primary-500 group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-900/30 rounded-xl flex items-center justify-center border border-primary-500/30 flex-shrink-0">
                    <span className="text-2xl">💡</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-main mb-2">
                        Avantage Fiscal Investisseur
                    </h3>
                    <p className="text-secondary text-sm mb-3">
                        Avec <span className="text-primary font-bold">{investorRatio}% de bailleurs</span> dans la copropriété,
                        le reste à charge est <strong className="text-main">déductible des revenus fonciers</strong> (Déficit Foncier).
                    </p>
                    <div className="bg-primary-900/20 rounded-lg p-3 border border-primary-500/20">
                        <p className="text-xs text-muted mb-1">Déduction estimée par lot investisseur :</p>
                        <p className="text-2xl font-bold text-primary tabular-nums">
                            {Math.round(remainingCostPerUnit).toLocaleString("fr-FR")} €
                        </p>
                        <p className="text-xs text-muted/70 mt-1">
                            Réduction d&apos;impôt dépendant de la TMI (30%, 41%, 45%)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
