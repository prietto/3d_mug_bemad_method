/**
 * Script to generate placeholder thumbnails for mug templates
 * Run with: node scripts/generate-template-thumbnails.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const templates = [
  { id: 'classic-white', name: 'Classic White', color: '#FFFFFF', textColor: '#333333' },
  { id: 'colorful-abstract', name: 'Colorful', color: '#FF6B6B', textColor: '#FFFFFF' },
  { id: 'minimalist-line', name: 'Minimalist', color: '#F5F5F5', textColor: '#000000' },
  { id: 'watercolor-floral', name: 'Floral', color: '#FFB6C1', textColor: '#FFFFFF' },
  { id: 'corporate-pro', name: 'Corporate', color: '#2C3E50', textColor: '#FFFFFF' },
  { id: 'vintage-retro', name: 'Vintage', color: '#F39C12', textColor: '#FFFFFF' },
  { id: 'photo-collage', name: 'Photo', color: '#95A5A6', textColor: '#FFFFFF' }
];

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'templates');
const SIZE = 150;

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

templates.forEach(template => {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = template.color;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Add border
  ctx.strokeStyle = '#DDDDDD';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, SIZE, SIZE);

  // Add template name
  ctx.fillStyle = template.textColor;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(template.name, SIZE / 2, SIZE / 2);

  // Add decorative element based on template type
  if (template.id === 'colorful-abstract') {
    // Add some geometric shapes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(30, 30, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(100, 100, 30, 30);
  } else if (template.id === 'watercolor-floral') {
    // Add flower-like circles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(
        SIZE / 2 + Math.cos((i * 2 * Math.PI) / 5) * 30,
        SIZE / 2 + Math.sin((i * 2 * Math.PI) / 5) * 30,
        10,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  } else if (template.id === 'minimalist-line') {
    // Add single accent line
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, SIZE / 2);
    ctx.lineTo(SIZE - 30, SIZE / 2);
    ctx.stroke();
  }

  // Save as PNG (can convert to WebP later if needed)
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(OUTPUT_DIR, `${template.id}.webp`);

  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Generated ${template.id}.webp`);
});

console.log(`\n✨ Generated ${templates.length} template thumbnails in ${OUTPUT_DIR}`);
