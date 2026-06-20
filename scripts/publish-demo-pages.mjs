import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const demoRoot = join(rootDir, 'demo');
const distDir = join(demoRoot, 'dist');
const publishDir = join(demoRoot, 'publish');

function stripImportMap(html) {
    return html
        .replace(/\s*<!-- GitHub Pages[\s\S]*?-->\s*/g, '')
        .replace(/\s*<script type="importmap">[\s\S]*?<\/script>\s*/gi, '');
}

execSync('vite build --config vite.demo.config.js', { stdio: 'inherit', cwd: rootDir });

if (!existsSync(distDir)) {
    throw new Error('demo/dist not found after build');
}

const builtHtml = stripImportMap(readFileSync(join(distDir, 'index.html'), 'utf8'));

rmSync(publishDir, { recursive: true, force: true });
mkdirSync(publishDir, { recursive: true });
writeFileSync(join(publishDir, 'index.html'), builtHtml, 'utf8');
cpSync(join(distDir, 'assets'), join(publishDir, 'assets'), { recursive: true });

console.log('');
console.log('GitHub Pages 发布包已生成: demo/publish/');
console.log('将 demo/publish/ 内全部文件复制到仓库 demo/ 目录后 push');
console.log('访问: https://jimole775.github.io/bezier-slider/demo/');
