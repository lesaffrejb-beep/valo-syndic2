import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { useBrandStore } from "@/stores/useBrandStore";
import { useAuth } from "@/hooks/useAuth";
import { ShareButton } from "@/components/ui/ShareButton";
import { ProjectionModeToggle } from "@/components/ui/ProjectionModeToggle";
import { JsonImporter } from "@/components/import/JsonImporter";
import { Save } from 'lucide-react';
import { type GhostExtensionImport } from '@/lib/schemas';

interface HeaderProps {
    onOpenBranding: () => void;
    onSave: () => void;
    onImport?: (data: GhostExtensionImport) => void;
    onLoad?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef?: React.RefObject<HTMLInputElement>;
    hasResult: boolean;
    onOpenAuth?: () => void;
    activeSection?: string;
    onNavigate?: (sectionId: string) => void;
    isSaving?: boolean;
}

// Update signature to include optional props
export function Header({
    onOpenBranding,
    onSave,
    onImport,
    onLoad,
    fileInputRef,
    hasResult,
    onOpenAuth,
    activeSection = 'diagnostic',
    onNavigate,
    isSaving = false
}: HeaderProps) {
    const brand = useBrandStore((state) => state.brand);
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
            setShowUserMenu(false);
            router.push('/');
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    const navItems = [
        { id: 'diagnostic', label: 'Diagnostic' },
        { id: 'projection', label: 'Projection' },
        { id: 'my-pocket', label: 'Analyse' },
        { id: 'finance', label: 'Financement' },
        { id: 'action', label: 'Action' },
    ];

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 z-[60] print:hidden"
        >
            {/* Premium Glassmorphism Layer */}
            <div className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-[20px] supports-[backdrop-filter]:bg-[#0A0A0A]/60 border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.1)]" />

            {/* Subtle Gradient Shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-50" />

            <div className="relative max-w-[1400px] mx-auto px-6 md:px-8">
                {/* GRID LAYOUT: 1fr | auto | 1fr to ensure center is centered but safe from overlap if sides grow too much */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center h-20 gap-4">

                    {/* LEFT: Actions (Import/Save) */}
                    <div className="flex items-center justify-start gap-2">
                        {onImport && <JsonImporter onImport={onImport} />}

                        {/* File Import Button (Legacy support) */}
                        {onLoad && fileInputRef && (
                            <>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-10 flex items-center gap-2 px-3 rounded-lg border border-transparent hover:bg-white/[0.04] transition-all duration-200 text-sm font-medium text-muted hover:text-white"
                                    title="Importer un fichier .valo"
                                >
                                    <span className="hidden xl:inline">Ouvrir</span>
                                    <span className="xl:hidden">📂</span>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".valo,.json"
                                    onChange={onLoad}
                                    className="hidden"
                                />
                            </>
                        )}

                        <button
                            onClick={onSave}
                            disabled={!hasResult || isSaving}
                            className="relative h-10 flex items-center gap-2 px-4 rounded-lg bg-gold text-[#050507] font-semibold text-sm hover:bg-gold-light hover:shadow-[0_0_20px_-5px_rgba(229,192,123,0.4)] hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                            title="Sauvegarder le dossier"
                        >
                            <Save className="w-4 h-4" />
                            <span className="hidden 2xl:inline">{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                            <span className="2xl:hidden">{isSaving ? 'Sauv...' : 'Sauv.'}</span>
                            <span className="absolute -top-1.5 -right-1.5 rounded-full bg-black text-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.35)]">
                                V2
                            </span>
                        </button>
                    </div>

                    {/* CENTER: Navigation */}
                    <div className="flex justify-center">
                        {/* Optional: Add Logo/Brand here if needed, but for now specific nav focus */}
                        {onNavigate && (
                            <div className="header-nav hidden md:flex items-center gap-1 xl:gap-2 bg-black/20 backdrop-blur-md p-1 rounded-full border border-white/5 relative">
                                {navItems.map((item) => {
                                    const isActive = activeSection === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => onNavigate(item.id)}
                                            className={`relative z-10 px-4 py-1.5 rounded-full text-[10px] xl:text-[11px] uppercase tracking-[0.15em] font-medium transition-colors duration-200 ${isActive ? 'text-white' : 'text-muted hover:text-white'
                                                }`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeSection"
                                                    className="absolute inset-0 bg-white/10 border border-white/10 rounded-full shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)] -z-10"
                                                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                                                />
                                            )}
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Tools & Auth */}
                    <div className="flex items-center justify-end gap-2 sm:gap-4 pl-2">
                        <div className="flex items-center gap-1.5">
                            <ShareButton />
                            <ProjectionModeToggle />
                        </div>

                        {/* Authentication Separator */}
                        <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-white/[0.1] to-transparent mx-1" />

                        {/* Authentication */}
                        {user ? (
                            /* User Menu */
                            <div className="relative group">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="h-10 flex items-center gap-3 pl-1 pr-2 rounded-full hover:bg-white/[0.04] transition-all duration-300 border border-transparent hover:border-white/[0.08]"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/20 ring-2 ring-transparent group-hover:ring-gold/10 transition-all">
                                        <span className="text-xs font-bold text-gold font-serif">
                                            {user.email?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="hidden xl:flex flex-col items-start text-left">
                                        <span className="text-xs font-medium text-white max-w-[100px] truncate leading-tight">
                                            {user.email?.split('@')[0]}
                                        </span>
                                        <span className="text-[9px] text-muted leading-tight">Connecté</span>
                                    </div>
                                    <svg className="hidden xl:block w-3.5 h-3.5 text-muted group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {showUserMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowUserMenu(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="absolute right-0 mt-3 w-64 bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] overflow-hidden z-50 ring-1 ring-white/[0.05]"
                                            >
                                                <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
                                                    <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">Compte</p>
                                                    <p className="text-sm text-white font-medium truncate">{user.email}</p>
                                                </div>
                                                <div className="p-2 space-y-0.5">
                                                    <button
                                                        onClick={() => {
                                                            setShowUserMenu(false);
                                                            router.push('/dashboard');
                                                        }}
                                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all duration-200 flex items-center gap-3 group/item"
                                                    >
                                                        <span className="text-lg opacity-60 group-hover/item:opacity-100 transition-opacity">💼</span>
                                                        <span>Mes Projets</span>
                                                    </button>
                                                    <div className="h-px bg-white/[0.04] my-1 mx-2" />
                                                    <button
                                                        onClick={handleSignOut}
                                                        className="w-full px-4 py-2.5 text-left text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 flex items-center gap-3 group/item"
                                                    >
                                                        <span className="text-lg opacity-60 group-hover/item:opacity-100 transition-opacity">🚪</span>
                                                        <span>Se déconnecter</span>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            /* Login Button */
                            <button
                                onClick={onOpenAuth}
                                className="relative h-10 flex items-center gap-2 px-4 rounded-lg text-sm font-semibold bg-gold text-[#050507] hover:bg-gold-light hover:shadow-[0_0_20px_-5px_rgba(229,192,123,0.4)] hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-black/10"
                            >
                                <span>🔐</span>
                                <span className="hidden sm:inline">Connexion</span>
                                <span className="absolute -top-1.5 -right-1.5 rounded-full bg-black text-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.35)]">
                                    V2
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.header>
    );
}
