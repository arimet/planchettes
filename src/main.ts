import './style.css';
import { count, placed, THEMES, type Model, type Theme } from './model';
import { MODELS } from './models';
import { planSvg } from './plan2d';
import { clampStep, loadStep, parseRoute, saveStep } from './state';
import { createViewer } from './viewer';

const app = document.querySelector<HTMLDivElement>('#app')!;
let cleanup = () => {};
let themeFilter: Theme | null = null;

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

function render() {
  cleanup();
  cleanup = () => {};
  const route = parseRoute(location.hash, MODELS);
  if (route.page === 'notice') notice(route.model);
  else home();
  window.scrollTo(0, 0);
}

function home() {
  document.title = 'Planchettes';
  const themes = (Object.keys(THEMES) as Theme[]).filter((t) => MODELS.some((m) => m.theme === t));
  const shown = MODELS.filter((m) => !themeFilter || m.theme === themeFilter);
  app.innerHTML = `
    <main class="home">
      <header class="hero">
        <h1>Planchettes</h1>
        <p>Des modèles à construire pas à pas. On a <strong>200 planchettes</strong>, chaque modèle en utilise moins.</p>
      </header>
      <nav class="chips" aria-label="Thèmes">
        <button class="chip" aria-pressed="${!themeFilter}" data-theme="">Tous</button>
        ${themes.map((t) => `<button class="chip" aria-pressed="${themeFilter === t}" data-theme="${t}">${THEMES[t]}</button>`).join('')}
      </nav>
      <ul class="grid">
        ${shown
          .map((m) => {
            const all = m.steps.flatMap((s) => s.planks);
            return `<li><a class="card" href="#/m/${m.id}">
              <div class="thumb">${planSvg(all, [], 'front')}</div>
              <h2>${esc(m.name)}</h2>
              <p><span class="count">${count(m)} planchettes</span><span class="stars" aria-label="niveau ${m.difficulty} sur 3">${stars(m.difficulty)}</span></p>
            </a></li>`;
          })
          .join('')}
      </ul>
    </main>`;
  app.querySelectorAll<HTMLButtonElement>('.chip').forEach((b) =>
    b.addEventListener('click', () => {
      themeFilter = (b.dataset.theme || null) as Theme | null;
      home();
    }),
  );
}

function notice(m: Model) {
  document.title = `${m.name} · Planchettes`;
  const n = m.steps.length; // step n = "Bravo !" (finished model, all wood)
  let step = clampStep(loadStep(m.id), n + 1);

  app.innerHTML = `
    <main class="notice">
      <header class="bar top">
        <a class="back" href="#/" aria-label="Retour aux modèles">←</a>
        <h1>${esc(m.name)}</h1>
        <span class="stars" aria-label="niveau ${m.difficulty} sur 3">${stars(m.difficulty)}</span>
        <span class="count">${count(m)} planchettes</span>
      </header>
      <section class="stage">
        <canvas class="view3d" aria-label="Vue 3D, glisse pour tourner"></canvas>
        <aside class="plans swipe">
          <figure><figcaption>Vu de dessus</figcaption><div class="plan-top"></div></figure>
          <figure><figcaption>Vu de face</figcaption><div class="plan-front"></div></figure>
        </aside>
      </section>
      <footer class="bar bottom swipe">
        <div class="progress"><div></div></div>
        <p class="hint"></p>
        <div class="nav">
          <button class="prev" aria-label="Étape précédente">◀</button>
          <p class="label" aria-live="polite"></p>
          <button class="next" aria-label="Étape suivante">▶</button>
        </div>
      </footer>
    </main>`;

  const $ = <T extends Element>(s: string) => app.querySelector<T>(s)!;
  const viewer = createViewer($<HTMLCanvasElement>('.view3d'));
  viewer.frame(m.steps.flatMap((s) => s.planks));

  function update() {
    const done = step === n;
    const { old, fresh } = done ? { old: m.steps.flatMap((s) => s.planks), fresh: [] } : placed(m, step);
    viewer.show(old, fresh);
    $('.plan-top').innerHTML = planSvg(old, fresh, 'top');
    $('.plan-front').innerHTML = planSvg(old, fresh, 'front');
    $('.label').innerHTML = done
      ? `<strong>Bravo !</strong> <span>${count(m)} planchettes</span>`
      : `<strong>Étape ${step + 1} / ${n}</strong> <span>+${fresh.length} planchettes</span>`;
    $('.hint').textContent = done ? 'Le modèle est fini !' : (m.steps[step].hint ?? '');
    $<HTMLElement>('.progress div').style.width = `${(step / n) * 100}%`;
    $<HTMLButtonElement>('.prev').disabled = step === 0;
    $<HTMLButtonElement>('.next').disabled = done;
    saveStep(m.id, step);
  }
  const go = (d: number) => {
    const s = clampStep(step + d, n + 1);
    if (s !== step) (step = s), update();
  };

  $('.prev').addEventListener('click', () => go(-1));
  $('.next').addEventListener('click', () => go(1));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  };
  document.addEventListener('keydown', onKey);
  // swipe only on the plan panel and the bottom bar: dragging the 3D view rotates it
  app.querySelectorAll<HTMLElement>('.swipe').forEach((el) => {
    let x0: number | null = null;
    el.addEventListener('pointerdown', (e) => (x0 = e.clientX));
    el.addEventListener('pointerup', (e) => {
      if (x0 !== null && Math.abs(e.clientX - x0) > 50) go(e.clientX < x0 ? 1 : -1);
      x0 = null;
    });
  });

  update();
  cleanup = () => {
    document.removeEventListener('keydown', onKey);
    viewer.dispose();
  };
}

addEventListener('hashchange', render);
render();
