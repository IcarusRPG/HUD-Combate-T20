Hooks.once("init", () => {
  game.settings.register("hud-combate-t20", "exibirBarra", {
    name: "Ativar HUD de Combate T20",
    hint: "Exibe ou oculta a barra de ações rápidas flutuante na tela.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  // ★ NOVO: posição e estado recolhido
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

  // ★ NOVO: favoritos por ator
  game.settings.register("hud-combate-t20", "favoritos", {
    name: "Favoritos por Ator",
    scope: "client",
    config: false,
    type: Object,
    default: {} // { [actorId]: [ {type:'poder'|'magia', id, name, img} ] }
  });
});

// ★ NOVO: helpers de favoritos
function getFavsFor(actorId) {
  const all = game.settings.get("hud-combate-t20", "favoritos") || {};
  return Array.isArray(all[actorId]) ? all[actorId] : [];
}
function setFavsFor(actorId, list) {
  const all = foundry.utils.duplicate(game.settings.get("hud-combate-t20", "favoritos") || {});
  all[actorId] = list;
  game.settings.set("hud-combate-t20", "favoritos", all);
}
function isFav(actorId, type, id) {
  return getFavsFor(actorId).some(f => f.type === type && f.id === id);
}
function toggleFav(actor, type, item) {
  const list = getFavsFor(actor.id);
  const idx = list.findIndex(f => f.type === type && f.id === item.id);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push({ type, id: item.id, name: item.name, img: item.img });
  }
  setFavsFor(actor.id, list);
}

// ★ NOVO: posição
function getHUDPosStyle() {
  const pos = game.settings.get("hud-combate-t20", "posicaoHUD") || { left: null, bottom: 10 };
  const parts = [];
  if (pos.left !== null) parts.push(`left:${pos.left}px;transform:translateX(0);`);
  else parts.push(`left:50%;transform:translateX(-50%);`);
  parts.push(`bottom:${pos.bottom ?? 10}px;`);
  return parts.join("");
}

async function renderHUD(actor) {
  const existing = document.querySelector(".t20-quickbar");
  if (existing) existing.remove();
  if (!actor) return;

  const armaEquipada = actor.items.find(i =>
    i.type === "arma" &&
    i.system?.equipado === 1 &&
    i.system?.equipado2?.type === "hand"
  );
  const armaIcon = armaEquipada?.img ?? "icons/svg/sword.svg";

  const buttons = [
    { id: "ataque",    label: "ATAQUE",    icon: armaIcon,                                           tab: "ataque" },
    { id: "pericias",  label: "PERÍCIAS",  icon: "modules/hud-combate-t20/img/pericias.png",         tab: "pericias" },
    { id: "poderes",   label: "PODERES",   icon: "modules/hud-combate-t20/img/poderes.png",          tab: "poderes" },
    { id: "magias",    label: "MAGIAS",    icon: "modules/hud-combate-t20/img/magias.png",           tab: "magias" },
    { id: "inventario",label: "INVENTÁRIO",icon: "modules/hud-combate-t20/img/inventario.png",       tab: "inventario" }
  ];

  // ★ NOVO: favoritos do ator
  const favoritos = getFavsFor(actor.id);

  const context = {
    buttons,
    img: actor.img,
    nome: actor.name,
    pv: `${actor.system?.attributes?.pv?.value ?? "—"} / ${actor.system?.attributes?.pv?.max ?? "—"}`,
    pm: `${actor.system?.attributes?.pm?.value ?? "—"} / ${actor.system?.attributes?.pm?.max ?? "—"}`,
    def: actor.system?.attributes?.defesa?.value ?? "—",
    favoritos,
    colapsado: game.settings.get("hud-combate-t20", "hudColapsada"),
    posStyle: getHUDPosStyle()
  };

  const html = await renderTemplate("modules/hud-combate-t20/templates/quick-actions.hbs", context);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container.firstElementChild);

  const hudEl = document.querySelector(".t20-quickbar");

  // ★ NOVO: clique nos favoritos
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

  // ★ NOVO: collapse
  hudEl.querySelector(".t20-collapse")?.addEventListener("click", () => {
    const current = game.settings.get("hud-combate-t20", "hudColapsada");
    game.settings.set("hud-combate-t20", "hudColapsada", !current);
    hudEl.classList.toggle("t20-collapsed", !current);
  });

  // ★ NOVO: drag para mover e salvar posição
  makeDraggable(hudEl);

  // Botões padrão
  document.querySelectorAll(".t20-button").forEach(button => {
    button.addEventListener("click", async () => {
      const tab = button.dataset.tab;
      const selectedActor = canvas.tokens.controlled[0]?.actor || actor;
      if (!selectedActor) return;

      if (tab === "poderes") {
        await openPowersDialog(selectedActor);
        return;
      }

      if (tab === "magias") {
        await openSpellsDialog(selectedActor);
        return;
      }

      if (tab === "ataque") {
        const armas = selectedActor.items.filter(i =>
          i.type === "arma" &&
          i.system?.equipado === 1 &&
          i.system?.equipado2?.type === "hand"
        );

        if (armas.length === 0) {
          ui.notifications.warn("Nenhuma arma equipada na mão principal encontrada.");
          return;
        }

        const abrirJanelaDeAtaque = (arma) => {
          const event = new MouseEvent("click", { shiftKey: true });
          arma.roll({ event });
        };

        if (armas.length === 1) {
          abrirJanelaDeAtaque(armas[0]);
          return;
        }

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
              abrirJanelaDeAtaque(arma);
              d.close();
            });
          }
        });

        d.render(true);
        return;
      }

      if (tab === "pericias") {
        ui.notifications.info("Perícias: posso implementar um seletor com rolagem por atributo e treino, se quiser.");
        return;
      }

      if (tab === "inventario") {
        ui.notifications.info("Inventário: posso listar itens/usar/consumir e equipar/des-equipar por aqui.");
        return;
      }

      ui.notifications.info(`Você clicou em: ${tab}`);
    });
  });
}

