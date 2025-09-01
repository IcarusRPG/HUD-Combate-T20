/* ============================================================
 * HUD Combate T20 — main.js (completo)
 * - Favoritos (HUD)
 * - Busca/ordem/filtros em Poderes & Magias
 * - Perícias usando "value"
 * - Consumíveis 1-clique (sem duplo consumo)
 * - Hotkeys (A/P/M/R/I/H/?), botão de Ajuda "?" e Fechar "✕"
 * - HUD arrastável e recolhível, com posição/estado persistentes
 * ============================================================ */

Hooks.once("init", () => {
  game.settings.register("hud-combate-t20", "exibirBarra", {
    name: "Ativar HUD de Combate T20",
    hint: "Exibe ou oculta a barra de ações rápidas flutuante na tela.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  // Posição e estados (cliente)
  game.settings.register("hud-combate-t20", "posicaoHUD", {
    name: "Posição da HUD",
    scope: "client",
    config: false,
    type: Object,
    default: { left: null, bottom: 10 }
  });

  game.settings.register("hud-combate-t20", "hudColapsada", {
    name: "HUD recolhida",
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });

  // HUD fechada (mostra apenas o botão "HUD" para reabrir)
  game.settings.register("hud-combate-t20", "hudFechada", {
    name: "HUD fechada",
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });

  // Favoritos por ator (cliente)
  game.settings.register("hud-combate-t20", "favoritos", {
    name: "Favoritos por Ator",
    scope: "client",
    config: false,
    type: Object,
    default: {} // { [actorId]: [ {type:'poder'|'magia', id, name, img} ] }
  });
});

  game.settings.register("hud-combate-t20", "mostrarBoasVindas", {
    name: "Mostrar mensagem de boas-vindas",
    scope: "client",
    config: false,
    type: Boolean,
    default: true
  });
});

// (Opcional) ajuste o caminho das imagens do seu módulo aqui:
const ICARUS_IMG_BASE = "modules/hud-combate-t20/img";
const ICARUS_LOGO = `${ICARUS_IMG_BASE}/logo.png`;
const ICARUS_EM_BREVE = `${ICARUS_IMG_BASE}/embreve.png`;

// Cria e exibe o diálogo de boas-vindas
function showIcarusWelcomeDialog() {
  const content = `
  <style>
    .icarus-welcome { font-family: Segoe UI, sans-serif; color: #fff; }
    .icarus-card {
      background:#1e1e1e; border:1px solid #555; border-radius:12px; padding:14px;
      box-shadow: 0 0 10px #000a;
    }
    .icarus-title { display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; }
    .icarus-title img { max-width: 70%; height:auto; }
    .icarus-sub { opacity:.9; font-size:.95rem; }
    .icarus-grid { display:grid; grid-template-columns: 1fr; gap:12px; margin-top:10px; }
    .icarus-box { background:#151515; border:1px solid #444; border-radius:10px; padding:10px; }
    .icarus-box h3 { margin:0 0 6px 0; font-size:1rem; color:#8be9fd; }
    .icarus-list { margin:0; padding-left:18px; line-height:1.45; }
    .icarus-center { text-align:center; }
    .icarus-link a { color:#7ee787; text-decoration:none; word-break:break-all; }
    .icarus-link a:hover { text-decoration:underline; }
    .icarus-cta { margin-top:6px; opacity:.95; }
    .icarus-img-embreve { max-width: 80%; height:auto; border-radius:10px; border:1px solid #444; }
    .icarus-bottom { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:10px; }
    .icarus-checkbox { display:flex; align-items:center; gap:6px; }
  </style>

  <div class="icarus-welcome">
    <div class="icarus-card">
      <div class="icarus-title">
        <img src="${ICARUS_LOGO}" alt="Icarus — Logo">
        <div class="icarus-sub">Bem-vindo ao <b>HUD de Combate T20</b> — módulo oficial do projeto <b>Icarus</b>.</div>
      </div>

      <div class="icarus-grid">
        <div class="icarus-box">
          <h3>O que é Icarus?</h3>
          <ul class="icarus-list">
            <li><b>RPG:</b> um cenário original com classes, aventuras, divindades e uma campanha própria — tudo sendo lançado no <i>Livro do Jogador</i>.</li>
            <li><b>Música:</b> banda de Power/Prog Metal cujas letras e artes nascem das histórias do mundo de Icarus.</li>
          </ul>
          <div class="icarus-center icarus-cta">
            <img class="icarus-img-embreve" src="${ICARUS_EM_BREVE}" alt="Icarus — Livro do Jogador (em breve)">
          </div>
        </div>

        <div class="icarus-box">
          <h3>O que este módulo faz?</h3>
          <ul class="icarus-list">
            <li><b>HUD flutuante</b> do ator selecionado com avatar, PV/PM/DEF, arrastável e com posição/estado salvos.</li>
            <li><b>Botões rápidos:</b> Ataque, Perícias, Poderes, Magias e Consumíveis (uso 1-clique, sem consumo duplo).</li>
            <li><b>Favoritos</b> (★) para poderes/magias direto na HUD.</li>
            <li><b>Busca, filtros e ordenação</b> em Poderes/Magias/Perícias.</li>
            <li><b>Atalhos</b> de teclado: A/P/M/R/I e <b>H</b> (Ajuda).</li>
            <li><b>Recolher/Expandir</b> e <b>Fechar</b> com botão flutuante para reabrir.</li>
          </ul>
        </div>

        <div class="icarus-box icarus-center">
          <h3>Ajude e siga o Icarus</h3>
          <div class="icarus-link">
            🔗 <a href="https://linktr.ee/icarusrpg" target="_blank" rel="noopener">linktr.ee/icarusrpg</a>
          </div>
          <div class="icarus-cta">Siga nas redes, compartilhe e apoie para que mais conteúdos (livros, músicas e módulos) continuem chegando!</div>
        </div>
      </div>

      <div class="icarus-bottom">
        <label class="icarus-checkbox">
          <input type="checkbox" id="icarusDontShowAgain"> Não mostrar novamente
        </label>
      </div>
    </div>
  </div>
  `;

  new Dialog({
    title: "🌟 Projeto Icarus — Boas-vindas",
    content,
    buttons: {
      ok: {
        label: "Vamos jogar!",
        callback: async (html) => {
          const dontShow = html.find("#icarusDontShowAgain")[0]?.checked;
          if (dontShow) {
            await game.settings.set("hud-combate-t20", "mostrarBoasVindas", false);
          }
        }
      }
    },
    default: "ok"
  }).render(true);
}

