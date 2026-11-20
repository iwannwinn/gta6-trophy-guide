// Boot and wiring for the Leonida Platinum guide: load the trophy data,
// restore the reader's saved progress, and keep every view in step.
import {
  loadState, saveState, isEarned, earnedCount, earnedByGrade,
} from './state.js';
import { renderTracker, renderNextUpStrip } from './tracker.js';
import { renderDetail } from './detail.js';
import { renderRoadmap, renderMissables, renderNextUp } from './roadmap.js';

const state = loadState();
let trophies = [];
let selected = null;

const $ = (id) => document.getElementById(id);
const rowsEl = $('rows');
const metaEl = $('list-meta');
const detailEl = $('detail');
const stripEl = $('nextup-strip');
const roadmapEl = $('roadmap-stages');
const missableEl = $('missable-list');
const nextupEl = $('nextup-list');

function updateProgress() {
  const earned = earnedCount(state, trophies);
  const pct = Math.round((earned / trophies.length) * 100);
  $('progress-count').textContent = `${earned} of ${trophies.length}`;
  $('progress-pct').textContent = `${pct}%`;
  $('progress-fill').style.width = `${pct}%`;
  const byGrade = earnedByGrade(state, trophies);
  $('progress-sub').textContent =
    `Platinum ${byGrade.platinum}/1 · Gold ${byGrade.gold}/2 · Silver ${byGrade.silver}/6 · Bronze ${byGrade.bronze}/46`;
}

function renderAll() {
  updateProgress();
  renderNextUpStrip(stripEl, trophies, state, selectTrophy);
  renderTracker(rowsEl, metaEl, trophies, state, selected, selectTrophy, renderAll);
  renderDetail(detailEl, selected, state, renderAll);
  renderRoadmap(roadmapEl, trophies, state, selectTrophy);
  renderMissables(missableEl, trophies, state, selectTrophy);
  renderNextUp(nextupEl, trophies, state, selectTrophy);
}

function selectTrophy(trophy) {
  selected = trophy;
  showTab('tracker');
  renderAll();
  detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

const TABS = ['tracker', 'roadmap', 'missables', 'nextup'];

function showTab(tab) {
  if (!TABS.includes(tab)) tab = 'tracker';
  state.tab = tab;
  saveState(state);
  for (const name of TABS) {
    $(`view-${name}`).classList.toggle('active', name === tab);
  }
  for (const button of document.querySelectorAll('.tabs button')) {
    button.classList.toggle('active', button.dataset.tab === tab);
  }
  if (location.hash !== `#${tab}`) history.replaceState(null, '', `#${tab}`);
  window.scrollTo(0, 0);
}

for (const button of document.querySelectorAll('.tabs button')) {
  button.addEventListener('click', () => showTab(button.dataset.tab));
}

// Deep links keep working when the reader follows one after the page loads.
window.addEventListener('hashchange', () => {
  const fromHash = location.hash.replace('#', '');
  if (TABS.includes(fromHash) && fromHash !== state.tab) showTab(fromHash);
});

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  $('theme-toggle').textContent = state.theme === 'dark' ? 'Light look' : 'Dark look';
}

$('theme-toggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveState(state);
  applyTheme();
});

$('spoiler-toggle').checked = state.spoiler;
$('spoiler-toggle').addEventListener('change', (event) => {
  state.spoiler = event.target.checked;
  saveState(state);
  renderAll();
});

for (const chip of document.querySelectorAll('#kind-chips .chip')) {
  chip.classList.toggle('active', chip.dataset.kind === state.kind);
  chip.addEventListener('click', () => {
    state.kind = chip.dataset.kind;
    saveState(state);
    for (const other of document.querySelectorAll('#kind-chips .chip')) {
      other.classList.toggle('active', other === chip);
    }
    renderAll();
  });
}

$('grade').value = state.grade;
$('grade').addEventListener('change', (event) => {
  state.grade = event.target.value;
  saveState(state);
  renderAll();
});

$('hide-earned').checked = state.hideEarned;
$('hide-earned').addEventListener('change', (event) => {
  state.hideEarned = event.target.checked;
  saveState(state);
  renderAll();
});

$('search').value = state.search;
$('search').addEventListener('input', (event) => {
  state.search = event.target.value;
  saveState(state);
  renderAll();
});

$('export').addEventListener('click', () => {
  const payload = {
    game: 'Grand Theft Auto VI',
    exported: new Date().toISOString(),
    earned: Object.keys(state.earned),
    counts: state.counts,
    notes: state.notes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leonida-platinum-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
});

$('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const names = new Set(trophies.map((t) => t.name));
    state.earned = {};
    for (const name of Array.isArray(payload.earned) ? payload.earned : []) {
      if (names.has(name)) state.earned[name] = true;
    }
    state.counts = {};
    for (const [name, value] of Object.entries(payload.counts || {})) {
      const trophy = trophies.find((t) => t.name === name);
      if (trophy && Number.isFinite(Number(value))) {
        state.counts[name] = Math.max(0, Math.min(trophy.target || 0, Math.floor(Number(value))));
      }
    }
    state.notes = {};
    for (const [name, value] of Object.entries(payload.notes || {})) {
      if (names.has(name) && typeof value === 'string') state.notes[name] = value.slice(0, 500);
    }
    saveState(state);
    renderAll();
  } catch {
    metaEl.textContent = 'That file could not be read as a progress export — nothing was changed.';
  }
  event.target.value = '';
});

$('reset').addEventListener('click', () => {
  if (!window.confirm('Clear every tick, counter and note? This cannot be undone.')) return;
  state.earned = {};
  state.counts = {};
  state.notes = {};
  saveState(state);
  renderAll();
});

async function boot() {
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  trophies = doc.trophies;
  applyTheme();
  const fromHash = location.hash.replace('#', '');
  showTab(TABS.includes(fromHash) ? fromHash : (state.tab || 'tracker'));
  selected = trophies.find((t) => t.name === 'The Shootist') || trophies[0];
  renderAll();
}

boot();
