// Tino Science — small helpers. Plain JavaScript, no build step.

// 1. Mobile navigation toggle (the hamburger button on phones)
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
}

// 2. Highlight the current page in the navigation
const currentFile = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach((link) => {
  if (link.getAttribute('href') === currentFile) link.setAttribute('aria-current', 'page');
});

// 3. Footer year
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// 4. (The atom picture on the homepage is a still drawing, so it needs no script.)

// 5. Scroll animations: add "is-visible" to .reveal elements as they come into view.
//    The styles are in style.css under "Scroll animations".
document.documentElement.classList.add('js');
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

// 6. Site search (the "Search" button in the top bar).
//    Works like Cmd+F across the whole site: it reads the text of every page,
//    lists the lines that contain what you typed, and each result links to
//    that spot. To include a new page in the search, add it to SEARCH_PAGES.
const SEARCH_PAGES = [
  { url: 'index.html', name: 'Home' },
  { url: 'scioly.html', name: 'Science Olympiad' },
  { url: 'scibowl.html', name: 'Science Bowl' },
  { url: 'team.html', name: 'Officers' },
  { url: 'archive.html', name: 'Archives' },
];
const SEARCH_BLOCKS = 'h1, h2, h3, h4, h5, p, li, td, figcaption';

// Collect the lines of text inside a page's <main>.
function collectSearchLines(doc) {
  const lines = [];
  const main = doc.querySelector('main');
  if (!main) return lines;
  main.querySelectorAll(SEARCH_BLOCKS).forEach((el) => {
    if (el.querySelector(SEARCH_BLOCKS)) return;   // skip wrappers; keep the innermost lines
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const section = el.closest('section[id]');
    lines.push({ text, section: section ? section.id : '' });
  });
  return lines;
}

// When this page was opened invisibly by the search on another page (see
// buildIndexFromFrames below), send its lines of text back to that page.
if (window.parent !== window && location.hash === '#search-index') {
  window.parent.postMessage({ type: 'tino-search-lines', url: currentFile, lines: collectSearchLines(document) }, '*');
}

const searchButton = document.querySelector('.topbar-search');
const searchPanel = document.querySelector('.search-panel');
if (searchButton && searchPanel) {
  const searchInput = searchPanel.querySelector('input');
  const searchStatus = searchPanel.querySelector('.search-status');
  const searchResults = searchPanel.querySelector('.search-results');
  let searchIndex = null;   // filled the first time the panel is opened
  let searchFailed = false;

  function addLines(index, page, lines) {
    lines.forEach((line) => {
      const text = String(line.text);
      index.push({ page, text, lower: text.toLowerCase(), section: String(line.section || '') });
    });
  }

  // Normal way (live site, local preview server): download each page once.
  async function buildIndexFromDownloads() {
    const index = [];
    for (const page of SEARCH_PAGES) {
      const response = await fetch(page.url);
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      addLines(index, page, collectSearchLines(doc));
    }
    return index;
  }

  // Backup way, for when the site is opened by double-clicking a file (browsers
  // block downloads there): open each page in an invisible frame and let it
  // send its own text back.
  function buildIndexFromFrames() {
    return new Promise((resolve, reject) => {
      const index = [];
      const waiting = new Set(SEARCH_PAGES.map((page) => page.url));
      const frames = [];
      function finish() {
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        frames.forEach((frame) => frame.remove());
        if (index.length) resolve(index); else reject(new Error('no pages answered'));
      }
      function onMessage(event) {
        const data = event.data;
        if (!data || data.type !== 'tino-search-lines' || !Array.isArray(data.lines)) return;
        const page = SEARCH_PAGES.find((p) => p.url === data.url);
        if (!page || !waiting.has(page.url)) return;
        waiting.delete(page.url);
        addLines(index, page, data.lines);
        if (waiting.size === 0) finish();
      }
      window.addEventListener('message', onMessage);
      const timer = setTimeout(finish, 6000);
      SEARCH_PAGES.forEach((page) => {
        const frame = document.createElement('iframe');
        frame.src = page.url + '#search-index';
        frame.hidden = true;
        frame.setAttribute('aria-hidden', 'true');
        frame.tabIndex = -1;
        document.body.append(frame);
        frames.push(frame);
      });
    });
  }

  function buildIndex() {
    return buildIndexFromDownloads().catch(buildIndexFromFrames);
  }

  function showResults() {
    const typed = searchInput.value.trim();
    const query = typed.toLowerCase();
    searchResults.replaceChildren();
    if (query.length < 2) { searchStatus.textContent = ''; return; }
    if (searchFailed) { searchStatus.textContent = 'Search could not load the pages. Reload and try again.'; return; }
    if (!searchIndex) { searchStatus.textContent = 'Loading…'; return; }
    const words = query.split(/\s+/);
    const matches = searchIndex.filter((line) => words.every((word) => line.lower.includes(word)));
    searchStatus.textContent = matches.length === 0 ? 'No results for "' + typed + '".'
      : matches.length + (matches.length === 1 ? ' result' : ' results');
    matches.slice(0, 30).forEach((line) => {
      // Highlight the phrase if it appears as typed, otherwise the first word.
      const term = line.lower.includes(query) ? query : words[0];
      const at = line.lower.indexOf(term);
      const start = Math.max(0, at - 50);
      const end = Math.min(line.text.length, at + term.length + 90);

      const link = document.createElement('a');
      // "#:~:text=" asks the browser to scroll to and highlight that text on the page.
      link.href = line.page.url + '#' + line.section + ':~:text=' + encodeURIComponent(term).replace(/-/g, '%2D');
      const pageName = document.createElement('span');
      pageName.className = 'search-page';
      pageName.textContent = line.page.name;
      const snippet = document.createElement('span');
      snippet.className = 'search-snippet';
      const mark = document.createElement('mark');
      mark.textContent = line.text.slice(at, at + term.length);
      snippet.append((start > 0 ? '…' : '') + line.text.slice(start, at), mark,
        line.text.slice(at + term.length, end) + (end < line.text.length ? '…' : ''));
      link.append(pageName, snippet);
      link.addEventListener('click', () => setSearchOpen(false));
      const item = document.createElement('li');
      item.append(link);
      searchResults.append(item);
    });
  }

  function setSearchOpen(open) {
    searchPanel.hidden = !open;
    searchButton.setAttribute('aria-expanded', String(open));
    if (!open) return;
    searchInput.focus();
    if (!searchIndex) {
      searchFailed = false;
      buildIndex()
        .then((lines) => { searchIndex = lines; showResults(); })
        .catch(() => { searchFailed = true; showResults(); });
    }
  }

  searchButton.addEventListener('click', () => setSearchOpen(searchPanel.hidden));
  searchInput.addEventListener('input', showResults);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !searchPanel.hidden) { setSearchOpen(false); searchButton.focus(); }
  });
}