// ★ NOVO: diálogo com busca/filtro/favoritos (PODERES)
async function openPowersDialog(selectedActor) {
  const poderes = selectedActor.items.filter(i => i.type === "poder");
  if (poderes.length === 0) {
    ui.notifications.warn("Nenhum poder encontrado.");
    return;
  }

  const actorId = selectedActor.id;
  const favs = getFavsFor(actorId);

  const listHtml = poderes.map(p => {
    const tipo = p.system?.tipo || "—";
    const ativ = p.system?.ativacao || {};
    const exec = ativ.execucao && ativ.execucao !== "passive" ? ativ.execucao : "";
    const cond = ativ.condicao || "";
    const custo = ativ.custo > 0 ? `${ativ.custo} PM` : "";
    const ativacao = [cond, exec, custo].filter(v => v).join(", ") || "—";
    const alcance = p.system?.alcance;
    const alvo = p.system?.alvo;
    const area = p.system?.area;
    const infoExtras = [
      alcance && alcance !== "none" ? `<div><strong>Alcance:</strong> ${alcance}</div>` : "",
      alvo ? `<div><strong>Alvo:</strong> ${alvo}</div>` : "",
      area ? `<div><strong>Área:</strong> ${area}</div>` : ""
    ].join("");
    const fav = favs.some(f => f.type === 'poder' && f.id === p.id);
    const descricao = p.system?.description?.value?.replace(/"/g, '&quot;') || "Sem descrição";

    return `
      <div class="t20-poder-item ${fav ? 'favorited':''}" data-id="${p.id}" data-desc="${descricao}" data-name="${p.name.toLowerCase()}" data-tipo="${String(tipo).toLowerCase()}">
        ${fav ? '<span class="t20-fav-badge">★</span>' : ''}
        <img class="t20-poder-icon" src="${p.img}" />
        <div class="t20-poder-info">
          <div class="t20-poder-nome">${p.name}</div>
          <div><strong>Tipo:</strong> ${tipo}</div>
          <div><strong>Ativação:</strong> ${ativacao}</div>
          ${infoExtras}
        </div>
      </div>
    `;
  }).join("");

  const content = `
    <style>
      .t20-poderes-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        max-height: 500px; overflow-y: auto; font-family: sans-serif;
      }
      .t20-poder-item { display:flex; gap:10px; padding:6px; border:1px solid #666; border-radius:6px; background:#1e1e1e; color:white; align-items:center; cursor:pointer; position:relative; }
      .t20-poder-item:hover { background:#333; }
      .t20-poder-icon { width:36px; height:36px; object-fit:cover; border-radius:4px; border:1px solid #aaa; }
      .t20-poder-info { display:flex; flex-direction:column; font-size:0.85rem; }
      .t20-poder-nome { font-weight:bold; }
      .t20-poder-tooltip { position:fixed; background:#222; color:white; padding:8px; border-radius:6px; max-width:300px; font-size:0.8rem; box-shadow:0 0 6px black; z-index:99999; display:none; pointer-events:none; white-space:normal; }
    </style>

    <div class="t20-filterbar">
      <input type="text" id="t20-search" placeholder="Buscar por nome..." />
      <select id="t20-order">
        <option value="name-asc">Nome (A→Z)</option>
        <option value="name-desc">Nome (Z→A)</option>
        <option value="tipo-asc">Tipo (A→Z)</option>
        <option value="tipo-desc">Tipo (Z→A)</option>
      </select>
    </div>

    <div class="t20-poderes-grid" id="t20-grid">
      ${listHtml}
    </div>
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

      const applyFilters = () => {
        const term = (search.value || "").toLowerCase();
        const cards = Array.from(grid.querySelectorAll(".t20-poder-item"));
        // filtro
        cards.forEach(c => {
          const matches = c.dataset.name.includes(term);
          c.style.display = matches ? "" : "none";
        });
        // ordenação
        const visible = cards.filter(c => c.style.display !== "none");
        const [field, dir] = order.value.split("-");
        visible.sort((a,b) => {
          const av = a.dataset[field] || a.dataset.name;
          const bv = b.dataset[field] || b.dataset.name;
          return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        }).forEach(el => grid.appendChild(el));
      };

      search.addEventListener("input", applyFilters);
      order.addEventListener("change", applyFilters);

      // tooltip + click + favorito via botão direito
      grid.querySelectorAll(".t20-poder-item").forEach(el => {
        el.addEventListener("mouseenter", () => {
          tooltip.innerHTML = el.dataset.desc;
          tooltip.style.display = "block";
        });
        el.addEventListener("mouseleave", () => {
          tooltip.style.display = "none";
        });
        el.addEventListener("mousemove", (e) => {
          tooltip.style.top = `${e.clientY}px`;
          tooltip.style.left = `${e.clientX}px`;
          tooltip.style.transform = "translate(10px, 5px)";
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
            const b = document.createElement("span");
            b.className = "t20-fav-badge";
            b.textContent = "★";
            el.appendChild(b);
          } else {
            el.querySelector(".t20-fav-badge")?.remove();
          }
          // atualiza HUD para refletir favoritos
          renderHUD(selectedActor);
        });
      });
    }
  });

  d.render(true);
}

// ★ NOVO: diálogo com busca/filtro/favoritos (MAGIAS)
async function openSpellsDialog(selectedActor) {
  const magias = selectedActor.items.filter(i => i.type === "magia");
  if (magias.length === 0) {
    ui.notifications.warn("Nenhuma magia encontrada.");
    return;
  }

  const actorId = selectedActor.id;
  const favs = getFavsFor(actorId);

  const listHtml = magias.map(m => {
    const tipo = m.system?.tipo || "—";
    const ativ = m.system?.ativacao || {};
    const exec = ativ.execucao && ativ.execucao !== "passive" ? ativ.execucao : "";
    const cond = ativ.condicao || "";
    const custo = ativ.custo > 0 ? `${ativ.custo} PM` : "";
    const ativacao = [cond, exec, custo].filter(v => v).join(", ") || "—";
    const alcance = m.system?.alcance;
    const alvo = m.system?.alvo;
    const area = m.system?.area;
    const infoExtras = [
      alcance && alcance !== "none" ? `<div><strong>Alcance:</strong> ${alcance}</div>` : "",
      alvo ? `<div><strong>Alvo:</strong> ${alvo}</div>` : "",
      area ? `<div><strong>Área:</strong> ${area}</div>` : ""
    ].join("");
    const fav = favs.some(f => f.type === 'magia' && f.id === m.id);
    const descricao = m.system?.description?.value?.replace(/"/g, '&quot;') || "Sem descrição";

    // nível (se existir) para futura ordenação
    const nivel = String(m.system?.nivel ?? "").toLowerCase();

    return `
      <div class="t20-poder-item ${fav ? 'favorited':''}" data-id="${m.id}" data-desc="${descricao}" data-name="${m.name.toLowerCase()}" data-tipo="${String(tipo).toLowerCase()}" data-nivel="${nivel}">
        ${fav ? '<span class="t20-fav-badge">★</span>' : ''}
        <img class="t20-poder-icon" src="${m.img}" />
        <div class="t20-poder-info">
          <div class="t20-poder-nome">${m.name}</div>
          <div><strong>Tipo:</strong> ${tipo}</div>
          <div><strong>Ativação:</strong> ${ativacao}</div>
          ${infoExtras}
        </div>
      </div>
    `;
  }).join("");

  const content = `
    <style>
      .t20-poderes-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        max-height: 500px; overflow-y: auto; font-family: sans-serif;
      }
      .t20-poder-item { display:flex; gap:10px; padding:6px; border:1px solid #666; border-radius:6px; background:#1e1e1e; color:white; align-items:center; cursor:pointer; position:relative; }
      .t20-poder-item:hover { background:#333; }
      .t20-poder-icon { width:36px; height:36px; object-fit:cover; border-radius:4px; border:1px solid #aaa; }
      .t20-poder-info { display:flex; flex-direction:column; font-size:0.85rem; }
      .t20-poder-nome { font-weight:bold; }
      .t20-poder-tooltip { position:fixed; background:#222; color:white; padding:8px; border-radius:6px; max-width:300px; font-size:0.8rem; box-shadow:0 0 6px black; z-index:99999; display:none; pointer-events:none; white-space:normal; }
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
    </div>

    <div class="t20-poderes-grid" id="t20-grid">
      ${listHtml}
    </div>
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

      const applyFilters = () => {
        const term = (search.value || "").toLowerCase();
        const cards = Array.from(grid.querySelectorAll(".t20-poder-item"));
        // filtro
        cards.forEach(c => {
          const matches = c.dataset.name.includes(term);
          c.style.display = matches ? "" : "none";
        });
        // ordenação
        const visible = cards.filter(c => c.style.display !== "none");
        const [field, dir] = order.value.split("-");
        visible.sort((a,b) => {
          const av = (a.dataset[field] || a.dataset.name) ?? "";
          const bv = (b.dataset[field] || b.dataset.name) ?? "";
          return dir === "asc" ? av.localeCompare(bv, undefined, {numeric:true}) : bv.localeCompare(av, undefined, {numeric:true});
        }).forEach(el => grid.appendChild(el));
      };

      search.addEventListener("input", applyFilters);
      order.addEventListener("change", applyFilters);

      // tooltip + click + favorito
      grid.querySelectorAll(".t20-poder-item").forEach(el => {
        el.addEventListener("mouseenter", () => {
          tooltip.innerHTML = el.dataset.desc;
          tooltip.style.display = "block";
        });
        el.addEventListener("mouseleave", () => {
          tooltip.style.display = "none";
        });
        el.addEventListener("mousemove", (e) => {
          tooltip.style.top = `${e.clientY}px`;
          tooltip.style.left = `${e.clientX}px`;
          tooltip.style.transform = "translate(10px, 5px)";
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
            const b = document.createElement("span");
            b.className = "t20-fav-badge";
            b.textContent = "★";
            el.appendChild(b);
          } else {
            el.querySelector(".t20-fav-badge")?.remove();
          }
          renderHUD(selectedActor);
        });
      });
    }
  });

  d.render(true);
}

