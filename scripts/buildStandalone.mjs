import { promises as fs } from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const OUTPUT_HTML_PATH = path.join(DIST_DIR, 'enzyme-reactor-simulator-standalone.html');

/**
 * Reads a UTF-8 text file from disk.
 *
 * @param {string} filePath The absolute path to the file.
 * @returns {Promise<string>} The file contents.
 */
async function readText(filePath) {
  return fs.readFile(filePath, 'utf8');
}

/**
 * Reads a file from disk as a raw buffer.
 *
 * @param {string} filePath The absolute path to the file.
 * @returns {Promise<Buffer>} The file contents.
 */
async function readBuffer(filePath) {
  return fs.readFile(filePath);
}

/**
 * Resolves an asset path found in the built HTML to an on-disk file path.
 *
 * @param {string} assetPath The path referenced from the built HTML.
 * @returns {string} The absolute filesystem path for the asset.
 */
function resolveAssetPath(assetPath) {
  const normalizedPath = assetPath.replace(/^\.\//, '').replace(/^\//, '');
  return path.join(DIST_DIR, normalizedPath);
}

/**
 * Converts a file into a base64 data URL.
 *
 * @param {string} assetPath The path referenced from the built HTML.
 * @param {string} mimeType The MIME type for the asset.
 * @returns {Promise<string>} A base64 data URL containing the asset.
 */
async function buildDataUrl(assetPath, mimeType) {
  const buffer = await readBuffer(resolveAssetPath(assetPath));
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Replaces stylesheet links with data-URL-backed links.
 *
 * @param {string} html The original built HTML.
 * @returns {Promise<string>} The HTML with stylesheet assets embedded.
 */
async function inlineStylesheets(html) {
  const stylesheetPattern = /<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;
  let result = html;
  let match = stylesheetPattern.exec(html);

  while (match !== null) {
    const [fullMatch, href] = match;
    const stylesheetDataUrl = await buildDataUrl(href, 'text/css');
    result = result.replace(fullMatch, `<link rel="stylesheet" href="${stylesheetDataUrl}">`);
    match = stylesheetPattern.exec(html);
  }

  return result;
}

/**
 * Replaces module scripts with data-URL-backed scripts.
 *
 * @param {string} html The original built HTML.
 * @returns {Promise<string>} The HTML with module scripts embedded.
 */
async function inlineModuleScripts(html) {
  const scriptPattern =
    /<script\s+type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g;
  let result = html;
  let match = scriptPattern.exec(html);

  while (match !== null) {
    const [fullMatch, src] = match;
    const scriptDataUrl = await buildDataUrl(src, 'text/javascript');
    result = result.replace(fullMatch, `<script type="module" src="${scriptDataUrl}"></script>`);
    match = scriptPattern.exec(html);
  }

  return result;
}

/**
 * Replaces the favicon reference with a data URL so the HTML is self-contained.
 *
 * @param {string} html The original built HTML.
 * @returns {Promise<string>} The HTML with an embedded favicon.
 */
async function inlineFavicon(html) {
  const faviconPattern =
    /<link\s+rel="icon"[^>]*type="image\/svg\+xml"[^>]*href="([^"]+)"[^>]*\/?>/;
  const match = faviconPattern.exec(html);

  if (match === null) {
    return html;
  }

  const [fullMatch, href] = match;
  const faviconDataUrl = await buildDataUrl(href, 'image/svg+xml');
  return html.replace(
    fullMatch,
    `<link rel="icon" type="image/svg+xml" href="${faviconDataUrl}" />`,
  );
}

/**
 * Removes module-preload hints that are no longer needed after inlining.
 *
 * @param {string} html The HTML document after asset inlining.
 * @returns {string} The HTML without module-preload links.
 */
function stripModulePreloads(html) {
  return html.replace(/<link\s+rel="modulepreload"[^>]*>\s*/g, '');
}

/**
 * Builds the standalone single-file HTML artifact from the Vite output.
 *
 * @returns {Promise<void>} Resolves once the standalone file is written.
 */
async function buildStandaloneHtml() {
  const indexHtml = await readText(INDEX_HTML_PATH);
  const htmlWithFavicon = await inlineFavicon(indexHtml);
  const htmlWithStyles = await inlineStylesheets(htmlWithFavicon);
  const htmlWithScripts = await inlineModuleScripts(htmlWithStyles);
  const standaloneHtml = stripModulePreloads(htmlWithScripts);

  await fs.writeFile(OUTPUT_HTML_PATH, standaloneHtml, 'utf8');
  process.stdout.write(`${OUTPUT_HTML_PATH}\n`);
}

await buildStandaloneHtml();
