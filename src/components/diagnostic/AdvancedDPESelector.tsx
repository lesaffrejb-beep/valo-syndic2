import { type DPELetter } from "@/lib/constants";

interface AdvancedDPESelectorProps {
    currentDPE?: DPELetter | undefined;
    targetDPE?: DPELetter | undefined;
    dpeProjete?: DPELetter | undefined;
    onChangeCurrent: (val: DPELetter) => void;
    onChangeTarget: (val: DPELetter) => void;
    onChangeProjete: (val: DPELetter) => void;
}

const ALL_DPE: DPELetter[] = ["A", "B", "C", "D", "E", "F", "G"];

export default function AdvancedDPESelector({
    currentDPE,
    targetDPE,
    dpeProjete,
    onChangeCurrent,
    onChangeTarget,
    onChangeProjete,
}: AdvancedDPESelectorProps) {



    const renderRowItem = (
        letter: DPELetter,
        selectedValue?: DPELetter,
        onSelect?: (val: DPELetter) => void,
        disabled?: boolean
    ) => {
        const isActive = selectedValue === letter;
        return (
            <button
                key={letter}
                type="button"
                onClick={() => !disabled && onSelect?.(letter)}
                disabled={disabled}
                className={`
                    w-[38px] h-[38px] rounded-full flex items-center justify-center text-[15px] font-bold transition-all duration-300
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2
                    ${isActive
                        ? "bg-navy text-white shadow-md scale-110 z-10"
                        : "bg-transparent text-slate hover:bg-slate-200/50 hover:text-oxford"
                    }
                    ${disabled && !isActive ? "opacity-30 cursor-not-allowed" : ""}
                `}
            >
                {letter}
            </button>
        );
    };

    return (
        <div className="flex flex-col space-y-8 py-4">
            <div className="space-y-1.5">
                <h2 className="text-2xl font-bold text-oxford tracking-tight">Sélecteur DPE</h2>
                <p className="text-[14px] text-slate max-w-sm">
                    Ajustez les curseurs pour simuler l&apos;impact de vos travaux sur la performance énergétique.
                </p>
            </div>

            <div className="space-y-6">
                {/* Row 1: ACTUEL */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate">Actuel</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 rounded-[2rem] px-2 py-2 border border-slate-200 shadow-inner">
                        {ALL_DPE.map(letter => renderRowItem(letter, currentDPE, onChangeCurrent))}
                    </div>
                </div>

                {/* Row 2: CIBLE */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate">Cible</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 rounded-[2rem] px-2 py-2 border border-slate-200 shadow-inner">
                        {ALL_DPE.map(letter => renderRowItem(letter, targetDPE, onChangeTarget))}
                    </div>
                </div>

                {/* Row 3: PROJETÉ */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate">Projeté</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 rounded-[2rem] px-2 py-2 border border-slate-200 shadow-inner">
                        {ALL_DPE.map(letter => renderRowItem(letter, dpeProjete, onChangeProjete))}
                    </div>
                </div>
            </div>

        </div>
    );
}