// ★ NOVO: drag util
function makeDraggable(hudEl) {
  const inner = hudEl.querySelector(".t20-quickbar-inner");
  if (!inner) return;

  let dragging = false;
  let startX = 0, startY = 0;
  let startLeft = 0, startBottom = 0;

  const onMouseDown = (e) => {
    if (e.target.closest(".t20-button") || e.target.closest(".t20-collapse") || e.target.closest(".t20-fav")) return;
    dragging = true;
    hudEl.classList.add("dragging");
    startX = e.clientX;
    startY = e.clientY;

    // calcular posição atual
    const rect = hudEl.getBoundingClientRect();
    const left = rect.left;
    const bottom = window.innerHeight - rect.bottom;

    startLeft = left;
    startBottom = bottom;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const newLeft = Math.max(0, Math.min(window.innerWidth - hudEl.offsetWidth, startLeft + dx));
    const newBottom = Math.max(0, Math.min(window.innerHeight - hudEl.offsetHeight, startBottom - dy));

    hudEl.style.left = `${newLeft}px`;
    hudEl.style.bottom = `${newBottom}px`;
    hudEl.style.transform = "translateX(0)";
  };

  const onMouseUp = () => {
    if (!dragging) return;
    dragging = false;
    hudEl.classList.remove("dragging");

    // salvar posição
    const left = parseInt(hudEl.style.left || "0", 10);
    const bottom = parseInt(hudEl.style.bottom || "10", 10);
    game.settings.set("hud-combate-t20", "posicaoHUD", { left, bottom });

    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  inner.addEventListener("mousedown", onMouseDown);
}

Hooks.once("ready", async () => {
  if (!game.settings.get("hud-combate-t20", "exibirBarra")) return;

  const controlled = canvas.tokens.controlled[0];
  const actor = controlled?.actor;
  await renderHUD(actor);

  Hooks.on("controlToken", async (token, controlled) => {
    if (controlled) await renderHUD(token.actor);
  });

  Hooks.on("updateActor", async (actorUpdated, data, options, userId) => {
    const current = canvas.tokens.controlled[0];
    if (current?.actor?.id === actorUpdated.id) {
      await renderHUD(actorUpdated);
    }
  });

  Hooks.on("updateItem", async (item, data, options, userId) => {
    const controlled = canvas.tokens.controlled[0];
    if (!controlled) return;
    if (item.parent?.id === controlled.actor.id && ["arma","poder","magia"].includes(item.type)) {
      await renderHUD(controlled.actor);
    }
  });
});
