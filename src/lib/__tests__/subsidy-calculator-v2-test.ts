// Manual Test V2: Subsidy Calculator with CEE + Local Aids
// Run this with: npx tsx src/lib/__tests__/subsidy-calculator-v2-test.ts

import { calculateSubsidies, type SimulationInputs } from '../subsidy-calculator';
import { formatCurrency } from '../calculator';


// =============================================================================
// SCÉNARIO 1: Standard SANS CEE/Locales (Référence)
// =============================================================================

const scenario1: SimulationInputs = {
    workAmountHT: 750_000,
    amoAmountHT: 18_000,
    nbLots: 30,
    energyGain: 0.35, // 35%
    initialDPE: 'E',
    targetDPE: 'D',
    isFragile: false,
    ceePerLot: 0, // Pas de CEE
    localAidPerLot: 0, // Pas d'aides locales
};

const result1 = calculateSubsidies(scenario1);

// =============================================================================
// SCÉNARIO 2: AVEC CEE (1 500 €/lot, moyenne Angers)
// =============================================================================

const scenario2: SimulationInputs = {
    workAmountHT: 750_000,
    amoAmountHT: 18_000,
    nbLots: 30,
    energyGain: 0.35,
    initialDPE: 'E',
    targetDPE: 'D',
    isFragile: false,
    ceePerLot: 1_500, // CEE moyenne
    localAidPerLot: 0,
};

const result2 = calculateSubsidies(scenario2);

// =============================================================================
// SCÉNARIO 3: AVEC CEE + Aides Locales (Angers Loire Métropole)
// =============================================================================

const scenario3: SimulationInputs = {
    workAmountHT: 750_000,
    amoAmountHT: 18_000,
    nbLots: 30,
    energyGain: 0.35,
    initialDPE: 'E',
    targetDPE: 'D',
    isFragile: false,
    ceePerLot: 1_500, // CEE
    localAidPerLot: 1_000, // Angers Loire Métropole
};

const result3 = calculateSubsidies(scenario3);

// =============================================================================
// SCÉNARIO 4: Performance + Passoire + CEE massif (3 000 €/lot)
// =============================================================================

const scenario4: SimulationInputs = {
    workAmountHT: 500_000,
    amoAmountHT: 12_000,
    nbLots: 20,
    energyGain: 0.55, // 55% (performance)
    initialDPE: 'G',
    targetDPE: 'C',
    isFragile: false,
    ceePerLot: 3_000, // CEE haute performance
    localAidPerLot: 0,
};

const result4 = calculateSubsidies(scenario4);

// =============================================================================
// SCÉNARIO 5: ALL-IN (Tous bonus + CEE + Locales)
// =============================================================================

const scenario5: SimulationInputs = {
    workAmountHT: 400_000,
    amoAmountHT: 9_000,
    nbLots: 15,
    energyGain: 0.60, // 60%
    initialDPE: 'F',
    targetDPE: 'B',
    isFragile: true, // Bonus Fragile
    ceePerLot: 2_000,
    localAidPerLot: 1_200,
};

const result5 = calculateSubsidies(scenario5);

// =============================================================================
// RÉCAPITULATIF : Puissance du CEE + Locales
// =============================================================================
