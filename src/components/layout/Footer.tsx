import { LEGAL } from "@/lib/constants";

interface FooterProps {
    onSave?: () => void;
    onLoad?: () => void;
    hasResult?: boolean;
}

export function Footer({ onSave, onLoad, hasResult }: FooterProps) {
    return (
        <footer className="bg-surface border-t border-boundary mt-12 print:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface-hover rounded-lg flex items-center justify-center">
                            <span className="text-muted font-bold text-sm">V</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-main">VALO-SYNDIC</p>
                            <p className="text-xs text-muted">Outil d&apos;aide à la décision • 2026</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Mobile save/load buttons */}
                        <div className="flex sm:hidden items-center gap-2">
                            <button
                                onClick={onSave}
                                disabled={!hasResult}
                                className="btn-ghost text-xs disabled:opacity-50"
                            >
                                💾
                            </button>
                            <button
                                onClick={onLoad}
                                className="btn-ghost text-xs"
                            >
                                📂
                            </button>
                        </div>
                        <a
                            href="/legal"
                            className="text-sm text-muted hover:text-main transition-colors"
                        >
                            Mentions légales
                        </a>
                        <span className="text-subtle">|</span>
                        <span className="text-xs text-muted">
                            Données réglementaires au 01/01/2026 • Simulateur à visée indicative
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
