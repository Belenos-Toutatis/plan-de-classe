// Harnais de test pour « plan de classe.html ».
//
// L'app est un mono-fichier HTML avec tout le JS inline (dans un <script> en fin de
// body, ~42 000 lignes). Pour tester les fonctions PURES (suppression en cascade,
// dates/périodes, parseurs, numérotation QCM, validation d'import, audit d'intégrité)
// SANS navigateur, on :
//   1. extrait le gros <script> ;
//   2. neutralise l'appel top-level `init()` (qui exige un vrai DOM) ;
//   3. injecte tôt (juste après la déclaration de `S`) un pont `__TESTEVAL(code)`
//      qui exécute du code DANS la portée lexicale du script → accès direct à `S`
//      et à toutes les fonctions déclarées ;
//   4. exécute le script dans un contexte `vm` avec un DOM/navigateur stubé.
//
// Les déclarations `function` étant hoistées, elles sont disponibles même si une
// instruction top-level d'amorçage UI lève après l'injection du pont — le harnais
// tolère donc une exception d'auto-exécution tant que `__TESTEVAL` a été défini.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeEl() {
  const el = {
    _h: '', _t: '', _v: '',
    classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    style: {}, dataset: {}, children: [], options: [], selectedIndex: 0,
    appendChild(c) { return c; }, removeChild() {}, remove() {}, insertBefore(c) { return c; },
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null; }, hasAttribute() { return false; },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    insertAdjacentHTML() {}, focus() {}, blur() {}, click() {}, closest() { return null; },
    getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }; },
    cloneNode() { return makeEl(); },
    get innerHTML() { return this._h; }, set innerHTML(v) { this._h = v; },
    get textContent() { return this._t; }, set textContent(v) { this._t = v; },
    get value() { return this._v; }, set value(v) { this._v = v; },
  };
  return el;
}

function makeDoc() {
  return {
    getElementById() { return makeEl(); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return makeEl(); },
    createElementNS() { return makeEl(); },
    createTextNode() { return makeEl(); },
    addEventListener() {}, removeEventListener() {},
    documentElement: { dataset: {}, style: {}, classList: { add() {}, remove() {}, contains() { return false; } } },
    body: makeEl(), head: makeEl(),
    fonts: { ready: Promise.resolve(), forEach() {}, add() {}, *[Symbol.iterator]() {} },
    title: '', cookie: '',
  };
}

function loadApp() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'plan de classe.html'), 'utf8');
  const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  let code = blocks[blocks.length - 1]; // le gros script applicatif

  // Pont d'accès à la portée lexicale, injecté juste APRÈS la déclaration de S
  // (donc tôt + dans la même portée → eval peut lire/écrire S et appeler les fonctions).
  const bridge = '\nglobalThis.__TESTEVAL = function (__c) { return eval(__c); };\n';
  const before = code;
  code = code.replace(/let S = \{[\s\S]*?cur: null \};/, m => m + bridge);
  if (code === before) throw new Error('Injection du pont échouée : déclaration de S introuvable.');

  // Neutralise l'auto-exécution qui exige un vrai DOM.
  code = code.replace(/^init\(\);$/m, '/* init() neutralisé pour les tests */');

  const lsMap = new Map();
  const localStorage = {
    getItem: k => (lsMap.has(k) ? lsMap.get(k) : null),
    setItem: (k, v) => lsMap.set(k, String(v)),
    removeItem: k => lsMap.delete(k),
    clear: () => lsMap.clear(),
  };

  const sandbox = {
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp,
    Map, Set, WeakMap, WeakSet, Symbol, parseInt, parseFloat, isNaN, isFinite,
    encodeURIComponent, decodeURIComponent, URL, TextEncoder, TextDecoder,
    Blob: global.Blob || function () {}, crypto: global.crypto,
    localStorage,
    navigator: { serviceWorker: undefined, mediaDevices: undefined, userAgent: 'node', language: 'fr' },
    location: { hostname: 'localhost', href: '', protocol: 'http:', reload() {}, replace() {} },
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} }),
    confirm: () => true, alert() {}, prompt: () => null,
    fetch: async () => ({ ok: false, status: 0, json: async () => ({}), text: async () => '' }),
    indexedDB: undefined, AudioContext: undefined, webkitAudioContext: undefined,
    speechSynthesis: undefined, documentPictureInPicture: undefined,
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    atob: s => Buffer.from(s, 'base64').toString('binary'),
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.document = makeDoc();
  sandbox.window.addEventListener = () => {};
  sandbox.window.removeEventListener = () => {};

  vm.createContext(sandbox);
  try {
    vm.runInContext(code, sandbox, { filename: 'plan-de-classe-inline.js' });
  } catch (e) {
    // Tolère une exception d'amorçage UI post-injection : les fonctions sont hoistées
    // et le pont est défini tôt, donc les tests restent possibles.
    if (!sandbox.__TESTEVAL) throw e;
  }
  if (typeof sandbox.__TESTEVAL !== 'function') {
    throw new Error('__TESTEVAL non défini — le script a échoué avant l\'injection du pont.');
  }
  return sandbox;
}

module.exports = { loadApp };
