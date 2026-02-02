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
    menu.style.position = "fixed";
    menu.style.zIndex = "999999";
    menu.style.minWidth = "220px";
    menu.style.background = "#0f1117";
    menu.style.border = "1px solid #2a3445";
    menu.style.borderRadius = "12px";
    menu.style.padding = "10px";
    menu.style.display = "none";
    menu.style.boxShadow = "0 10px 30px rgba(0,0,0,0.45)";
    menu.style.color = "#e6e6e6";
    menu.style.fontFamily = "system-ui, Arial, sans-serif";

    menu.innerHTML = `
      <div style="font-size:12px;color:#a8b3cf;margin-bottom:8px">Texte sélectionné</div>
      <div id="ytx-text" style="font-size:13px;line-height:1.35;max-height:90px;overflow:auto;margin-bottom:10px"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="ytx-speak" style="padding:8px 10px;border-radius:10px;border:1px solid #2a3445;background:#161a22;color:#e6e6e6;cursor:pointer">🔊 Lire (DE)</button>
        <button id="ytx-translate" style="padding:8px 10px;border-radius:10px;border:1px solid #2a3445;background:#161a22;color:#e6e6e6;cursor:pointer">🌍 Traduire (FR)</button>
        <button id="ytx-close" style="margin-left:auto;padding:8px 10px;border-radius:10px;border:1px solid #2a3445;background:#161a22;color:#e6e6e6;cursor:pointer">✖</button>
      </div>
      <div id="ytx-result" style="margin-top:10px;font-size:13px;color:#c7d2f0;display:none"></div>
    `;

    document.body.appendChild(menu);

    // close handlers
    document.getElementById("ytx-close").onclick = hideMenu;
    document.addEventListener("click", (e) => {
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
    const padding = 12;
    menu.style.display = "block";
    menu.style.left = Math.min(x + padding, window.innerWidth - 260) + "px";
    menu.style.top = Math.min(y + padding, window.innerHeight - 200) + "px";
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
    resBox.textContent = "Traduction en cours...";

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
