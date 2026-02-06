#!/usr/bin/env node

/**
 * VALO-SYNDIC Ghost — Icon Generator
 * ===================================
 * Generates PNG icons for Chrome Extension (16x16, 48x48, 128x128)
 * Uses HTML5 Canvas to create simple placeholder icons.
 */

const fs = require('fs');
const path = require('path');

// Check if canvas module is available
let Canvas;
try {
    Canvas = require('canvas');
} catch (err) {
    console.error('❌ Module "canvas" non installé.');
    console.log('📦 Installez-le avec: npm install canvas');
    console.log('🔧 Alternative: utilisez les SVG existants (Chrome les supporte)');
    process.exit(1);
}

const { createCanvas } = Canvas;

// Icon configuration
const ICONS = [
    { size: 16, name: 'icon-16.png' },
    { size: 48, name: 'icon-48.png' },
    { size: 128, name: 'icon-128.png' },
];

const GOLD = '#E0B976';
const OBSIDIAN = '#020202';

function generateIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background (Obsidian)
    ctx.fillStyle = OBSIDIAN;
    ctx.fillRect(0, 0, size, size);

    // Gold Border
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = Math.max(1, size / 32);
    ctx.strokeRect(
        ctx.lineWidth / 2,
        ctx.lineWidth / 2,
        size - ctx.lineWidth,
        size - ctx.lineWidth
    );

    // Text "VS" or "V"
    ctx.fillStyle = GOLD;
    ctx.font = `bold ${size * 0.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = size >= 48 ? 'VS' : 'V';
    ctx.fillText(text, size / 2, size / 2);

    // Save to file
    const buffer = canvas.toBuffer('image/png');
    const iconsDir = path.join(__dirname, 'icons');

    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }

    const filepath = path.join(iconsDir, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`✅ Généré: ${filename} (${size}x${size})`);
}

// Generate all icons
console.log('🎨 Génération des icônes VALO-SYNDIC Ghost...\n');

for (const icon of ICONS) {
    generateIcon(icon.size, icon.name);
}

console.log('\n✅ Toutes les icônes ont été générées dans ./icons/');
console.log('📦 Vous pouvez maintenant charger l\'extension dans Chrome.');
