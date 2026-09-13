# Nodisium — Server Website

Static marketing site for the **Nodisium** geopolitics Minecraft server.
Dark navy-black + gold ("dark luxury") theme, Cinzel serif display type,
hand-rolled spinning wireframe globe. No build step — plain HTML/CSS/JS.

## Pages

| Nav | What it does |
|-----|--------------|
| Home | Hero over the rotating globe, pre-launch badge, scroll-revealed launch countdown. |
| Rules | Numbered server rules in a centered box (`RULES` in `js/data.js`). |
| Shop | Ranks + items with a working client-side basket ("reserve" flow, no live payments). |
| Guides | Feature cards + collapsible guide dropdowns (`FEATURES`, `GUIDES` in `js/data.js`). |
| Stats | Search a Minecraft username → KD, kills, deaths, town, nation, playtime. Also a nation search → KD, kills, deaths, nodes captured/lost, combined playtime. |
| Map | Placeholder 16:9 box — swap in the real dynmap iframe when ready. |

## Files

```
nodisium/
├── index.html
├── css/styles.css
└── js/
    ├── data.js     ← all page content + stats API stub
    ├── app.js      ← router, rendering, shop cart, countdown, copy-IP
    └── globe.js    ← canvas globe (Natural Earth coastlines, no library)
```

## Key configuration

| What | Where |
|------|-------|
| Server IP (Copy IP button) | `SERVER_IP` in `js/app.js` — currently `play.nodisium.net` |
| Launch date (countdown) | `LAUNCH_DATE` in `js/app.js` |
| Shop ranks / items / prices | `SHOP_RANKS`, `SHOP_ITEMS` in `js/app.js` (currency = `CURRENCY`, set to `£`) |
| Globe spin speed & tilt | `SPEED`, `TILT` in `js/globe.js` |
| Colours | CSS custom properties at the top of `css/styles.css` (`--gold`, `--gold-bright`, `--bg`, …) |

## Globe

The globe is **pure canvas 2D** — no charting library. It fetches Natural Earth
110m coastline data from the public `world-atlas` package on jsDelivr at runtime:

```
https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json
```

If that fetch fails the globe still renders the graticule and markers, so the page
never breaks. The animation pauses when the Home view is off-screen or the tab is
hidden, and honours `prefers-reduced-motion`.

> The shop basket is still a **client-side stub** — no payment processing is wired up.
> Player/nation stats are real: `API.fetchPlayer`/`API.fetchNation` in `js/data.js` read
> the Nodisium game server's daily JSON snapshot, published via GitHub Pages at
> `DCFiendish/nodisium-stats` (see `docs/STATS.md` in the main Nodisium repo). That feed
> updates once a day at midnight EST, not live — the Stats page shows nothing for a given
> player/nation until at least one snapshot has run since they existed.

## Running locally

Any static server works — no build step:

```bash
cd nodisium
python3 -m http.server 8099     # then open http://localhost:8099
```

## Deploying / importing elsewhere

Drop the folder on any static host (nginx, GitHub Pages, Netlify, Cloudflare Pages,
Vercel, or any cPanel/FTP web root). **All paths are relative**, so it works from a
subdirectory as well as a domain root. Upload the *contents* of this folder so that
`index.html` sits at the web root.

## Stats data source

`js/data.js`'s `API` object is the single point of contact with live data — the UI never
reads the feed directly, only through `API.fetchPlayer(name)`/`API.fetchNation(name)`.
`API.endpoint` points at the GitHub Pages URL for `DCFiendish/nodisium-stats`. To point
this at a different stats feed later, change `endpoint` and the two `fetch` calls in
`API` — nothing else on the page needs to change.

## Dynmap embed

When you have the map URL, replace the `.dynmap-placeholder` div in `index.html`:

```html
<iframe class="dynmap-box" src="https://your-dynmap-url/" frameborder="0" allowfullscreen></iframe>
```
