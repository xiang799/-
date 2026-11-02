'use strict';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('is-open', !expanded);
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});

// Native hash links also work without JavaScript. With JS, navigation mirrors
// the reference: Home shows the whole introduction; Works and Resume focus a section.
const home = document.querySelector('#home');
if (home) {
  const sections = ['home', 'about', 'work', 'contact'].map(id => document.getElementById(id));
  function applyView() {
    const view = ['#work', '#about'].includes(location.hash) ? location.hash.slice(1) : 'home';
    document.body.dataset.view = view;
    sections.forEach(section => {
      section.hidden = view !== 'home' && section.id !== view && section.id !== 'contact';
    });
    navigation.querySelectorAll('[data-view]').forEach(link => {
      const active = link.dataset.view === view;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (view === 'about') document.querySelector('.resume-details').open = true;
  }
  window.addEventListener('hashchange', () => {
    applyView();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  applyView();
  // The hero's scroll hint reveals the profile in the continuous Home view.
  document.querySelector('.scroll-down').addEventListener('click', event => {
    event.preventDefault();
    document.querySelector('#about').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
}

const projects = [...document.querySelectorAll('.project')];
const filters = [...document.querySelectorAll('.filter')];
filters.forEach(button => {
  button.addEventListener('click', () => {
    filters.forEach(filter => {
      const selected = filter === button;
      filter.classList.toggle('active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    });
    let count = 0;
    projects.forEach(project => {
      project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter;
      if (!project.hidden) count++;
    });
    document.querySelector('#filter-status').textContent = `当前显示 ${count} 个项目`;
  });
});

// Cards retain real page links for direct sharing, modified clicks and no-JS use.
// Only normal same-origin clicks are enhanced into a full-screen detail dialog.
const dialog = document.querySelector('#project-dialog');
if (dialog && location.protocol !== 'file:') {
  const body = document.querySelector('#project-dialog-body');
  const modalTitle = document.querySelector('#project-modal-title');
  const pageLink = document.querySelector('.modal-page-link');
  let request;
  let opener;
  async function openProject(url, trigger) {
    request?.abort();
    const controller = new AbortController();
    request = controller;
    if (!dialog.open) {
      opener = trigger;
      dialog.showModal();
      document.body.classList.add('detail-open');
    }
    body.innerHTML = '<p class="modal-loading" role="status">正在载入项目…</p>';
    modalTitle.textContent = '项目详情';
    pageLink.href = url;
    dialog.scrollTop = 0;
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Project request failed');
      const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
      const main = parsed.querySelector('.case-main');
      if (!main) throw new Error('Missing project content');
      if (controller.signal.aborted || !dialog.open) return;
      const article = document.createElement('article');
      article.className = 'case-main';
      main.querySelectorAll('[src], [href]').forEach(element => {
        for (const attribute of ['src', 'href']) {
          if (element.hasAttribute(attribute)) element.setAttribute(attribute, new URL(element.getAttribute(attribute), url).href);
        }
      });
      article.append(...main.childNodes);
      body.replaceChildren(article);
      const title = article.querySelector('h1');
      modalTitle.textContent = title.textContent;
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    } catch (error) {
      if (controller.signal.aborted) return;
      // Fall back to the complete static page if enhanced loading fails.
      window.location.assign(url);
    }
  }
  document.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('.project-open, #project-dialog .project-pagination a');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    event.preventDefault();
    openProject(url.href, link);
  });
  dialog.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || link.target === '_blank' || link.classList.contains('modal-page-link')) return;
    const url = new URL(link.href);
    if (url.pathname === new URL(pageLink.href).pathname && url.hash) {
      event.preventDefault();
      body.querySelector(url.hash)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  });
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    request?.abort();
    document.body.classList.remove('detail-open');
    body.replaceChildren();
    opener?.focus({ preventScroll: true });
  });
}
document.querySelector('#year').textContent = new Date().getFullYear();
