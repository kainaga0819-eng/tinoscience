// tino science js. just plain javascript, nothing to install

// phone menu : the hamburger button opens and closes the links
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', function () {
    navLinks.classList.toggle('open');
    if (navLinks.classList.contains('open')) {
      navToggle.setAttribute('aria-expanded', 'true');
    } else {
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// current page : find wich page we are on and mark that link in the menu
let currentFile = location.pathname.split('/').pop();
if (currentFile == '') {
  currentFile = 'index.html';   // the home page sometimes has no file name
}
const allNavLinks = document.querySelectorAll('.nav-links a');
for (let i = 0; i < allNavLinks.length; i++) {
  if (allNavLinks[i].getAttribute('href') === currentFile) {
    allNavLinks[i].setAttribute('aria-current', 'page');
  }
}

// footer year : so i dont have to change it every year
const yearSpots = document.querySelectorAll('[data-year]');
for (let i = 0; i < yearSpots.length; i++) {
  yearSpots[i].textContent = new Date().getFullYear();
}

// (the atom on the home page is just a drawing now so no code for it)

// scroll animations : adds "is-visible" to anything with class "reveal" when
// you scroll down to it. the actual animation is in style.css
document.documentElement.classList.add('js');
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(function (entries) {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) {
        entries[i].target.classList.add('is-visible');
        revealObserver.unobserve(entries[i].target);   // only animate once
      }
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  for (let i = 0; i < revealItems.length; i++) {
    revealObserver.observe(revealItems[i]);
  }
} else {
  // old browsers : just show everything
  for (let i = 0; i < revealItems.length; i++) {
    revealItems[i].classList.add('is-visible');
  }
}

// search : the "search" button in the top bar
// its basicly cmd+f but for the whole site. it reads the text of every page,
// shows the lines that have what you typed, and clicking one takes you there.
// if you make a new page add it to this list or search wont see it
const SEARCH_PAGES = [
  { url: 'index.html', name: 'Home' },
  { url: 'scioly.html', name: 'Science Olympiad' },
  { url: 'scibowl.html', name: 'Science Bowl' },
  { url: 'team.html', name: 'Officers' },
  { url: 'archive.html', name: 'Archives' },
];
// the kinds of tags that count as a "line" of text
const SEARCH_BLOCKS = 'h1, h2, h3, h4, h5, p, li, td, figcaption';

// gets all the lines of text inside the <main> part of a page
function collectSearchLines(doc) {
  const lines = [];
  const main = doc.querySelector('main');
  if (!main) {
    return lines;
  }
  const blocks = main.querySelectorAll(SEARCH_BLOCKS);
  for (let i = 0; i < blocks.length; i++) {
    const el = blocks[i];
    // if it has another block inside it skip it, or the same text shows up twice
    if (el.querySelector(SEARCH_BLOCKS)) {
      continue;
    }
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (text == '') {
      continue;
    }
    const section = el.closest('section[id]');
    let sectionId = '';
    if (section) {
      sectionId = section.id;
    }
    lines.push({ text: text, section: sectionId });
  }
  return lines;
}

// if this page got opened in a hidden frame by the search on a diffrent page
// (see buildIndexFromFrames) then send its text back to that page
if (window.parent !== window && location.hash === '#search-index') {
  window.parent.postMessage({ type: 'tino-search-lines', url: currentFile, lines: collectSearchLines(document) }, '*');
}

const searchButton = document.querySelector('.topbar-search');
const searchPanel = document.querySelector('.search-panel');
if (searchButton && searchPanel) {
  const searchInput = searchPanel.querySelector('input');
  const searchStatus = searchPanel.querySelector('.search-status');
  const searchResults = searchPanel.querySelector('.search-results');
  let searchIndex = null;   // empty untill the first time you open search
  let searchFailed = false;

  // puts one page's lines into the big list
  function addLines(index, page, lines) {
    for (let i = 0; i < lines.length; i++) {
      const text = String(lines[i].text);
      const section = String(lines[i].section || '');
      index.push({ page: page, text: text, lower: text.toLowerCase(), section: section });
    }
  }

  // normal way : download each page (works on the real site and the preview server)
  async function buildIndexFromDownloads() {
    const index = [];
    for (let i = 0; i < SEARCH_PAGES.length; i++) {
      const page = SEARCH_PAGES[i];
      const response = await fetch(page.url);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      addLines(index, page, collectSearchLines(doc));
    }
    return index;
  }

  // backup way : if you just double click the file the browser blocks downloads,
  // so insted open every page in a hidden frame and each one sends its text back
  function buildIndexFromFrames() {
    return new Promise(function (resolve, reject) {
      const index = [];
      const frames = [];
      const waiting = [];   // pages that didnt answer yet
      for (let i = 0; i < SEARCH_PAGES.length; i++) {
        waiting.push(SEARCH_PAGES[i].url);
      }

      function finish() {
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        for (let i = 0; i < frames.length; i++) {
          frames[i].remove();
        }
        if (index.length > 0) {
          resolve(index);
        } else {
          reject(new Error('no pages answered'));
        }
      }

      function onMessage(event) {
        const data = event.data;
        if (!data || data.type !== 'tino-search-lines' || !Array.isArray(data.lines)) {
          return;
        }
        let page = null;
        for (let i = 0; i < SEARCH_PAGES.length; i++) {
          if (SEARCH_PAGES[i].url === data.url) {
            page = SEARCH_PAGES[i];
            break;
          }
        }
        if (page == null) {
          return;
        }
        const spot = waiting.indexOf(page.url);
        if (spot == -1) {
          return;   // this page already answered
        }
        waiting.splice(spot, 1);
        addLines(index, page, data.lines);
        if (waiting.length == 0) {
          finish();
        }
      }

      window.addEventListener('message', onMessage);
      const timer = setTimeout(finish, 6000);   // give up after 6 seconds
      for (let i = 0; i < SEARCH_PAGES.length; i++) {
        const frame = document.createElement('iframe');
        frame.src = SEARCH_PAGES[i].url + '#search-index';
        frame.hidden = true;
        frame.setAttribute('aria-hidden', 'true');
        frame.tabIndex = -1;
        document.body.append(frame);
        frames.push(frame);
      }
    });
  }

  // try the normal way first, if that breaks use the backup
  function buildIndex() {
    return buildIndexFromDownloads().catch(buildIndexFromFrames);
  }

  // runs every time you type a letter
  function showResults() {
    const typed = searchInput.value.trim();
    const query = typed.toLowerCase();
    searchResults.replaceChildren();   // clear the old results
    if (query.length < 2) {
      searchStatus.textContent = '';
      return;
    }
    if (searchFailed) {
      searchStatus.textContent = 'Search could not load the pages. Reload and try again.';
      return;
    }
    if (!searchIndex) {
      searchStatus.textContent = 'Loading…';
      return;
    }

    // a line matches if it has every word you typed
    const words = query.split(/\s+/);
    const matches = [];
    for (let i = 0; i < searchIndex.length; i++) {
      let hasAll = true;
      for (let j = 0; j < words.length; j++) {
        if (!searchIndex[i].lower.includes(words[j])) {
          hasAll = false;
        }
      }
      if (hasAll) {
        matches.push(searchIndex[i]);
      }
    }

    if (matches.length == 0) {
      searchStatus.textContent = 'No results for "' + typed + '".';
    } else if (matches.length == 1) {
      searchStatus.textContent = '1 result';
    } else {
      searchStatus.textContent = matches.length + ' results';
    }

    // only show the first 30 so the list isnt huge
    for (let i = 0; i < matches.length && i < 30; i++) {
      const line = matches[i];
      // highlight the whole thing you typed if its in the line, if not just the first word
      let term = words[0];
      if (line.lower.includes(query)) {
        term = query;
      }
      const at = line.lower.indexOf(term);
      // show a bit of text before and after the word
      const start = Math.max(0, at - 50);
      const end = Math.min(line.text.length, at + term.length + 90);
      let before = line.text.slice(start, at);
      if (start > 0) {
        before = '…' + before;
      }
      let after = line.text.slice(at + term.length, end);
      if (end < line.text.length) {
        after = after + '…';
      }

      const link = document.createElement('a');
      // the "#:~:text=" part makes the browser scroll to that text and highlight it
      link.href = line.page.url + '#' + line.section + ':~:text=' + encodeURIComponent(term).replace(/-/g, '%2D');
      const pageName = document.createElement('span');
      pageName.className = 'search-page';
      pageName.textContent = line.page.name;
      const snippet = document.createElement('span');
      snippet.className = 'search-snippet';
      const mark = document.createElement('mark');
      mark.textContent = line.text.slice(at, at + term.length);
      snippet.append(before, mark, after);
      link.append(pageName, snippet);
      link.addEventListener('click', function () {
        setSearchOpen(false);
      });
      const item = document.createElement('li');
      item.append(link);
      searchResults.append(item);
    }
  }

  // opens or closes the search box
  function setSearchOpen(open) {
    searchPanel.hidden = !open;
    searchButton.setAttribute('aria-expanded', String(open));
    if (!open) {
      return;
    }
    searchInput.focus();
    // first time opening : go read all the pages
    if (!searchIndex) {
      searchFailed = false;
      buildIndex()
        .then(function (lines) {
          searchIndex = lines;
          showResults();
        })
        .catch(function () {
          searchFailed = true;
          showResults();
        });
    }
  }

  searchButton.addEventListener('click', function () {
    setSearchOpen(searchPanel.hidden);
  });
  searchInput.addEventListener('input', showResults);
  // esc key closes it
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !searchPanel.hidden) {
      setSearchOpen(false);
      searchButton.focus();
    }
  });
}
