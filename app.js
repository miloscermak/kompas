// ============================================================
// Český kompas 2026 — logika aplikace (UI)
// Skórování je v scoring.js, data v data.js.
// ============================================================

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  // Stav průchodu: krok v pořadí otázek, odpovědi podle id otázky, index hrozby
  const state = {
    step: 0,
    answers: {},
    threat: null,
  };

  // Uložený výsledek pro sdílení (kartička, odkaz)
  let currentResult = null;

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

  // --- Rozstřel ---

  function buildThreatButtons() {
    const wrap = $("#threats");
    THREATS.forEach((t, i) => {
      const btn = document.createElement("button");
      btn.className = "answer-btn threat-btn";
      btn.innerHTML = '<span class="icon" aria-hidden="true">' + t.icon + "</span>" + t.label;
      btn.setAttribute("aria-label", t.label + " (klávesa " + (i + 1) + ")");
      btn.addEventListener("click", () => pickThreat(i));
      wrap.appendChild(btn);
    });
  }

  function renderShootout() {
    $("#shootout-text").textContent = SHOOTOUT_TEXT;
    show("shootout");
  }

  function pickThreat(index) {
    state.threat = index;
    const scores = computeScores(state.answers, QUESTIONS);
    showResult(scores, index, false);
  }

  // --- Výsledek ---

  const CIRCLE_COLORS = ["#1450b4", "#b3271d", "#7b2d8b", "#1f7a45", "#b3711d", "#3a3a8c"];

  function initials(name) {
    const parts = name.split(" ");
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }

  function showResult(scores, threatIndex, shared) {
    const quad = getQuadrant(scores, QUADRANTS);
    const matches = findMatches(scores, FIGURES);
    const badges = getBadges(scores, BADGES);
    const twin = matches[0];

    currentResult = { scores, threatIndex, quad, twin };

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

    // Odznaky + slidery (pozice = (skóre + 10) / 20)
    $("#badge2").textContent = badges[0];
    $("#badge4").textContent = badges[1];

    // Hrozba
    const threat = THREATS[threatIndex];
    $("#threat-icon").textContent = threat.icon;
    $("#threat-text").textContent = "Tvoje hrozba: " + threat.label;

    // Tlačítka podle režimu (vlastní výsledek vs. sdílený odkaz)
    $("#btn-copy").hidden = shared;
    $("#btn-retry").hidden = shared;
    $("#btn-try").hidden = !shared;

    show("result");

    // Animace: bod doletí na mapu, slidery se posunou, procento se napočítá
    const point = $("#map-point");
    point.classList.remove("landed");
    point.style.left = "50%";
    point.style.top = "50%";
    $("#slider2").style.left = "50%";
    $("#slider4").style.left = "50%";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        point.classList.add("landed");
        point.style.left = ((scores[0] + 10) / 20) * 100 + "%";
        point.style.top = ((10 - scores[2]) / 20) * 100 + "%";
        $("#slider2").style.left = ((scores[1] + 10) / 20) * 100 + "%";
        $("#slider4").style.left = ((scores[3] + 10) / 20) * 100 + "%";
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

  // --- Sdílení ---

  function shareURL() {
    const base = location.href.split("?")[0].split("#")[0];
    return base + "?r=" + encodeResult(currentResult.scores, currentResult.threatIndex);
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
    const { scores, threatIndex, quad, twin } = currentResult;
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
    ctx.fillStyle = "#fdeee0"; ctx.fillRect(mx, my, half, half);              // Trump + Bude líp
    ctx.fillStyle = "#e2ecfb"; ctx.fillRect(mx + half, my, half, half);       // Brusel + Bude líp
    ctx.fillStyle = "#f6ddd9"; ctx.fillRect(mx, my + half, half, half);       // Trump + Bylo líp
    ctx.fillStyle = "#e7e2f5"; ctx.fillRect(mx + half, my + half, half, half); // Brusel + Bylo líp
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
    // Popisky kvadrantů v rozích
    ctx.fillStyle = "rgba(28,27,51,0.6)";
    ctx.font = "700 22px " + FONT;
    ctx.textAlign = "left";
    ctx.fillText("NÁRODNÍ BUDITEL 2.0", mx + 16, my + 36);
    ctx.fillText("HOSPODSKÝ PROROK", mx + 16, my + mapSize - 18);
    ctx.textAlign = "right";
    ctx.fillText("BRUSELSKÝ SLUNÍČKÁŘ", mx + mapSize - 16, my + 36);
    ctx.fillText("USTARANÝ DEMOKRAT", mx + mapSize - 16, my + mapSize - 18);
    // Popisky os
    ctx.font = "700 26px " + FONT;
    ctx.textAlign = "center";
    ctx.fillText("BUDE LÍP", mx + half, my - 14);
    ctx.fillText("BYLO LÍP", mx + half, my + mapSize + 34);
    ctx.save();
    ctx.translate(mx - 18, my + half); ctx.rotate(-Math.PI / 2);
    ctx.fillText("TRUMP", 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(mx + mapSize + 30, my + half); ctx.rotate(Math.PI / 2);
    ctx.fillText("BRUSEL", 0, 0);
    ctx.restore();
    // Bod uživatele
    const px = mx + ((scores[0] + 10) / 20) * mapSize;
    const py = my + ((10 - scores[2]) / 20) * mapSize;
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
    ctx.font = "900 68px " + FONT;
    ctx.fillText(quad.name, W / 2, 890);

    // Dvojník a hrozba
    ctx.font = "600 40px " + FONT;
    ctx.fillText("Můj politický dvojník: " + twin.name + " (" + twin.match + " %)", W / 2, 990);
    ctx.fillText("Největší hrozba: " + THREATS[threatIndex].label, W / 2, 1070);

    // Dělicí linka nad URL
    ctx.strokeStyle = "rgba(28,27,51,0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 200, 1180);
    ctx.lineTo(W / 2 + 200, 1180);
    ctx.stroke();

    // URL webu
    ctx.font = "700 30px " + FONT;
    ctx.fillStyle = "#1450b4";
    ctx.fillText("miloscermak.github.io/cesky-kompas-2026", W / 2, H - 60);

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
    state.threat = null;
    currentResult = null;
    // Vyčisti ?r= z adresy, aby refresh nevrátil cizí výsledek
    if (location.search) history.replaceState(null, "", location.pathname);
    show("intro");
  }

  // --- Klávesnice: 1–5 odpovědi, Enter pokračování, ←/Backspace zpět ---

  function onKey(e) {
    const screen = currentScreen();
    if (screen === "intro" && e.key === "Enter") {
      renderQuestion();
      return;
    }
    if (screen === "question" || screen === "shootout") {
      if (e.key >= "1" && e.key <= "5") {
        const wrap = screen === "question" ? "#answers" : "#threats";
        const btns = document.querySelectorAll(wrap + " .answer-btn");
        btns[Number(e.key) - 1].click();
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        screen === "question" ? goBack() : show("question");
      }
    }
  }

  // --- Inicializace ---

  function init() {
    buildAnswerButtons();
    buildThreatButtons();

    $("#btn-start").addEventListener("click", () => renderQuestion());
    $("#btn-back").addEventListener("click", goBack);
    $("#btn-back-shootout").addEventListener("click", () => renderQuestion());
    $("#btn-download").addEventListener("click", downloadCard);
    $("#btn-copy").addEventListener("click", copyLink);
    $("#btn-retry").addEventListener("click", restart);
    $("#btn-try").addEventListener("click", restart);
    document.addEventListener("keydown", onKey);

    // Sdílený odkaz (?r=...) → rovnou výsledek
    const params = new URLSearchParams(location.search);
    const decoded = params.get("r") ? decodeResult(params.get("r")) : null;
    if (decoded) {
      showResult(decoded.scores, decoded.threatIndex, true);
    } else {
      show("intro");
    }
  }

  init();
})();
