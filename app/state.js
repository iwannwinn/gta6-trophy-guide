// Saved progress for the trophy tracker: earned ticks, counted progress,
// per-trophy notes, and the reader's own settings. Everything lives in
// localStorage, so the progress survives a reload and never leaves the machine.
const STORAGE_KEY = 'leonida-platinum-v1';

function blankState() {
  return {
    earned: {},
    counts: {},
    notes: {},
    spoiler: false,
    theme: 'light',
    tab: 'tracker',
    kind: 'all',
    grade: 'all',
    hideEarned: false,
    search: '',
  };
}

export function loadState() {
  const state = blankState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return state;
    const saved = JSON.parse(raw);
    if (saved && typeof saved === 'object') {
      for (const key of Object.keys(state)) {
        if (saved[key] !== undefined) state[key] = saved[key];
      }
    }
  } catch {
    // A damaged save is ignored rather than wiping the reader's progress.
  }
  return state;
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing may refuse storage; the tracker still works in memory.
  }
}

export function isEarned(state, trophy) {
  return Boolean(state.earned[trophy.name]);
}

export function setEarned(state, trophy, earned) {
  if (earned) state.earned[trophy.name] = true;
  else delete state.earned[trophy.name];
  saveState(state);
}

export function getCount(state, trophy) {
  const value = Number(state.counts[trophy.name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function setCount(state, trophy, value) {
  const clean = Math.max(0, Math.min(trophy.target || 0, Math.floor(Number(value) || 0)));
  if (clean > 0) state.counts[trophy.name] = clean;
  else delete state.counts[trophy.name];
  if (trophy.target && clean >= trophy.target) state.earned[trophy.name] = true;
  saveState(state);
}

export function getNote(state, trophy) {
  return typeof state.notes[trophy.name] === 'string' ? state.notes[trophy.name] : '';
}

export function setNote(state, trophy, text) {
  const clean = String(text).slice(0, 500);
  if (clean.trim()) state.notes[trophy.name] = clean;
  else delete state.notes[trophy.name];
  saveState(state);
}

export function earnedCount(state, trophies) {
  return trophies.filter((t) => isEarned(state, t)).length;
}

export function earnedByGrade(state, trophies) {
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) {
    if (isEarned(state, t)) byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
  }
  return byGrade;
}
