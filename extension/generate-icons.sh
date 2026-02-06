#!/bin/bash

# VALO-SYNDIC Ghost — Icon Generator (ImageMagick)
# =================================================
# Generates PNG icons using ImageMagick (convert command)

GOLD="#E0B976"
OBSIDIAN="#020202"

mkdir -p icons

echo "🎨 Génération des icônes VALO-SYNDIC Ghost..."
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick non installé."
    echo "📦 Installez-le avec: brew install imagemagick"
    echo ""
    echo "🔧 Alternative: utilisez generate-icons.js (nécessite Node.js + canvas)"
    exit 1
fi

# Generate 16x16
convert -size 16x16 xc:"$OBSIDIAN" \
  -fill "$GOLD" -stroke "$GOLD" -strokewidth 1 -draw "rectangle 0,0 15,15" \
  -fill "$GOLD" -font "Helvetica-Bold" -pointsize 10 \
  -gravity center -annotate +0+0 "V" \
  icons/icon-16.png
echo "✅ Généré: icon-16.png"

# Generate 48x48
convert -size 48x48 xc:"$OBSIDIAN" \
  -fill "$GOLD" -stroke "$GOLD" -strokewidth 2 -draw "rectangle 1,1 46,46" \
  -fill "$GOLD" -font "Helvetica-Bold" -pointsize 24 \
  -gravity center -annotate +0+0 "VS" \
  icons/icon-48.png
echo "✅ Généré: icon-48.png"

# Generate 128x128
convert -size 128x128 xc:"$OBSIDIAN" \
  -fill "$GOLD" -stroke "$GOLD" -strokewidth 3 -draw "rectangle 2,2 125,125" \
  -fill "$GOLD" -font "Helvetica-Bold" -pointsize 56 \
  -gravity center -annotate +0-5 "VS" \
  -fill "$GOLD" -font "Helvetica" -pointsize 14 \
  -gravity center -annotate +0+35 "GHOST" \
  icons/icon-128.png
echo "✅ Généré: icon-128.png"

echo ""
echo "✅ Toutes les icônes ont été générées dans ./icons/"
echo "📦 Vous pouvez maintenant charger l'extension dans Chrome."
