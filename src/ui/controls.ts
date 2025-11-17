import { parseMoves, formatMoves, type Face, type MoveToken } from "./moveParser";

type Handlers = {
  onParse?: (tokens: MoveToken[], text: string) => void;
};

const FACES: Face[] = ["U", "D", "L", "R", "F", "B"];
const PRIME_CHAR = "′";

export function mountMoveUI(handlers: Handlers = {}): {
  getText: () => string;
  setText: (s: string) => void;
  destroy: () => void;
} {
  const host = document.getElementById("app") || document.body;

  const root = document.createElement("div");
  root.setAttribute("data-tour", "moves");
  root.className = "panel moves";
  Object.assign(root.style, {
    background: "rgba(10,12,16,0.88)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    padding: "10px",
    color: "#e6edf3",
    font: "12px/1.3 ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    backdropFilter: "blur(6px)",
    boxShadow: "0 4px 30px rgba(0,0,0,0.45)"
  } as CSSStyleDeclaration);

  root.classList.add("moves-dock");

  root.innerHTML = `
    <div class="row title" style="font-weight:600;opacity:0.9;margin-bottom:6px;">Moves</div>
    <div class="row faces" style="display:flex;gap:6px;margin-bottom:6px;">
      ${FACES.map((f) => `<button class="btn face" data-face="${f}">${f}</button>`).join("")}
    </div>
    <div class="row suffix" style="display:flex;gap:6px;margin-bottom:6px;">
      <button class="btn suffix" data-sfx="prime">${PRIME_CHAR}</button>
      <button class="btn suffix" data-sfx="2">2</button>
      <button class="btn util" data-act="back" title="Backspace" style="margin-left:auto;">⌫</button>
      <button class="btn util" data-act="clear" title="Clear">Clear</button>
    </div>
    <div class="row input" style="display:flex;gap:6px;margin-bottom:6px;">
      <input id="moveInput" class="input" data-role="moves-input" placeholder="Type: F R U L D′ F B′ R U" spellcheck="false"
        style="flex:1;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:rgba(20,22,27,0.8);color:#e6edf3;padding:6px 8px;outline:none;" />
      <button id="parseBtn" class="btn parse" data-role="parse-btn" style="font-weight:700;">Parse</button>
    </div>
    <div class="row status" id="parseStatus" style="min-height:16px;opacity:0.9;"></div>
  `;

  root.querySelectorAll<HTMLButtonElement>(".btn").forEach((btn) => {
    Object.assign(btn.style, {
      border: "1px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.06)",
      color: "#e6edf3",
      borderRadius: "6px",
      padding: "6px 8px",
      cursor: "pointer",
      userSelect: "none",
      transition: "background 0.1s ease, transform 0.1s ease"
    });
    btn.addEventListener("mouseenter", () => {
      btn.style.background = "rgba(255,255,255,0.12)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "rgba(255,255,255,0.06)";
    });
    btn.addEventListener("mousedown", () => {
      btn.style.transform = "translateY(1px)";
    });
    btn.addEventListener("mouseup", () => {
      btn.style.transform = "";
    });
  });

  host.appendChild(root);

  const input = root.querySelector<HTMLInputElement>("#moveInput")!;
  const status = root.querySelector<HTMLDivElement>("#parseStatus")!;
  const parseBtn = root.querySelector<HTMLButtonElement>("#parseBtn")!;

  let committed = "";
  let pending = "";

  function updateInput() {
    input.value = committed + pending;
  }

  function finalizePending() {
    if (pending.length) {
      if (!/\s$/.test(committed)) committed += " ";
      committed += pending + " ";
      pending = "";
    }
    updateInput();
  }

  function appendFace(face: Face) {
    finalizePending();
    pending = face;
    updateInput();
  }

  function appendPrime() {
    if (!pending) return;
    if (!pending.includes("'") && !pending.includes(PRIME_CHAR)) {
      pending += PRIME_CHAR;
      updateInput();
    }
  }

  function append2() {
    if (!pending) return;
    if (!pending.includes("2")) {
      pending += "2";
      updateInput();
    }
  }

  function backspace() {
    if (pending.length) {
      pending = pending.slice(0, -1);
      updateInput();
      return;
    }
    committed = committed.replace(/\s+$/, "");
    committed = committed.slice(0, -1);
    committed = committed.replace(/\s+$/, "") + (committed ? " " : "");
    updateInput();
  }

  function clearAll() {
    committed = "";
    pending = "";
    updateInput();
    status.textContent = "";
  }

  function parseNow() {
    finalizePending();
    const text = (committed + pending).trim();
    if (!text) {
      status.textContent = "No moves.";
      return;
    }
    try {
      const tokens = parseMoves(text);
      status.textContent = `Parsed: ${formatMoves(tokens)}`;
      handlers.onParse?.(tokens, text);
    } catch (err: any) {
      status.textContent = err?.message || "Parse error.";
    }
  }

  root.querySelectorAll<HTMLButtonElement>(".btn.face").forEach((btn) => {
    btn.addEventListener("click", () => appendFace(btn.dataset.face as Face));
  });
  root.querySelectorAll<HTMLButtonElement>(".btn.suffix").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sfx = btn.dataset.sfx;
      if (sfx === "prime") appendPrime();
      else if (sfx === "2") append2();
    });
  });
  root.querySelectorAll<HTMLButtonElement>(".btn.util").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      if (act === "back") backspace();
      else if (act === "clear") clearAll();
    });
  });
  parseBtn.addEventListener("click", parseNow);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      parseNow();
    }
  });

  function onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    const isTyping =
      target &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
    if (isTyping && target !== input) return;

    const k = e.key;
    if (/^[udlrfb]$/i.test(k)) {
      appendFace(k.toUpperCase() as Face);
      return;
    }
    if (k === "'" || k === "′") {
      appendPrime();
      return;
    }
    if (k === "2") {
      append2();
      return;
    }
    if (k === "Backspace") {
      e.preventDefault();
      backspace();
      return;
    }
    if (k === " " || k === "Enter") {
      e.preventDefault();
      parseNow();
      return;
    }
  }

  window.addEventListener("keydown", onKey);
  updateInput();

  return {
    getText: () => (committed + pending).trim(),
    setText: (s: string) => {
      committed = s.trim() ? s.trim() + " " : "";
      pending = "";
      updateInput();
    },
    destroy: () => {
      window.removeEventListener("keydown", onKey);
      root.remove();
    }
  };
}
