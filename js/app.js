/* ============================================================
   Nodisium — app logic (router, render, interactions)
   ============================================================ */

(function () {
  "use strict";

  const views = document.querySelectorAll(".view");
  const navItems = document.querySelectorAll(".nav-item");
  let currentView = "home";

  /* ---------------- View router ---------------- */
  function showView(name) {
    if (name === "home" && currentView === "home") {
      // Already on the starting page → refresh it
      window.location.reload();
      return;
    }
    currentView = name;
    views.forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    navItems.forEach((n) => n.classList.toggle("active", n.dataset.view === name));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  // Brand (logo) → back to home without the reload behaviour
  const brand = document.querySelector(".nav-brand");
  if (brand) {
    brand.addEventListener("click", () => {
      if (currentView !== "home") showView("home");
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Any [data-goto] button (hero CTAs, etc.)
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.goto));
  });

  /* ---------------- Toast ---------------- */
  let toastTimer = null;
  function showToast(message) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = message;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => { t.hidden = true; }, 350);
    }, 2600);
  }

  /* ---------------- Copy IP ---------------- */
  const copyBtn = document.getElementById("copy-ip");
  const SERVER_IP = "play.nodisium.net";
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(SERVER_IP);
      } catch (e) {
        // fallback for older browsers / non-secure contexts
        const ta = document.createElement("textarea");
        ta.value = SERVER_IP;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (_) {}
        document.body.removeChild(ta);
      }
      showToast("Server IP copied to clipboard");
    });
  }

  /* ---------------- Launch countdown ---------------- */
  // Doors open: 30 October, midnight (Europe — adjust offset if needed)
  const LAUNCH_DATE = new Date("2026-10-30T00:00:00+02:00").getTime();

  function pad(n) { return String(n).padStart(2, "0"); }

  function tickCountdown() {
    const el = (id) => document.getElementById(id);
    let diff = LAUNCH_DATE - Date.now();
    if (diff < 0) {
      el("count-days").textContent = "00";
      el("count-hours").textContent = "00";
      el("count-mins").textContent = "00";
      el("count-secs").textContent = "00";
      const live = el("count-live");
      if (live) live.textContent = "The world is live — join now.";
      return;
    }
    const days = Math.floor(diff / 86400000);
    diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000);
    diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000);
    diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);
    el("count-days").textContent = pad(days);
    el("count-hours").textContent = pad(hours);
    el("count-mins").textContent = pad(mins);
    el("count-secs").textContent = pad(secs);
  }

  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------------- Rules ---------------- */
  function renderRules() {
    const box = document.getElementById("rules-box");
    const ol = document.createElement("ol");
    RULES.forEach((rule) => {
      const li = document.createElement("li");
      li.textContent = rule;
      ol.appendChild(li);
    });
    box.appendChild(ol);
  }

  /* ---------------- Features & Guides ---------------- */
  function renderFeatures() {
    const grid = document.getElementById("features-grid");
    FEATURES.forEach((f) => {
      const card = document.createElement("div");
      card.className = "feature-card";
      card.innerHTML =
        '<span class="feat-icon">' + f.icon + "</span>" +
        "<h4>" + f.title + "</h4>" +
        "<p>" + f.desc + "</p>";
      grid.appendChild(card);
    });
  }

  function renderGuides() {
    const acc = document.getElementById("guides-accordion");
    GUIDES.forEach((g, i) => {
      const item = document.createElement("div");
      item.className = "guide-item";

      const toggle = document.createElement("button");
      toggle.className = "guide-toggle";
      toggle.type = "button";
      toggle.innerHTML =
        "<span>" + g.title + "</span>" +
        '<span class="guide-chevron">▼</span>';

      const body = document.createElement("div");
      body.className = "guide-body";
      const inner = document.createElement("div");
      inner.className = "guide-inner";
      inner.innerHTML = g.body;
      body.appendChild(inner);

      item.appendChild(toggle);
      item.appendChild(body);
      acc.appendChild(item);

      toggle.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        // close all
        acc.querySelectorAll(".guide-item.open").forEach((o) => {
          o.classList.remove("open");
          o.querySelector(".guide-body").style.maxHeight = "0px";
        });
        if (!isOpen) {
          item.classList.add("open");
          body.style.maxHeight = body.scrollHeight + "px";
        }
      });
    });
  }

  /* ---------------- Stats ---------------- */
  // Pulls real names from the live daily feed rather than PLACEHOLDER_PLAYERS -- clicking
  // a suggestion has to actually find a real player. Hides the whole hint (not just an
  // empty list) if the feed isn't reachable yet or has no players, rather than showing a
  // stale/fake suggestion that would always 404.
  async function renderSuggestions() {
    const hint = document.getElementById("stats-hint");
    const span = document.getElementById("name-suggestions");
    try {
      const daily = await API.fetchDaily();
      const names = daily.players.slice(0, 5).map((p) => p.name);
      if (names.length === 0) {
        hint.hidden = true;
        return;
      }
      names.forEach((name, idx) => {
        const s = document.createElement("span");
        s.className = "suggest";
        s.textContent = name + (idx < names.length - 1 ? ", " : "");
        s.addEventListener("click", () => {
          document.getElementById("stats-input").value = name;
          searchPlayer(name);
        });
        span.appendChild(s);
      });
    } catch (e) {
      hint.hidden = true;
    }
  }

  function kd(kills, deaths) {
    if (!deaths) return kills.toFixed(2);
    return (kills / deaths).toFixed(2);
  }

  function renderResult(player) {
    const el = document.getElementById("stats-result");
    el.innerHTML =
      '<div class="plr-name">' + player.name + "</div>" +
      '<div class="plr-meta">Town: <strong>' + player.town + "</strong> · Nation: <strong>" +
      player.nation + "</strong></div>" +
      '<div class="stat-grid">' +
      stat("KD Ratio", kd(player.kills, player.deaths)) +
      stat("Total Kills", player.kills.toLocaleString()) +
      stat("Deaths", player.deaths.toLocaleString()) +
      stat("Town", player.town) +
      stat("Nation", player.nation) +
      stat("Playtime", player.playtime) +
      "</div>";
    el.hidden = false;

    function stat(label, value) {
      return '<div class="stat"><div class="stat-label">' + label +
             '</div><div class="stat-value">' + value + "</div></div>";
    }
  }

  function renderError(msg) {
    const el = document.getElementById("stats-result");
    el.innerHTML = '<div class="error-msg">' + msg + "</div>";
    el.hidden = false;
  }

  async function searchPlayer(name) {
    const value = String(name || "").trim();
    if (!value) return;
    renderError("Searching…");
    try {
      const player = await API.fetchPlayer(value);
      renderResult(player);
    } catch (e) {
      renderError("Player \u201c" + value + "\u201d not found. Check the spelling or try one of the examples.");
    }
  }

  document.getElementById("stats-form").addEventListener("submit", (e) => {
    e.preventDefault();
    searchPlayer(document.getElementById("stats-input").value);
  });

  function renderNationResult(nation) {
    const el = document.getElementById("nation-stats-result");
    el.innerHTML =
      '<div class="plr-name">' + nation.name + "</div>" +
      '<div class="stat-grid">' +
      stat("KD Ratio", nation.kd.toFixed(2)) +
      stat("Total Kills", nation.kills.toLocaleString()) +
      stat("Deaths", nation.deaths.toLocaleString()) +
      stat("Nodes Captured", nation.nodesCaptured.toLocaleString()) +
      stat("Nodes Lost", nation.nodesLost.toLocaleString()) +
      stat("Combined Playtime", nation.playtime) +
      "</div>";
    el.hidden = false;

    function stat(label, value) {
      return '<div class="stat"><div class="stat-label">' + label +
             '</div><div class="stat-value">' + value + "</div></div>";
    }
  }

  function renderNationError(msg) {
    const el = document.getElementById("nation-stats-result");
    el.innerHTML = '<div class="error-msg">' + msg + "</div>";
    el.hidden = false;
  }

  async function searchNation(name) {
    const value = String(name || "").trim();
    if (!value) return;
    renderNationError("Searching…");
    try {
      const nation = await API.fetchNation(value);
      renderNationResult(nation);
    } catch (e) {
      renderNationError("Nation “" + value + "” not found. Check the spelling.");
    }
  }

  document.getElementById("nation-stats-form").addEventListener("submit", (e) => {
    e.preventDefault();
    searchNation(document.getElementById("nation-stats-input").value);
  });

  /* ---------------- Shop ---------------- */
  // Ranks & items ported from the reference store. Founder pricing =
  // 25% off the launch price (shown struck-through), one-time, lifetime.
  const SHOP_RANKS = [
    { name: "Settler", price: 6.75, featured: false, perks: [
      "Gold name in global chat",
      "2 extra /home slots",
      "Coloured town banner on the live map",
      "Queue priority when the server is full",
    ]},
    { name: "Envoy", price: 14.25, featured: true, perks: [
      "Everything in Settler",
      "Custom 3-character nation tag",
      "/nick and 5 extra /home slots",
      "Access to the diplomacy channel on Discord",
      "Founder badge on your stats profile — never sold again",
    ]},
    { name: "Sovereign", price: 29.25, featured: false, perks: [
      "Everything in Envoy",
      "Bespoke particle trail and join message",
      "Name engraved on the world spawn monument",
      "A say in the first season's world border vote",
      "Direct line to staff for land disputes",
    ]},
  ];

  const SHOP_ITEMS = [
    ["Founder cape", "Cosmetic cape, pre-launch only. Never re-issued in a later season.", 4.5],
    ["Nation crest pack", "Twelve heraldic banner presets for your capital and border markers.", 3.75],
    ["Pet fox — Ember", "Follows you, does nothing useful, universally adored.", 3.0],
    ["Extra /home slot", "One more waypoint. Stacks up to ten across all purchases.", 1.5],
    ["Chat colour token", "Recolour your name once. Twelve palette options, no neon.", 2.25],
    ["Name change", "Transfer your stats and nation history to a new Minecraft username.", 2.0],
  ];

  const CURRENCY = "£";
  const fmt = (n) => CURRENCY + n.toFixed(2);

  // cart: array of {name, raw} — ported "reserve" flow, no live checkout
  let cart = [];
  let reserved = false;

  function renderShop() {
    const grid = document.getElementById("rank-grid");
    SHOP_RANKS.forEach((r) => {
      const card = document.createElement("div");
      card.className = "rank-card" + (r.featured ? " featured" : "");
      card.innerHTML =
        (r.featured ? '<div class="rank-ribbon">Most chosen</div>' : "") +
        '<div class="rank-card-inner">' +
        '<div class="rank-name">' + r.name + "</div>" +
        '<div class="rank-price-row">' +
        '<span class="rank-price">' + fmt(r.price) + "</span>" +
        '<span class="rank-was">' + fmt(r.price / 0.75) + "</span>" +
        "</div>" +
        '<div class="rank-lifetime">one-time &middot; lifetime</div>' +
        '<div class="rank-divider"></div>' +
        '<ul class="rank-perks">' +
        r.perks.map((p) => '<li>' + p + "</li>").join("") +
        "</ul>" +
        '<button type="button" class="btn rank-btn' + (r.featured ? " btn-gold" : " btn-ghost") + '">Reserve ' + r.name + "</button>" +
        "</div>";
      card.querySelector("button").addEventListener("click", () => addToCart(r.name, r.price));
      grid.appendChild(card);
    });

    const items = document.getElementById("item-grid");
    SHOP_ITEMS.forEach((it) => {
      const [name, desc, price] = it;
      const cell = document.createElement("div");
      cell.className = "item-card";
      cell.innerHTML =
        '<div class="item-name">' + name + "</div>" +
        '<div class="item-desc">' + desc + "</div>" +
        '<div class="item-foot">' +
        '<span class="item-price">' + fmt(price) + "</span>" +
        '<button type="button" class="btn btn-ghost item-btn">Add</button>' +
        "</div>";
      cell.querySelector("button").addEventListener("click", () => addToCart(name, price));
      items.appendChild(cell);
    });
  }

  function addToCart(name, raw) {
    if (cart.some((c) => c.name === name)) {
      showToast("Already in your basket");
      return;
    }
    cart = cart.concat([{ name: name, raw: raw }]);
    reserved = false;
    paintBasket();
    showToast(name + " added to your basket");
  }

  function paintBasket() {
    const basket = document.getElementById("basket");
    const list = document.getElementById("basket-items");
    const total = document.getElementById("basket-total");
    const checkout = document.getElementById("basket-checkout");
    const clearBtn = document.getElementById("basket-clear");

    basket.hidden = cart.length === 0;
    list.innerHTML = cart
      .map((c) => '<div class="basket-item"><span>' + c.name + '</span><span class="basket-item-price">' + fmt(c.raw) + "</span></div>")
      .join("");
    total.textContent = fmt(cart.reduce((s, c) => s + c.raw, 0));
    checkout.textContent = reserved ? "Reserved ✓ — check your email" : "Reserve at founder price";
    clearBtn.style.visibility = reserved && cart.length ? "visible" : "visible";
  }

  document.getElementById("basket-clear").addEventListener("click", () => {
    cart = [];
    reserved = false;
    paintBasket();
  });

  document.getElementById("basket-checkout").addEventListener("click", () => {
    if (!cart.length) return;
    reserved = true;
    paintBasket();
    showToast("Reserved — charged the day the world opens");
  });

  /* ---------------- Init ---------------- */
  renderRules();
  renderFeatures();
  renderGuides();
  renderSuggestions();
  renderShop();
})();
