/* ============================================================
   Nodisium — site data + API structure
   ------------------------------------------------------------
   STATS API: `API.fetchPlayer(name)` returns a Promise that
   resolves to a player object or rejects with an error.

   For now it reads from the local PLACEHOLDER_PLAYERS list.
   When your backend is ready, point `API.endpoint` at it and
   replace the mock body with a real `fetch()` call. Nothing
   else on the page needs to change.
   ============================================================ */

// Format a millisecond playtime total the way PLACEHOLDER_PLAYERS' mock data did
// ("412h 30m"), so app.js's existing renderResult() needs no changes at all.
function formatPlaytimeMs(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

const API = {
  /** Nodisium's daily stats snapshot (see docs/STATS.md in the main Nodisium repo) --
   *  written by the game server once a day at midnight EST, published here via GitHub
   *  Pages. Updates once daily, not live. */
  endpoint: "https://dcfiendish.github.io/nodisium-stats/daily-stats.json",

  // Both fetchPlayer/fetchNation re-fetch the same small JSON file per call rather than
  // caching it -- it's a few KB and the browser's own HTTP cache already avoids repeat
  // downloads within a page session, so a hand-rolled cache would only add complexity.
  async fetchDaily() {
    const res = await fetch(this.endpoint);
    if (!res.ok) throw new Error("Stats feed unavailable (HTTP " + res.status + ")");
    return res.json();
  },

  async fetchPlayer(username) {
    const daily = await this.fetchDaily();
    const target = String(username).trim().toLowerCase();
    const p = daily.players.find((x) => x.name.toLowerCase() === target);
    if (!p) throw new Error("Player not found");
    return {
      name: p.name,
      kills: p.kills,
      deaths: p.deaths,
      town: p.town || "None",
      nation: p.nation || "None",
      playtime: formatPlaytimeMs(p.playtimeMs),
    };
  },

  async fetchNation(name) {
    const daily = await this.fetchDaily();
    const target = String(name).trim().toLowerCase();
    const n = daily.nations.find((x) => x.name.toLowerCase() === target);
    if (!n) throw new Error("Nation not found");
    return {
      name: n.name,
      kills: n.kills,
      deaths: n.deaths,
      kd: n.kd,
      nodesCaptured: n.nodesCaptured,
      nodesLost: n.nodesLost,
      playtime: formatPlaytimeMs(n.playtimeMs),
    };
  },
};

/* ---------- 15 rules ---------- */
const RULES = [
  "No griefing. Damaging or altering builds, land, or property without permission is strictly prohibited.",
  "No hacking or cheating. Mods that give an unfair advantage (X-ray, kill aura, fly hacks) are banned.",
  "No exploiting bugs or glitches. Report them to staff instead of abusing them.",
  "Respect all players. Harassment, hate speech, discrimination, and toxicity are not tolerated.",
  "No scamming or deceptive trading. All trades must be honest and agreed upon by both parties.",
  "No raiding towns or nations outside of declared, legitimate war mechanics.",
  "War must follow the official war rules — declared, agreed-upon conflicts only.",
  "No alt accounts used to evade bans, gain unfair resources, or rig elections.",
  "Do not build within another town's claims without permission or alliance.",
  "PvP outside of war and agreed arenas must be consensual.",
  "No spamming chat, advertising, or inappropriate content.",
  "Claims must be clearly marked. Unmarked land is not protected by staff.",
  "Follow staff instructions at all times — they have the final word.",
  "No IRL trading or selling in-game items, currency, or land for real money.",
  "Have fun and play fairly — remember there are real people behind every block.",
];

/* ---------- Features (2 rows, left-to-right) ---------- */
const FEATURES = [
  { icon: "🏛️", title: "Towny Gameplay", desc: "Found or join towns, claim land, and grow your settlement from a village to a capital." },
  { icon: "🌍", title: "Nations & Alliances", desc: "Form nations, forge treaties, and shape the global political map." },
  { icon: "⚔️", title: "Declared Wars", desc: "Wars follow clear rules — declarations, timers, and agreed victory conditions." },
  { icon: "💰", title: "Player Economy", desc: "Player-run shops, markets, and trade routes drive the server economy." },
  { icon: "🛡️", title: "Politics & Elections", desc: "Run for office, vote on laws, and lead your nation through its history." },
  { icon: "🗺️", title: "Living World", desc: "A world that remembers — conquests change borders, not just the chat log." },
];

/* ---------- 8 guides ---------- */
const GUIDES = [
  {
    title: "Getting Started: Your First Steps",
    body: "<p>New to Nodisium? Start by finding a safe area and learning the core loop: gather resources, avoid unclaimed hostile territory, and join a community fast.</p><ul><li><strong>/spawn</strong> — find your bearings and browse town listings.</li><li>Join a town early — solo players are vulnerable to raiders and land loss.</li><li>Read <strong>/rules</strong> before you do anything else.</li></ul><p>Your first goal should be joining a settlement so you have a safe claim to build on.</p>"
  },
  {
    title: "Towns, Claims & Land",
    body: "<p>Land in Nodisium is protected through town claims. A town spends claim blocks to expand its borders and keep its land safe.</p><ul><li>Claims protect against griefing and unauthorized building.</li><li>Only mayors and trusted ranks can expand a town's claims.</li><li>Unclaimed land is open — and dangerous.</li></ul><p>Keep an eye on the dynmap to see exactly who owns what before you build.</p>"
  },
  {
    title: "Founding Your Own Town",
    body: "<p>Want to lead instead of follow? Founding a town takes resources and a good location.</p><ul><li>Choose a location with resources, defensible terrain, and room to grow.</li><li>Bank enough money — founding costs an upfront fee and claims cost more over time.</li><li>Recruit members who actually play; an empty town is a dead town.</li></ul><p>Start small, claim only what you can protect, and expand deliberately.</p>"
  },
  {
    title: "Nations & Diplomacy",
    body: "<p>When towns unite, they form nations. Nations share foreign policy, war decisions, and prestige.</p><ul><li>A nation needs a capital town and enough towns to sustain it.</li><li>Use diplomacy before war — treaties, embargos, and alliances shape the map.</li><li>Nations can annex, ally, or wage war on one another.</li></ul><p>The strongest nations are built on trust, not just land area.</p>"
  },
  {
    title: "War & Conflict",
    body: "<p>War on Nodisium is structured, not chaotic. Both sides must follow the war rules for the conflict to count.</p><ul><li>Wars require a formal declaration with clear terms.</li><li>Victory is decided by agreed objectives — not endless raiding.</li><li>Neutral players and towns are off-limits unless they join the war.</li></ul><p>Never attack outside war mechanics — that is raiding and will be punished.</p>"
  },
  {
    title: "Economy & Trading",
    body: "<p>Wealth is power on Nodisium. Master the economy to fund wars, towns, and expansions.</p><ul><li>Set up player shops to sell surplus goods passively.</li><li>Control valuable resources (rare ores, enchanted gear) for leverage.</li><li>Buy low, sell high — supply lines matter in wartime.</li></ul><p>An embargo on your nation hurts more than a lost battle.</p>"
  },
  {
    title: "Military & Defenses",
    body: "<p>Prepare before war finds you. A town without defenses is a target.</p><ul><li>Stockpile armor, weapons, and potions for every member.</li><li>Build defensive terrain: walls, choke points, and hidden storage.</li><li>Keep emergency funds for war reparations or bribes.</li></ul><p>Defense wins wars — offense just starts them.</p>"
  },
  {
    title: "Dynmap & Navigation",
    body: "<p>The dynmap is your window into the world. Use it to understand borders, find resources, and plan expansion.</p><ul><li>Check the dynmap to see town claims and nation territories at a glance.</li><li>Mark strategic locations — chokepoints, resource nodes, hidden valleys.</li><li>Watch enemy activity from the safety of your map room.</li></ul><p>Information is the most valuable currency in geopolitics.</p>"
  },
];
