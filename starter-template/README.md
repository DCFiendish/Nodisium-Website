# Nodisium — website starter template

Static, single-file site for the Nodisium Minecraft server (geopolitical Towny, Java 1.21).
No build step, no dependencies. Open `index.html` or serve the folder.

## Tabs

| Tab | State |
| --- | --- |
| Home | Done — animated wireframe globe, launch countdown, locked IP, waitlist |
| Rules | Done — four sections, plugin/staff-enforced tags |
| Shop | Done — three ranks + à la carte items, basket, mocked "reserve at founder price" checkout |
| Guides | Structure done, bodies are placeholder — see below |
| Stats | Done against mock data — see below |
| Map | Empty framed slot, waiting on the map module |

## Wiring the live stats

Search, player profiles, nation profiles and all four leaderboards read from a single
in-file data layer (`PLAYERS`, `NATIONS`, `BOARDS`). Replace those constants with a
fetch against your webhook and everything on the Stats tab goes live at once.

Expected shape:

```js
// player
{ name, nation, role, hours, kills, deaths, online }
// nation
{ name, leader, capital, founded, members, towns, allies, crest,
  ledger: [[date, 'War' | 'Alliance' | 'Treaty' | 'Trade', text], ...] }
```

## Guides

Each guide has a `slug`. Bodies are placeholder copy; drop markdown at
`/guides/<slug>.md` and render it into the article view. Front-matter should carry
`cat`, `title`, `read`, `blurb`.

## Launch date

The countdown targets `2026-11-14T19:00:00Z`. Change the ISO string to move it.

## Theme

Yellow `#F2C230` on obsidian purple `#2A1B47` / near-black `#08070C`.
Type: Instrument Serif (display), IBM Plex Sans (body), IBM Plex Mono (figures).
