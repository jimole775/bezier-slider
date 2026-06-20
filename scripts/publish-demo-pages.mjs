import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const demoRoot = join(rootDir, 'demo');
const distDir = join(demoRoot, 'dist');
const publishDir = join(demoRoot, 'publish');
const deployAssetsDir = join(demoRoot, 'assets');
const builtHtmlPath = join(distDir, 'index.dev.html');

function prepareDeployHtml(html) {
    return html
        .replace(/\s*<!-- GitHub Pages[\s\S]*?-->\s*/g, '')
        .replace(/\s*<script type="importmap">[\s\S]*?<\/script>\s*/gi, '')
        .replace(/\s*<link[^>]*highlight\.js[^>]*>\s*/gi, '');
}

function replaceDirContents(sourceDir, targetDir) {
    rmSync(targetDir, { recursive: true, force: true });
    mkdirSync(targetDir, { recursive: true });
    cpSync(sourceDir, targetDir, { recursive: true });
}

function normalizeAssetNames(assetsDir, html) {
    let result = html;

    for (const fileName of listAssetFiles(assetsDir)) {
        const normalized = fileName.replace(/^index\.dev-/, 'index-');
        if (normalized === fileName) {
            continue;
        }

        renameSync(join(assetsDir, fileName), join(assetsDir, normalized));
        result = result.split(fileName).join(normalized);
    }

    return result;
}

function syncDeployOutput(sourceAssetsDir, targetAssetsDir, html) {
    replaceDirContents(sourceAssetsDir, targetAssetsDir);
    return normalizeAssetNames(targetAssetsDir, html);
}

function listAssetFiles(dir) {
    if (!existsSync(dir)) {
        return [];
    }

    return readdirSync(dir).filter((name) => statSync(join(dir, name)).isFile());
}

execSync('vite build --config vite.demo.config.js', { stdio: 'inherit', cwd: rootDir });

if (!existsSync(builtHtmlPath)) {
    throw new Error('demo/dist/index.dev.html not found after build');
}

const builtAssetsDir = join(distDir, 'assets');
if (!existsSync(builtAssetsDir)) {
    throw new Error('demo/dist/assets not found after build');
}

const deployHtml = prepareDeployHtml(readFileSync(builtHtmlPath, 'utf8'));

rmSync(publishDir, { recursive: true, force: true });
mkdirSync(publishDir, { recursive: true });
cpSync(builtAssetsDir, join(publishDir, 'assets'), { recursive: true });
const publishHtml = normalizeAssetNames(join(publishDir, 'assets'), deployHtml);
writeFileSync(join(publishDir, 'index.html'), publishHtml, 'utf8');

const demoHtml = syncDeployOutput(builtAssetsDir, deployAssetsDir, deployHtml);
writeFileSync(join(demoRoot, 'index.html'), demoHtml, 'utf8');

const assetFiles = listAssetFiles(deployAssetsDir);

console.log('');
console.log('GitHub Pages 发布包已同步到 demo/');
console.log(`  demo/index.html`);
console.log(`  demo/assets/ (${assetFiles.length} 个文件)`);
console.log('');
console.log('本地预览: npm run preview:demo');
console.log('提交并 push 后访问: https://jimole775.github.io/bezier-slider/demo/');
console.log('本地开发请用: npm run dev  →  /index.dev.html');
