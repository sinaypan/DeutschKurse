(function () {
  let lastSelection = "";

  function getSelectedText() {
    const sel = window.getSelection ? window.getSelection().toString() : "";
    return (sel || "").trim();
  }

  function ensureMenu() {
    let menu = document.getElementById("ytx-menu");
    if (menu) return menu;

    menu = document.createElement("div");
    menu.id = "ytx-menu";
    
    // Style injected via JS, but ideally should be in CSS class "context-menu"
    // mixing inline for safety with logic
    Object.assign(menu.style, {
      position: "fixed",
      zIndex: "999999",
      minWidth: "260px",
      background: "rgba(10, 10, 10, 0.95)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "12px",
      padding: "16px",
      display: "none",
      boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
      color: "#fff",
      fontFamily: "'Inter', sans-serif",
      fontSize: "14px"
    });

    menu.innerHTML = `
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#60a5fa; margin-bottom:8px; font-weight:600">Texte sélectionné</div>
      <div id="ytx-text" style="font-size:13px; line-height:1.5; color:#e5e5e5; max-height:100px; overflow-y:auto; margin-bottom:16px; padding:8px; background:rgba(255,255,255,0.05); border-radius:6px;"></div>
      
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        <button id="ytx-speak" style="display:flex; align-items:center; justify-content:center; gap:6px; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#fff; cursor:pointer; font-size:13px; transition:all 0.2s;">
          <span>🔊</span> Lire
        </button>
        <button id="ytx-translate" style="display:flex; align-items:center; justify-content:center; gap:6px; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:#3b82f6; color:#fff; cursor:pointer; font-size:13px; font-weight:500; transition:all 0.2s;">
          <span>🌍</span> Traduire
        </button>
      </div>
      
      <button id="ytx-close" style="position:absolute; top:12px; right:12px; background:none; border:none; color:#a3a3a3; cursor:pointer; padding:4px;">✖</button>
      
      <div id="ytx-result" style="margin-top:16px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.1); font-size:13px; color:#fff; display:none; line-height:1.5;"></div>
    `;

    document.body.appendChild(menu);

    // Hover effects via JS for inline styles (optional but nice)
    const btnTranslate = document.getElementById("ytx-translate");
    btnTranslate.onmouseenter = () => btnTranslate.style.background = "#2563eb";
    btnTranslate.onmouseleave = () => btnTranslate.style.background = "#3b82f6";
    
    const btnSpeak = document.getElementById("ytx-speak");
    btnSpeak.onmouseenter = () => btnSpeak.style.background = "rgba(255,255,255,0.1)";
    btnSpeak.onmouseleave = () => btnSpeak.style.background = "rgba(255,255,255,0.05)";

    // close handlers
    document.getElementById("ytx-close").onclick = hideMenu;
    document.addEventListener("mousedown", (e) => {
      const m = document.getElementById("ytx-menu");
      if (!m) return;
      if (m.style.display === "none") return;
      if (!m.contains(e.target)) hideMenu();
    });

    // actions
    document.getElementById("ytx-speak").onclick = () => {
      const text = document.getElementById("ytx-text").textContent.trim();
      speakGerman(text);
    };

    document.getElementById("ytx-translate").onclick = async () => {
      const text = document.getElementById("ytx-text").textContent.trim();
      await translate(text);
    };

    return menu;
  }

  function showMenu(x, y, text) {
    const menu = ensureMenu();
    document.getElementById("ytx-text").textContent = text;
    const res = document.getElementById("ytx-result");
    res.style.display = "none";
    res.textContent = "";

    // position
    const padding = 16;
    menu.style.display = "block";
    
    // Smart positioning to avoid overflow
    let left = x + padding;
    let top = y + padding;
    
    if (left + 280 > window.innerWidth) {
      left = x - 280 - padding;
    }
    
    if (top + 300 > window.innerHeight) {
      top = y - 300 - padding;
    }
    
    menu.style.left = Math.max(10, left) + "px";
    menu.style.top = Math.max(10, top) + "px";
  }

  function hideMenu() {
    const menu = document.getElementById("ytx-menu");
    if (menu) menu.style.display = "none";
  }

  function pickGermanVoice() {
    const voices = window.speechSynthesis.getVoices() || [];
    // Priorité aux voix allemandes
    return (
      voices.find(v => (v.lang || "").toLowerCase().startsWith("de-de")) ||
      voices.find(v => (v.lang || "").toLowerCase().startsWith("de")) ||
      null
    );
  }

  function speakGerman(text) {
    if (!text) return;

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";

    const voice = pickGermanVoice();
    if (voice) u.voice = voice;

    window.speechSynthesis.speak(u);
  }

  async function translate(text) {
    if (!text) return;

    const resBox = document.getElementById("ytx-result");
    resBox.style.display = "block";
    resBox.innerHTML = '<span style="color:#a3a3a3">Traduction en cours...</span>';

    try {
      const r = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, source: "de", target: "fr" })
      });
      const data = await r.json();
      resBox.textContent = data.translatedText || JSON.stringify(data);
    } catch (e) {
      resBox.textContent = "Erreur traduction (serveur).";
    }
  }

  // Track selection
  document.addEventListener("selectionchange", () => {
    const s = getSelectedText();
    if (s) lastSelection = s;
  });

  // Custom context menu
  document.addEventListener("contextmenu", (e) => {
    const selected = getSelectedText() || lastSelection;
    if (!selected) return; // laisse le menu normal si rien sélectionné
    e.preventDefault();
    showMenu(e.clientX, e.clientY, selected);
  });

  // Some browsers load voices async
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }
})();
