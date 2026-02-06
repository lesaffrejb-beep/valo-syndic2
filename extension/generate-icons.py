#!/usr/bin/env python3

"""
VALO-SYNDIC Ghost — Icon Generator (Python + PIL)
==================================================
Generates PNG icons using Pillow (PIL) library.
"""

import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("❌ Module 'Pillow' non installé.")
    print("📦 Installez-le avec: pip3 install Pillow")
    print("🔧 Alternative: utilisez generate-icons.sh (ImageMagick)")
    exit(1)

# Colors (Obsidian + Gold)
GOLD = "#E0B976"
OBSIDIAN = "#020202"

# Icon sizes
ICONS = [
    {"size": 16, "text": "V", "font_size": 10},
    {"size": 48, "text": "VS", "font_size": 24},
    {"size": 128, "text": "VS", "font_size": 56},
]

def generate_icon(size, text, font_size, filename):
    """Generate a single icon"""
    # Create image with obsidian background
    img = Image.new('RGB', (size, size), OBSIDIAN)
    draw = ImageDraw.Draw(img)
    
    # Draw gold border
    border_width = max(1, size // 32)
    draw.rectangle(
        [(0, 0), (size - 1, size - 1)],
        outline=GOLD,
        width=border_width
    )
    
    # Try to use a bold font, fallback to default
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        try:
            font = ImageFont.truetype("/Library/Fonts/Arial Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()
    
    # Draw text centered
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]
    
    draw.text((x, y), text, fill=GOLD, font=font)
    
    # Save
    icons_dir = Path(__file__).parent / "icons"
    icons_dir.mkdir(exist_ok=True)
    
    filepath = icons_dir / filename
    img.save(filepath, "PNG")
    print(f"✅ Généré: {filename} ({size}x{size})")

def main():
    print("🎨 Génération des icônes VALO-SYNDIC Ghost...\n")
    
    for icon in ICONS:
        filename = f"icon-{icon['size']}.png"
        generate_icon(icon['size'], icon['text'], icon['font_size'], filename)
    
    print("\n✅ Toutes les icônes ont été générées dans ./icons/")
    print("📦 Vous pouvez maintenant charger l'extension dans Chrome.")

if __name__ == "__main__":
    main()
