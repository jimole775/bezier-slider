import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const wxComponentDir = join(rootDir, 'wx', 'bezier-slider');
const engineSource = join(rootDir, 'dist', 'bezier-slider.wx-engine.cjs');
const engineTarget = join(wxComponentDir, 'engine.js');

if (!existsSync(engineSource)) {
    throw new Error('dist/bezier-slider.wx-engine.cjs not found — run vite build first');
}

mkdirSync(wxComponentDir, { recursive: true });

let engineCode = readFileSync(engineSource, 'utf8');
engineCode = `'use strict';\n\n${engineCode}`;
writeFileSync(engineTarget, engineCode, 'utf8');

console.log('wx engine bundled → wx/bezier-slider/engine.js');
