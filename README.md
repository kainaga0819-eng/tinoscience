# Tino Science website

The website for Tino Science, the science club at Cupertino High School.
Plain HTML, CSS and a little JavaScript. No build step: edit the files directly on GitHub and the site updates.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home: general club info (meeting day, room, advisor), a short intro to each team, tryouts and how to join, contact |
| `scioly.html` | Science Olympiad: what members do, how teams prepare, why join, competition schedule |
| `scibowl.html` | Science Bowl: how matches work, subjects, team culture, results |
| `team.html` | Team: the officers and advisor |
| `archive.html` | Archives: photos and results from past seasons |
| `style.css` | All styling. Colors and fonts are at the top in `:root`. |
| `script.js` | Mobile menu, current-page highlight, scroll animations, footer year, loads the 3D atom |
| `atom.js` | The 3D atom in the homepage hero (Three.js) |
| `images/` | Photos and the logo. `images/archive/` holds the archive photos. |

The top bar, menu and footer are repeated on every page, so a change to either has to be made in all five HTML files.

## Common updates

Each section starts with a comment in capital letters, so search for the name.

**Meeting day, room and advisor.** In `index.html`, find `ABOUT THE CLUB` and edit the three cards. The contact section lower on the same page repeats the meeting time.

**Picture + description rows.** The team pages and the homepage team intro are built from `<div class="feature-row">` blocks: one short description and one picture. Copy a block to add another. Add `flip` to the class to put the picture on the left. Anything with the class `reveal` fades in as the visitor scrolls to it.

**The 23 Science Olympiad events.** In `scioly.html`, find `THE 23 EVENTS`. Each event is one colored tile (`<li class="event-tile cat-...">`) with its name, a one-line description, its category and its format. The tile color comes from the category class; the five colors are set in `style.css` under "The 23 event tiles". The list is the 2027 Division C list from soinc.org/events/2027-division-c-events. Events change a little each season, so update the names every fall.

**Science Olympiad logo.** `images/scioly-logo.png` is the official logo from soinc.org/logo_samples, which says teams with a current membership may use it on websites. Do not recolor or edit it.

**Science Bowl logo.** `images/scibowl-logo.png` is the official National Science Bowl logo from science.osti.gov/wdts/nsb/About/Logos. Its rules: do not alter it, do not imply the club is part of the Department of Energy, and keep the credit sentence under it ("The U.S. Department of Energy Office of Science manages the National Science Bowl®, and sponsors the NSB finals competition.").

**Science Olympiad pictures.** There are no SciOly photos yet, so two rows on the SciOly page show navy number panels. To use a photo, replace the `<div class="feature-media stat-panel reveal">` block with `<figure class="feature-media reveal"><img src="images/your-photo.jpg" alt="Short description"></figure>`.

**Competitions.** In `scioly.html`, find `COMPETITIONS` and edit the table rows.

**Science Bowl results.** In `scibowl.html`, find `Recent results` and add a new `<li>` at the top of the list. Add it to `archive.html` too.

**Archives.** In `archive.html`, find `ARCHIVES`. Put new photos in `images/archive/`, then copy one `<figure class="media reveal">` block and change the file name, alt text and caption. For a new season, copy a whole `<div class="season">` block and put it above the older one.

**Officers.** In `team.html`, find `OFFICER TEAM`. Copy one `<div class="card officer">` block per officer. The two letters inside `.avatar` are the initials. To use a photo instead, put the image at `images/officers/firstname.jpg` and replace the initials with `<img src="images/officers/firstname.jpg" alt="">`.

**Contact details.** In `index.html`, find `CONTACT`. The SciOly card currently says "Coming soon" for Instagram; replace it once the handle exists.

## Photos

| File | Used in |
| --- | --- |
| `images/scibowl-tournament.jpg` | Science Bowl, "How a match works" |
| `images/scibowl-subjects.jpg` | Science Bowl, "Subjects" |
| `images/scibowl-team.jpg` | Science Bowl, "Team culture" |
| `images/archive/scibowl-2025-26-1.jpg` to `-6.jpg` | Archives |

To swap a photo, replace the file and keep the same name. Keep photos as JPG, about 1200px wide, under ~350 KB each. Any free tool such as Squoosh (squoosh.app) can resize and compress. Make sure students in the photos are okay with being on a public site.

## Changing the accent color

Open `style.css`. At the top, change:

```css
--accent: #C9A227;       /* gold */
--accent-text: #8A6E12;  /* darker gold for small text */
```

to teal:

```css
--accent: #1F8A8A;
--accent-text: #176B6B;
```

Also update `GOLD` at the top of `atom.js` so the 3D atom matches.

## The 3D atom

The hero shows a Three.js atom built in `atom.js`. It only loads on screens wider than 720px, so phones get a lighter page. If 3D is unavailable, a flat SVG atom (in `index.html`, class `atom-fallback`) shows instead.

To replace it with a `.glb` model (for example from Kimi 3D, https://www.kimi.ai/make3d), keep the file under 2 MB, save it as `images/atom.glb`, and swap the `<div class="hero-visual">` block in `index.html` for:

```html
<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
<model-viewer class="hero-visual" src="images/atom.glb" alt="3D atom"
  auto-rotate rotation-per-second="20deg" camera-controls disable-zoom
  interaction-prompt="none" style="background: transparent;"></model-viewer>
```

Then delete the "3D atom" block at the bottom of `script.js`.

## Previewing locally

The 3D atom loads as a JavaScript module, which browsers block when opening files directly. Run a tiny local server instead:

```bash
cd path/to/Tino-Science
python3 -m http.server 8000
```

Then open http://localhost:8000 in a browser.

## Publishing

The site is hosted on GitHub Pages from the `main` branch. Every push to `main` goes live within a minute or two. In the repository, Settings → Pages shows the live URL.
