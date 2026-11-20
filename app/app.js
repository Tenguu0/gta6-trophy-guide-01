const STORAGE = 'leonida-field-notes-progress-v1';
const spoilerStorage = 'leonida-field-notes-spoilers-v1';
const list = await (await fetch('data/trophies.json')).json();
const trophies = list.trophies;
const earned = new Set(JSON.parse(localStorage.getItem(STORAGE) || '[]'));
const byId = new Map(trophies.map((item) => [item.id, item]));
const rows = document.querySelector('#rows');
const dialog = document.querySelector('#detail');
const query = new URLSearchParams(location.search);
let hideSpoilers = localStorage.getItem(spoilerStorage) === 'true';

function persistProgress() {
  localStorage.setItem(STORAGE, JSON.stringify([...earned]));
}

function isSpoiler(item) {
  return item.hidden || item.kind === 'story';
}

function visibleName(item) {
  return hideSpoilers && isSpoiler(item) && !earned.has(item.name) ? 'Hidden trophy' : item.name;
}

function renderSummary() {
  const count = earned.size;
  document.querySelector('#progress').textContent = `${count} / ${trophies.length} earned`;
  document.querySelector('#progress-bar').style.width = `${count / trophies.length * 100}%`;
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  document.querySelector('#grade-summary').textContent = grades.map((grade) => `${grade[0].toUpperCase()} ${trophies.filter((t) => t.grade === grade && earned.has(t.name)).length}/${trophies.filter((t) => t.grade === grade).length}`).join('  ·  ');
  const staged = trophies.filter((t) => t.stage >= 1 && t.stage <= 4);
  document.querySelector('#roadmap-progress').textContent = `${Math.round(staged.filter((t) => earned.has(t.name)).length / staged.length * 100)}%`;
}

function makeTrophyCard(item) {
  const card = document.createElement('article');
  card.className = 'trophy';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = earned.has(item.name);
  checkbox.setAttribute('aria-label', `Mark ${visibleName(item)} earned`);
  checkbox.addEventListener('change', () => {
    checkbox.checked ? earned.add(item.name) : earned.delete(item.name);
    persistProgress();
    render();
  });
  const open = document.createElement('button');
  open.className = 'trophy-main';
  const name = document.createElement('span');
  name.className = 'trophy-name';
  name.textContent = visibleName(item);
  const description = document.createElement('span');
  description.className = 'trophy-desc';
  description.textContent = hideSpoilers && isSpoiler(item) && !earned.has(item.name) ? 'Earn this trophy to reveal its details.' : item.description;
  open.append(name, description);
  open.addEventListener('click', () => showDetail(item));
  const grade = document.createElement('span');
  grade.className = 'grade-tag';
  grade.textContent = item.grade;
  card.append(checkbox, open, grade);
  if (item.missable) {
    const flag = document.createElement('span');
    flag.className = 'flags';
    flag.textContent = `CHECK WINDOW · ${item.missableWhen}`;
    open.append(flag);
  }
  return card;
}

function matchesFilter(item) {
  const kind = document.querySelector('#kind').value;
  const grade = document.querySelector('#grade').value;
  const search = document.querySelector('#search').value.trim().toLowerCase();
  const candidate = visibleName(item).toLowerCase();
  return (kind === 'all' || item.kind === kind) && (grade === 'all' || item.grade === grade) && (!search || candidate.includes(search));
}

function render() {
  rows.replaceChildren();
  const filtered = trophies.filter(matchesFilter);
  for (const item of filtered) rows.append(makeTrophyCard(item));
  document.querySelector('#result-count').textContent = `Showing ${filtered.length} of ${trophies.length} trophies`;
  renderSummary();
}

function showDetail(item) {
  const content = document.querySelector('#detail-content');
  content.replaceChildren();
  const title = document.createElement('h2');
  title.className = 'detail-title';
  title.textContent = visibleName(item);
  const grade = document.createElement('div');
  grade.className = 'detail-grade';
  grade.textContent = `${item.grade.toUpperCase()} · ${item.kind.toUpperCase()}`;
  content.append(grade, title);
  const official = document.createElement('p');
  official.className = 'detail-official';
  official.textContent = hideSpoilers && isSpoiler(item) && !earned.has(item.name) ? 'Official description hidden until earned.' : item.description;
  content.append(official);
  addDetailBlock(content, 'Guide', item.guide);
  addDetailBlock(content, 'Sources & confidence', item.sources);
  if (item.missable) addDetailBlock(content, 'Timing note', item.missableWhen);
  const toggle = document.createElement('button');
  toggle.className = 'earned-toggle';
  toggle.textContent = earned.has(item.name) ? 'Mark not earned' : 'Mark earned';
  toggle.addEventListener('click', () => {
    earned.has(item.name) ? earned.delete(item.name) : earned.add(item.name);
    persistProgress();
    render();
    showDetail(item);
  });
  content.append(toggle);
  dialog.showModal();
}

