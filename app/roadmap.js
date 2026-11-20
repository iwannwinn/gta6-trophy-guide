// The roadmap to the platinum, the missables page and the Next Up planner.
// All three are built from the trophies' own data: their stage, their
// missable flag and their kind — never from a walkthrough.
import { isEarned, getCount } from './state.js';

export const STAGES = [
  {
    number: 1,
    title: 'Play the story',
    blurb: 'Chapters 1 to 4, the opening mission and the finale, with the seven named story missions on the way. The chapter trophies and the mission trophies come from playing the main missions in order — nothing else is needed. Play the named missions carefully: they can only be earned while the mission is live, unless the game lets you replay missions.',
  },
  {
    number: 2,
    title: 'Strangers and side strands',
    blurb: 'The five side characters (Andy, Kenton, Billy, Randy, Tyrone), the 8 stranger strands and Bret\'s unique-animal hunt. Do these before the final story mission — side strands may lock after the finale, and that is not yet confirmed either way for this game.',
  },
  {
    number: 3,
    title: 'Activities',
    blurb: 'Try every activity type once, then grind the counts: 250 stunts, 42 Shooting Range challenges to gold, 14 drone-race locations, 20 different races, 50 challenges, plus fishing against Cal, one arcade game and a game of bowling.',
  },
  {
    number: 4,
    title: 'Collectibles and exploration',
    blurb: 'Sweep Leonida: 18 meditation spots, 3 card sets, 100 WAiNK It locations, 100 vehicles discovered and all 52 areas explored. Work region by region so the last few are easy to find.',
  },
  {
    number: 5,
    title: 'Combat and crime',
    blurb: 'Partner crimes, robberies and fights: a 4-star wanted level escaped with your partner, 3 shops in a row, 5 enemies in one Combat Focus, 5 bank vaults, an armored truck, one illegal operation for each of the 9 gangs, and the showroom smash.',
  },
  {
    number: 6,
    title: 'Money and the mop-up',
    blurb: 'Launder $250,000 of Marked Bills, spend $100,000 in shops, buy all 8 garages, register 10 vehicles with Scooter Bros, enjoy the Ocean Beach cocktail, and let the choices, the second-try moment and the strange event come as they will. Then 100% completion — and the platinum.',
  },
];

function stageTrophies(trophies, number) {
  return trophies.filter((t) => t.stage === number).sort((a, b) => a.id - b.id);
}

export function renderRoadmap(container, trophies, state, onSelect) {
  container.replaceChildren();
  for (const stage of STAGES) {
    const list = stageTrophies(trophies, stage.number);
    const earned = list.filter((t) => isEarned(state, t)).length;
    const card = document.createElement('article');
    card.className = 'stage-card';
    const head = document.createElement('div');
    head.className = 'stage-head';
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = `Stage ${stage.number}`;
    const title = document.createElement('h2');
    title.textContent = stage.title;
    const progress = document.createElement('span');
    progress.className = 'stage-progress';
    progress.textContent = `${earned} of ${list.length} earned`;
    head.append(num, title, progress);
    const blurb = document.createElement('p');
    blurb.className = 'stage-blurb';
    blurb.textContent = stage.blurb;
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    for (const trophy of list) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'stage-chip' + (isEarned(state, trophy) ? ' earned' : '');
      chip.textContent = `${trophy.name} · ${trophy.grade}`;
      chip.addEventListener('click', () => onSelect(trophy));
      chips.append(chip);
    }
    card.append(head, blurb, chips);
    container.append(card);
  }
}

export function renderMissables(container, trophies, state, onSelect) {
  container.replaceChildren();
  const missed = trophies.filter((t) => t.missable).sort((a, b) => a.stage - b.stage || a.id - b.id);
  for (const trophy of missed) {
    const item = document.createElement('article');
    item.className = 'missable-item';
    const title = document.createElement('h3');
    title.textContent = trophy.name;
    const grade = document.createElement('span');
    grade.className = `grade-pill grade-${trophy.grade}`;
    grade.textContent = trophy.grade;
    const earned = document.createElement('span');
    earned.className = 'kind-tag';
    earned.textContent = isEarned(state, trophy) ? '✓ Earned' : 'Not yet earned';
    const why = document.createElement('p');
    why.className = 'why';
    why.textContent = trophy.missable_note || trophy.description;
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'chip';
    open.textContent = 'Open its guide';
    open.addEventListener('click', () => onSelect(trophy));
    item.append(title, ' ', grade, ' ', earned, why, open);
    container.append(item);
  }
}

// The planner: missable trophies first, then the story in order, then quick
// single-action trophies, then the long counters — each with its reason.
export function suggestNext(trophies, state) {
  const todo = trophies.filter((t) => !isEarned(state, t));
  const score = (t) => {
    if (t.missable) return 0;
    if (t.kind === 'story') return 1;
    if (!t.target) return 2;
    return 3;
  };
  const ordered = [...todo].sort((a, b) => {
    const byScore = score(a) - score(b);
    if (byScore !== 0) return byScore;
    if (score(a) === 3) {
      const progressA = getCount(state, a) / (a.target || 1);
      const progressB = getCount(state, b) / (b.target || 1);
      if (progressB !== progressA) return progressB - progressA;
    }
    return a.stage - b.stage || a.id - b.id;
  });
  return ordered.map((trophy) => {
    let reason;
    if (trophy.missable) reason = 'Missable — do it before the finale';
    else if (trophy.kind === 'story') reason = 'Next story step';
    else if (!trophy.target) reason = 'Quick win — one action';
    else {
      const have = getCount(state, trophy);
      reason = have > 0
        ? `Already ${have.toLocaleString('en-US')} of ${trophy.target.toLocaleString('en-US')} — keep going`
        : `A long counter: ${trophy.target.toLocaleString('en-US')} ${trophy.target_label}`;
    }
    return { trophy, reason };
  });
}

export function renderNextUp(listEl, trophies, state, onSelect) {
  listEl.replaceChildren();
  const picks = suggestNext(trophies, state).slice(0, 8);
  if (picks.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'All 55 earned — the platinum is yours.';
    listEl.append(li);
    return;
  }
  for (const pick of picks) {
    const li = document.createElement('li');
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = `${pick.trophy.name} — ${pick.trophy.description}`;
    const reason = document.createElement('div');
    reason.className = 'reason';
    reason.textContent = pick.reason;
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'chip';
    open.textContent = 'Open its guide';
    open.addEventListener('click', () => onSelect(pick.trophy));
    body.append(name, reason, open);
    li.append(body);
    listEl.append(li);
  }
}
