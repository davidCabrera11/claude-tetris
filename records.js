'use strict';

// ---- Records: top 5 local, mejor combo y líneas máximas (localStorage) ----
const RECORDS_KEY = 'tetris-records';
const MAX_RECORDS = 5;
const NAME_MAX = 12;

function emptyRecords() {
  return { top: [], bestCombo: 0, maxLines: 0 };
}

function sanitizeName(name) {
  const clean = String(name ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, NAME_MAX);
  return clean || 'ANON';
}

function toCount(v) {
  return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
}

function loadRecords() {
  const rec = emptyRecords();
  try {
    const data = JSON.parse(localStorage.getItem(RECORDS_KEY));
    if (!data || typeof data !== 'object') return rec;
    rec.bestCombo = toCount(data.bestCombo);
    rec.maxLines = toCount(data.maxLines);
    if (Array.isArray(data.top)) {
      rec.top = data.top
        .filter(e => e && typeof e === 'object' && Number.isFinite(e.score))
        .map(e => ({
          name: sanitizeName(e.name),
          score: toCount(e.score),
          lines: toCount(e.lines),
          level: Math.max(1, toCount(e.level)),
          date: typeof e.date === 'string' ? e.date.slice(0, 32) : '',
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RECORDS);
    }
  } catch (e) { /* datos corruptos o localStorage no disponible */ }
  return rec;
}

function saveRecords(rec) {
  try { localStorage.setItem(RECORDS_KEY, JSON.stringify(rec)); } catch (e) { /* ignorar */ }
}

function scoreQualifies(rec, score) {
  if (score <= 0) return false;
  return rec.top.length < MAX_RECORDS || score > rec.top[rec.top.length - 1].score;
}

// Inserta la entrada (tras las existentes con igual puntuación) y devuelve el objeto insertado
function insertRecord(rec, entry) {
  let i = rec.top.findIndex(e => e.score < entry.score);
  if (i === -1) i = rec.top.length;
  rec.top.splice(i, 0, entry);
  rec.top.length = Math.min(rec.top.length, MAX_RECORDS);
  return entry;
}

function resetRecords() {
  try { localStorage.removeItem(RECORDS_KEY); } catch (e) { /* ignorar */ }
}

// Dibuja la tabla en un <ol>; highlightIdx = índice de la fila a resaltar
function renderRecordList(listEl, rec, highlightIdx = -1) {
  listEl.textContent = '';
  if (!rec.top.length) {
    const li = document.createElement('li');
    li.className = 'record-empty';
    li.textContent = 'Sin records aún';
    listEl.appendChild(li);
    return;
  }
  rec.top.forEach((e, i) => {
    const li = document.createElement('li');
    li.className = 'record-row' + (i === highlightIdx ? ' record-new' : '');
    const name = document.createElement('span');
    name.className = 'record-name';
    name.textContent = `${i + 1}. ${e.name}`;
    const sc = document.createElement('span');
    sc.className = 'record-score';
    sc.textContent = e.score.toLocaleString();
    li.append(name, sc);
    li.title = `${e.lines} líneas · nivel ${e.level}${e.date ? ' · ' + e.date : ''}`;
    listEl.appendChild(li);
  });
}

// ---- UI ----
const recordsListEl = document.getElementById('records-list');
const recordsComboEl = document.getElementById('records-combo');
const recordsLinesEl = document.getElementById('records-lines');
const recordsResetBtn = document.getElementById('records-reset');
const overlayRecordsEl = document.getElementById('overlay-records');
const recordFormEl = document.getElementById('record-form');
const recordNameEl = document.getElementById('record-name');
const recordNoteEl = document.getElementById('record-note');

let pendingRecord = null; // { score, lines, level } mientras se espera el nombre

function renderAllRecords(rec, highlightIdx = -1) {
  renderRecordList(recordsListEl, rec, highlightIdx);
  renderRecordList(overlayRecordsEl, rec, highlightIdx);
  recordsComboEl.textContent = rec.bestCombo;
  recordsLinesEl.textContent = rec.maxLines;
}

// Llamado al terminar la partida
function recordGameEnd(score, lines, level, bestCombo) {
  const rec = loadRecords();
  rec.bestCombo = Math.max(rec.bestCombo, bestCombo);
  rec.maxLines = Math.max(rec.maxLines, lines);
  saveRecords(rec);
  overlayRecordsEl.classList.remove('hidden');
  renderAllRecords(rec);
  if (scoreQualifies(rec, score)) {
    pendingRecord = { score, lines, level };
    recordNoteEl.textContent = '¡Nuevo record! Escribe tu nombre';
    recordNoteEl.classList.remove('hidden');
    recordNameEl.value = 'ANON';
    recordFormEl.classList.remove('hidden');
    recordNameEl.focus();
    recordNameEl.select();
  } else {
    recordFormEl.classList.add('hidden');
    recordNoteEl.classList.add('hidden');
  }
}

function commitPendingRecord() {
  if (!pendingRecord) return;
  const { score, lines, level } = pendingRecord;
  pendingRecord = null;
  const rec = loadRecords();
  if (!scoreQualifies(rec, score)) {
    recordFormEl.classList.add('hidden');
    recordNoteEl.textContent = 'La puntuación ya no entra en el top';
    renderAllRecords(rec);
    return;
  }
  const entry = insertRecord(rec, {
    name: sanitizeName(recordNameEl.value),
    score, lines, level,
    date: new Date().toISOString().slice(0, 10),
  });
  saveRecords(rec);
  recordFormEl.classList.add('hidden');
  recordNoteEl.textContent = '¡Record guardado!';
  renderAllRecords(rec, rec.top.indexOf(entry));
}

// Al iniciar partida: si quedó un record sin guardar se guarda con el nombre escrito
function resetRecordUI() {
  commitPendingRecord();
  recordFormEl.classList.add('hidden');
  recordNoteEl.classList.add('hidden');
  overlayRecordsEl.classList.add('hidden');
  renderAllRecords(loadRecords());
}

recordFormEl.addEventListener('submit', e => {
  e.preventDefault();
  commitPendingRecord();
  document.getElementById('restart-btn').focus();
});

recordsResetBtn.addEventListener('click', () => {
  recordsResetBtn.blur();
  if (!confirm('¿Resetear todos los records?')) return;
  resetRecords();
  pendingRecord = null; // el record pendiente tampoco debe sobrevivir al reset
  recordFormEl.classList.add('hidden');
  recordNoteEl.classList.add('hidden');
  renderAllRecords(loadRecords());
  recordsResetBtn.blur();
});

renderAllRecords(loadRecords());