Hooks.once("ready", () => {
  if (game.settings.get("hud-combate-t20", "mostrarBoasVindas")) {
    showIcarusWelcomeDialog();
  }
});	

/* ---------------- Helpers favoritos/posição ---------------- */
function getFavsFor(actorId) {
  const all = game.settings.get("hud-combate-t20", "favoritos") || {};
  return Array.isArray(all[actorId]) ? all[actorId] : [];
}
function setFavsFor(actorId, list) {
  const all = foundry.utils.duplicate(game.settings.get("hud-combate-t20", "favoritos") || {});
  all[actorId] = list;
  game.settings.set("hud-combate-t20", "favoritos", all);
}
function toggleFav(actor, type, item) {
  const list = getFavsFor(actor.id);
  const idx = list.findIndex(f => f.type === type && f.id === item.id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push({ type, id: item.id, name: item.name, img: item.img });
  setFavsFor(actor.id, list);
}
function getHUDPosStyle() {
  const pos = game.settings.get("hud-combate-t20", "posicaoHUD") || { left: null, bottom: 10 };
  const parts = [];
  if (pos.left !== null) parts.push(`left:${pos.left}px;transform:translateX(0);`);
  else parts.push(`left:50%;transform:translateX(-50%);`);
  parts.push(`bottom:${pos.bottom ?? 10}px;`);
  return parts.join("");
}

/* ---------------------- Ajuda (hotkeys) -------------------- */
function showHotkeysDialog() {
  const content = `
    <style>
      .t20-help-list { line-height: 1.6; }
      .t20-help-list kbd {
        background: #222; color: #fff; border: 1px solid #555; border-radius: 4px;
        padding: 0 6px; font-family: monospace; font-size: 0.9rem;
      }
      .t20-help-note { opacity: .85; font-size: .9rem; margin-top: 6px; }
    </style>
    <div class="t20-help-list">
      <div><kbd>A</kbd> — Ataque</div>
      <div><kbd>P</kbd> — Poderes</div>
      <div><kbd>M</kbd> — Magias</div>
      <div><kbd>R</kbd> — Perícias</div>
      <div><kbd>I</kbd> — Consumíveis</div>
      <hr>
      <div><kbd>H</kbd> ou <kbd>?</kbd> — Esta ajuda</div>
      <div class="t20-help-note">Atalhos são ignorados quando um campo de texto está em foco.</div>
    </div>
  `;
  new Dialog({
    title: "Atalhos de Teclado — HUD Combate T20",
    content,
    buttons: { ok: { label: "Fechar" } }
  }).render(true);
}

/* --------------- Toggle quando HUD está fechada ------------ */
function renderHUDToggle() {
  document.querySelector(".t20-quickbar")?.remove();
  document.querySelector(".t20-hud-toggle")?.remove();

  const container = document.createElement("div");
  container.className = "t20-hud-toggle";
  container.setAttribute("style", getHUDPosStyle());
  container.innerHTML = `<button class="t20-open" title="Abrir HUD">HUD</button>`;
  document.body.appendChild(container);

  container.querySelector(".t20-open")?.addEventListener("click", async () => {
    await game.settings.set("hud-combate-t20", "hudFechada", false);
    const actor = canvas.tokens.controlled[0]?.actor || null;
    renderHUD(actor);
  });
}

/* ------------------------ Render HUD ----------------------- */
async function renderHUD(actor) {
  // limpa UI anterior
  document.querySelector(".t20-quickbar")?.remove();
  document.querySelector(".t20-hud-toggle")?.remove();

  // Se a HUD estiver desativada nas configs, não renderiza nada
  if (!game.settings.get("hud-combate-t20", "exibirBarra")) return;

  // Se estiver fechada, mostra apenas o botão de abrir
  if (game.settings.get("hud-combate-t20", "hudFechada")) {
    renderHUDToggle();
    return;
  }

  if (!actor) return;

  const armaEquipada = actor.items.find(i =>
    i.type === "arma" && i.system?.equipado === 1 && i.system?.equipado2?.type === "hand"
  );
  const armaIcon = armaEquipada?.img ?? "icons/svg/sword.svg";

  const buttons = [
    { id: "ataque",     label: "ATAQUE",      icon: armaIcon,                                           tab: "ataque" },
    { id: "pericias",   label: "PERÍCIAS",    icon: "modules/hud-combate-t20/img/pericias.png",         tab: "pericias" },
    { id: "poderes",    label: "PODERES",     icon: "modules/hud-combate-t20/img/poderes.png",          tab: "poderes" },
    { id: "magias",     label: "MAGIAS",      icon: "modules/hud-combate-t20/img/magias.png",           tab: "magias" },
    { id: "inventario", label: "CONSUMÍVEIS", icon: "modules/hud-combate-t20/img/inventario.png",       tab: "inventario" }
  ];

  const context = {
    buttons,
    img: actor.img,
    nome: actor.name,
    pv: `${actor.system?.attributes?.pv?.value ?? "—"} / ${actor.system?.attributes?.pv?.max ?? "—"}`,
    pm: `${actor.system?.attributes?.pm?.value ?? "—"} / ${actor.system?.attributes?.pm?.max ?? "—"}`,
    def: actor.system?.attributes?.defesa?.value ?? "—",
    favoritos: getFavsFor(actor.id),
    colapsado: game.settings.get("hud-combate-t20", "hudColapsada"),
    posStyle: getHUDPosStyle()
  };

  const html = await renderTemplate("modules/hud-combate-t20/templates/quick-actions.hbs", context);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container.firstElementChild);

  const hudEl = document.querySelector(".t20-quickbar");

  // Clique nos favoritos (HUD)
  document.querySelectorAll(".t20-fav").forEach(f => {
    f.addEventListener("click", () => {
      const type = f.dataset.type; const id = f.dataset.id;
      const selectedActor = canvas.tokens.controlled[0]?.actor || actor;
      const item = selectedActor?.items?.get(id);
      if (!item) return;
      const event = new MouseEvent("click", { shiftKey: true });
      item?.roll?.({ event });
    });
  });

  // Collapse ▾
  hudEl.querySelector(".t20-collapse")?.addEventListener("click", () => {
    const current = game.settings.get("hud-combate-t20", "hudColapsada");
    game.settings.set("hud-combate-t20", "hudColapsada", !current);
    hudEl.classList.toggle("t20-collapsed", !current);
  });

  // Ajuda "?"
  hudEl.querySelector(".t20-help")?.addEventListener("click", () => {
    showHotkeysDialog();
  });

  // Fechar HUD ✕
  hudEl.querySelector(".t20-close")?.addEventListener("click", async () => {
    await game.settings.set("hud-combate-t20", "hudFechada", true);
    renderHUDToggle();
  });

  // Drag
  makeDraggable(hudEl);

  // Botões da HUD
  document.querySelectorAll(".t20-button").forEach(button => {
    button.addEventListener("click", async () => {
      const tab = button.dataset.tab;
      const selectedActor = canvas.tokens.controlled[0]?.actor || actor;
      if (!selectedActor) return;

      if (tab === "poderes")     return void openPowersDialog(selectedActor);
      if (tab === "magias")      return void openSpellsDialog(selectedActor);
      if (tab === "pericias")    return void openSkillsDialog(selectedActor);
      if (tab === "inventario")  return void openInventoryDialog(selectedActor);

      if (tab === "ataque") {
        const armas = selectedActor.items.filter(i =>
          i.type === "arma" && i.system?.equipado === 1 && i.system?.equipado2?.type === "hand"
        );
        if (!armas.length) return ui.notifications.warn("Nenhuma arma equipada na mão principal encontrada.");

        const abrir = (arma) => {
          const event = new MouseEvent("click", { shiftKey: true });
          arma.roll({ event });
        };

        if (armas.length === 1) return abrir(armas[0]);

        const dialogContent = `
          <p>Escolha a arma para atacar:</p>
          <select id="armaSelect">
            ${armas.map(a => `<option value="${a.id}">${a.name}</option>`).join("")}
          </select>
          <button id="confirmarAtaque">Abrir Janela</button>
        `;
        const d = new Dialog({
          title: "Escolher Arma",
          content: dialogContent,
          buttons: { fechar: { label: "Cancelar" } },
          render: html => {
            const select = html[0].querySelector("#armaSelect");
            const btn = html[0].querySelector("#confirmarAtaque");
            btn.addEventListener("click", () => {
              const armaId = select.value;
              const arma = armas.find(a => a.id === armaId);
              abrir(arma);
              d.close();
            });
          }
        });
        d.render(true);
      }
    });
  });
}

