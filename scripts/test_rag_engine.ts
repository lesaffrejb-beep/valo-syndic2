import { generateDiagnostic } from '../src/lib/calculator';
import type { DiagnosticInput } from '../src/lib/schemas';

const testInput: DiagnosticInput = {
    address: '123 Rue de la République',
    postalCode: '75001',
    city: 'Paris',
    currentDPE: 'F',
    targetDPE: 'C',
    numberOfUnits: 20,
    commercialLots: 0,
    estimatedCostHT: 300000,
    heatingSystem: 'gaz',
    averagePricePerSqm: 5000,
    averageUnitSurface: 65,
    localAidAmount: 0,
    alurFund: 15000,
    ceeBonus: 0,
    currentEnergyBill: 24000,
    isCostTTC: true,
    includeHonoraires: true,
    investorRatio: 0
};

const result = generateDiagnostic(testInput);
const f = result.financing;

// Reconstitution manuelle TTC pour vérification comptable
const worksTTC = f.worksCostHT * 1.055;
const syndicTTC = f.syndicFees * 1.20;
const doTTC = f.doFees * 1.09;
const contingencyTTC = f.contingencyFees;            // provision, neutre
const amoCostHT = 20 * 600;                     // 20 lots × 600€ AMO
const amoTTC = amoCostHT * 1.20;
const checkTotalTTC = worksTTC + syndicTTC + doTTC + contingencyTTC + amoTTC;

console.log('\n=================================================================');
console.log('            AUDIT CFO — TICKET DE CAISSE IMMEUBLE');
console.log('=================================================================');
console.log(`Travaux HT               : ${f.worksCostHT.toLocaleString('fr-FR')} € → TTC 5.5% : ${Math.round(worksTTC).toLocaleString('fr-FR')} €`);
console.log(`Syndic HT  (${(f.syndicFees / f.worksCostHT * 100).toFixed(0)}%)        : ${f.syndicFees.toLocaleString('fr-FR')} € → TTC 20%  : ${Math.round(syndicTTC).toLocaleString('fr-FR')} €`);
console.log(`DO HT      (${(f.doFees / f.worksCostHT * 100).toFixed(0)}%)           : ${f.doFees.toLocaleString('fr-FR')} € → Taxe  9% : ${Math.round(doTTC).toLocaleString('fr-FR')} €`);
console.log(`Aléas HT   (${(f.contingencyFees / f.worksCostHT * 100).toFixed(0)}%)           : ${f.contingencyFees.toLocaleString('fr-FR')} € → NEUTRE   : ${Math.round(contingencyTTC).toLocaleString('fr-FR')} €`);
console.log(`AMO HT                   :  ${amoCostHT.toLocaleString('fr-FR')} € → TTC 20%  : ${Math.round(amoTTC).toLocaleString('fr-FR')} €`);
console.log('─────────────────────────────────────────────────────────────────');
console.log(`totalCostHT (exact)      : ${f.totalCostHT.toLocaleString('fr-FR')} €`);
console.log(`totalCostTTC (multi-TVA) : ${f.totalCostTTC.toLocaleString('fr-FR')} € (check: ${Math.round(checkTotalTTC).toLocaleString('fr-FR')} €) ✓`);

console.log('\n=================================================================');
console.log('                     PLAN DE FINANCEMENT');
console.log('=================================================================');
console.log(`MPR (taux: ${(f.mprRate * 100).toFixed(0)}%)          : ${f.mprAmount.toLocaleString('fr-FR')} €  ${f.exitPassoireBonus > 0 ? `[dont bonus passoire +${(f.exitPassoireBonus * 100).toFixed(0)}% ✓]` : ''}`);
console.log(`CEE (devis fournisseur)  : ${f.ceeAmount.toLocaleString('fr-FR')} €`);
console.log(`AMO subvention (50%)     : ${f.amoAmount.toLocaleString('fr-FR')} €`);
console.log(`Fonds Travaux ALUR       : 15 000 €`);
console.log(`Éco-PTZ (assiette éligi.): ${f.ecoPtzAmount.toLocaleString('fr-FR')} €  (principal + 500€ garantie fixe)`);
console.log(`Mensualité/mois immeuble : ${f.monthlyPayment.toLocaleString('fr-FR')} €`);
console.log(`RAC brut copropriété     : ${f.remainingCost.toLocaleString('fr-FR')} €`);
console.log(`Économies énergie/mois   : ${f.monthlyEnergySavings.toLocaleString('fr-FR')} €`);
console.log(`Cash-flow net/mois       : ${f.netMonthlyCashFlow.toLocaleString('fr-FR')} €`);

if (f.alerts && f.alerts.length > 0) {
    console.log('\n⚠️  ALERTES DE CONFORMITÉ :');
    f.alerts.forEach((alert: string) => console.log(`   - ${alert}`));
}

console.log('\n=================================================================');
console.log('     SLIDE AG — PAR LOT (divisé par 20, hors tantièmes réels)');
console.log('=================================================================');
const p = f.perUnit!;
console.log(`coutParLotTTC            : ${p.coutParLotTTC.toLocaleString('fr-FR')} €`);
console.log(`mprParLot                : ${p.mprParLot.toLocaleString('fr-FR')} €`);
console.log(`ceeParLot                : ${p.ceeParLot.toLocaleString('fr-FR')} €`);
console.log(`ecoPtzParLot             : ${p.ecoPtzParLot.toLocaleString('fr-FR')} €`);
console.log(`mensualiteParLot         : ${p.mensualiteParLot.toLocaleString('fr-FR')} € / mois`);
console.log(`cashflowNetParLot        : ${p.cashflowNetParLot.toLocaleString('fr-FR')} € / mois`);
console.log(`racBrutParLot            : ${p.racBrutParLot.toLocaleString('fr-FR')} €`);
console.log(`racComptantParLot        : ${p.racComptantParLot.toLocaleString('fr-FR')} €  ← appelé au comptant dès AG`);
console.log(`avantagesFiscauxAnnee1   : ${p.avantagesFiscauxAnnee1.toLocaleString('fr-FR')} €  ← déductible (47.2% du RAC comptant réel)`);
console.log(`valeurVerteParLot        : ${p.valeurVerteParLot.toLocaleString('fr-FR')} €  ← plus-value patrimoniale`);

console.log('\n=================================================================');
console.log('                   COÛT DE L\'INACTION');
console.log('=================================================================');
console.log(JSON.stringify(result.inactionCost, null, 2));