function addDetailBlock(parent, heading, text) {
  const block = document.createElement('section');
  block.className = 'detail-block';
  const title = document.createElement('h3');
  title.textContent = heading;
  const body = document.createElement('p');
  body.textContent = text;
  if (heading.startsWith('Sources')) body.className = 'source';
  block.append(title, body);
  parent.append(block);
}

function renderRoadmap() {
  const target = document.querySelector('#roadmap-stages');
  const stages = [
    ['01', 'Story spine', 'Complete the campaign in order. The chapter trophies name four chapter endpoints; the list does not establish optional mission requirements.', (t) => t.stage === 1],
    ['02', 'Character strands', 'Pick up the named character strands and side content as they become available. Keep a short list of what is still open before advancing the story.', (t) => t.stage === 2],
    ['03', 'Statewide sweep', 'Explore, discover vehicles, finish collection sets and cross-state tasks. Use in-game counters; no verified route or collectible map is supplied here.', (t) => t.stage === 3],
    ['04', 'Activity cleanup', 'Finish repeatable challenges, races, stunts, shops, and the 100% checklist. Save the platinum for the final cleanup pass.', (t) => t.stage === 4],
  ];
  target.replaceChildren();
  for (const [number, title, copy, pick] of stages) {
    const section = document.createElement('article');
    section.className = 'stage';
    const label = document.createElement('small');
    label.textContent = `PASS ${number}`;
    const heading = document.createElement('h3');
    heading.textContent = title;
    const description = document.createElement('p');
    description.textContent = copy;
    const list = document.createElement('ul');
    for (const item of trophies.filter(pick)) {
      const row = document.createElement('li');
      row.textContent = `${earned.has(item.name) ? '✓ ' : ''}${visibleName(item)}`;
      list.append(row);
    }
    section.append(label, heading, description, list);
    target.append(section);
  }
}

function selectView(view) {
  const roadmap = view === 'roadmap';
  document.querySelector('#tracker-view').hidden = roadmap;
  document.querySelector('#roadmap-view').hidden = !roadmap;
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view));
  if (roadmap) renderRoadmap();
}

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => selectView(tab.dataset.view)));
document.querySelector('#roadmap-link').addEventListener('click', () => selectView('roadmap'));
document.querySelector('#detail .close').addEventListener('click', () => dialog.close());
document.querySelector('#spoilers').checked = hideSpoilers;
document.querySelector('#spoilers').addEventListener('change', (event) => {
  hideSpoilers = event.target.checked;
  localStorage.setItem(spoilerStorage, String(hideSpoilers));
  render();
});
for (const selector of ['#kind', '#grade']) document.querySelector(selector).addEventListener('change', render);
document.querySelector('#search').addEventListener('input', render);
document.querySelector('#export').addEventListener('click', () => {
  const file = new Blob([JSON.stringify({ version: 1, earned: [...earned] }, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = 'leonida-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
});
document.querySelector('#import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('Progress file needs an earned list.');
    earned.clear();
    for (const name of names) if (trophies.some((item) => item.name === name)) earned.add(name);
    persistProgress();
    render();
  } catch { window.alert('That file is not a valid Leonida progress export.'); }
  event.target.value = '';
});

document.querySelector('#roadmap-stages').addEventListener('click', (event) => {
  const card = event.target.closest('.stage');
  if (!card) return;
  const heading = card.querySelector('h3').textContent;
  const stageNumber = [...document.querySelectorAll('.stage')].indexOf(card) + 1;
  const first = trophies.find((item) => item.stage === stageNumber);
  if (first) showDetail(first);
});

document.querySelector('#spoilers').checked = hideSpoilers;
render();
selectView(query.get('view') === 'roadmap' ? 'roadmap' : 'tracker');
if (query.has('grade')) document.querySelector('#grade').value = query.get('grade');
if (query.has('kind')) document.querySelector('#kind').value = query.get('kind');
if (query.has('spoilers')) {
  hideSpoilers = query.get('spoilers') === 'on';
  document.querySelector('#spoilers').checked = hideSpoilers;
}
if (query.has('trophy')) {
  const requested = byId.get(Number(query.get('trophy')));
  if (requested) showDetail(requested);
}
render();
window.__shotReady = true;
