/**
 * Český kompas 2026 — Apps Script webhook
 *
 * Co tenhle skript dělá:
 *   doPost(e) — přijme JSON z webu a zapíše řádek do Google Sheets.
 *               Dva typy zpráv:
 *                 type: "result" — hotový výsledek testu (zapíše nový řádek)
 *                 type: "demo"   — dobrovolná demografie (doplní existující řádek
 *                                  podle submission_id)
 *   doGet(e)  — vrátí JSON s počtem uložených výsledků (pro případný článek
 *               "Jak odpovídalo Česko").
 *
 * SETUP (stejný postup jako u EvalAI):
 *   1. Otevři script.google.com → New project, vlož sem celý tento soubor.
 *   2. Vytvoř Google Sheet, jeho ID zkopíruj dole do SPREADSHEET_ID.
 *      (ID je dlouhý řetězec v URL sheetu mezi /d/ a /edit)
 *   3. Deploy → New deployment → Type: Web app
 *      Execute as: Me, Who has access: Anyone.
 *   4. Zkopíruj URL nasazení — patří do data.js jako WEBHOOK_URL.
 *
 * Neukládá se nic osobního: žádné IP adresy, žádná jména, žádné cookies.
 */

// ════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════

const SPREADSHEET_ID = 'DOPLN-ID-SHEETU';
const SHEET_NAME = 'vysledky';

// Pořadí sloupců MUSÍ odpovídat appendRow v processResult níž
const SHEET_HEADERS = [
  'submission_id', 'timestamp',
  'brusel_trump', 'kavarna_zbytek', 'budelip_bylolip', 'uspech_solidarita',
  'quadrant', 'twin', 'twin_match', 'threat',
  'duration_sec',
  'age', 'gender', 'place', 'education',
  'user_agent', 'version',
];

// ════════════════════════════════════════════════════════════════════════
// HTTP HANDLERS
// ════════════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const result = (payload.type === 'demo')
      ? processDemo(payload)
      : processResult(payload);
    return jsonResponse({ ok: true, ...result });
  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  try {
    const sheet = getSheet();
    return jsonResponse({ ok: true, count: Math.max(0, sheet.getLastRow() - 1) });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════════════════════════════════
// ZPRACOVÁNÍ
// ════════════════════════════════════════════════════════════════════════

function processResult(payload) {
  const scores = payload.scores;
  if (!Array.isArray(scores) || scores.length !== 4
      || scores.some(function (s) { return typeof s !== 'number' || s < -10 || s > 10; })) {
    throw new Error('Neplatné skóre.');
  }

  const row = [
    String(payload.submissionId || '').slice(0, 16),
    payload.timestamp || new Date().toISOString(),
    scores[0], scores[1], scores[2], scores[3],
    String(payload.quadrant || '').slice(0, 50),
    String(payload.twin || '').slice(0, 50),
    Number(payload.twinMatch) || '',
    String(payload.threat || '').slice(0, 30),
    Number(payload.durationSec) || '',
    '', '', '', '',                              // demografie se doplní později
    String(payload.userAgent || '').slice(0, 200),
    String(payload.version || '').slice(0, 10),
  ];

  getSheet().appendRow(row);
  return { saved: 'result' };
}

// Doplní demografii k dřív zapsanému řádku (hledá submission_id v 1. sloupci)
function processDemo(payload) {
  const id = String(payload.submissionId || '').slice(0, 16);
  if (!id) throw new Error('Chybí submission_id.');

  const sheet = getSheet();
  const finder = sheet.getRange(2, 1, Math.max(1, sheet.getLastRow() - 1), 1)
    .createTextFinder(id).matchEntireCell(true).findNext();
  if (!finder) throw new Error('Záznam nenalezen.');

  const rowIndex = finder.getRow();
  const col = function (name) { return SHEET_HEADERS.indexOf(name) + 1; };
  const clean = function (v) { return String(v || '').slice(0, 20); };

  sheet.getRange(rowIndex, col('age')).setValue(clean(payload.age));
  sheet.getRange(rowIndex, col('gender')).setValue(clean(payload.gender));
  sheet.getRange(rowIndex, col('place')).setValue(clean(payload.place));
  sheet.getRange(rowIndex, col('education')).setValue(clean(payload.education));

  return { saved: 'demo' };
}

// ════════════════════════════════════════════════════════════════════════
// SHEET I/O
// ════════════════════════════════════════════════════════════════════════

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ════════════════════════════════════════════════════════════════════════
// LOCAL TEST — spustit ručně z editoru pro ověření zápisu
// ════════════════════════════════════════════════════════════════════════

function testSubmission() {
  const fake = {
    type: 'result',
    submissionId: 'test' + new Date().getTime().toString(36).slice(-4),
    version: 'test',
    timestamp: new Date().toISOString(),
    durationSec: 123,
    scores: [10, 2, -6, -2],
    quadrant: 'Ustaraný demokrat',
    twin: 'Mikuláš Minář',
    twinMatch: 82,
    threat: 'Rusko',
    userAgent: 'apps-script-test/1.0',
  };
  console.log(processResult(fake));
  console.log(processDemo({ type: 'demo', submissionId: fake.submissionId, age: '41_60', gender: 'muz', place: 'praha', education: 'vs' }));
}
