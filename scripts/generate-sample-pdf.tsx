import React from 'react';
import fs from 'fs';
import path from 'path';
import { pdf } from '@react-pdf/renderer';
import PDFDocumentEnhanced from '../src/components/pdf/PDFDocumentEnhanced';

async function run() {
  const outDir = path.resolve(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'audit-sample.pdf');

  // Minimal mock data — the PDF components are defensive about missing fields
  const mockResult: any = {
    address: '1 Rue de la République, 75001 Paris',
    input: {
      address: '1 Rue de la République',
      postalCode: '75001',
      city: 'Paris',
      numberOfUnits: 12,
      currentDPE: 'D',
      targetDPE: 'C',
    },
    summary: {
      inactionCost: 4729,
      recommendedWorks: [],
    },
    dpe: {
      letter: 'D',
      consumption: 250,
    },
    financing: {
      energyGainPercent: 0.15,
      ecoPtzAmount: 10000,
      remainingCost: 0,
    },
    // Minimal compliance object expected by PDF helpers
    compliance: {
      isProhibited: false,
      prohibitionDate: null,
      daysUntilProhibition: null,
    },
    inactionCost: {
      totalInactionCost: 4729,
      projectedCost3Years: 5200,
      currentCost: 4700,
    },
    valuation: {
      greenValueGain: 15000,
      greenValueGainPercent: 0.12,
      currentValue: 300000,
      projectedValue: 315000,
    },
  };

  const mockBrand: any = {
    agencyName: 'VALO SYNDIC — TEST',
    primaryColor: '#B8860B',
    logoUrl: undefined,
    contactEmail: 'contact@example.com',
    contactPhone: '+33 1 23 45 67 89',
  };

  const doc = (
    // @ts-ignore
    <PDFDocumentEnhanced result={mockResult} brand={mockBrand} targetProfile={undefined} showAllProfiles={true} />
  );

  console.log('Generating PDF to', outPath);
  try {
    const buffer = (await pdf(doc).toBuffer()) as unknown as Buffer;
    await fs.promises.writeFile(outPath, buffer);
    console.log('PDF generated:', outPath);
  } catch (err) {
    console.error('PDF generation failed:', err);
    process.exit(2);
  }
}

run();
