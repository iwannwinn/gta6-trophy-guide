// The tracker: the checklist of all 55 trophies, its filters and search,
// the spoiler masking, and the strip of what to chase next.
import { isEarned, getCount, setEarned } from './state.js';
import { suggestNext } from './roadmap.js';

export const KIND_LABELS = {
  story: 'Story',
  side: 'Side',
  collectibles: 'Collectibles',
  activities: 'Activities',
  combat: 'Combat',
  money: 'Money',
  misc: 'Misc',
  completion: 'Completion',
  platinum: 'Platinum',
};

function trophyMatches(trophy, state) {
  if (state.kind === 'missable' && !trophy.missable) return false;
  if (state.kind === 'online') return false;
  if (state.kind !== 'all' && state.kind !== 'missable' && trophy.kind !== state.kind) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.hideEarned && isEarned(state, trophy)) return false;
  if (state.search) {
    const needle = state.search.trim().toLowerCase();
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

// A story trophy still unearned stays hidden while the spoiler setting is on:
// its name and description are replaced, never shown.
export function isSpoilerHidden(trophy, state) {
  return state.spoiler && trophy.kind === 'story' && !isEarned(state, trophy);
}

function gradePill(grade) {
  const span = document.createElement('span');
  span.className = `grade-pill grade-${grade}`;
  span.textContent = grade;
  return span;
}

function formatCount(trophy, state) {
  if (!trophy.target) return '—';
  const have = getCount(state, trophy);
  const label = trophy.target >= 1000 ? trophy.target.toLocaleString('en-US') : String(trophy.target);
  const done = have >= trophy.target;
  return `${have.toLocaleString('en-US')} / ${label}${done ? ' ✓' : ''}`;
}

export function renderNextUpStrip(strip, trophies, state, onSelect) {
  strip.replaceChildren();
  const label = document.createElement('span');
  label.className = 'strip-label';
  label.textContent = 'Next up';
  strip.append(label);
  const picks = suggestNext(trophies, state).slice(0, 3);
  if (picks.length === 0) {
    const done = document.createElement('span');
    done.className = 'nextup-card';
    done.textContent = 'All 55 earned — the platinum is yours.';
    strip.append(done);
    return;
  }
  for (const pick of picks) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'nextup-card';
    const name = document.createElement('strong');
    name.textContent = pick.trophy.name;
    const why = document.createElement('span');
    why.className = 'why';
    why.textContent = pick.reason;
    card.append(name, why);
    card.addEventListener('click', () => onSelect(pick.trophy));
    strip.append(card);
  }
}

export function renderTracker(rowsEl, metaEl, trophies, state, selected, onSelect, onChanged) {
  const visible = trophies.filter((t) => trophyMatches(t, state));
  rowsEl.replaceChildren();
  if (visible.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'empty-state';
    td.textContent = state.kind === 'online'
      ? 'No online trophies in this list — every one of the 55 is earned in single-player.'
      : 'No trophies match these filters. Clear the search or pick another kind.';
    tr.append(td);
    rowsEl.append(tr);
  }
  for (const trophy of visible) {
    const earned = isEarned(state, trophy);
    const hidden = isSpoilerHidden(trophy, state);
    const tr = document.createElement('tr');
    if (earned) tr.classList.add('earned-row');
    if (selected && selected.name === trophy.name) tr.classList.add('selected');

    const boxCell = document.createElement('td');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => {
      setEarned(state, trophy, box.checked);
      if (onChanged) onChanged();
    });
    boxCell.append(box);

    const nameCell = document.createElement('td');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = hidden ? 'Hidden trophy — earn it to reveal its name' : trophy.name;
    const desc = document.createElement('div');
    desc.className = 'trophy-desc' + (hidden ? ' hidden-spoiler' : '');
    desc.textContent = hidden ? 'A story trophy. Turn the spoiler setting off to see it.' : trophy.description;
    nameCell.append(name, desc);

    const gradeCell = document.createElement('td');
    gradeCell.append(gradePill(trophy.grade));

    const kindCell = document.createElement('td');
    const kind = document.createElement('span');
    kind.className = 'kind-tag';
    kind.textContent = KIND_LABELS[trophy.kind] || trophy.kind;
    kindCell.append(kind);
    if (trophy.missable) {
      const badge = document.createElement('span');
      badge.className = 'missable-badge';
      badge.textContent = 'Missable';
      kindCell.append(badge);
    }

    const countCell = document.createElement('td');
    const counter = document.createElement('span');
    counter.className = 'counter';
    if (trophy.target && getCount(state, trophy) >= trophy.target) counter.classList.add('done');
    counter.textContent = formatCount(trophy, state);
    countCell.append(counter);

    tr.append(boxCell, nameCell, gradeCell, kindCell, countCell);
    tr.addEventListener('click', () => onSelect(trophy));
    rowsEl.append(tr);
  }
  const earned = trophies.filter((t) => isEarned(state, t)).length;
  metaEl.textContent = `Showing ${visible.length} of 55 trophies · ${earned} earned` +
    (state.kind === 'online' ? ' · this list has no online trophies' : '');
}
