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
      
      <button id="ytx-vocab" style="width:100%; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:6px; padding:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(16, 185, 129, 0.1); color:#34d399; cursor:pointer; font-size:12px; transition:all 0.2s;">
         <span>⭐</span> Ajouter au vocabulaire
      </button>

      <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:11px; color:#a3a3a3;">Surligner :</span>
          <div style="display:flex; gap:8px;">
            <button class="hl-btn" data-color="#fde047" style="width:24px; height:24px; border-radius:50%; border:2px solid transparent; background:#fde047; cursor:pointer;" title="Jaune"></button>
            <button class="hl-btn" data-color="#86efac" style="width:24px; height:24px; border-radius:50%; border:2px solid transparent; background:#86efac; cursor:pointer;" title="Vert"></button>
            <button class="hl-btn" data-color="#fca5a5" style="width:24px; height:24px; border-radius:50%; border:2px solid transparent; background:#fca5a5; cursor:pointer;" title="Rouge"></button>
          </div>
      </div>
      
      <button id="ytx-close" style="position:absolute; top:12px; right:12px; background:none; border:none; color:#a3a3a3; cursor:pointer; padding:4px;">✖</button>
      
      <div id="ytx-result" style="margin-top:16px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.1); font-size:13px; color:#fff; display:none; line-height:1.5;"></div>
    `;

    document.body.appendChild(menu);

    // Hover effects via JS for inline styles
    const btnTranslate = document.getElementById("ytx-translate");
    if (btnTranslate) {
        btnTranslate.onmouseenter = () => btnTranslate.style.background = "#2563eb";
        btnTranslate.onmouseleave = () => btnTranslate.style.background = "#3b82f6";
    }
    
    const btnSpeak = document.getElementById("ytx-speak");
    if (btnSpeak) {
        btnSpeak.onmouseenter = () => btnSpeak.style.background = "rgba(255,255,255,0.1)";
        btnSpeak.onmouseleave = () => btnSpeak.style.background = "rgba(255,255,255,0.05)";
    }

    const btnVocab = document.getElementById("ytx-vocab");
    if (btnVocab) {
        btnVocab.onmouseenter = () => btnVocab.style.background = "rgba(16, 185, 129, 0.2)";
        btnVocab.onmouseleave = () => btnVocab.style.background = "rgba(16, 185, 129, 0.1)";
    }

    // Highlight Buttons Logic
    menu.querySelectorAll('.hl-btn').forEach(btn => {
        btn.onclick = () => {
             highlightSelection(btn.dataset.color);
             hideMenu();
        };
    });

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
    
    document.getElementById("ytx-vocab").onclick = async () => {
        const original = document.getElementById("ytx-text").textContent.trim();
        await addToVocabulary(original);
    };

    return menu;
  }
  
  // Highlighting Logic
  async function highlightSelection(color) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();
      if (rects.length === 0) return;

      // Find which page we are on
      let container = range.commonAncestorContainer;
      if (container.nodeType === 3) container = container.parentNode;
      
      const pageDiv = container.closest('.page');
      if (!pageDiv) {
          alert("Veuillez sélectionner du texte à l'intérieur d'une page PDF.");
          return;
      }
      
      const pageNum = parseInt(pageDiv.dataset.pageNum);
      const pageRect = pageDiv.getBoundingClientRect();
      
      // Get scale factor stored in CSS var
      const scaleFactor = parseFloat(pageDiv.style.getPropertyValue('--scale-factor')) || 1.0;

      const normalizedRects = [];
      
      for (let i = 0; i < rects.length; i++) {
          const r = rects[i];
          // Calculate relative to page container AND un-scale
          normalizedRects.push({
              x: (r.left - pageRect.left) / scaleFactor,
              y: (r.top - pageRect.top) / scaleFactor,
              w: r.width / scaleFactor,
              h: r.height / scaleFactor
          });
      }

      // Dispatch event for Viewer
      const event = new CustomEvent('annotation-added', { 
          detail: { pageNum, rects: normalizedRects, color } 
      });
      window.dispatchEvent(event);
  }

  function showMenu(x, y, text) {
    const menu = ensureMenu();
    document.getElementById("ytx-text").textContent = text;
    const res = document.getElementById("ytx-result");
    res.style.display = "none";
    res.textContent = "";

    const padding = 16;
    menu.style.display = "block";
    
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

  async function addToVocabulary(original) {
      const resBox = document.getElementById("ytx-result");
      resBox.style.display = "block";
      resBox.innerHTML = '<span style="color:#a3a3a3">Sauvegarde...</span>';
      
      try {
        const tReq = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: original, source: "de", target: "fr" })
        });
        const tData = await tReq.json();
        const translation = tData.translatedText || "???";
        
        const vReq = await fetch("/api/vocab", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ original: original, translation: translation })
        });
        
        if (vReq.ok) {
            resBox.innerHTML = `<span style="color:#34d399">✅ Enregistré: ${translation}</span>`;
            setTimeout(() => { }, 2000);
        } else {
            resBox.textContent = "Erreur sauvegarde.";
        }
      } catch (e) {
         resBox.textContent = "Erreur réseau.";
      }
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
    if (!selected) return;
    e.preventDefault(); // Stop Browser Menu
    showMenu(e.clientX, e.clientY, selected);
  });

  // Some browsers load voices async
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }
})();
