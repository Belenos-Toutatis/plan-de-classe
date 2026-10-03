// Import des photos depuis le thrombinoscope PDF (MBN).
// La fixture est un faux trombinoscope (noms inventés, carrés de couleur) imprimé en PDF par
// Chrome : même structure que l'export MBN réel (PDF 1.4, polices Type0 Identity-H avec
// ToUnicode, photos JPEG en DCTDecode, grille de 4 colonnes, noms longs sur plusieurs lignes).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadApp } = require('./harness');

const sb = loadApp();
const ev = c => sb.__TESTEVAL(c);
const PDF = new Uint8Array(fs.readFileSync(path.join(__dirname, 'fixtures', 'trombi', 'fake-trombi.pdf')));

test('trombinoscope : en-tête, photos JPEG et noms lus dans le PDF', async () => {
  sb.__u8 = PDF;
  const r = JSON.parse(await ev(`_trombiParsePdf(__u8).then(r => JSON.stringify({
    h: r.header, e: r.entries.map(e => ({ t: e.text, jpg: !!e.jpeg && e.jpeg[0] === 0xFF && e.jpeg[1] === 0xD8 })) }))`));
  assert.deepStrictEqual(r.h, { classLabel: '6A', count: 10, pp: 'Mme Durand, M. Leroy', year: '2026-2027', date: '03/10/2026', school: 'Collège Jean Moulin' });
  assert.strictEqual(r.e.length, 10);
  assert.ok(r.e.every(e => e.jpg), 'chaque photo est un JPEG recopié tel quel');
  assert.deepStrictEqual(r.e.map(e => e.t), ['MARTIN Léa', 'DUPONT Jean-Baptiste', 'NGUYEN Thi Mai',
    'DE LA TOUR-DUVERNOY Marie-Charlotte', 'BERNARD Hugo', 'PETIT Zoé', 'ROUX Inès', 'FONTAINE-LACROIX Maëlys',
    'LEFÈVRE Noé', 'MOREAU Ambre']);
});

test('trombinoscope : en-tête réel de MBN (formes du rapport de diagnostic)', () => {
  const h = ev(`_trombiParseHeader(['Collège Jean Moulin', 'Année scolaire 2026-2027', 'Trombinoscope de la classe 5B',
    '28 élèves', 'Professeur principal : Mme Durand, Mme Petit', 'Trombinoscope édité le 02/10/2026 08:41', 'Page 1 sur 2'])`);
  assert.strictEqual(h.classLabel, '5B');
  assert.strictEqual(h.count, 28);
  assert.strictEqual(h.pp, 'Mme Durand, Mme Petit');
  assert.strictEqual(h.date, '02/10/2026');
});

test('trombinoscope : découpe NOM / Prénom', () => {
  const sp = s => JSON.parse(ev(`JSON.stringify(_trombiSplitName(${JSON.stringify(s)}))`));
  assert.deepStrictEqual(sp('DE LA TOUR Jean-Marc'), { nom: 'DE LA TOUR', prenom: 'Jean-Marc' });
  assert.deepStrictEqual(sp('NGUYEN Thi Mai'), { nom: 'NGUYEN', prenom: 'Thi Mai' });
  assert.deepStrictEqual(sp("N'DIAYE Aïssatou"), { nom: "N'DIAYE", prenom: 'Aïssatou' });
  assert.deepStrictEqual(sp('LEFÈVRE ÉLODIE'), { nom: 'LEFÈVRE', prenom: 'ÉLODIE' });
});

test('trombinoscope : association aux élèves (accents, ordre, doublons)', () => {
  const props = JSON.parse(ev(`JSON.stringify(_trombiMatch(
    ['DUPONT Jean-Baptiste', 'MARTIN Lea', 'DE LA TOUR Chloé', 'BERNARD Hugo', 'BERNARD Hugo', 'INCONNU Zed', 'DURAND Léo'],
    [ { id: 'a', nom: 'Dupont', prenom: 'Jean Baptiste' }, { id: 'b', nom: 'MARTIN', prenom: 'Léa' },
      { id: 'c', nom: 'De la Tour', prenom: 'Chloé' }, { id: 'd', nom: 'BERNARD', prenom: 'Hugo' },
      { id: 'e', nom: 'DURAND', prenom: 'Léo' }, { id: 'f', nom: 'DURAND', prenom: 'Léonie' } ]))`));
  assert.deepStrictEqual(props.map(p => p.sid), ['a', 'b', 'c', null, null, null, 'e']);
});

test('trombinoscope : classe désignée par « 6A », « 6e A », « 6ème A »', () => {
  ev(`S.classes = { '6A': { id: '6A', nom: '6e A', eleves: [] }, 'X5B': { id: 'X5B', nom: '5ème B', eleves: [] } }`);
  assert.strictEqual(ev(`_trombiResolveClass('6A')`), '6A');
  assert.strictEqual(ev(`_trombiResolveClass('6ème A')`), '6A');
  assert.strictEqual(ev(`_trombiResolveClass('5B')`), 'X5B');
  assert.strictEqual(ev(`_trombiResolveClass('4C')`), null);
});
