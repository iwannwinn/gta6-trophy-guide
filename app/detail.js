// The guide panel beside the checklist: one trophy's official details,
// its guide with the sources beside it, a counter for counted trophies,
// and the reader's own note.
import { isEarned, getCount, setCount, getNote, setNote, setEarned } from './state.js';
import { isSpoilerHidden } from './tracker.js';
import { STAGES } from './roadmap.js';

function gradePill(grade) {
  const span = document.createElement('span');
  span.className = `grade-pill grade-${grade}`;
  span.textContent = grade;
  return span;
}

export function renderDetail(panel, trophy, state, onChanged) {
  panel.replaceChildren();
  if (!trophy) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Pick a trophy from the list to see its guide, its sources and your progress on it.';
    panel.append(empty);
    return;
  }
  const hidden = isSpoilerHidden(trophy, state);
  const earned = isEarned(state, trophy);

  const gradeLine = document.createElement('div');
  gradeLine.className = 'detail-grade';
  gradeLine.append(gradePill(trophy.grade));

  const title = document.createElement('h2');
  title.textContent = hidden ? 'Hidden trophy' : trophy.name;
  panel.append(gradeLine, title);

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden
    ? 'A story trophy. Earn it in the game to reveal its name and description here.'
    : trophy.description;
  panel.append(official);

  if (!hidden) {
    const guideLabel = document.createElement('div');
    guideLabel.className = 'guide-label';
    guideLabel.textContent = 'Guide';
    const guide = document.createElement('p');
    guide.className = 'guide';
    guide.textContent = trophy.guide;
    panel.append(guideLabel, guide);

    if (trophy.missable && trophy.missable_note) {
      const note = document.createElement('div');
      note.className = 'missable-note';
      note.textContent = `Missable: ${trophy.missable_note}`;
      panel.append(note);
    }

    const sourcesLabel = document.createElement('div');
    sourcesLabel.className = 'sources-label';
    sourcesLabel.textContent = 'Sources';
    const sources = document.createElement('ul');
    sources.className = 'sources';
    for (const source of trophy.sources || []) {
      const li = document.createElement('li');
      li.textContent = source;
      sources.append(li);
    }
    panel.append(sourcesLabel, sources);
  }

  if (trophy.target) {
    const counterLabel = document.createElement('div');
    counterLabel.className = 'guide-label';
    counterLabel.textContent = `Your progress — ${trophy.target_label}`;
    const box = document.createElement('div');
    box.className = 'counter-box';
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(trophy.target);
    input.value = String(getCount(state, trophy));
    input.setAttribute('aria-label', `How many ${trophy.target_label} you have done`);
    const targetText = document.createElement('span');
    targetText.textContent = `of ${trophy.target.toLocaleString('en-US')} ${trophy.target_label}`;
    const setButton = document.createElement('button');
    setButton.type = 'button';
    setButton.textContent = 'Save count';
    setButton.addEventListener('click', () => {
      setCount(state, trophy, input.value);
      onChanged();
    });
    box.append(input, targetText, setButton);
    panel.append(counterLabel, box);
  }

  const notesLabel = document.createElement('div');
  notesLabel.className = 'notes-label';
  notesLabel.textContent = 'Your note';
  const noteBox = document.createElement('textarea');
  noteBox.value = getNote(state, trophy);
  noteBox.placeholder = 'Your own note on this trophy — a place, a loadout, a reminder…';
  noteBox.setAttribute('aria-label', `Your note on ${trophy.name}`);
  noteBox.addEventListener('change', () => setNote(state, trophy, noteBox.value));
  panel.append(notesLabel, noteBox);

  const earnButton = document.createElement('button');
  earnButton.type = 'button';
  earnButton.className = 'earn-btn' + (earned ? ' earned' : '');
  earnButton.textContent = earned ? '✓ Earned — tap to unmark' : 'Mark as earned';
  earnButton.addEventListener('click', () => {
    setEarned(state, trophy, !earned);
    onChanged();
  });
  panel.append(earnButton);

  const stage = STAGES.find((s) => s.number === trophy.stage);
  if (stage) {
    const stageLine = document.createElement('p');
    stageLine.className = 'stage-line';
    stageLine.textContent = `Roadmap stage ${stage.number}: ${stage.title}`;
    panel.append(stageLine);
  }
}
