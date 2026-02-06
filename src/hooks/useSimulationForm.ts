import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    SimulationFormSchema,
    type SimulationFormValues,
} from "@/lib/schemas";
import {
    DEFAULT_VALUES,
    mergeDataWithDefaults,
    type SimulationApiData,
} from "@/lib/simulationDefaults";

export function useSimulationForm(addressData?: SimulationApiData | null) {
    const form = useForm<SimulationFormValues>({
        resolver: zodResolver(SimulationFormSchema),
        defaultValues: {
            numberOfLots: undefined,
            totalLivingArea: undefined,
            currentDpeLabel: "F",
            targetDpeLabel: "C",
            pricePerSqm: DEFAULT_VALUES.pricePerSqm,
            workBudget: 0,
        } as any,
        mode: "onChange",
    });

    const [budgetManuallySet, setBudgetManuallySet] = useState(false);
    const [surfaceManuallySet, setSurfaceManuallySet] = useState(false);

    const numberOfLots = useWatch({ control: form.control, name: "numberOfLots" });
    const totalLivingArea = useWatch({ control: form.control, name: "totalLivingArea" });

    useEffect(() => {
        if (!addressData) return;

        const merged = mergeDataWithDefaults(addressData);

        if (merged.numberOfLots) {
            form.setValue("numberOfLots", merged.numberOfLots, { shouldValidate: true });
        }

        if (!surfaceManuallySet) {
            form.setValue("totalLivingArea", merged.totalSurface || undefined as any, { shouldValidate: true });
        }

        form.setValue("currentDpeLabel", merged.currentDpe, { shouldValidate: true });
        form.setValue("targetDpeLabel", merged.targetDpe, { shouldValidate: true });
        form.setValue("pricePerSqm", merged.pricePerSqm, { shouldValidate: true });

        if (!budgetManuallySet) {
            form.setValue("workBudget", merged.workBudget, { shouldValidate: true });
        }
    }, [addressData, budgetManuallySet, surfaceManuallySet, form]);

    useEffect(() => {
        if (!numberOfLots || numberOfLots <= 0) return;
        if (surfaceManuallySet) return;

        const nextSurface = numberOfLots * DEFAULT_VALUES.avgSurfacePerLot;
        if (!totalLivingArea || Math.abs(totalLivingArea - nextSurface) > 0.5) {
            form.setValue("totalLivingArea", nextSurface, { shouldValidate: true });
        }
    }, [numberOfLots, totalLivingArea, surfaceManuallySet, form]);

    useEffect(() => {
        if (!totalLivingArea || totalLivingArea <= 0) return;
        if (budgetManuallySet) return;

        const nextBudget = Math.round(totalLivingArea * DEFAULT_VALUES.renoCostPerSqm);
        if (!form.getValues("workBudget") || Math.abs(form.getValues("workBudget") - nextBudget) > 0.5) {
            form.setValue("workBudget", nextBudget, { shouldValidate: true });
        }
    }, [totalLivingArea, budgetManuallySet, form]);

    const autoFlags = useMemo(() => {
        const merged = mergeDataWithDefaults(addressData);
        return {
            numberOfLots: Boolean(addressData?.total_units || addressData?.number_of_units || addressData?.numberOfUnits),
            totalLivingArea: Boolean(addressData?.living_area || addressData?.total_surface),
            currentDpeLabel: Boolean(addressData?.dpe_label),
            pricePerSqm: Boolean(addressData?.price_per_sqm || addressData?.pricePerSqm),
            estimatedSurface: !merged.totalSurface && Boolean(merged.numberOfLots),
        };
    }, [addressData]);

    return {
        form,
        numberOfLots,
        totalLivingArea,
        autoFlags,
        budgetManuallySet,
        surfaceManuallySet,
        markBudgetManual: () => setBudgetManuallySet(true),
        markSurfaceManual: () => setSurfaceManuallySet(true),
    };
}
