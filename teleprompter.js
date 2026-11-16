// The intro script reads itself once, word by word, like the Underlens overlay following a voice.
// Without this script, or with reduced motion on, the script is simply shown in full.
function initTeleprompter(root) {
  const lines = [...root.querySelectorAll(".script p")];
  const statusEl = root.querySelector("[data-status]");
  const clockEl = root.querySelector("[data-clock]");
  const progressEl = root.querySelector(".progress");
  const bar = root.querySelector(".prompter-bar");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Each line keeps a hidden plain copy for screen readers; the per-word spans are visual only.
  const words = [];
  lines.forEach((p) => {
    const text = p.textContent.trim();
    const spoken = document.createElement("span");
    spoken.className = "sr-only";
    spoken.textContent = text;
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    text.split(/\s+/).forEach((word, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = word;
      if (i > 0) visual.append(" ");
      visual.append(span);
      words.push({ span, line: p });
    });
    p.replaceChildren(spoken, visual);
  });

  const again = document.createElement("button");
  again.type = "button";
  again.className = "again";
  again.textContent = "Read again";
  again.hidden = true;
  bar.insertBefore(again, clockEl);

  const fmt = (ms) => `0:${String(Math.floor(ms / 1000)).padStart(2, "0")}`;
  let timer = 0;

  function finish(elapsed) {
    root.classList.remove("is-live");
    lines.forEach((p) => p.classList.remove("past", "now"));
    words.forEach((w) => w.span.classList.remove("read"));
    statusEl.textContent = "Take finished";
    clockEl.textContent = fmt(elapsed);
    progressEl.style.setProperty("--p", 1);
    again.hidden = false;
  }

  function play() {
    clearTimeout(timer);
    again.hidden = true;
    words.forEach((w) => w.span.classList.remove("read"));
    lines.forEach((p) => p.classList.remove("past", "now"));
    root.classList.add("is-live");
    statusEl.textContent = "Reading";
    progressEl.style.setProperty("--p", 0);
    const start = performance.now();
    let i = 0;

    const step = () => {
      if (i >= words.length) {
        timer = setTimeout(() => finish(performance.now() - start), 600);
        return;
      }
      const { span, line } = words[i];
      if (!line.classList.contains("now")) {
        lines.forEach((p) => {
          if (p.classList.contains("now")) p.classList.replace("now", "past");
        });
        line.classList.add("now");
      }
      span.classList.add("read");
      i += 1;
      progressEl.style.setProperty("--p", i / words.length);
      clockEl.textContent = fmt(performance.now() - start);
      const pause = /[.,]$/.test(span.textContent) ? 190 : 0;
      timer = setTimeout(step, 115 + pause);
    };
    timer = setTimeout(step, 500);
  }

  again.addEventListener("click", play);

  if (reduced) {
    statusEl.textContent = "Script";
    clockEl.hidden = true;
    progressEl.hidden = true;
    return;
  }
  play();
}

// Wait for the web fonts so lines don't reflow mid-read; stop waiting after 1.2 s.
Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() =>
  document.querySelectorAll("[data-teleprompter]").forEach(initTeleprompter)
);
