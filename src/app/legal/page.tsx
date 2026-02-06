/**
 * VALO-SYNDIC — Mentions Légales & CGU
 * Dark Mode version matching main app design
 */

import { LEGAL } from "@/lib/constants";
import { LegalWarning } from "@/components/business/LegalWarning";
import Link from "next/link";

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-app">
            {/* Header */}
            <header className="glass sticky top-0 z-50 border-b border-boundary">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <Link
                        href="/"
                        className="text-primary hover:text-primary-400 flex items-center gap-2 transition-colors"
                    >
                        ← Retour au diagnostic
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-main mb-8">
                    Mentions Légales & CGU
                </h1>

                <div className="space-y-10">
                    {/* Section 1 */}
                    <section className="card-bento p-6">
                        <h2 className="text-xl font-semibold text-main mb-4">
                            1. Nature du Service
                        </h2>
                        <p className="text-secondary mb-4">
                            VALO-SYNDIC est un <strong className="text-main">outil d&apos;aide à la décision</strong>{" "}
                            destiné aux professionnels de la gestion immobilière. Il fournit
                            des simulations indicatives basées sur les barèmes publics en
                            vigueur.
                        </p>
                        <LegalWarning variant="banner" />
                    </section>

                    {/* Section 2 */}
                    <section className="card-bento p-6">
                        <h2 className="text-xl font-semibold text-main mb-4">
                            2. Limitation de Responsabilité
                        </h2>
                        <div className="bg-warning-900/20 border border-warning-500/30 rounded-lg p-4 mb-4">
                            <p className="text-warning-400 font-medium">
                                ⚠️ AVERTISSEMENT IMPORTANT
                            </p>
                            <p className="text-warning-300/80 text-sm mt-2">
                                Les résultats affichés sont des <strong>estimations</strong>{" "}
                                basées sur les informations fournies par l&apos;utilisateur et les
                                barèmes publics. Ils ne constituent en aucun cas :
                            </p>
                            <ul className="list-disc list-inside text-warning-300/80 text-sm mt-2 space-y-1">
                                <li>Un engagement de financement</li>
                                <li>Un audit réglementaire au sens de la réglementation</li>
                                <li>Un diagnostic de performance énergétique (DPE)</li>
                                <li>Un conseil juridique ou fiscal personnalisé</li>
                            </ul>
                        </div>
                        <p className="text-secondary">
                            Pour tout projet de rénovation, il est impératif de faire appel à
                            des professionnels qualifiés (auditeurs OPQIBI 1905, maîtres
                            d&apos;œuvre, bureaux d&apos;études thermiques).
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section className="card-bento p-6">
                        <h2 className="text-xl font-semibold text-main mb-4">
                            3. Protection des Données (RGPD)
                        </h2>
                        <div className="bg-primary-900/20 border border-primary-500/30 rounded-lg p-4 mb-4">
                            <p className="text-primary-400 font-medium">
                                🔒 Privacy by Design
                            </p>
                            <p className="text-primary-300/80 text-sm mt-2">
                                VALO-SYNDIC est conçu selon le principe de minimisation des
                                données :
                            </p>
                            <ul className="list-disc list-inside text-primary-300/80 text-sm mt-2 space-y-1">
                                <li>
                                    <strong className="text-primary-300">Calcul 100% local</strong> : Toutes les simulations
                                    sont effectuées dans votre navigateur
                                </li>
                                <li>
                                    <strong className="text-primary-300">Aucune transmission</strong> : Les données saisies ne
                                    sont pas envoyées à un serveur distant
                                </li>
                                <li>
                                    <strong className="text-primary-300">Pas de tracking</strong> : Aucun cookie publicitaire ou
                                    de suivi comportemental
                                </li>
                                <li>
                                    <strong className="text-primary-300">Stockage optionnel</strong> : Les données peuvent être
                                    sauvegardées localement (LocalStorage) pour votre confort
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section className="card-bento p-6">
                        <h2 className="text-xl font-semibold text-main mb-4">
                            4. Sources des Données
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-surface-highlight">
                                        <th className="border border-boundary px-4 py-2 text-left text-main">
                                            Donnée
                                        </th>
                                        <th className="border border-boundary px-4 py-2 text-left text-main">
                                            Source
                                        </th>
                                        <th className="border border-boundary px-4 py-2 text-left text-main">
                                            Mise à jour
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-secondary">
                                    <tr>
                                        <td className="border border-boundary px-4 py-2">
                                            Calendrier Loi Climat
                                        </td>
                                        <td className="border border-boundary px-4 py-2">
                                            Loi Climat et Résilience (2021)
                                        </td>
                                        <td className="border border-boundary px-4 py-2">
                                            Janvier 2026
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-boundary px-4 py-2">
                                            Barème MaPrimeRénov&apos;
                                        </td>
                                        <td className="border border-boundary px-4 py-2">
                                            ANAH / Service-Public.fr
                                        </td>
                                        <td className="border border-boundary px-4 py-2">
                                            Janvier 2026
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-boundary px-4 py-2">
                                            Éco-PTZ Copropriété
                                        </td>
                                        <td className="border border-boundary px-4 py-2">
                                            Banque des Territoires
                                        </td>
                                        <td className="border border-boundary px-4 py-2">
                                            Janvier 2026
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-boundary px-4 py-2">
                                            Valeurs foncières (DVF)
                                        </td>
                                        <td className="border border-boundary px-4 py-2">
                                            data.gouv.fr
                                        </td>
                                        <td className="border border-boundary px-4 py-2">
                                            2024 (retard 2 ans)
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section className="card-bento p-6">
                        <h2 className="text-xl font-semibold text-main mb-4">
                            5. Propriété Intellectuelle
                        </h2>
                        <p className="text-secondary">
                            L&apos;outil VALO-SYNDIC, son code source, son design et ses contenus
                            sont protégés par le droit d&apos;auteur. Toute reproduction ou
                            utilisation non autorisée est interdite.
                        </p>
                    </section>

                    {/* Version */}
                    <section className="border-t border-boundary pt-6">
                        <p className="text-sm text-muted">
                            Dernière mise à jour :{" "}
                            {LEGAL.lastUpdate.toLocaleDateString("fr-FR")}
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
