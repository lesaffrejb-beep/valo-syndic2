// Manual Test: Subsidy Calculator Verification
// Run this with: npx tsx src/lib/__tests__/subsidy-calculator-manual-test.ts

import { calculateSubsidies, type SimulationInputs } from '../subsidy-calculator';
import { formatCurrency } from '../calculator';


// =============================================================================
// SCÉNARIO 1: Standard (30% base, pas de bonus)
// =============================================================================

const scenario1: SimulationInputs = {
    workAmountHT: 750_000,
    amoAmountHT: 18_000, // 30 lots * 600€
    nbLots: 30,
    energyGain: 0.35, // 35% (seuil minimum)
    initialDPE: 'E',
    targetDPE: 'D',
    isFragile: false,
};

const result1 = calculateSubsidies(scenario1);

// =============================================================================
// SCÉNARIO 2: Performance + Passoire (45% + 10%)
// =============================================================================

const scenario2: SimulationInputs = {
    workAmountHT: 500_000,
    amoAmountHT: 12_000, // 20 lots * 600€
    nbLots: 20,
    energyGain: 0.55, // 55% (performance)
    initialDPE: 'G',
    targetDPE: 'C',
    isFragile: false,
};

const result2 = calculateSubsidies(scenario2);

// =============================================================================
// SCÉNARIO 3: All Bonuses (45% + 10% + 20%)
// =============================================================================

const scenario3: SimulationInputs = {
    workAmountHT: 400_000,
    amoAmountHT: 9_000, // 15 lots * 600€
    nbLots: 15,
    energyGain: 0.60, // 60%
    initialDPE: 'F',
    targetDPE: 'B',
    isFragile: true,
};

const result3 = calculateSubsidies(scenario3);

// =============================================================================
// SCÉNARIO 4: Grande Copro (AMO cap = 600€/lot)
// =============================================================================

const scenario4: SimulationInputs = {
    workAmountHT: 1_200_000,
    amoAmountHT: 30_000, // 50 lots * 600€
    nbLots: 50,
    energyGain: 0.50, // 50% (seuil performance)
    initialDPE: 'E',
    targetDPE: 'C',
    isFragile: false,
};

const result4 = calculateSubsidies(scenario4);

// =============================================================================
// SCÉNARIO 5: Petite Copro (AMO floor = 3000€ minimum)
// =============================================================================

const scenario5: SimulationInputs = {
    workAmountHT: 100_000,
    amoAmountHT: 3_000, // 5 lots * 600€
    nbLots: 5,
    energyGain: 0.40, // 40%
    initialDPE: 'D',
    targetDPE: 'C',
    isFragile: false,
};

const result5 = calculateSubsidies(scenario5);

