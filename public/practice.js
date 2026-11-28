// SAMADHI LOVE practices: breath guides, trataka, contemplation timer, glossary search and gentle sound.
// Sound is made live with Web Audio. Nothing plays until the visitor presses a button.
(() => {
  "use strict";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // ---------- Sound ----------
  let ctx = null, master = null, bed = null, volume = 0.4, chimesOn = false;
  function audio() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try {
        ctx = new C();
        master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
      } catch (e) { ctx = null; master = null; return null; } // sound not allowed: the practice still works silently
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  const level = () => 0.35 * volume;
  function fadeMaster(to, secs) {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(to, t + secs);
  }
  function stopBed() {
    if (!bed) return;
    const old = bed; bed = null;
    clearTimeout(old.timer);
    fadeMaster(0, 1.2);
    setTimeout(() => old.nodes.forEach((n) => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { /* already stopped */ } }), 1400);
  }
  function drone(base) {
    const nodes = [], out = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1400; out.gain.value = 0.9;
    out.connect(lp); lp.connect(master);
    [[base / 2, 0.5, 0], [base / 2, 0.35, 1.2], [base, 0.22, -0.8], [base * 1.5, 0.09, 0.6], [base * 2, 0.05, 0]].forEach(([fq, g, det]) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = "sine"; o.frequency.value = fq; o.detune.value = det; og.gain.value = g;
      o.connect(og); og.connect(out); o.start(); nodes.push(o);
    });
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = 0.18; lfo.connect(lg); lg.connect(out.gain); lfo.start(); nodes.push(lfo);
    return { nodes };
  }
  function strike(fund, gainScale = 1, dest = master) {
    const t = ctx.currentTime;
    [[1, 0.5, 9], [2.71, 0.22, 6], [5.15, 0.1, 3.5], [8.4, 0.04, 2]].forEach(([ratio, g, decay]) => {
      [0, 1.6].forEach((det) => {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.type = "sine"; o.frequency.value = fund * ratio; o.detune.value = det;
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(g * 0.5 * gainScale, t + 0.02);
        og.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        o.connect(og); og.connect(dest); o.start(t); o.stop(t + decay + 0.1);
      });
    });
  }
  function bowl() {
    const b = { nodes: [], timer: 0 };
    const ring = () => { if (bed !== b) return; strike(196 + Math.random() * 6); b.timer = setTimeout(ring, 9000 + Math.random() * 5000); };
    setTimeout(ring, 300);
    return b;
  }
  function rain() {
    const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; d[i] = last * 3.2 + w * 0.04; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    hp.type = "highpass"; hp.frequency.value = 250; lp.type = "lowpass"; lp.frequency.value = 2600; g.gain.value = 0.9;
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master); src.start();
    return { nodes: [src] };
  }
  function playBed(kind) {
    if (!audio()) return;
    const had = !!bed;
    stopBed();
    if (kind === "off") return;
    setTimeout(() => {
      bed = kind === "bowl" ? bowl() : kind === "rain" ? rain() : drone(kind === "drone528" ? 528 : 432);
      fadeMaster(level(), 2.5);
    }, had ? 1300 : 0);
  }
  function bell() {
    if (!audio()) return;
    const g = ctx.createGain(); g.gain.value = Math.max(0.25, volume) * 0.6; g.connect(ctx.destination);
    strike(392, 0.8, g);
  }
  function chime(high) {
    if (!chimesOn || !audio()) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = high ? 660 : 495;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 * Math.max(0.3, volume), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 1.7);
  }

  $$("[data-px-sound]").forEach((bar) => {
    const state = $("[data-px-sound-state]", bar);
    $$("[data-sound]", bar).forEach((btn) => btn.addEventListener("click", () => {
      $$("[data-sound]", bar).forEach((b) => { b.classList.toggle("is-on", b === btn); b.setAttribute("aria-pressed", String(b === btn)); });
      playBed(btn.dataset.sound);
      if (state) state.textContent = btn.dataset.sound === "off" ? "off" : btn.textContent.toLowerCase();
    }));
    const vol = $("[data-px-volume]", bar);
    if (vol) vol.addEventListener("input", () => { volume = vol.value / 100; if (ctx && bed) fadeMaster(level(), 0.3); });
    const ch = $("[data-px-chimes]", bar);
    if (ch) { chimesOn = ch.checked; ch.addEventListener("change", () => { chimesOn = ch.checked; if (ch.checked) { audio(); chime(true); } }); }
  });

  // ---------- Breath pacers ----------
  let activeStop = null;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  $$("[data-px-pacer]").forEach((el) => {
    const kind = el.dataset.pxPacer, orb = $("[data-px-orb]", el), phase = $("[data-px-phase]", el), count = $("[data-px-count]", el);
    const startBtn = $("[data-px-start]", el), stopBtn = $("[data-px-stop]", el), mins = $("[data-px-minutes]", el);
    const left = $("[data-px-left]", el), right = $("[data-px-right]", el);
    const steps = kind === "kapal" ? null : JSON.parse(el.dataset.steps || "[]");
    let timers = [], tick = 0, running = false;
    const scale = (s, secs) => { orb.style.transition = `transform ${secs}s ${secs < 0.5 ? "ease-out" : "ease-in-out"}`; orb.style.transform = `scale(${s})`; };
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    function reset(msg) {
      timers.forEach(clearTimeout); timers = []; clearInterval(tick); running = false;
      scale(0.45, 1.2); phase.textContent = msg || "Ready when you are"; count.textContent = "";
      startBtn.hidden = false; stopBtn.hidden = true; if (left) left.classList.remove("on"); if (right) right.classList.remove("on");
      if (activeStop === reset) activeStop = null;
    }
    function countdown(secs) {
      clearInterval(tick); let n = secs; count.textContent = n;
      tick = setInterval(() => { n -= 1; count.textContent = n > 0 ? n : ""; if (n <= 0) clearInterval(tick); }, 1000);
    }
    function runSteps(endAt, i = 0) {
      if (!running) return;
      if (Date.now() >= endAt && i % steps.length === 0) { reset("Well done. Rest for a moment and notice how you feel."); chime(false); return; }
      const [type, secs, text, side] = steps[i % steps.length];
      phase.textContent = text;
      if (type === "in") scale(1, secs); else if (type === "out") scale(0.45, secs);
      if (left) left.classList.toggle("on", side === "left");
      if (right) right.classList.toggle("on", side === "right");
      chime(type === "in");
      countdown(secs);
      later(() => runSteps(endAt, i + 1), secs * 1000);
    }
    function runKapal(round = 1) {
      if (!running) return;
      if (round > 3) { reset("Well done. Sit quietly and feel the energy and the stillness."); chime(false); return; }
      phase.textContent = `Round ${round} of 3 · quick out-breaths from the belly`;
      let n = 0;
      const pulse = () => {
        if (!running) return;
        n += 1; count.textContent = n; scale(0.55, 0.15); later(() => scale(0.8, 0.6), 220);
        if (n < 30) later(pulse, 1000);
        else later(() => { phase.textContent = "Rest. Breathe quietly and naturally"; chime(false); scale(0.9, 4); countdown(30); later(() => runKapal(round + 1), 30000); }, 1000);
      };
      scale(0.8, 1); later(pulse, 1500);
    }
    startBtn.addEventListener("click", () => {
      if (activeStop) activeStop();
      running = true; activeStop = reset; startBtn.hidden = true; stopBtn.hidden = false; audio();
      if (steps) { phase.textContent = "Settle in…"; scale(0.45, 1); later(() => runSteps(Date.now() + Number(mins ? mins.value : 3) * 60000), 1500); }
      else runKapal();
    });
    stopBtn.addEventListener("click", () => reset());
    scale(0.45, 0);
  });

  // ---------- Trataka ----------
  $$("[data-px-trataka]").forEach((el) => {
    const screen = $("[data-tk-screen]", el), art = $("[data-tk-art]", el), time = $("[data-tk-time]", el), hint = $("[data-tk-hint]", el);
    let timer = 0;
    function close() {
      clearInterval(timer); screen.hidden = true; document.body.classList.remove("tk-open");
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
    $("[data-tk-start]", el).addEventListener("click", () => {
      const chosen = $("input[name=tk-shape]:checked", el), thumb = chosen && chosen.closest(".tk-opt").querySelector(".tk-thumb");
      art.innerHTML = thumb ? thumb.innerHTML : "";
      const bellOn = $("[data-tk-bell]", el).checked;
      if (bellOn) audio();
      let left = Number($("[data-tk-minutes]", el).value) * 60;
      hint.textContent = "Rest your gaze softly on the centre. Blink when you need to.";
      time.textContent = fmt(left);
      screen.hidden = false; document.body.classList.add("tk-open");
      if (screen.requestFullscreen) screen.requestFullscreen().catch(() => {});
      clearInterval(timer);
      timer = setInterval(() => {
        left -= 1; time.textContent = left > 0 ? fmt(left) : "";
        if (left <= 0) {
          clearInterval(timer);
          hint.textContent = "Close your eyes. Watch the light between your eyebrows until it fades.";
          art.classList.add("tk-fade");
          if (bellOn) bell();
          setTimeout(() => art.classList.remove("tk-fade"), 8000);
        }
      }, 1000);
    });
    $("[data-tk-end]", el).addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !screen.hidden) close(); });
    document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && !screen.hidden) close(); });
  });

  // ---------- Questions to sit with ----------
  $$("[data-px-today]").forEach((box) => {
    const items = $$(".px-prompts li");
    if (!items.length) return;
    const q = $("[data-px-today-q]", box), src = $("[data-px-today-src]", box), out = $("[data-px-sit-time]", box);
    const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    let idx = day % items.length;
    const show = () => { q.textContent = items[idx].dataset.q; src.textContent = items[idx].dataset.src; };
    show();
    $("[data-px-next]", box).addEventListener("click", () => { idx = (idx + 1) % items.length; show(); });
    let timer = 0;
    $("[data-px-sit]", box).addEventListener("click", () => {
      audio(); clearInterval(timer); let left = 120; out.textContent = fmt(left);
      timer = setInterval(() => { left -= 1; out.textContent = left > 0 ? fmt(left) : "Gently open your eyes. What did the question show you?"; if (left <= 0) { clearInterval(timer); bell(); } }, 1000);
    });
  });

  // ---------- Glossary ----------
  $$("[data-px-glossary]").forEach((gl) => {
    const input = $("[data-gl-input]", gl), none = $("[data-gl-none]", gl), items = $$(".gl-item", gl);
    let lang = "all";
    const apply = () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      items.forEach((it) => { const ok = (!q || it.dataset.glText.includes(q)) && (lang === "all" || it.dataset.glGroup === lang); it.hidden = !ok; if (ok) shown += 1; });
      none.hidden = shown > 0;
    };
    input.addEventListener("input", apply);
    $$("[data-gl-lang]", gl).forEach((b) => b.addEventListener("click", () => {
      lang = b.dataset.glLang;
      $$("[data-gl-lang]", gl).forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
      apply();
    }));
  });

  // ---------- Numerology (reflection only; nothing is stored or sent) ----------
  $$("[data-px-num]").forEach((box) => {
    const reduce = (n) => { const steps = [n]; while (n > 9 && n !== 11 && n !== 22 && n !== 33) { n = String(n).split("").reduce((a, d) => a + Number(d), 0); steps.push(n); } return { n, steps }; };
    const showMean = (n, where) => {
      const src = $(`.nc-mean[data-n="${n}"]`, box);
      if (where) { where.innerHTML = ""; if (src) { const c = src.cloneNode(true); c.hidden = false; where.appendChild(c); } return; }
      $$(".nc-mean", box).forEach((m) => { m.hidden = m.dataset.n !== String(n); });
    };
    const dateIn = $("[data-nc-date]", box), dateOut = $("[data-nc-steps]", box);
    $("[data-nc-go]", box).addEventListener("click", () => {
      const digits = (dateIn.value || "").replace(/\D/g, "");
      if (digits.length !== 8) { dateOut.textContent = "Please choose a full date of birth."; showMean(0); return; }
      const sum = digits.split("").reduce((a, d) => a + Number(d), 0);
      const r = reduce(sum);
      dateOut.textContent = `${digits.split("").join(" + ")} = ${r.steps.join(" → ")}. Your life path number is ${r.n}.`;
      showMean(r.n);
    });
    const nameIn = $("[data-nc-name]", box), nameOut = $("[data-nc-name-steps]", box), nameMean = $("[data-nc-name-out]", box);
    $("[data-nc-name-go]", box).addEventListener("click", () => {
      const letters = (nameIn.value || "").toUpperCase().normalize("NFD").replace(/[^A-Z]/g, "");
      if (!letters) { nameOut.textContent = "Please type a name using the letters A to Z."; nameMean.innerHTML = ""; return; }
      const vals = letters.split("").map((ch) => ((ch.charCodeAt(0) - 65) % 9) + 1);
      const r = reduce(vals.reduce((a, v) => a + v, 0));
      nameOut.textContent = `${vals.join(" + ")} = ${r.steps.join(" → ")}. The name number is ${r.n}.`;
      showMean(r.n, nameMean);
    });
  });
})();
