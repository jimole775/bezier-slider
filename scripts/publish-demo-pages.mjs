import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const demoRoot = join(rootDir, 'demo');
const distDir = join(demoRoot, 'dist');
const publishDir = join(demoRoot, 'publish');

execSync('vite build --config vite.demo.config.js', { stdio: 'inherit', cwd: rootDir });

if (!existsSync(distDir)) {
    throw new Error('demo/dist not found after build');
}

rmSync(publishDir, { recursive: true, force: true });
mkdirSync(publishDir, { recursive: true });
cpSync(join(distDir, 'index.html'), join(publishDir, 'index.html'));
cpSync(join(distDir, 'assets'), join(publishDir, 'assets'), { recursive: true });

console.log('');
console.log('GitHub Pages 发布包已生成: demo/publish/');
console.log('将 demo/publish/ 内的文件复制到仓库 demo/ 目录后 push，即可访问:');
console.log('https://jimole775.github.io/bezier-slider/demo/');
