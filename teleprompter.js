// Reads the intro sentence once, word by word, the way Underlens follows a voice.
// The sentence is fully visible before this runs and when reduced motion is on.
function initTeleprompter(el) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const text = el.textContent.trim();
  const spoken = document.createElement("span");
  spoken.className = "sr-only";
  spoken.textContent = text;

  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");
  const words = text.split(/\s+/).map((word, i) => {
    const span = document.createElement("span");
    span.className = "w";
    span.textContent = word;
    if (i > 0) visual.append(" ");
    visual.append(span);
    return span;
  });

  el.replaceChildren(spoken, visual);
  el.classList.add("is-reading");

  const perWord = 95;
  let i = 0;
  const step = () => {
    if (i > 0) {
      words[i - 1].classList.remove("cue");
      words[i - 1].classList.add("read");
    }
    if (i < words.length) {
      words[i].classList.add("cue");
      i += 1;
      setTimeout(step, perWord + (/[,.]$/.test(words[i - 1].textContent) ? 140 : 0));
    } else {
      setTimeout(() => el.classList.remove("is-reading"), 500);
    }
  };
  setTimeout(step, 300);
}

// Wait for the web fonts so lines don't reflow mid-read; give up waiting after 1.2 s.
Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() =>
  document.querySelectorAll("[data-teleprompter]").forEach(initTeleprompter)
);