/* ------------- Poderes: busca/ordem/filtros/fav ------------- */
async function openPowersDialog(selectedActor) {
  const poderes = selectedActor.items.filter(i => i.type === "poder");
  if (!poderes.length) return ui.notifications.warn("Nenhum poder encontrado.");
  const favs = getFavsFor(selectedActor.id);

  const listHtml = poderes.map(p => {
    const tipo = p.system?.tipo || "—";
    const ativ = p.system?.ativacao || {};
    const exec = ativ.execucao && ativ.execucao !== "passive" ? ativ.execucao : "";
    const cond = ativ.condicao || "";
    const custoNum = Number(ativ.custo ?? 0) || 0;
    const custo = custoNum > 0 ? `${custoNum} PM` : "";
    const ativacao = [cond, exec, custo].filter(Boolean).join(", ") || "—";
    const alcance = p.system?.alcance ?? "";
    const alvo = p.system?.alvo ?? "";
    const area = p.system?.area ?? "";
    const fav = favs.some(f => f.type === 'poder' && f.id === p.id);
    const desc = p.system?.description?.value?.replace(/"/g, '&quot;') || "Sem descrição";
    return `
      <div class="t20-poder-item ${fav ? 'favorited':''}"
           data-id="${p.id}"
           data-desc="${desc}"
           data-name="${(p.name||'').toLowerCase()}"
           data-tipo="${String(tipo).toLowerCase()}"
           data-custo="${custoNum}"
           data-alcance="${String(alcance).toLowerCase()}"
           data-alvo="${String(alvo).toLowerCase()}"
           data-area="${String(area).toLowerCase()}">
        ${fav ? '<span class="t20-fav-badge">★</span>' : ''}
        <img class="t20-poder-icon" src="${p.img}" />
        <div class="t20-poder-info">
          <div class="t20-poder-nome">${p.name}</div>
          <div><strong>Tipo:</strong> ${tipo}</div>
          <div><strong>Ativação:</strong> ${ativacao}</div>
          ${alcance ? `<div><strong>Alcance:</strong> ${alcance}</div>` : ""}
          ${alvo ? `<div><strong>Alvo:</strong> ${alvo}</div>` : ""}
          ${area ? `<div><strong>Área:</strong> ${area}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");

  const content = `
    <style>
      .t20-poderes-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:500px;overflow-y:auto;font-family:sans-serif;}
      .t20-poder-item{display:flex;gap:10px;padding:6px;border:1px solid #666;border-radius:6px;background:#1e1e1e;color:#fff;align-items:center;cursor:pointer;position:relative;}
      .t20-poder-item:hover{background:#333}
      .t20-poder-icon{width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #aaa}
      .t20-poder-info{display:flex;flex-direction:column;font-size:.85rem}
      .t20-poder-nome{font-weight:bold}
      .t20-poder-tooltip{position:fixed;background:#222;color:#fff;padding:8px;border-radius:6px;max-width:300px;font-size:.8rem;box-shadow:0 0 6px #000;z-index:99999;display:none;pointer-events:none;white-space:normal}
    </style>

    <div class="t20-filterbar">
      <input type="text" id="t20-search" placeholder="Buscar por nome..." />
      <select id="t20-order">
        <option value="name-asc">Nome (A→Z)</option>
        <option value="name-desc">Nome (Z→A)</option>
        <option value="tipo-asc">Tipo (A→Z)</option>
        <option value="tipo-desc">Tipo (Z→A)</option>
      </select>
      <input type="number" id="t20-pm-min" min="0" step="1" placeholder="PM ≥" style="width:70px">
      <input type="text" id="t20-alcance" placeholder="Alcance contém…" style="width:140px">
      <input type="text" id="t20-alvo" placeholder="Alvo contém…" style="width:120px">
      <input type="text" id="t20-area" placeholder="Área contém…" style="width:120px">
    </div>

    <div class="t20-poderes-grid" id="t20-grid">${listHtml}</div>
    <div class="t20-poder-tooltip" id="tooltip-poder"></div>
  `;

  const d = new Dialog({
    title: "Poderes",
    content,
    buttons: { fechar: { label: "Fechar" } },
    render: (html) => {
      const root = html[0];
      const tooltip = root.querySelector("#tooltip-poder");
      const grid = root.querySelector("#t20-grid");
      const search = root.querySelector("#t20-search");
      const order = root.querySelector("#t20-order");
      const pmMin = root.querySelector("#t20-pm-min");
      const inAlc = root.querySelector("#t20-alcance");
      const inAlvo = root.querySelector("#t20-alvo");
      const inArea = root.querySelector("#t20-area");

      const applyFilters = () => {
        const term = (search.value || "").toLowerCase();
        const pm = Number(pmMin.value || 0) || 0;
        const alc = (inAlc.value || "").toLowerCase();
        const alvo = (inAlvo.value || "").toLowerCase();
        const area = (inArea.value || "").toLowerCase();

        const cards = Array.from(grid.querySelectorAll(".t20-poder-item"));
        cards.forEach(c => {
          const okName = c.dataset.name.includes(term);
          const okPM   = Number(c.dataset.custo || 0) >= pm;
          const okAlc  = !alc  || c.dataset.alcance.includes(alc);
          const okAlvo = !alvo || c.dataset.alvo.includes(alvo);
          const okArea = !area || c.dataset.area.includes(area);
          c.style.display = (okName && okPM && okAlc && okAlvo && okArea) ? "" : "none";
        });

        const visible = cards.filter(c => c.style.display !== "none");
        const [field, dir] = order.value.split("-");
        visible.sort((a,b) => {
          const av = (a.dataset[field] || a.dataset.name) ?? "";
          const bv = (b.dataset[field] || b.dataset.name) ?? "";
          return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        }).forEach(el => grid.appendChild(el));
      };

      [search, order, pmMin, inAlc, inAlvo, inArea].forEach(el => el.addEventListener("input", applyFilters));

      grid.querySelectorAll(".t20-poder-item").forEach(el => {
        el.addEventListener("mouseenter", () => { tooltip.innerHTML = el.dataset.desc; tooltip.style.display = "block"; });
        el.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
        el.addEventListener("mousemove", (e) => {
          tooltip.style.top = `${e.clientY}px`; tooltip.style.left = `${e.clientX}px`; tooltip.style.transform = "translate(10px, 5px)";
        });
        el.addEventListener("click", () => {
          const id = el.dataset.id;
          const poder = selectedActor.items.get(id);
          const event = new MouseEvent("click", { shiftKey: true });
          poder?.roll({ event });
          d.close();
        });
        el.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          const id = el.dataset.id;
          const item = selectedActor.items.get(id);
          toggleFav(selectedActor, "poder", item);
          el.classList.toggle("favorited");
          if (el.classList.contains("favorited")) {
            const b = document.createElement("span"); b.className = "t20-fav-badge"; b.textContent = "★"; el.appendChild(b);
          } else el.querySelector(".t20-fav-badge")?.remove();
          renderHUD(selectedActor);
        });
      });
    }
  });
  d.render(true);
}

/* ------------- Magias: busca/ordem/filtros/nivel/fav ------------- */
async function openSpellsDialog(selectedActor) {
  const magias = selectedActor.items.filter(i => i.type === "magia");
  if (!magias.length) return ui.notifications.warn("Nenhuma magia encontrada.");
  const favs = getFavsFor(selectedActor.id);

  const listHtml = magias.map(m => {
    const tipo = m.system?.tipo || "—";
    const ativ = m.system?.ativacao || {};
    const exec = ativ.execucao && ativ.execucao !== "passive" ? ativ.execucao : "";
    const cond = ativ.condicao || "";
    const custoNum = Number(ativ.custo ?? 0) || 0;
    const custo = custoNum > 0 ? `${custoNum} PM` : "";
    const ativacao = [cond, exec, custo].filter(Boolean).join(", ") || "—";
    const alcance = m.system?.alcance ?? "";
    const alvo = m.system?.alvo ?? "";
    const area = m.system?.area ?? "";
    const nivel = String(m.system?.nivel ?? "");
    const fav = favs.some(f => f.type === 'magia' && f.id === m.id);
    const desc = m.system?.description?.value?.replace(/"/g, '&quot;') || "Sem descrição";
    return `
      <div class="t20-poder-item ${fav ? 'favorited':''}"
           data-id="${m.id}"
           data-desc="${desc}"
           data-name="${(m.name||'').toLowerCase()}"
           data-tipo="${String(tipo).toLowerCase()}"
           data-custo="${custoNum}"
           data-nivel="${nivel.toLowerCase()}"
           data-alcance="${String(alcance).toLowerCase()}"
           data-alvo="${String(alvo).toLowerCase()}"
           data-area="${String(area).toLowerCase()}">
        ${fav ? '<span class="t20-fav-badge">★</span>' : ''}
        <img class="t20-poder-icon" src="${m.img}" />
        <div class="t20-poder-info">
          <div class="t20-poder-nome">${m.name}</div>
          <div><strong>Tipo:</strong> ${tipo}</div>
          <div><strong>Ativação:</strong> ${ativacao}</div>
          ${nivel ? `<div><strong>Nível:</strong> ${nivel}</div>` : ""}
          ${alcance ? `<div><strong>Alcance:</strong> ${alcance}</div>` : ""}
          ${alvo ? `<div><strong>Alvo:</strong> ${alvo}</div>` : ""}
          ${area ? `<div><strong>Área:</strong> ${area}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");

  const content = `
    <style>
      .t20-poderes-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:500px;overflow-y:auto;font-family:sans-serif;}
      .t20-poder-item{display:flex;gap:10px;padding:6px;border:1px solid #666;border-radius:6px;background:#1e1e1e;color:#fff;align-items:center;cursor:pointer;position:relative;}
      .t20-poder-item:hover{background:#333}
      .t20-poder-icon{width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #aaa}
      .t20-poder-info{display:flex;flex-direction:column;font-size:.85rem}
      .t20-poder-nome{font-weight:bold}
      .t20-poder-tooltip{position:fixed;background:#222;color:#fff;padding:8px;border-radius:6px;max-width:300px;font-size:.8rem;box-shadow:0 0 6px #000;z-index:99999;display:none;pointer-events:none;white-space:normal}
    </style>

    <div class="t20-filterbar">
      <input type="text" id="t20-search" placeholder="Buscar por nome..." />
      <select id="t20-order">
        <option value="name-asc">Nome (A→Z)</option>
        <option value="name-desc">Nome (Z→A)</option>
        <option value="tipo-asc">Tipo (A→Z)</option>
        <option value="tipo-desc">Tipo (Z→A)</option>
        <option value="nivel-asc">Nível (↑)</option>
        <option value="nivel-desc">Nível (↓)</option>
      </select>
      <input type="number" id="t20-pm-min" min="0" step="1" placeholder="PM ≥" style="width:70px">
      <input type="text" id="t20-alcance" placeholder="Alcance contém…" style="width:140px">
      <input type="text" id="t20-alvo" placeholder="Alvo contém…" style="width:120px">
      <input type="text" id="t20-area" placeholder="Área contém…" style="width:120px">
    </div>

    <div class="t20-poderes-grid" id="t20-grid">${listHtml}</div>
    <div class="t20-poder-tooltip" id="tooltip-magia"></div>
  `;

  const d = new Dialog({
    title: "Magias",
    content,
    buttons: { fechar: { label: "Fechar" } },
    render: (html) => {
      const root = html[0];
      const tooltip = root.querySelector("#tooltip-magia");
      const grid = root.querySelector("#t20-grid");
      const search = root.querySelector("#t20-search");
      const order = root.querySelector("#t20-order");
      const pmMin = root.querySelector("#t20-pm-min");
      const inAlc = root.querySelector("#t20-alcance");
      const inAlvo = root.querySelector("#t20-alvo");
      const inArea = root.querySelector("#t20-area");

      const applyFilters = () => {
        const term = (search.value || "").toLowerCase();
        const pm = Number(pmMin.value || 0) || 0;
        const alc = (inAlc.value || "").toLowerCase();
        const alvo = (inAlvo.value || "").toLowerCase();
        const area = (inArea.value || "").toLowerCase();

        const cards = Array.from(grid.querySelectorAll(".t20-poder-item"));
        cards.forEach(c => {
          const okName = c.dataset.name.includes(term);
          const okPM   = Number(c.dataset.custo || 0) >= pm;
          const okAlc  = !alc  || c.dataset.alcance.includes(alc);
          const okAlvo = !alvo || c.dataset.alvo.includes(alvo);
          const okArea = !area || c.dataset.area.includes(area);
          c.style.display = (okName && okPM && okAlc && okAlvo && okArea) ? "" : "none";
        });

        const visible = cards.filter(c => c.style.display !== "none");
        const [field, dir] = order.value.split("-");
        visible.sort((a,b) => {
          const av = (a.dataset[field] || a.dataset.name) ?? "";
          const bv = (b.dataset[field] || b.dataset.name) ?? "";
          return dir === "asc" ? av.localeCompare(bv, undefined, {numeric:true})
                               : bv.localeCompare(av, undefined, {numeric:true});
        }).forEach(el => grid.appendChild(el));
      };

      [search, order, pmMin, inAlc, inAlvo, inArea].forEach(el => el.addEventListener("input", applyFilters));

      grid.querySelectorAll(".t20-poder-item").forEach(el => {
        el.addEventListener("mouseenter", () => { tooltip.innerHTML = el.dataset.desc; tooltip.style.display = "block"; });
        el.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
        el.addEventListener("mousemove", (e) => {
          tooltip.style.top = `${e.clientY}px`; tooltip.style.left = `${e.clientX}px`; tooltip.style.transform = "translate(10px, 5px)";
        });
        el.addEventListener("click", () => {
          const id = el.dataset.id;
          const magia = selectedActor.items.get(id);
          const event = new MouseEvent("click", { shiftKey: true });
          magia?.roll({ event });
          d.close();
        });
        el.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          const id = el.dataset.id;
          const item = selectedActor.items.get(id);
          toggleFav(selectedActor, "magia", item);
          el.classList.toggle("favorited");
          if (el.classList.contains("favorited")) {
            const b = document.createElement("span"); b.className = "t20-fav-badge"; b.textContent = "★"; el.appendChild(b);
          } else el.querySelector(".t20-fav-badge")?.remove();
          renderHUD(selectedActor);
        });
      });
    }
  });
  d.render(true);
}

/* ----------------- Perícias (usa "value") ------------------ */
async function openSkillsDialog(actor) {
  const pericias = actor.system?.pericias || actor.system?.skills || {};
  const entries = Object.entries(pericias).map(([key, val]) => {
    const nome = val?.rotulo || val?.label || key;
    const value = Number(val?.value ?? val?.total ?? val?.mod ?? 0) || 0; // usa "value"
    const atr = (val?.atributo || val?.ability || "").toString();
    const treinada = !!(val?.treinado ?? val?.trained ?? false);
    return { key, nome, value, atr, treinada };
  });

  if (!entries.length) return ui.notifications.warn("Nenhuma perícia encontrada.");

  const listHtml = entries.map(p => `
    <div class="t20-skill-item"
         data-key="${p.key}"
         data-name="${p.nome.toLowerCase()}"
         data-atr="${p.atr.toLowerCase()}"
         data-treino="${p.treinada ? 'sim':'nao'}"
         data-value="${p.value}">
      <div class="t20-skill-name"><strong>${p.nome}</strong></div>
      <div class="t20-skill-meta">ATR: ${p.atr || "—"} | Bônus: ${p.value} | ${p.treinada ? "Treinada" : "Não treinada"}</div>
      <button class="t20-skill-roll">Rolar</button>
    </div>
  `).join("");

  const content = `
    <style>
      .t20-skills-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:500px;overflow-y:auto}
      .t20-skill-item{display:flex;flex-direction:column;gap:4px;padding:6px;border:1px solid #666;border-radius:6px;background:#1e1e1e;color:#fff}
      .t20-skill-item button{background:#1e1e1e;border:1px solid #555;border-radius:6px;color:#fff;cursor:pointer;padding:4px 6px}
      .t20-skill-item button:hover{background:#333}
      .t20-skill-name{font-size:.95rem}
      .t20-skill-meta{font-size:.8rem;opacity:.9}
    </style>

    <div class="t20-filterbar">
      <input type="text" id="t20-search" placeholder="Buscar perícia..." />
      <select id="t20-order">
        <option value="name-asc">Nome (A→Z)</option>
        <option value="name-desc">Nome (Z→A)</option>
        <option value="value-desc">Bônus (↓)</option>
        <option value="value-asc">Bônus (↑)</option>
      </select>
      <select id="t20-atr">
        <option value="">ATR (todas)</option>
      </select>
      <select id="t20-treino">
        <option value="">Treino (todos)</option>
        <option value="sim">Treinada</option>
        <option value="nao">Não treinada</option>
      </select>
    </div>

    <div class="t20-skills-grid" id="t20-grid">${listHtml}</div>
  `;

  const d = new Dialog({
    title: "Perícias",
    content,
    buttons: { fechar: { label: "Fechar" } },
    render: (html) => {
      const root = html[0];
      const grid = root.querySelector("#t20-grid");
      const search = root.querySelector("#t20-search");
      const order = root.querySelector("#t20-order");
      const selAtr = root.querySelector("#t20-atr");
      const selTreino = root.querySelector("#t20-treino");

      // popular ATR únicos
      const atrs = [...new Set(entries.map(e => e.atr).filter(Boolean))];
      atrs.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a; opt.textContent = a;
        selAtr.appendChild(opt);
      });

      const applyFilters = () => {
        const term = (search.value || "").toLowerCase();
        const atr = (selAtr.value || "").toLowerCase();
        const treino = (selTreino.value || "");
        const cards = Array.from(grid.querySelectorAll(".t20-skill-item"));
        cards.forEach(c => {
          const okName = c.dataset.name.includes(term);
          const okAtr = !atr || c.dataset.atr === atr;
          const okTreino = !treino || c.dataset.treino === treino;
          c.style.display = (okName && okAtr && okTreino) ? "" : "none";
        });

        const visible = cards.filter(c => c.style.display !== "none");
        const [field, dir] = order.value.split("-");
        visible.sort((a,b) => {
          let av, bv;
          if (field === "name") {
            av = a.dataset.name; bv = b.dataset.name;
            return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
          } else { // value
            av = Number(a.dataset.value || 0);
            bv = Number(b.dataset.value || 0);
            return dir === "asc" ? av - bv : bv - av;
          }
        }).forEach(el => grid.appendChild(el));
      };

      [search, order, selAtr, selTreino].forEach(el => el.addEventListener("input", applyFilters));

      // rolar perícia (usando "value")
      grid.querySelectorAll(".t20-skill-roll").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const card = e.currentTarget.closest(".t20-skill-item");
          const value = Number(card.dataset.value || 0);
          const nome = card.querySelector(".t20-skill-name")?.textContent?.trim() || "Perícia";
          const r = await (new Roll(`1d20 + ${value}`)).roll({async:true});
          r.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<b>${nome}</b>` });
        });
      });
    }
  });
  d.render(true);
}

/* --------- Consumíveis: só "Usar" (sem duplo consumo) --------- */
async function openInventoryDialog(actor) {
  const items = actor.items || [];

  // Apenas consumíveis (tipos comuns + heurística por categoria)
  const consumiveis = items.filter(i =>
    ["consumivel","consumable","po","pocao","elixir"].includes((i.type||"").toLowerCase()) ||
    /consum/i.test(i.system?.categoria || "")
  );

  if (!consumiveis.length) {
    ui.notifications.warn("Nenhum consumível encontrado.");
    return;
  }

  const listHtml = consumiveis.map(it => {
    const qtd = it.system?.quantidade ?? it.system?.qtd ?? it.system?.quantity ?? 1;
    return `
      <div class="t20-inv-item" data-id="${it.id}" data-name="${(it.name||'').toLowerCase()}">
        <img class="t20-inv-icon" src="${it.img}" alt="${it.name}">
        <div class="t20-inv-info">
          <div class="t20-inv-name"><strong>${it.name}</strong></div>
          <div class="t20-inv-meta">Qtd: <b>${qtd}</b></div>
          <div class="t20-inv-actions">
            <button class="t20-inv-use">Usar</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const content = `
    <style>
      .t20-inv-section{margin-bottom:10px}
      .t20-inv-title{font-weight:bold;margin-bottom:6px}
      .t20-inv-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:500px;overflow-y:auto}
      .t20-inv-item{display:flex;gap:8px;padding:6px;border:1px solid #666;border-radius:6px;background:#1e1e1e;color:#fff;align-items:center}
      .t20-inv-icon{width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #aaa}
      .t20-inv-info{display:flex;flex-direction:column;gap:4px}
      .t20-inv-actions{display:flex;gap:6px;flex-wrap:wrap}
      .t20-inv-actions button{background:#1e1e1e;border:1px solid #555;border-radius:6px;color:#fff;cursor:pointer;padding:4px 6px}
      .t20-inv-actions button:hover{background:#333}
      .t20-inv-filter{display:flex;gap:8px;margin-bottom:8px}
    </style>

    <div class="t20-inv-filter">
      <input type="text" id="t20-search" placeholder="Buscar consumível…">
    </div>

    <div class="t20-inv-section">
      <div class="t20-inv-title">Consumíveis (${consumiveis.length})</div>
      <div class="t20-inv-grid">
        ${listHtml}
      </div>
    </div>
  `;

  const d = new Dialog({
    title: "Consumíveis",
    content,
    buttons: { fechar: { label: "Fechar" } },
    render: (html) => {
      const root = html[0];
      const search = root.querySelector("#t20-search");

      // Busca por nome
      const applySearch = () => {
        const term = (search.value || "").toLowerCase();
        root.querySelectorAll(".t20-inv-item").forEach(el => {
          el.style.display = el.dataset.name.includes(term) ? "" : "none";
        });
      };
      search.addEventListener("input", applySearch);

      // USAR: mensagem -> usar item -> se não consumiu, decrementa 1
      root.querySelectorAll(".t20-inv-use").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();

          const card = e.currentTarget.closest(".t20-inv-item");
          const itemId = card.dataset.id;
          let item = actor.items.get(itemId);
          if (!item) return;

          // Descobrir caminho de quantidade
          const qtyPaths = ["system.quantidade", "system.qtd", "system.quantity"];
          let qtyPath = null;
          for (const p of qtyPaths) {
            if (typeof foundry.utils.getProperty(item, p) !== "undefined") { qtyPath = p; break; }
          }
          const getQty = (doc) => {
            const v = qtyPath ? foundry.utils.getProperty(doc, qtyPath) : undefined;
            return Number(v);
          };

          const beforeQty = getQty(item);
          if (Number.isFinite(beforeQty) && beforeQty <= 0) {
            ui.notifications.warn(`Sem unidades de: ${item.name}`);
            return;
          }

          // 1) Mensagem "Usou"
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<b>Usou:</b> ${item.name}`
          });

          // 2) Usar automaticamente SEM abrir diálogo
          try {
            if (typeof item.use === "function") {
              await item.use({ configureDialog: false, fastForward: true, skipDialog: true, createMessage: true });
            } else if (typeof item.roll === "function") {
              await item.roll({ configureDialog: false, fastForward: true, skipDialog: true, createMessage: true });
            } else if (typeof item.activate === "function") {
              await item.activate();
            }
          } catch (err) {
            console.error(err);
            ui.notifications.warn("Não foi possível executar os efeitos automáticos do item (mas a mensagem foi enviada).");
          }

          // 3) Verifica se o sistema já consumiu; se não, decrementa 1 (fallback)
          item = actor.items.get(itemId) || item;
          const afterQty = getQty(item);

          if (Number.isFinite(beforeQty)) {
            if (Number.isFinite(afterQty)) {
              if (afterQty === beforeQty && qtyPath) {
                await item.update({ [qtyPath]: Math.max(0, beforeQty - 1) });
              }
            } else if (qtyPath) {
              // Sistema não retornou número; ainda assim tentamos consumir 1
              await item.update({ [qtyPath]: Math.max(0, beforeQty - 1) });
            }
          }

          // Atualiza UI
          d.close();
          openInventoryDialog(actor);
        });
      });
    }
  });

  d.render(true);
}

/* --------------------- Drag util --------------------- */
function makeDraggable(hudEl) {
  const inner = hudEl.querySelector(".t20-quickbar-inner");
  if (!inner) return;
  let dragging = false, startX = 0, startY = 0, startLeft = 0, startBottom = 0;

  const onMouseDown = (e) => {
    if (
      e.target.closest(".t20-button") ||
      e.target.closest(".t20-collapse") ||
      e.target.closest(".t20-help") ||
      e.target.closest(".t20-close") ||
      e.target.closest(".t20-fav")
    ) return;

    dragging = true; hudEl.classList.add("dragging");
    startX = e.clientX; startY = e.clientY;
    const rect = hudEl.getBoundingClientRect();
    startLeft = rect.left; startBottom = window.innerHeight - rect.bottom;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX; const dy = e.clientY - startY;
    const newLeft = Math.max(0, Math.min(window.innerWidth - hudEl.offsetWidth, startLeft + dx));
    const newBottom = Math.max(0, Math.min(window.innerHeight - hudEl.offsetHeight, startBottom - dy));
    hudEl.style.left = `${newLeft}px`; hudEl.style.bottom = `${newBottom}px`; hudEl.style.transform = "translateX(0)";
  };
  const onMouseUp = () => {
    if (!dragging) return;
    dragging = false; hudEl.classList.remove("dragging");
    const left = parseInt(hudEl.style.left || "0", 10);
    const bottom = parseInt(hudEl.style.bottom || "10", 10);
    game.settings.set("hud-combate-t20", "posicaoHUD", { left, bottom });
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
  inner.addEventListener("mousedown", onMouseDown);
}

/* ---------------- Ready: render + hotkeys --------------- */
Hooks.once("ready", async () => {
  if (!game.settings.get("hud-combate-t20", "exibirBarra")) return;

  const controlled = canvas.tokens.controlled[0];
  const actor = controlled?.actor;
  await renderHUD(actor);

  Hooks.on("controlToken", async (token, controlled) => {
    if (controlled) await renderHUD(token.actor);
    else {
      // Se nenhum token estiver selecionado, ainda mantenha o toggle se a HUD estiver fechada
      if (game.settings.get("hud-combate-t20", "hudFechada")) renderHUDToggle();
      else document.querySelector(".t20-quickbar")?.remove();
    }
  });

  Hooks.on("updateActor", async (actorUpdated) => {
    const current = canvas.tokens.controlled[0];
    if (current?.actor?.id === actorUpdated.id) await renderHUD(actorUpdated);
  });

  Hooks.on("updateItem", async (item) => {
    const current = canvas.tokens.controlled[0];
    if (!current) return;
    if (item.parent?.id === current.actor.id && ["arma","poder","magia","armadura","escudo"].includes(item.type)) {
      await renderHUD(current.actor);
    }
  });

  // Hotkeys
  document.addEventListener("keydown", (e) => {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable) return;

    const actor = canvas.tokens.controlled[0]?.actor;
    // Mesmo sem actor, permitimos abrir a ajuda
    const key = e.key?.toLowerCase();

    if (key === "h" || key === "?") return showHotkeysDialog();
    if (!actor) return;

    if (key === "a") return void clickTab("ataque", actor);
    if (key === "p") return void clickTab("poderes", actor);
    if (key === "m") return void clickTab("magias", actor);
    if (key === "r") return void clickTab("pericias", actor);
    if (key === "i") return void clickTab("inventario", actor);
  });
});

function clickTab(tab, actor) {
  if (tab === "ataque")    return document.querySelector('.t20-button[data-tab="ataque"]')?.click();
  if (tab === "poderes")   return openPowersDialog(actor);
  if (tab === "magias")    return openSpellsDialog(actor);
  if (tab === "pericias")  return openSkillsDialog(actor);
  if (tab === "inventario")return openInventoryDialog(actor);
}
