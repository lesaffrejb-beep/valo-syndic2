import { generateDiagnostic } from '../src/lib/calculator';
import type { DiagnosticInput } from '../src/lib/schemas';

const baseInput: DiagnosticInput = {
    currentDPE: "G", targetDPE: "C", numberOfUnits: 10, estimatedCostHT: 150000,
    averageUnitSurface: 65, averagePricePerSqm: 3000, isCostTTC: true, includeHonoraires: true,
    devisValide: true, revenusFonciersExistants: 0, montantTravauxAmeliorationHT: 0, statutLot: 'bailleur',
    optionLocAvantages: false, commercialLots: 0, localAidAmount: 0, alurFund: 0, ceeBonus: 0,
    currentEnergyBill: 0, investorRatio: 0
};

console.log("=== CRASH TEST TERRAIN (Moteur ValoSyndic 2026) ===");

// 1. Le Test de la Passoire
const diag1 = generateDiagnostic({ ...baseInput });
const diag2 = generateDiagnostic({ ...baseInput, targetDPE: "E" });

console.log("\n[Test 1: La Passoire (CGI Art. 156-I-3°)]");
console.log(`G -> C (Devis signé) : Plafond Imputable = ${diag1.financing.plafondImputationDeductible} € (Attendu: 21400)`);
console.log(`G -> E (Devis signé) : Plafond Imputable = ${diag2.financing.plafondImputationDeductible} € (Attendu: 10700)`);

// 2. Le Test du Tiers de Confiance
const baseCostRAC = generateDiagnostic({ ...baseInput, montantHonorairesSyndicHT: 0 });
const addedFeesRAC = generateDiagnostic({ ...baseInput, montantHonorairesSyndicHT: 10000 });

console.log("\n[Test 2: Le Tiers de Confiance (TVA 20% Isolée)]");
console.log(`Sans Honoraires Syndic: EcoPTZ = ${baseCostRAC.financing.ecoPtzAmount} €, RAC Cash (CashDownPayment) = ${baseCostRAC.financing.cashDownPayment} €`);
console.log(`Avec 10 000€ HT Syndic : EcoPTZ = ${addedFeesRAC.financing.ecoPtzAmount} €, RAC Cash (CashDownPayment) = ${addedFeesRAC.financing.cashDownPayment} €`);
console.log(`Différence RAC Cash = ${addedFeesRAC.financing.cashDownPayment - baseCostRAC.financing.cashDownPayment} € (Attendu: 12000 € TTC)`);
console.log(`Différence EcoPTZ = ${addedFeesRAC.financing.ecoPtzAmount - baseCostRAC.financing.ecoPtzAmount} € (Attendu: 0 €)`);

console.log("\n=> Le test de la Frontière (ANAH) s'effectue dynamiquement côté client (PersonalSimulator.tsx).");
