import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import './style.css';
import type { Plank } from './geometry';
import { count, placed, THEMES, type Model, type Theme } from './model';
import { MODELS } from './models';
import { planSvg } from './plan2d';
import { clampStep, loadStep, parseRoute, saveStep } from './state';
import { createViewer } from './viewer';

const app = document.querySelector<HTMLDivElement>('#app')!;
let cleanup = () => {};
let themeFilter: Theme | null = null;
let query = '';
// accents and case don't matter when searching: "eglise" finds "Église"
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// ---------- icons (authored, one stroke weight) ----------
const svg = (body: string, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON = {
  prev: svg('<path d="M15 5l-7 7 7 7"/>'),
  next: svg('<path d="M9 5l7 7-7 7"/>'),
  home: svg('<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>'),
  plan: svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 10v10"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  again: svg('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>'),
  eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
};

// little drawings of a plank in each pose, for the "take these" callout
type Pose = 'couchée' | 'tranche' | 'debout' | 'penchée';
const POSE_ICON: Record<Pose, string> = {
  couchée: '<polygon class="t" points="4,18 44,18 52,12 12,12"/><polygon class="f" points="4,18 44,18 44,23 4,23"/><polygon class="s" points="44,18 52,12 52,17 44,23"/>',
  tranche: '<polygon class="t" points="4,13 44,13 47,10 7,10"/><polygon class="f" points="4,13 44,13 44,27 4,27"/><polygon class="s" points="44,13 47,10 47,24 44,27"/>',
  debout: '<polygon class="t" points="20,5 31,5 35,2 24,2"/><polygon class="f" points="20,5 31,5 31,37 20,37"/><polygon class="s" points="31,5 35,2 35,34 31,37"/>',
  penchée: '<g transform="rotate(-24 28 20)"><polygon class="t" points="4,18 44,18 52,12 12,12"/><polygon class="f" points="4,18 44,18 44,23 4,23"/><polygon class="s" points="44,18 52,12 52,17 44,23"/></g>',
};
const POSE_LABEL: Record<Pose, [string, string]> = {
  couchée: ['couchée', 'couchées'],
  tranche: ['sur la tranche', 'sur la tranche'],
  debout: ['debout', 'debout'],
  penchée: ['penchée', 'penchées'],
};
const pose = (p: Plank): Pose => (p.tilt ? 'penchée' : p.o.startsWith('flat') ? 'couchée' : p.o.startsWith('edge') ? 'tranche' : 'debout');

const LOGO = `<svg class="logo" viewBox="0 0 64 48" aria-hidden="true">
  <g><polygon class="t" points="6,36 46,36 56,30 16,30"/><polygon class="f" points="6,36 46,36 46,42 6,42"/><polygon class="s" points="46,36 56,30 56,36 46,42"/></g>
  <g><polygon class="t" points="12,20 22,20 28,16 18,16"/><polygon class="f" points="12,20 22,20 22,36 12,36"/><polygon class="s" points="22,20 28,16 28,32 22,36"/></g>
  <g class="hot"><polygon class="t" points="34,20 44,20 50,16 40,16"/><polygon class="f" points="34,20 44,20 44,36 34,36"/><polygon class="s" points="44,20 50,16 50,32 44,36"/></g>
  <g><polygon class="t" points="8,14 48,14 58,8 18,8"/><polygon class="f" points="8,14 48,14 48,20 8,20"/><polygon class="s" points="48,14 58,8 58,14 48,20"/></g>
</svg>`;

const level = (n: number) =>
  `<span class="level" aria-label="niveau ${n} sur 3">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const allPlanks = (m: Model) => m.steps.flatMap((s) => s.planks);

// ---------- thumbnails: one offscreen renderer, rendered once per session ----------
const thumbs = new Map<string, string>();
const HERO_STEP = 13;
function thumbnails(): Map<string, string> {
  if (thumbs.size) return thumbs;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;left:-9999px;width:480px;height:400px';
  document.body.append(canvas);
  const v = createViewer(canvas, { preserve: true });
  for (const m of MODELS) {
    v.frame(allPlanks(m));
    v.show(allPlanks(m), [], false);
    thumbs.set(m.id, v.snapshot());
  }
  // the hero card shows the first model half built, new planks in coral
  const star = MODELS[0];
  const { old, fresh } = placed(star, HERO_STEP - 1);
  v.frame(allPlanks(star));
  v.show(old, fresh, false);
  thumbs.set('hero', v.snapshot());
  v.dispose();
  canvas.remove();
  return thumbs;
}

// coming back from a notice lands on the same spot of the list, not at the top
let onHome = false;
let homeScroll = 0;
history.scrollRestoration = 'manual';

function render() {
  if (onHome) homeScroll = scrollY;
  cleanup();
  cleanup = () => {};
  const route = parseRoute(location.hash, MODELS);
  onHome = route.page !== 'notice';
  if (route.page === 'notice') notice(route.model);
  else home();
  window.scrollTo(0, onHome ? homeScroll : 0);
}

// ---------- home ----------
function home() {
  document.title = 'Planchettes';
  const themes = (Object.keys(THEMES) as Theme[]).filter((t) => MODELS.some((m) => m.theme === t));
  const pics = thumbnails();
  const star = MODELS[0];
  app.innerHTML = `
    <div class="wrap">
      <header class="top">
        <a class="brand" href="#/"><span class="mark">${LOGO}</span><b>Planchettes</b></a>
      </header>
      <section class="hero">
        <div>
          <span class="badge">${LOGO}Pour 200 planchettes en bois</span>
          <h1>Construis-le <em>pas&nbsp;à&nbsp;pas.</em></h1>
          <p class="lead">Une notice comme celles des briques : la 3D qu’on fait tourner, les planchettes à prendre, et le plan pour les poser au bon endroit.</p>
          <div class="cta"><a class="btn primary" href="#/m/${star.id}">Commencer ${esc(star.name.toLowerCase())}</a><a class="btn" href="#modeles">Voir les modèles</a></div>
        </div>
        <a class="live" href="#/m/${star.id}" aria-label="Ouvrir ${esc(star.name)}">
          <span class="label">En cours</span>
          <img src="${pics.get('hero')}" alt="" width="480" height="400">
          <span class="live-step"><b>${HERO_STEP}</b><span>/ ${star.steps.length} étapes</span></span>
          <span class="bar"><span style="transform:scaleX(${HERO_STEP / star.steps.length})"></span></span>
          <span class="live-take"><svg class="pose" viewBox="0 0 56 40" aria-hidden="true">${POSE_ICON.couchée}</svg><b>×4</b> couchées</span>
        </a>
      </section>
      <section class="models" id="modeles">
        <h2>Les modèles</h2>
        <label class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
          <input type="search" placeholder="Chercher un modèle" aria-label="Chercher un modèle" value="${esc(query)}">
        </label>
        <nav class="chips" aria-label="Thèmes">
          <button class="pill" aria-pressed="${!themeFilter}" data-theme="">Tout</button>
          ${themes.map((t) => `<button class="pill" aria-pressed="${themeFilter === t}" data-theme="${t}">${THEMES[t]}</button>`).join('')}
        </nav>
        <ul class="shelf">
          ${MODELS
            .map(
              (m) => `<li data-theme="${m.theme}" data-q="${esc(fold(`${m.name} ${THEMES[m.theme]}`))}"><a class="model t-${m.theme}" href="#/m/${m.id}">
                <span class="tile"><img src="${pics.get(m.id)}" alt="" width="480" height="400"></span>
                <span class="meta">
                  <span class="name">${esc(m.name)}</span>
                  <span class="facts"><span><b>${count(m)}</b> planchettes · ${m.steps.length} étapes</span>${level(m.difficulty)}</span>
                </span>
              </a></li>`,
            )
            .join('')}
        </ul>
        <p class="none" hidden>Aucun modèle ne s’appelle comme ça.</p>
      </section>
    </div>`;
  const pills = app.querySelectorAll<HTMLButtonElement>('.chips .pill');
  const apply = () => {
    const q = fold(query.trim());
    let found = 0;
    app.querySelectorAll<HTMLElement>('.shelf li').forEach((li) => {
      li.hidden = !((!themeFilter || li.dataset.theme === themeFilter) && li.dataset.q!.includes(q));
      if (!li.hidden) found++;
    });
    pills.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.theme || null) === themeFilter)));
    app.querySelector<HTMLElement>('.none')!.hidden = found > 0;
  };
  pills.forEach((b) =>
    b.addEventListener('click', () => {
      themeFilter = (b.dataset.theme || null) as Theme | null;
      apply();
    }),
  );
  app.querySelector<HTMLInputElement>('.search input')!.addEventListener('input', (e) => {
    query = (e.target as HTMLInputElement).value;
    themeFilter = null; // a search looks in every theme
    apply();
  });
  apply();
}

// ---------- notice ----------
function notice(m: Model) {
  document.title = `${m.name} · Planchettes`;
  const n = m.steps.length; // step n = finished model
  let step = clampStep(loadStep(m.id), n + 1);
  if (step === n) step = 0; // reopening a finished model starts it again
  let preview = false; // "see the finished model" while staying on the current step

  app.innerHTML = `
    <main class="build t-${m.theme}">
      <canvas class="view3d" aria-label="Le modèle en 3D : fais glisser pour le tourner"></canvas>
      <header class="hud-top">
        <a class="round" href="#/" aria-label="Retour aux modèles">${ICON.home}</a>
        <div class="title"><h1>${esc(m.name)}</h1><p class="where" aria-live="polite"></p></div>
        <div class="tools">
          <button class="round final-toggle" aria-pressed="false" aria-label="Voir le modèle fini" title="Voir le modèle fini">${ICON.eye}</button>
          <button class="round plan-toggle" aria-label="Voir le plan" title="Voir le plan" aria-expanded="false">${ICON.plan}</button>
        </div>
      </header>
      <aside class="step-card swipe" aria-label="Cette étape">
        <div class="parts"><span class="label">Prends</span><ul></ul></div>
        <p class="hint"></p>
      </aside>
      <aside class="final-card" hidden>
        <span class="label">Modèle fini</span>
        <p>En orange, l’étape où tu es. En clair, ce qu’il reste à poser.</p>
        <button class="btn back-step">${ICON.prev}Revenir à l’étape</button>
      </aside>
      <section class="drawer swipe" aria-label="Plan de l’étape" hidden>
        <header><h2>Le plan</h2><button class="round small close-plan" aria-label="Fermer le plan">${ICON.close}</button></header>
        <figure><figcaption>Vu de dessus</figcaption><div class="plan-top"></div></figure>
        <figure><figcaption>Vu de face</figcaption><div class="plan-front"></div></figure>
      </section>
      <section class="bravo" hidden>
        <span class="label">Fini</span><h2><em>Bravo&nbsp;!</em></h2>
        <p>Tu as posé les ${count(m)} planchettes.</p>
        <div class="actions">
          <button class="btn again">${ICON.again}Recommencer</button>
          <a class="btn primary" href="#/">Autres modèles</a>
        </div>
      </section>
      <footer class="hud-bottom swipe">
        <button class="round big prev" aria-label="Étape précédente">${ICON.prev}</button>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${n}"><div></div></div>
        <button class="round big go next" aria-label="Étape suivante">${ICON.next}</button>
      </footer>
    </main>`;

  const $ = <T extends Element>(s: string) => app.querySelector<T>(s)!;
  const viewer = createViewer($<HTMLCanvasElement>('.view3d'));
  const drawer = $<HTMLElement>('.drawer');
  const toggle = $<HTMLButtonElement>('.plan-toggle');
  const finalToggle = $<HTMLButtonElement>('.final-toggle');

  // frame the model in the band the interface leaves free (measured once per size, so it never jumps between steps)
  function fit() {
    const h = innerHeight;
    const top = $('.hud-top').getBoundingClientRect().bottom + 8;
    const card = $('.step-card').getBoundingClientRect();
    const bottomEdges = [$('.hud-bottom').getBoundingClientRect().top];
    if (card.top > h / 2) bottomEdges.push(card.top); // phone: the step card sits above the buttons
    viewer.setInsets(top, h - Math.min(...bottomEdges) + 8);
    viewer.frame(allPlanks(m));
  }

  function update(animate = true) {
    const done = step === n;
    const { old, fresh } = done ? { old: allPlanks(m), fresh: [] } : placed(m, step);
    const rest = preview && !done ? m.steps.slice(step + 1).flatMap((s) => s.planks) : [];
    viewer.show(old, fresh, animate && !preview, rest);
    viewer.celebrate(done);
    $('.plan-top').innerHTML = planSvg(old, fresh, 'top');
    $('.plan-front').innerHTML = planSvg(old, fresh, 'front');
    $('.where').textContent = done ? 'Fini !' : `Étape ${step + 1} sur ${n}`;

    const groups = new Map<Pose, number>();
    for (const p of fresh) groups.set(pose(p), (groups.get(pose(p)) ?? 0) + 1);
    $('.parts ul').innerHTML = [...groups]
      .map(([k, c]) => `<li><svg class="pose" viewBox="0 0 56 40" aria-hidden="true">${POSE_ICON[k]}</svg><b>×${c}</b><span>${POSE_LABEL[k][c > 1 ? 1 : 0]}</span></li>`)
      .join('');
    const hint = done ? '' : (m.steps[step].hint ?? '');
    $('.hint').textContent = hint;
    $<HTMLElement>('.hint').hidden = hint === '';
    $<HTMLElement>('.step-card').hidden = done || preview;
    $<HTMLElement>('.final-card').hidden = !preview || done;
    $<HTMLElement>('.bravo').hidden = !done;
    finalToggle.setAttribute('aria-pressed', String(preview));
    finalToggle.disabled = done;
    const bar = $<HTMLElement>('.progress');
    bar.setAttribute('aria-valuenow', String(step));
    bar.querySelector<HTMLElement>('div')!.style.transform = `scaleX(${step / n})`;
    $<HTMLButtonElement>('.prev').disabled = step === 0;
    $<HTMLButtonElement>('.next').disabled = done;
    saveStep(m.id, step);
  }
  const go = (d: number) => {
    const s = clampStep(step + d, n + 1);
    if (s !== step) (step = s), (preview = false), update();
  };
  const setPreview = (on: boolean) => {
    preview = on;
    update(false);
  };
  const setDrawer = (open: boolean) => {
    drawer.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };

  $('.prev').addEventListener('click', () => go(-1));
  $('.next').addEventListener('click', () => go(1));
  $('.again').addEventListener('click', () => ((step = 0), update()));
  finalToggle.addEventListener('click', () => setPreview(!preview));
  $('.back-step').addEventListener('click', () => setPreview(false));
  toggle.addEventListener('click', () => setDrawer(drawer.hidden !== false));
  $('.close-plan').addEventListener('click', () => setDrawer(false));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'Escape') (setDrawer(false), preview && setPreview(false));
  };
  document.addEventListener('keydown', onKey);
  // swipe on the step card, the bottom bar and the plan: dragging the 3D view only turns the model
  app.querySelectorAll<HTMLElement>('.swipe').forEach((el) => {
    let x0: number | null = null;
    el.addEventListener('pointerdown', (e) => (x0 = (e.target as Element).closest('button') ? null : e.clientX));
    el.addEventListener('pointerup', (e) => {
      if (x0 !== null && Math.abs(e.clientX - x0) > 50) go(e.clientX < x0 ? 1 : -1);
      x0 = null;
    });
  });
  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(fit, 150);
  };
  addEventListener('resize', onResize);

  update(false);
  fit();
  cleanup = () => {
    document.removeEventListener('keydown', onKey);
    removeEventListener('resize', onResize);
    clearTimeout(resizeTimer);
    viewer.dispose();
  };
}

addEventListener('hashchange', render);
render();

// installed on a tablet, the notices keep working without wifi
if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
