(() => {
  const A = window.ARCHIVE;
  const CATS = A.categories;
  const ENTS = A.entities;
  const INCS = A.incidents;
  const OTHER = CATS.findIndex((c) => c.id === "other");
  const HUB_SLUGS = ["bangladesh_football_federation", "bangladesh_national_football_team"];
  const COLORS = { ink: "#17241f", quiet: "#5d6a65", line: "#dce3e0", field: "#006a4e", paper: "#ffffff" };
  const TYPE_NAMES = {
    person: ["person", "people", "Person"],
    team: ["team", "teams", "Team"],
    organization: ["organisation", "organisations", "Organisation"],
    tournament: ["tournament", "tournaments", "Tournament"],
    other: ["name", "names", "Other"],
  };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const VIEWS = ["categories", "connections", "incidents", "about"];

  const bySlug = new Map(ENTS.map((e, i) => [e.slug, i]));
  const hubs = new Set(HUB_SLUGS.map((s) => bySlug.get(s)).filter((i) => i !== undefined));
  const neighbours = ENTS.map(() => []);
  for (const [a, b, ns] of A.links) {
    neighbours[a].push([b, ns]);
    neighbours[b].push([a, ns]);
  }

  const state = {
    view: "categories",
    type: "person",
    minKinds: 3,
    sort: "count",
    entity: null,
    panelCat: null,
    panelWith: null,
    minShared: 3,
    netCat: "",
    netHubs: false,
    q: "",
    incCat: "",
    incYear: "",
    limit: 50,
  };

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const plural = (n, one, many) => `${n.toLocaleString("en")} ${n === 1 ? one : many}`;

  function formatRange(start, end) {
    const [y1, m1, d1] = start.split("-").map(Number);
    const [y2, m2, d2] = end.split("-").map(Number);
    const a = `${d1} ${MONTHS[m1 - 1]}`;
    const b = `${d2} ${MONTHS[m2 - 1]} ${y2}`;
    if (start === end) return b;
    if (y1 === y2 && m1 === m2) return `${d1}–${b}`;
    if (y1 === y2) return `${a} – ${b}`;
    return `${a} ${y1} – ${b}`;
  }

  function step(n) {
    if (n >= 8) return 4;
    if (n >= 4) return 3;
    if (n >= 2) return 2;
    return 1;
  }

  // Header

  function renderMeta() {
    const m = A.meta;
    const [y, mo, d] = m.generated.split("-").map(Number);
    $("#counts").textContent =
      `${INCS.length.toLocaleString("en")} incidents · ${Number(m.incident_posts).toLocaleString("en")} source posts · ${Number(m.posts).toLocaleString("en")} posts analyzed`;
    $("#meta").textContent = `v${m.version} · Updated ${d} ${MONTHS_FULL[mo - 1]} ${y}`;
  }

  // Categories view

  function renderMatrix() {
    const names = TYPE_NAMES[state.type];
    const rows = ENTS.map((e, i) => i).filter((i) => ENTS[i].type === state.type && ENTS[i].kinds >= state.minKinds);
    rows.sort((a, b) => {
      const ea = ENTS[a], eb = ENTS[b];
      const byKinds = eb.kinds - ea.kinds, byCount = eb.incidents.length - ea.incidents.length;
      return (state.sort === "kinds" ? byKinds || byCount : byCount || byKinds) || ea.label.localeCompare(eb.label);
    });

    $("#matrix-heading").textContent = rows.length
      ? `${plural(rows.length, names[0], names[1])} ${rows.length === 1 ? "appears" : "appear"} in ${state.minKinds} or more kinds of incident`
      : `No ${names[1]} appear in ${state.minKinds} or more kinds of incident`;

    for (const b of document.querySelectorAll(".choice [data-type]")) {
      b.setAttribute("aria-pressed", String(b.dataset.type === state.type));
    }

    const table = $("#matrix");
    if (!rows.length) {
      table.innerHTML = "";
      $("#matrix-status").textContent = "Lower the number of kinds to see more.";
      return;
    }
    $("#matrix-status").textContent = "Point at a square to see its count. Click it to read those incidents.";

    const groupStart = (c) => c > 0 && CATS[c].group !== CATS[c - 1].group;
    const colClass = (c) => [groupStart(c) ? "group-start" : "", c === OTHER ? "other-col" : ""].join(" ");

    let head = `<thead><tr><th class="name"></th>`;
    CATS.forEach((cat, c) => {
      head += `<th class="${colClass(c)}" scope="col"><span class="col" data-col="${c}">${esc(cat.label)}</span></th>`;
    });
    head +=
      `<th class="num" scope="col"><button type="button" class="sort" data-sort="count" aria-pressed="${state.sort === "count"}">Incidents</button></th>` +
      `<th class="num" scope="col"><button type="button" class="sort" data-sort="kinds" aria-pressed="${state.sort === "kinds"}">Kinds</button></th>` +
      `</tr></thead>`;

    let body = "<tbody>";
    for (const i of rows) {
      const e = ENTS[i];
      body += `<tr data-row="${i}"><th class="name" scope="row"><button type="button" data-open="${i}" title="${esc(e.label)}">${esc(e.label)}</button></th>`;
      CATS.forEach((cat, c) => {
        const n = e.cats[c] || 0;
        body += `<td class="${colClass(c)}">`;
        body += n
          ? `<button type="button" class="cell s${step(n)}" data-e="${i}" data-c="${c}" aria-label="${esc(e.label)}, ${esc(cat.label)}, ${plural(n, "incident", "incidents")}"></button>`
          : `<span class="dot"></span>`;
        body += "</td>";
      });
      body += `<td class="num">${e.incidents.length}</td><td class="num">${e.kinds}</td></tr>`;
    }
    body += "</tbody>";
    table.innerHTML = head + body;

    $("#matrix-legend").innerHTML =
      [["s1", "1 incident"], ["s2", "2–3"], ["s3", "4–7"], ["s4", "8 or more"]]
        .map(([s, t]) => `<span><span class="swatch cell ${s}" aria-hidden="true"></span>${t}</span>`)
        .join("") + `<span>Other is shown lighter because it holds incidents that fit no kind.</span>`;
  }

  function matrixHover(target) {
    const table = $("#matrix");
    table.querySelectorAll(".on").forEach((el) => el.classList.remove("on"));
    if (!target || !target.dataset.e) return;
    const e = ENTS[+target.dataset.e], c = +target.dataset.c, n = e.cats[c];
    target.closest("tr").classList.add("on");
    table.querySelector(`[data-col="${c}"]`)?.classList.add("on");
    $("#matrix-status").textContent = `${e.label}: ${plural(n, "incident", "incidents")} in ${CATS[c].label}.`;
  }

  function bindMatrix() {
    const table = $("#matrix");
    table.addEventListener("click", (ev) => {
      const cell = ev.target.closest("[data-e]");
      const name = ev.target.closest("[data-open]");
      const sort = ev.target.closest("[data-sort]");
      if (cell) openEntity(+cell.dataset.e, { cat: +cell.dataset.c });
      else if (name) openEntity(+name.dataset.open);
      else if (sort) { state.sort = sort.dataset.sort; renderMatrix(); }
    });
    table.addEventListener("mouseover", (ev) => matrixHover(ev.target.closest("[data-e]")));
    table.addEventListener("focusin", (ev) => matrixHover(ev.target.closest("[data-e]")));
    table.addEventListener("mouseleave", () => matrixHover(null));

    for (const b of document.querySelectorAll(".choice [data-type]")) {
      b.addEventListener("click", () => { state.type = b.dataset.type; renderMatrix(); });
    }
    const sel = $("#min-kinds");
    for (let k = 1; k <= 10; k++) sel.add(new Option(String(k), String(k), false, k === state.minKinds));
    sel.addEventListener("change", () => { state.minKinds = +sel.value; renderMatrix(); });
  }

  // Shared incident rendering

  function renderIncident(n, current) {
    const inc = INCS[n];
    const kinds = inc.cats.map((c) => CATS[c].label).join(", ");
    const names = inc.ents
      .map((e) => (e === current ? esc(ENTS[e].label) : `<button type="button" data-open="${e}">${esc(ENTS[e].label)}</button>`))
      .join(", ");
    const posts = inc.posts
      .map((url, k) => `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="Facebook post ${k + 1} of ${inc.posts.length}">${k + 1}</a>`)
      .join(", ");
    return `<article class="incident">
      <p class="small quiet">${formatRange(inc.start, inc.end)}</p>
      <h3>${esc(inc.title)}</h3>
      <p>${esc(inc.summary)}</p>
      <p class="facts small">${esc(kinds)}.${names ? ` Named: ${names}.` : ""}</p>
      <p class="posts small">Facebook ${inc.posts.length === 1 ? "post" : "posts"}: ${posts}</p>
    </article>`;
  }

  // Entity panel

  function openEntity(i, { cat = null, withEnt = null } = {}) {
    state.entity = i;
    state.panelCat = cat;
    state.panelWith = withEnt;
    const hash = `${state.view}/${ENTS[i].slug}`;
    if (location.hash.slice(1) !== hash) history.pushState(null, "", `#${hash}`);
    renderPanel(true);
    redrawGraph();
  }

  function closeEntity() {
    state.entity = null;
    $("#panel").hidden = true;
    document.body.classList.remove("panel-open");
    if (location.hash.slice(1) !== state.view) history.pushState(null, "", `#${state.view}`);
    redrawGraph();
  }

  function strip(e) {
    const start = Date.UTC(2014, 8, 1), end = Date.UTC(2022, 0, 1);
    const x = (iso) => {
      const [y, m, d] = iso.split("-").map(Number);
      return 4 + ((Date.UTC(y, m - 1, d) - start) / (end - start)) * 392;
    };
    let svg = `<svg class="strip" viewBox="0 0 400 44" preserveAspectRatio="none" role="img" aria-label="When these incidents happened, September 2014 to December 2021">`;
    svg += `<line class="axis" x1="4" x2="396" y1="24.5" y2="24.5"/>`;
    for (let y = 2015; y <= 2021; y++) {
      const px = x(`${y}-01-01`);
      svg += `<line class="axis" x1="${px}" x2="${px}" y1="24" y2="28"/><text x="${px}" y="40" text-anchor="middle">${y}</text>`;
    }
    for (const n of e.incidents) {
      const inc = INCS[n];
      const on = matchesPanel(inc);
      const px = x(inc.start).toFixed(1);
      svg += `<line class="tick${on ? "" : " off"}" x1="${px}" x2="${px}" y1="4" y2="22"/>`;
    }
    return svg + "</svg>";
  }

  function matchesPanel(inc) {
    if (state.panelCat !== null && !inc.cats.includes(state.panelCat)) return false;
    if (state.panelWith !== null && !inc.ents.includes(state.panelWith)) return false;
    return true;
  }

  function renderPanel(focus) {
    const i = state.entity;
    const e = ENTS[i];
    const panel = $("#panel");
    const years = e.incidents.map((n) => INCS[n].start.slice(0, 4));
    const span = years[0] === years[years.length - 1] ? `in ${years[0]}` : `from ${years[0]} to ${years[years.length - 1]}`;
    const otherCount = e.cats[OTHER] || 0;

    const kinds = Object.entries(e.cats)
      .map(([c, n]) => [+c, n])
      .sort((a, b) => (a[0] === OTHER) - (b[0] === OTHER) || b[1] - a[1]);
    const together = neighbours[i]
      .map(([j, ns]) => [j, ns.length])
      .sort((a, b) => b[1] - a[1] || ENTS[a[0]].label.localeCompare(ENTS[b[0]].label))
      .slice(0, 10);

    const shown = e.incidents.filter((n) => matchesPanel(INCS[n])).slice().reverse();
    let showing = "";
    if (state.panelCat !== null || state.panelWith !== null) {
      const parts = [];
      if (state.panelCat !== null) parts.push(`in ${CATS[state.panelCat].label}`);
      if (state.panelWith !== null) parts.push(`shared with ${ENTS[state.panelWith].label}`);
      showing = `<p class="showing small"><span>Showing ${plural(shown.length, "incident", "incidents")} ${esc(parts.join(", "))}.</span><button type="button" data-clear>Show all</button></p>`;
    }

    panel.innerHTML = `
      <div class="panel-head">
        <h2 id="panel-name" tabindex="-1">${esc(e.label)}</h2>
        <button type="button" class="close" data-close>Close</button>
        <p class="quiet">${TYPE_NAMES[e.type][2]}</p>
      </div>
      <p>Named in ${plural(e.incidents.length, "incident", "incidents")} ${span}, across ${plural(e.kinds, "kind", "kinds")} of incident${otherCount ? `. ${otherCount} more ${otherCount === 1 ? "is" : "are"} filed under Other` : ""}.</p>
      ${strip(e)}
      <section>
        <h3>Kinds of incident</h3>
        <div class="filters">${kinds
          .map(([c, n]) => `<button type="button" class="filter" data-cat="${c}" aria-pressed="${state.panelCat === c}">${esc(CATS[c].label)}<span class="n">${n}</span></button>`)
          .join("")}</div>
      </section>
      ${together.length ? `<section>
        <h3>Most often named with</h3>
        <div class="filters">${together
          .map(([j, n]) => `<button type="button" class="filter" data-with="${j}" aria-pressed="${state.panelWith === j}">${esc(ENTS[j].label)}<span class="n">${n}</span></button>`)
          .join("")}</div>
      </section>` : ""}
      <section>
        <h3>Incidents, newest first</h3>
        ${showing}
        <div class="incidents">${shown.map((n) => renderIncident(n, i)).join("")}</div>
      </section>`;

    panel.hidden = false;
    document.body.classList.add("panel-open");
    if (focus) {
      panel.scrollTop = 0;
      $("#panel-name").focus({ preventScroll: true });
    }
  }

  function bindPanel() {
    const panel = $("#panel");
    panel.addEventListener("click", (ev) => {
      const t = ev.target.closest("button");
      if (!t) return;
      if (t.dataset.close !== undefined) closeEntity();
      else if (t.dataset.clear !== undefined) { state.panelCat = null; state.panelWith = null; renderPanel(); }
      else if (t.dataset.cat !== undefined) { state.panelCat = state.panelCat === +t.dataset.cat ? null : +t.dataset.cat; renderPanel(); }
      else if (t.dataset.with !== undefined) { state.panelWith = state.panelWith === +t.dataset.with ? null : +t.dataset.with; renderPanel(); }
      else if (t.dataset.open !== undefined) openEntity(+t.dataset.open);
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && state.entity !== null) closeEntity();
    });
  }

  // Connections view

  let graph = null;
  let hover = null;
  let lit = new Map();
  let litLabels = new Set();
  let netNeighbours = new Map();
  let labelled = new Set();
  const positions = new Map();
  const LABEL_COUNT = 14;
  const FOCUS_LABEL_COUNT = 10;

  // Pulls every node gently toward the centre so small separate clusters
  // stay in view instead of drifting off and shrinking the fitted zoom.
  function gravity(strength) {
    let nodes = [];
    const force = (alpha) => {
      for (const n of nodes) {
        n.vx -= n.x * strength * alpha;
        n.vy -= n.y * strength * alpha;
      }
    };
    force.initialize = (ns) => { nodes = ns; };
    return force;
  }

  function netData() {
    const cat = state.netCat === "" ? null : +state.netCat;
    const links = [];
    const used = new Set();
    for (const [a, b, ns] of A.links) {
      if (!state.netHubs && (hubs.has(a) || hubs.has(b))) continue;
      const w = cat === null ? ns.length : ns.filter((n) => INCS[n].cats.includes(cat)).length;
      if (w < state.minShared) continue;
      links.push({ source: a, target: b, w });
      used.add(a);
      used.add(b);
    }
    netNeighbours = new Map([...used].map((i) => [i, new Map()]));
    for (const l of links) {
      netNeighbours.get(l.source).set(l.target, l.w);
      netNeighbours.get(l.target).set(l.source, l.w);
    }
    const nodes = [...used].map((id) => ({ id, ...(positions.get(id) || {}) }));
    labelled = new Set(
      [...used]
        .sort((a, b) => ENTS[b].kinds - ENTS[a].kinds || ENTS[b].incidents.length - ENTS[a].incidents.length)
        .slice(0, LABEL_COUNT)
    );
    return { nodes, links };
  }

  const radius = (e) => 2.5 + Math.sqrt(e.kinds) * 1.7;

  function drawNode(node, ctx, scale) {
    const e = ENTS[node.id];
    const r = radius(e);
    const focus = hover ?? state.entity;
    const dim = focus !== null && netNeighbours.has(focus) && node.id !== focus && !lit.has(node.id);
    ctx.globalAlpha = dim ? 0.18 : 1;

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    if (e.type === "person") {
      ctx.fillStyle = COLORS.field;
      ctx.fill();
    } else if (e.type === "team") {
      ctx.fillStyle = COLORS.quiet;
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS.paper;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = COLORS.quiet;
      ctx.stroke();
    }
    if (node.id === state.entity) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 2.5, 0, 2 * Math.PI);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLORS.ink;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  // Labels are drawn after all nodes so no circle covers a name. They are
  // placed in priority order and a label that would overlap one already
  // placed is skipped.
  function drawLabels(ctx, scale) {
    const focus = hover ?? state.entity;
    const focused = focus !== null && netNeighbours.has(focus);
    const nodes = graph.graphData().nodes;
    const byId = new Map(nodes.map((n) => [n.id, n]));

    let order;
    if (focused) {
      order = [focus, ...litLabels];
    } else {
      order = [...labelled];
      if (scale > 2.5) order = order.concat(nodes.map((n) => n.id).filter((id) => !labelled.has(id)));
    }

    const font = (id) =>
      id === focus
        ? `600 ${13 / scale}px "Anek Bangla", system-ui, sans-serif`
        : `500 ${12 / scale}px "Anek Bangla", system-ui, sans-serif`;
    const half = 8 / scale;
    const gap = 2 / scale;
    const placed = [];
    const toDraw = [];
    for (const id of order) {
      const node = byId.get(id);
      if (!node) continue;
      const e = ENTS[id];
      ctx.font = font(id);
      const x = node.x + radius(e) + 3 / scale;
      const box = [x - gap, node.y - half, x + ctx.measureText(e.label).width + gap, node.y + half];
      if (placed.some((p) => box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1])) continue;
      placed.push(box);
      toDraw.push([id, x, node.y]);
    }

    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.strokeStyle = COLORS.paper;
    ctx.fillStyle = COLORS.ink;
    for (const [id, x, y] of toDraw.reverse()) {
      ctx.font = font(id);
      ctx.lineWidth = (id === focus ? 4 : 3) / scale;
      ctx.strokeText(ENTS[id].label, x, y);
      ctx.fillText(ENTS[id].label, x, y);
    }
  }

  function setFocus(id) {
    hover = id;
    const focus = hover ?? state.entity;
    lit = focus !== null && netNeighbours.has(focus) ? netNeighbours.get(focus) : new Map();
    litLabels = new Set(
      [...lit.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, FOCUS_LABEL_COUNT)
        .map(([id]) => id)
    );
  }

  function redrawGraph() {
    if (!graph) return;
    setFocus(hover);
    graph.linkColor(graph.linkColor());
  }

  function linkTouches(l, id) {
    const s = typeof l.source === "object" ? l.source.id : l.source;
    const t = typeof l.target === "object" ? l.target.id : l.target;
    return s === id || t === id;
  }

  function initGraph() {
    const el = $("#network");
    graph = new ForceGraph(el)
      .backgroundColor(COLORS.paper)
      .nodeId("id")
      .nodeLabel(() => "")
      .nodeCanvasObject(drawNode)
      .nodePointerAreaPaint((node, color, ctx) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius(ENTS[node.id]) + 2, 0, 2 * Math.PI);
        ctx.fill();
      })
      .linkColor((l) => {
        const focus = hover ?? state.entity;
        if (focus === null || !netNeighbours.has(focus)) return "rgba(93, 106, 101, 0.22)";
        return linkTouches(l, focus) ? COLORS.quiet : "rgba(93, 106, 101, 0.06)";
      })
      .linkWidth((l) => Math.min(0.4 + (l.w - 1) * 0.3, 3))
      .onRenderFramePost(drawLabels)
      .cooldownTicks(250)
      .onNodeHover((node) => {
        setFocus(node ? node.id : null);
        el.style.cursor = node ? "pointer" : "";
      })
      .onNodeClick((node) => openEntity(node.id))
      .onNodeDragEnd((node) => positions.set(node.id, { x: node.x, y: node.y }))
      .onEngineStop(() => {
        for (const n of graph.graphData().nodes) positions.set(n.id, { x: n.x, y: n.y });
        if (!graph.__fitted) {
          graph.zoomToFit(0, 40);
          graph.__fitted = true;
        }
      });
    graph.d3Force("charge").strength(-120);
    graph.d3Force("link").distance(48);
    graph.d3Force("gravity", gravity(0.12));

    new ResizeObserver(() => {
      const centre = graph.centerAt();
      graph.width(el.clientWidth).height(el.clientHeight);
      if (graph.__fitted) graph.centerAt(centre.x, centre.y, 0);
    }).observe(el);
    refreshGraph();
  }

  function refreshGraph() {
    const data = netData();
    graph.__fitted = false;
    graph.graphData(data);
    setFocus(null);
    $("#net-count").textContent = data.nodes.length
      ? `${plural(data.nodes.length, "name", "names")} shown.`
      : "No names meet these settings. Lower the number of shared incidents.";
  }

  function focusNode(i) {
    openEntity(i);
    const node = graph.graphData().nodes.find((n) => n.id === i);
    if (node) {
      graph.centerAt(node.x, node.y, 0);
      graph.zoom(2, 0);
    }
  }

  function bindFind() {
    const input = $("#net-find");
    const list = $("#net-suggest");
    let items = [];
    let active = -1;

    const render = () => {
      const open = input.value.trim() !== "";
      list.innerHTML = items.length
        ? items
            .map((i, k) =>
              `<li role="option" id="net-opt-${k}" data-k="${k}" aria-selected="${k === active}">` +
              `${esc(ENTS[i].label)}<span>${TYPE_NAMES[ENTS[i].type][2]}</span></li>`)
            .join("")
        : `<li class="none" role="option" aria-disabled="true">No name in the network matches</li>`;
      list.hidden = !open;
      input.setAttribute("aria-expanded", String(open));
      if (active >= 0) input.setAttribute("aria-activedescendant", `net-opt-${active}`);
      else input.removeAttribute("aria-activedescendant");
    };
    const close = () => {
      items = [];
      active = -1;
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    };
    const choose = (k) => {
      const i = items[k];
      if (i === undefined) return;
      input.value = ENTS[i].label;
      close();
      focusNode(i);
    };

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return close();
      const shown = new Set(graph.graphData().nodes.map((n) => n.id));
      const starts = (i) => ENTS[i].label.toLowerCase().startsWith(q);
      items = [...shown]
        .filter((i) => ENTS[i].label.toLowerCase().includes(q))
        .sort((a, b) => starts(b) - starts(a) || ENTS[b].kinds - ENTS[a].kinds || ENTS[a].label.localeCompare(ENTS[b].label))
        .slice(0, 8);
      active = items.length ? 0 : -1;
      render();
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        if (!items.length) return;
        ev.preventDefault();
        active = (active + (ev.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
        render();
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        choose(active);
      } else if (ev.key === "Escape" && !list.hidden) {
        ev.stopPropagation();
        close();
      }
    });
    input.addEventListener("blur", close);
    list.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      const li = ev.target.closest("[data-k]");
      if (li) choose(+li.dataset.k);
    });
  }

  function bindNetwork() {
    const cat = $("#net-cat");
    CATS.forEach((c, i) => cat.add(new Option(c.label, String(i))));
    $("#min-shared").addEventListener("change", (ev) => { state.minShared = +ev.target.value; refreshGraph(); });
    cat.addEventListener("change", () => { state.netCat = cat.value; refreshGraph(); });
    $("#net-hubs").addEventListener("change", (ev) => { state.netHubs = ev.target.checked; refreshGraph(); });
    bindFind();
  }

  // Incidents view

  function incidentMatches(inc) {
    if (state.incCat !== "" && !inc.cats.includes(+state.incCat)) return false;
    if (state.incYear !== "" && !inc.start.startsWith(state.incYear)) return false;
    if (state.q) {
      const hay = `${inc.title} ${inc.summary}`.toLowerCase();
      if (!state.q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  }

  function renderIncidents() {
    const list = INCS.map((inc, n) => n).filter((n) => incidentMatches(INCS[n])).reverse();
    const filtered = state.q || state.incCat !== "" || state.incYear !== "";
    $("#inc-heading").textContent = filtered
      ? `${plural(list.length, "incident", "incidents")} of ${INCS.length.toLocaleString("en")}`
      : `All ${INCS.length.toLocaleString("en")} incidents, newest first`;
    $("#inc-list").innerHTML = list.length
      ? list.slice(0, state.limit).map((n) => renderIncident(n, null)).join("")
      : `<p class="empty quiet">No incidents match. Clear the search or choose another kind or year.</p>`;
    const more = $("#inc-more");
    const left = list.length - state.limit;
    more.hidden = left <= 0;
    more.textContent = `Show ${Math.min(50, left)} more`;
  }

  function bindIncidents() {
    const cat = $("#inc-cat");
    CATS.forEach((c, i) => cat.add(new Option(c.label, String(i))));
    const year = $("#inc-year");
    const years = [...new Set(INCS.map((i) => i.start.slice(0, 4)))].sort();
    for (const y of years) year.add(new Option(y, y));
    const reset = () => { state.limit = 50; renderIncidents(); };
    $("#inc-q").addEventListener("input", (ev) => { state.q = ev.target.value.trim().toLowerCase(); reset(); });
    cat.addEventListener("change", () => { state.incCat = cat.value; reset(); });
    year.addEventListener("change", () => { state.incYear = year.value; reset(); });
    $("#inc-more").addEventListener("click", () => { state.limit += 50; renderIncidents(); });
    $("#inc-list").addEventListener("click", (ev) => {
      const t = ev.target.closest("[data-open]");
      if (t) openEntity(+t.dataset.open);
    });
  }

  // Routing

  function showView(view) {
    state.view = view;
    for (const v of VIEWS) $(`#view-${v}`).hidden = v !== view;
    for (const a of document.querySelectorAll(".tabs a")) {
      if (a.dataset.view === view) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }
    if (view === "connections" && !graph) initGraph();
  }

  function route() {
    const [view, slug] = location.hash.slice(1).split("/");
    showView(VIEWS.includes(view) ? view : "categories");
    const i = slug ? bySlug.get(slug) : undefined;
    if (i !== undefined) {
      if (i !== state.entity) {
        state.entity = i;
        state.panelCat = null;
        state.panelWith = null;
      }
      renderPanel(false);
    } else if (state.entity !== null) {
      state.entity = null;
      $("#panel").hidden = true;
      document.body.classList.remove("panel-open");
    }
    redrawGraph();
  }

  for (const a of document.querySelectorAll(".tabs a")) {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      const slug = state.entity !== null ? `/${ENTS[state.entity].slug}` : "";
      history.pushState(null, "", `#${a.dataset.view}${slug}`);
      route();
    });
  }
  window.addEventListener("popstate", route);

  renderMeta();
  bindMatrix();
  bindPanel();
  bindNetwork();
  bindIncidents();
  renderMatrix();
  renderIncidents();
  route();
})();
