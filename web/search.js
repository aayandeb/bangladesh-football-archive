// Forgiving search over the archive. There is no page code in here: app.js
// asks, this answers. The rules it follows are in docs/design.md, "Search".
//
// A typed word finds an incident in one of these ways, strongest first:
//   1. the incident has that word                                (ban)
//   2. it has the same word with another ending                  (banned, bans)
//   3. it uses another spelling of the same name                 (Salauddin, Salahuddin)
//   4. it names something the word is the short form of          (BFF)
//   5. one of its words starts with what was typed               (salah, Salahuddin)
//   6. what was typed sits inside one of its words               (uddin, Salahuddin)
// Only when a word finds nothing in the whole archive:
//   7. the closest spelling the archive does have                (Salahudin, Salahuddin)
window.ArchiveSearch = (() => {
  // Short forms and respellings read as the same word.
  const SAME = {
    md: "mohammad", mohd: "mohammad", mohamed: "mohammad", mohammed: "mohammad", muhammad: "mohammad",
    sk: "sheikh", ctg: "chittagong", chattogram: "chittagong", ltd: "limited",
  };
  // Left out of a search unless it is all there is.
  const STOP = new Set("a an and the of in on at to for by with from is are was were who what why how did".split(" "));
  // Endings the rules below can't work out.
  const IRREGULAR = {
    paid: "pay", bought: "buy", sold: "sell", won: "win", lost: "lose", beaten: "beat", chose: "choose",
    chosen: "choose", took: "take", taken: "take", gave: "give", given: "give", made: "make", held: "hold",
    sent: "send", spent: "spend", stole: "steal", stolen: "steal", used: "use", using: "use", tied: "tie",
    died: "die", owed: "owe", owing: "owe", goes: "go", does: "do", agreed: "agree", refereed: "referee",
    guaranteed: "guarantee", freed: "free", men: "man", women: "woman", womens: "woman", chairmen: "chairman",
    linesmen: "linesman", policemen: "policeman", businessmen: "businessman",
  };
  // Words that only look like they have an ending.
  const WHOLE = new Set(["evening", "morning", "during", "united", "limited", "wedding", "building"]);
  // How much a match counts in the title, the names, the kinds and the summary.
  const WEIGHT = [3, 2.5, 2, 1];
  const PHRASE = [2, 1.5, 0, 1];
  const SHORT_FOR = new Set(["organization", "tournament", "team"]);

  const fold = (w) => w.replace(/(.)\1+/g, "$1");

  // Text as plain lower-case words. Capitals, accents, apostrophes and
  // punctuation go. "U-19", "U19" and "under 19" all become "u19", scores such
  // as "4-3" stay whole, and "vote-buying" becomes "vote buying". With joined,
  // used for the archive's own text, "votebuying" is added too and "under 19"
  // keeps its "under".
  function words(text, joined) {
    let t = String(text)
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[’'`]/g, "")
      .replace(/\b(under|u)[- ]?(1[2-9]|2[0-3])\b/g, (m, word, age) => (joined && word === "under" ? `under u${age}` : `u${age}`))
      .replace(/([a-z])-(?=\d)|(\d)-(?=[a-z])/g, "$1$2");
    if (joined) t = t.replace(/[a-z]+(?:-[a-z]+)+/g, (m) => `${m} ${m.replace(/-/g, "")}`);
    return t
      .replace(/-/g, (m, i, s) => (/\d/.test(s[i - 1] || "") && /\d/.test(s[i + 1] || "") ? "-" : " "))
      .replace(/[^a-z0-9-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w) => SAME[w] || w);
  }

  const isVowel = (s, i) => "aeiou".includes(s[i]) || (s[i] === "y" && i > 0 && !isVowel(s, i - 1));
  const hasVowel = (s) => [...s].some((_, i) => isVowel(s, i));
  // How many times a vowel is followed by a consonant: 1 in "vote", 2 in "allege".
  function beats(s) {
    let n = 0;
    for (let i = 1; i < s.length; i++) if (isVowel(s, i - 1) && !isVowel(s, i)) n++;
    return n;
  }
  // Ends consonant, vowel, consonant, as "vot" and "brib" do.
  const closed = (s) => {
    const n = s.length;
    return n >= 3 && !isVowel(s, n - 3) && isVowel(s, n - 2) && !isVowel(s, n - 1) && !"wxy".includes(s[n - 1]);
  };

  // The word without its ending, so referee, referees, refereed and refereeing
  // all give "refere". Plurals, -ed and -ing only. Related words such as
  // "election" and "elected" stay apart, because joining those by rule also
  // joins "mission" to "missed".
  function stem(word) {
    let s = IRREGULAR[word] || word;
    if (s.length < 4 || WHOLE.has(s) || !/^[a-z]+$/.test(s)) return s;

    if (s.endsWith("sses")) s = s.slice(0, -2);
    else if (s.endsWith("ies")) s = s.length > 4 ? `${s.slice(0, -3)}y` : s.slice(0, -1);
    else if (s.endsWith("s") && !/(ss|us|is)$/.test(s)) s = s.slice(0, -1);
    s = IRREGULAR[s] || s;

    let rest = null;
    let swapped = false;
    if (s.length > 4 && s.endsWith("ied")) { rest = `${s.slice(0, -3)}y`; swapped = true; }
    else if (s.endsWith("ed") && !s.endsWith("eed")) rest = s.slice(0, -2);
    else if (s.endsWith("ing")) rest = s.slice(0, -3);
    if (rest && rest.length >= 3 && hasVowel(rest)) {
      s = rest;
      if (/([^aeiou])\1$/.test(s)) s = s.slice(0, -1);                      // banned, ban
      else if (!swapped && beats(s) === 1 && closed(s)) s += "e";           // voted, vote
    }

    if (s.length > 3 && s.endsWith("e")) {
      const cut = s.slice(0, -1);
      const n = beats(cut);
      if (n > 1 || (n === 1 && !closed(cut))) s = cut;                      // allege, alleg
    }
    return s.length > 3 ? s.replace(/([^aeiou])\1$/, "$1") : s;             // pass, pas
  }

  // How many single-letter slips turn a into b: a letter added, dropped,
  // changed, or two swapped. Gives up past the limit.
  function slips(a, b, limit) {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    let before = null;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const row = [i];
      let best = i;
      for (let j = 1; j <= b.length; j++) {
        let d = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (before && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, before[j - 2] + 1);
        row.push(d);
        if (d < best) best = d;
      }
      if (best > limit) return limit + 1;
      before = prev;
      prev = row;
    }
    return prev[b.length];
  }

  // The words in a list that are nearest to a typed word that matched nothing.
  // One slip is allowed, two in a word of 10 letters or more, and none in a
  // word under 5, where one slip turns "ball" into "bell". Doubled letters
  // don't count as a slip.
  function closest(word, list) {
    const typed = fold(word);
    if (!/^[a-z]+$/.test(word) || typed.length < 5) return [];
    const limit = typed.length >= 10 ? 2 : 1;
    let best = limit;
    let found = [];
    for (const item of list) {
      const d = slips(typed, item.folded, best);
      if (d > best) continue;
      if (d < best) { best = d; found = []; }
      found.push(item);
    }
    return found.sort((a, b) => b.uses - a.uses).slice(0, 4).map((item) => item.word);
  }

  // "Bangladesh Football Federation" gives "bff", and "Sheikh Russel KC" gives "srkc".
  function shortForm(entity) {
    if (!SHORT_FOR.has(entity.type)) return "";
    const parts = entity.label.split(/[\s-]+/).filter((p) => /^[A-Za-z]/.test(p) && !/^(of|the|and|for)$/i.test(p));
    if (parts.length < 3) return "";
    return parts.map((p) => (/^[A-Z]{2,4}$/.test(p) ? p : p[0])).join("").toLowerCase();
  }

  function build(archive) {
    const others = new Map();
    for (const group of archive.spellings || []) {
      for (const w of group) others.set(w, group.filter((x) => x !== w));
    }

    const shown = new Map();
    const display = (w) => shown.get(w) || w;

    // One piece of text, ready to search: its words, and the same words
    // without their endings. Each has a space at both ends so " word" finds
    // the start of a word and " word " a whole one.
    function read(text, uses) {
      const list = words(text, true);
      for (const raw of String(text).match(/[\p{L}\p{N}]+/gu) || []) {
        const [key, more] = words(raw, false);
        if (!key || more) continue;
        // Prefer the lower-case form if the archive ever writes one, and the
        // word itself over a short form of it ("Mohammad" over "Md").
        const have = shown.get(key);
        if (!have || (raw === key && have !== key) || (raw.toLowerCase() === key && have.toLowerCase() !== key)) {
          shown.set(key, raw);
        }
      }
      for (const w of new Set(list)) uses.set(w, (uses.get(w) || 0) + 1);
      return { words: ` ${list.join(" ")} `, stems: ` ${list.map(stem).join(" ")} ` };
    }
    const vocabulary = (uses) =>
      [...uses]
        .filter(([w]) => /^[a-z]+$/.test(w) && fold(w).length >= 5)
        .map(([word, n]) => ({ word, folded: fold(word), uses: n }));

    const nameUses = new Map();
    const fullName = archive.entities.map((e) => [e.label, ...(e.aka || [])].join(" "));
    const short = archive.entities.map(shortForm);
    const entities = archive.entities.map((e, i) => read(fullName[i], nameUses));
    const nameWords = vocabulary(nameUses);

    const allUses = new Map();
    const incidents = archive.incidents.map((inc) => ({
      fields: [
        inc.title,
        inc.ents.map((e) => fullName[e]).join(" "),
        inc.cats.map((c) => archive.categories[c].label).join(" "),
        `${inc.summary} ${inc.id}`,
      ].map((text) => read(text, allUses)),
      short: ` ${inc.ents.map((e) => short[e]).filter(Boolean).join(" ")} `,
    }));
    const allWords = vocabulary(allUses);

    // How well one typed word fits each incident, 0 for not at all.
    const cache = new Map();
    function match(word) {
      if (cache.has(word)) return cache.get(word);
      const score = new Float32Array(incidents.length);
      const ending = ` ${stem(word)} `;
      const also = new Set();
      let any = false;

      incidents.forEach((inc, n) => {
        let own = inc.short.includes(` ${word} `) ? WEIGHT[1] : 0;
        let other = 0;
        let spelling = null;
        inc.fields.forEach((f, k) => {
          const q = f.words.includes(` ${word} `) ? 1
            : f.stems.includes(ending) ? 0.9
            : f.words.includes(` ${word}`) ? 0.8
            : f.words.includes(word) ? 0.5
            : 0;
          own = Math.max(own, q * WEIGHT[k]);
          const o = (others.get(word) || []).find((x) => f.words.includes(` ${x}`));
          if (o && 0.9 * WEIGHT[k] > other) { other = 0.9 * WEIGHT[k]; spelling = o; }
        });
        if (!own && other) also.add(spelling);
        score[n] = Math.max(own, other);
        if (score[n]) any = true;
      });

      let near = [];
      if (!any) {
        near = closest(word, allWords);
        const endings = near.map((w) => ` ${stem(w)} `);
        incidents.forEach((inc, n) => {
          inc.fields.forEach((f, k) => {
            if (endings.some((e) => f.stems.includes(e))) score[n] = Math.max(score[n], 0.4 * WEIGHT[k]);
          });
        });
      }

      const result = { score, also: [...also], near };
      if (cache.size > 300) cache.clear();
      cache.set(word, result);
      return result;
    }

    // Incidents for a typed query, best match first, or null when nothing
    // was typed. Every word has to match. If no incident has them
    // all, the ones with the most are returned and `partial` is true. `also`
    // and `closest` list the spellings used that were not the ones typed.
    function findIncidents(query) {
      if (!String(query).trim()) return null;
      let typed = words(query, false);
      const kept = typed.filter((w) => !STOP.has(w));
      if (kept.length) typed = kept;
      typed = [...new Set(typed)];
      // Typed, but nothing in it can be looked up: Bangla script, or only punctuation.
      if (!typed.length) return { order: [], partial: false, also: [], closest: [] };

      const matches = typed.map(match);
      const total = new Float32Array(incidents.length);
      const hits = new Uint8Array(incidents.length);
      let most = 0;
      for (const m of matches) {
        for (let n = 0; n < incidents.length; n++) {
          if (!m.score[n]) continue;
          total[n] += m.score[n];
          if (++hits[n] > most) most = hits[n];
        }
      }

      const phrase = typed.length > 1 ? ` ${typed.join(" ")}` : null;
      const order = [];
      for (let n = 0; n < incidents.length && most; n++) {
        if (hits[n] !== most) continue;
        if (phrase) incidents[n].fields.forEach((f, k) => { if (f.words.includes(phrase)) total[n] += PHRASE[k]; });
        order.push(n);
      }
      order.sort((a, b) => total[b] - total[a] || b - a);

      return {
        order,
        partial: most > 0 && most < typed.length,
        also: [...new Set(matches.flatMap((m) => m.also))].map(display),
        closest: matches
          .map((m, i) => ({ typed: typed[i], shown: m.near.map(display) }))
          .filter((c) => c.shown.length),
      };
    }

    // Entities whose name fits what was typed, best first. `candidates` are
    // the entity numbers to choose from.
    function findNames(query, candidates) {
      const typed = [...new Set(words(query, false))];
      if (!typed.length) return [];
      const lead = ` ${typed.join(" ")}`;
      const fit = (i, w) => {
        const e = entities[i];
        if (e.words.includes(` ${w} `) || short[i] === w) return 1;
        if ((others.get(w) || []).some((x) => e.words.includes(` ${x}`))) return 0.9;
        return e.words.includes(` ${w}`) ? 0.8 : e.words.includes(w) ? 0.5 : 0;
      };
      const rank = (fitOf) => {
        const found = [];
        for (const i of candidates) {
          let total = entities[i].words.startsWith(lead) ? 0.1 : 0;
          if (typed.every((w) => { const q = fitOf(i, w); total += q; return q; })) found.push([i, total]);
        }
        return found;
      };

      let found = rank(fit);
      if (!found.length) {
        const near = new Map(typed.map((w) => [w, closest(w, nameWords).map((c) => ` ${c} `)]));
        found = rank((i, w) => fit(i, w) || (near.get(w).some((c) => entities[i].words.includes(c)) ? 0.4 : 0));
      }
      const E = archive.entities;
      return found
        .sort((a, b) => b[1] - a[1] || E[b[0]].kinds - E[a[0]].kinds || E[a[0]].label.localeCompare(E[b[0]].label))
        .map(([i]) => i);
    }

    return { incidents: findIncidents, names: findNames };
  }

  return { build, words, stem };
})();
