// ============================================================
// Český kompas 2026 — logika aplikace (UI)
// Skórování je v scoring.js, data v data.js.
// ============================================================

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  // Stav průchodu: krok v pořadí otázek, odpovědi podle id otázky,
  // rozstřely (indexy zvolených možností)
  const state = {
    step: 0,
    answers: {},
    shootoutStep: 0,
    shootoutAnswers: [null, null],
  };

  // Uložený výsledek pro sdílení (kartička, odkaz)
  let currentResult = null;

  // Odesílání výsledků: id záznamu, start průchodu, odpovědi demografie
  const VERSION = "2.0";
  let submissionId = null;
  let startTime = null;
  let demoAnswers = {};

  const screens = {
    intro: $("#screen-intro"),
    question: $("#screen-question"),
    shootout: $("#screen-shootout"),
    result: $("#screen-result"),
  };

  function show(name) {
    for (const key in screens) screens[key].hidden = key !== name;
    window.scrollTo(0, 0);
  }

  function currentScreen() {
    for (const key in screens) if (!screens[key].hidden) return key;
    return null;
  }

  // --- Otázky ---

  function buildAnswerButtons() {
    const wrap = $("#answers");
    ANSWER_SCALE.forEach((a, i) => {
      const btn = document.createElement("button");
      btn.className = "answer-btn";
      btn.dataset.value = a.value;
      btn.textContent = a.label;
      btn.setAttribute("aria-label", a.label + " (klávesa " + (i + 1) + ")");
      btn.addEventListener("click", () => answer(a.value));
      wrap.appendChild(btn);
    });
  }

  function renderQuestion() {
    const qid = ORDER[state.step];
    const q = QUESTIONS.find((x) => x.id === qid);
    $("#q-text").textContent = q.text;
    $("#progress-label").textContent = (state.step + 1) + "/" + ORDER.length;
    $("#progress-fill").style.width = ((state.step + 1) / ORDER.length) * 100 + "%";
    $(".progress").setAttribute("aria-valuenow", state.step + 1);

    // Zvýrazni dřívější odpověď (při návratu zpět)
    const prev = state.answers[qid];
    document.querySelectorAll("#answers .answer-btn").forEach((btn) => {
      btn.classList.toggle("selected", typeof prev === "number" && Number(btn.dataset.value) === prev);
    });

    // Restart animace karty (slide)
    const card = $("#q-card");
    card.style.animation = "none";
    void card.offsetWidth; // vynutí reflow, aby se animace spustila znovu
    card.style.animation = "";

    show("question");
  }

  function answer(value) {
    const qid = ORDER[state.step];
    state.answers[qid] = value;
    if (state.step < ORDER.length - 1) {
      state.step++;
      renderQuestion();
    } else {
      state.shootoutStep = 0;
      renderShootout();
    }
  }

  function goBack() {
    if (state.step === 0) {
      show("intro");
    } else {
      state.step--;
      renderQuestion();
    }
  }

  // Start testu: nový záznam + stopky pro měření délky průchodu
  function startQuiz() {
    submissionId = Math.random().toString(36).slice(2, 10);
    startTime = Date.now();
    renderQuestion();
  }

  // --- Rozstřely (dvě bonusové otázky) ---

  function renderShootout() {
    const s = SHOOTOUTS[state.shootoutStep];
    $("#shootout-text").textContent = s.text;
    const wrap = $("#shootout-options");
    wrap.innerHTML = "";
    s.options.forEach((o, i) => {
      const btn = document.createElement("button");
      btn.className = "answer-btn threat-btn";
      btn.innerHTML = '<span class="icon" aria-hidden="true">' + o.icon + "</span>" + o.label;
      btn.setAttribute("aria-label", o.label + " (klávesa " + (i + 1) + ")");
      btn.addEventListener("click", () => pickShootout(i));
      wrap.appendChild(btn);
    });

    // Restart animace karty
    const card = $("#shootout-card");
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";

    show("shootout");
  }

  function shootoutBack() {
    if (state.shootoutStep > 0) {
      state.shootoutStep--;
      renderShootout();
    } else {
      renderQuestion(); // zpět na poslední otázku
    }
  }

  function pickShootout(index) {
    state.shootoutAnswers[state.shootoutStep] = index;
    if (state.shootoutStep < SHOOTOUTS.length - 1) {
      state.shootoutStep++;
      renderShootout();
    } else {
      const scores = computeScores(state.answers, QUESTIONS);
      showResult(scores, state.shootoutAnswers[0], state.shootoutAnswers[1], false);
      submitResult(scores);
    }
  }

  // --- Výsledek ---

  const CIRCLE_COLORS = ["#1450b4", "#b3271d", "#7b2d8b", "#1f7a45", "#b3711d", "#3a3a8c"];

  function initials(name) {
    const parts = name.split(" ");
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }

  function showResult(scores, threatIndex, lipIndex, shared) {
    const quad = getQuadrant(scores, QUADRANTS);
    const matches = findMatches(scores, FIGURES);
    const twin = matches[0];

    currentResult = { scores, threatIndex, lipIndex, quad, twin };

    $("#res-quadrant").textContent = quad.name;
    $("#res-quadrant-desc").textContent = quad.desc;

    // Dvojník
    $("#twin-name").textContent = twin.name;
    $("#twin-desc").textContent = twin.desc;
    const circle = $("#twin-circle");
    circle.textContent = initials(twin.name);
    circle.style.background = CIRCLE_COLORS[FIGURES.findIndex((f) => f.name === twin.name) % CIRCLE_COLORS.length];
    $("#twin-also").textContent =
      "Blízko máš taky k: " + matches[1].name + " (" + matches[1].match + " %), " +
      matches[2].name + " (" + matches[2].match + " %)";

    // Rozstřely: hrozba + líp už bylo/teprve bude
    const threat = SHOOTOUTS[0].options[threatIndex];
    $("#threat-icon").textContent = threat.icon;
    $("#threat-text").textContent = "Tvoje hrozba: " + threat.label;
    const lip = SHOOTOUTS[1].options[lipIndex];
    $("#lip-icon").textContent = lip.icon;
    $("#lip-text").textContent = lip.label;

    // Tlačítka podle režimu (vlastní výsledek vs. sdílený odkaz)
    $("#btn-copy").hidden = shared;
    $("#btn-retry").hidden = shared;
    $("#btn-try").hidden = !shared;

    // Demografie jen po vlastním průchodu
    $("#demo-block").hidden = shared;
    if (!shared) resetDemoUI();

    show("result");

    // Animace: bod doletí na mapu, procento se napočítá
    const point = $("#map-point");
    point.classList.remove("landed");
    point.style.left = "50%";
    point.style.top = "50%";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        point.classList.add("landed");
        point.style.left = ((scores[0] + 20) / 40) * 100 + "%";
        point.style.top = ((20 - scores[1]) / 40) * 100 + "%";
      });
    });

    animateCount($("#twin-match"), twin.match);
  }

  // Počítadlo procent shody (0 → cíl za ~0,8 s)
  function animateCount(el, target) {
    const duration = 800;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      el.textContent = Math.round(eased * target) + " %";
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // --- Odesílání do Google Sheets (Apps Script) ---

  // text/plain = jednoduchý CORS požadavek bez preflightu (stejný trik jako EvalAI).
  // Když webhook chybí nebo selže, uživateli se nic nerozbije.
  function sendToWebhook(payload) {
    if (!WEBHOOK_URL) {
      console.log("[Kompas DEV] payload:", payload);
      return;
    }
    fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  function submitResult(scores) {
    const quad = getQuadrant(scores, QUADRANTS);
    const twin = findMatches(scores, FIGURES)[0];
    sendToWebhook({
      type: "result",
      submissionId,
      version: VERSION,
      timestamp: new Date().toISOString(),
      durationSec: startTime ? Math.round((Date.now() - startTime) / 1000) : "",
      scores,
      quadrant: quad.name,
      twin: twin.name,
      twinMatch: twin.match,
      threat: SHOOTOUTS[0].options[state.shootoutAnswers[0]].label,
      lip: SHOOTOUTS[1].options[state.shootoutAnswers[1]].label,
      answers: state.answers,
      userAgent: navigator.userAgent.slice(0, 200),
    });
  }

  // --- Demografický průzkum (dobrovolný) ---

  function buildDemoUI() {
    const wrap = $("#demo-questions");
    DEMOGRAPHICS.forEach((d) => {
      const block = document.createElement("div");
      block.className = "demo-q";
      const label = document.createElement("p");
      label.className = "demo-label";
      label.textContent = d.label;
      block.appendChild(label);
      const opts = document.createElement("div");
      opts.className = "demo-opts";
      d.options.forEach((o) => {
        const b = document.createElement("button");
        b.className = "pill";
        b.textContent = o.label;
        b.addEventListener("click", () => {
          demoAnswers[d.id] = o.value;
          opts.querySelectorAll(".pill").forEach((p) => p.classList.toggle("selected", p === b));
        });
        opts.appendChild(b);
      });
      block.appendChild(opts);
      wrap.appendChild(block);
    });
    $("#btn-demo-send").addEventListener("click", sendDemo);
    $("#btn-demo-skip").addEventListener("click", () => {
      $("#demo-block").hidden = true;
    });
  }

  function sendDemo() {
    if (Object.keys(demoAnswers).length > 0) {
      sendToWebhook(Object.assign({ type: "demo", submissionId }, demoAnswers));
    }
    $("#demo-inner").hidden = true;
    $("#demo-thanks").hidden = false;
  }

  function resetDemoUI() {
    demoAnswers = {};
    document.querySelectorAll("#demo-questions .pill").forEach((p) => p.classList.remove("selected"));
    $("#demo-inner").hidden = false;
    $("#demo-thanks").hidden = true;
  }

  // --- Sdílení ---

  function shareURL() {
    const base = location.href.split("?")[0].split("#")[0];
    return base + "?r=" + encodeResult(currentResult.scores, currentResult.threatIndex, currentResult.lipIndex);
  }

  function copyLink() {
    const url = shareURL();
    const btn = $("#btn-copy");
    const done = () => {
      btn.textContent = "Zkopírováno ✓";
      setTimeout(() => (btn.textContent = "Zkopírovat odkaz"), 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, () => prompt("Zkopíruj odkaz ručně:", url));
    } else {
      prompt("Zkopíruj odkaz ručně:", url);
    }
  }

  // --- Kartička (Canvas, 1080 × 1350, bez knihoven) ---

  function drawCard() {
    const { scores, threatIndex, lipIndex, quad, twin } = currentResult;
    const W = 1080, H = 1350;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const FONT = '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    // Pozadí
    ctx.fillStyle = "#f7f1e5";
    ctx.fillRect(0, 0, W, H);

    // Titulek
    ctx.fillStyle = "#1c1b33";
    ctx.textAlign = "center";
    ctx.font = "900 60px " + FONT;
    ctx.fillText("ČESKÝ KOMPAS 2026", W / 2, 110);

    // Mapa
    const mapSize = 560;
    const mx = (W - mapSize) / 2;
    const my = 170;
    const half = mapSize / 2;
    // Kvadranty (stejné odstíny jako na webu)
    ctx.fillStyle = "#fdeee0"; ctx.fillRect(mx, my, half, half);               // Pragmatická konzerva
    ctx.fillStyle = "#e2ecfb"; ctx.fillRect(mx + half, my, half, half);        // Sluníčkový byznysmen
    ctx.fillStyle = "#f6ddd9"; ctx.fillRect(mx, my + half, half, half);        // Socan vlastenec
    ctx.fillStyle = "#e7e2f5"; ctx.fillRect(mx + half, my + half, half, half); // Rovnostář z kavárny
    // Mřížka a rám
    ctx.strokeStyle = "rgba(28,27,51,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx, my + half); ctx.lineTo(mx + mapSize, my + half);
    ctx.moveTo(mx + half, my); ctx.lineTo(mx + half, my + mapSize);
    ctx.stroke();
    ctx.strokeStyle = "#1c1b33";
    ctx.lineWidth = 5;
    ctx.strokeRect(mx, my, mapSize, mapSize);
    // Popisky kvadrantů v rozích — dva řádky, jinak se dlouhé názvy překrývají
    ctx.fillStyle = "rgba(28,27,51,0.6)";
    ctx.font = "700 22px " + FONT;
    const cornerLabel = (name, x, align, fromBottom) => {
      // rozděl název na dva řádky zhruba v polovině slov
      const words = name.toUpperCase().split(" ");
      const mid = Math.ceil(words.length / 2);
      const lines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")].filter(Boolean);
      ctx.textAlign = align;
      lines.forEach((line, i) => {
        const yy = fromBottom
          ? my + mapSize - 18 - (lines.length - 1 - i) * 26
          : my + 36 + i * 26;
        ctx.fillText(line, x, yy);
      });
    };
    cornerLabel(QUADRANTS.konzerva.name, mx + 16, "left", false);
    cornerLabel(QUADRANTS.byznysmen.name, mx + mapSize - 16, "right", false);
    cornerLabel(QUADRANTS.socan.name, mx + 16, "left", true);
    cornerLabel(QUADRANTS.rovnostar.name, mx + mapSize - 16, "right", true);
    // Popisky os
    ctx.font = "700 26px " + FONT;
    ctx.textAlign = "center";
    ctx.fillText("JÁ", mx + half, my - 14);
    ctx.fillText("MY", mx + half, my + mapSize + 34);
    ctx.save();
    ctx.translate(mx - 18, my + half); ctx.rotate(-Math.PI / 2);
    ctx.fillText("DEZOLÁTI", 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(mx + mapSize + 30, my + half); ctx.rotate(Math.PI / 2);
    ctx.fillText("LEPŠOLIDI", 0, 0);
    ctx.restore();
    // Bod uživatele
    const px = mx + ((scores[0] + 20) / 40) * mapSize;
    const py = my + ((20 - scores[1]) / 40) * mapSize;
    ctx.beginPath();
    ctx.arc(px, py, 16, 0, Math.PI * 2);
    ctx.fillStyle = "#1c1b33";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    // Název kvadrantu (rovnoměrně v prostoru mezi mapou a URL)
    ctx.fillStyle = "#1c1b33";
    ctx.textAlign = "center";
    ctx.font = "900 64px " + FONT;
    ctx.fillText(quad.name, W / 2, 880);

    // Dvojník, hrozba, líp už bylo/teprve bude
    ctx.font = "600 40px " + FONT;
    ctx.fillText("Můj politický dvojník: " + twin.name + " (" + twin.match + " %)", W / 2, 975);
    ctx.fillText("Největší hrozba: " + SHOOTOUTS[0].options[threatIndex].label, W / 2, 1045);
    ctx.fillText("A jinak: " + SHOOTOUTS[1].options[lipIndex].label.toLowerCase() + ".", W / 2, 1115);

    // Dělicí linka nad URL
    ctx.strokeStyle = "rgba(28,27,51,0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 200, 1190);
    ctx.lineTo(W / 2 + 200, 1190);
    ctx.stroke();

    // URL webu — bere se ze skutečné adresy, takže funguje na libovolné doméně.
    // Při otevření z disku (file://) se řádek vynechá.
    if (location.protocol.startsWith("http")) {
      const site = location.host + location.pathname.replace(/\/(index\.html)?$/, "");
      ctx.font = "700 30px " + FONT;
      ctx.fillStyle = "#1450b4";
      ctx.fillText(site, W / 2, H - 60);
    }

    return canvas;
  }

  // Ladicí háček: v konzoli lze kartičku prohlédnout bez stahování
  window.__drawCard = drawCard;

  function downloadCard() {
    const canvas = drawCard();
    const save = (url) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = "cesky-kompas-2026.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    // toBlob je úspornější; dataURL fallback pro starší prohlížeče
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        save(url);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }, "image/png");
    } else {
      save(canvas.toDataURL("image/png"));
    }
  }

  // --- Restart ---

  function restart() {
    state.step = 0;
    state.answers = {};
    state.shootoutStep = 0;
    state.shootoutAnswers = [null, null];
    currentResult = null;
    // Vyčisti ?r= z adresy, aby refresh nevrátil cizí výsledek
    if (location.search) history.replaceState(null, "", location.pathname);
    show("intro");
  }

  // --- Klávesnice: 1–5 odpovědi, Enter pokračování, ←/Backspace zpět ---

  function onKey(e) {
    const screen = currentScreen();
    if (screen === "intro" && e.key === "Enter") {
      startQuiz();
      return;
    }
    if (screen === "question" || screen === "shootout") {
      if (e.key >= "1" && e.key <= "9") {
        const wrap = screen === "question" ? "#answers" : "#shootout-options";
        const btns = document.querySelectorAll(wrap + " .answer-btn");
        const idx = Number(e.key) - 1;
        if (btns[idx]) btns[idx].click();
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        screen === "question" ? goBack() : shootoutBack();
      }
    }
  }

  // --- Inicializace ---

  function init() {
    buildAnswerButtons();
    buildDemoUI();

    $("#btn-start").addEventListener("click", startQuiz);
    $("#btn-back").addEventListener("click", goBack);
    $("#btn-back-shootout").addEventListener("click", shootoutBack);
    $("#btn-download").addEventListener("click", downloadCard);
    $("#btn-copy").addEventListener("click", copyLink);
    $("#btn-retry").addEventListener("click", restart);
    $("#btn-try").addEventListener("click", restart);
    document.addEventListener("keydown", onKey);

    // Sdílený odkaz (?r=...) → rovnou výsledek
    const params = new URLSearchParams(location.search);
    const decoded = params.get("r") ? decodeResult(params.get("r")) : null;
    if (decoded) {
      showResult(decoded.scores, decoded.threatIndex, decoded.lipIndex, true);
    } else {
      show("intro");
    }
  }

  init();
})();
