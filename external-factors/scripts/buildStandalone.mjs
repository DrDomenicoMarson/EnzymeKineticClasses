import { promises as fs } from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const OUTPUT_HTML_PATH = path.join(DIST_DIR, 'enzyme-external-factors-standalone.html');

async function readText(filePath) {
  return fs.readFile(filePath, 'utf8');
}

async function readBuffer(filePath) {
  return fs.readFile(filePath);
}

function resolveAssetPath(assetPath) {
  const normalizedPath = assetPath.replace(/^\.\//, '').replace(/^\//, '');
  return path.join(DIST_DIR, normalizedPath);
}

async function buildDataUrl(assetPath, mimeType) {
  const buffer = await readBuffer(resolveAssetPath(assetPath));
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function inlineStylesheets(html) {
  const pattern = /<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;
  let result = html;
  let match = pattern.exec(html);
  while (match !== null) {
    const [fullMatch, href] = match;
    const dataUrl = await buildDataUrl(href, 'text/css');
    result = result.replace(fullMatch, `<link rel="stylesheet" href="${dataUrl}">`);
    match = pattern.exec(html);
  }
  return result;
}

async function inlineModuleScripts(html) {
  const pattern = /<script\s+type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g;
  let result = html;
  let match = pattern.exec(html);
  while (match !== null) {
    const [fullMatch, src] = match;
    const dataUrl = await buildDataUrl(src, 'text/javascript');
    result = result.replace(fullMatch, `<script type="module" src="${dataUrl}"></script>`);
    match = pattern.exec(html);
  }
  return result;
}

async function inlineFavicon(html) {
  const pattern = /<link\s+rel="icon"[^>]*type="image\/svg\+xml"[^>]*href="([^"]+)"[^>]*\/?>/;
  const match = pattern.exec(html);
  if (!match) return html;
  const [fullMatch, href] = match;
  const dataUrl = await buildDataUrl(href, 'image/svg+xml');
  return html.replace(fullMatch, `<link rel="icon" type="image/svg+xml" href="${dataUrl}" />`);
}

function stripModulePreloads(html) {
  return html.replace(/<link\s+rel="modulepreload"[^>]*>\s*/g, '');
}

async function buildStandaloneHtml() {
  const indexHtml = await readText(INDEX_HTML_PATH);
  const htmlWithFavicon = await inlineFavicon(indexHtml);
  const htmlWithStyles = await inlineStylesheets(htmlWithFavicon);
  const htmlWithScripts = await inlineModuleScripts(htmlWithStyles);
  const standaloneHtml = stripModulePreloads(htmlWithScripts);
  await fs.writeFile(OUTPUT_HTML_PATH, standaloneHtml, 'utf8');
  process.stdout.write(`✅ ${OUTPUT_HTML_PATH}\n`);
}

await buildStandaloneHtml();
