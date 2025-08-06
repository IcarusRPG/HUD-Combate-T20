Hooks.once("init", () => {
  game.settings.register("hud-combate-t20", "exibirBarra", {
    name: "Ativar HUD de Combate T20",
    hint: "Exibe ou oculta a barra de ações rápidas flutuante na tela.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
});

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
    { id: "ataque", label: "ATAQUE", icon: armaIcon, tab: "ataque" },
    { id: "pericias", label: "PERÍCIAS", icon: "modules/hud-combate-t20/img/pericias.png", tab: "pericias" },
    { id: "poderes", label: "PODERES", icon: "modules/hud-combate-t20/img/poderes.png", tab: "poderes" },
    { id: "magias", label: "MAGIAS", icon: "modules/hud-combate-t20/img/magias.png", tab: "magias" },
    { id: "inventario", label: "INVENTÁRIO", icon: "modules/hud-combate-t20/img/inventario.png", tab: "inventario" }
  ];

  const context = {
    buttons,
    img: actor.img,
    nome: actor.name,
    pv: `${actor.system?.attributes?.pv?.value ?? "—"} / ${actor.system?.attributes?.pv?.max ?? "—"}`,
    pm: `${actor.system?.attributes?.pm?.value ?? "—"} / ${actor.system?.attributes?.pm?.max ?? "—"}`,
    def: actor.system?.attributes?.defesa?.value ?? "—"
  };

  const html = await renderTemplate("modules/hud-combate-t20/templates/quick-actions.hbs", context);

  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container.firstElementChild);

  document.querySelectorAll(".t20-button").forEach(button => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;
      const selectedActor = canvas.tokens.controlled[0]?.actor;
      if (!selectedActor) return;

      if (tab === "pericias") {
        const pericias = selectedActor.system.pericias;
        const periciaList = Object.entries(pericias).map(([key, value]) => ({
          key,
          label: game.i18n.localize(value.label || key),
          value: value.value
        }));

        const dialogContent = `
          <div style="display: flex; flex-direction: column; gap: 10px; font-family: sans-serif;">
            <label for="periciaSelect">Escolha a Perícia:</label>
            <select id="periciaSelect">
              ${periciaList.map(p => `<option value="${p.key}">${p.label}</option>`).join("")}
            </select>
            <div id="periciaValor">Valor: ${periciaList[0].value}</div>
            <button id="rolarTeste">🎲 Rolar Teste</button>
          </div>
        `;

        const d = new Dialog({
          title: "Teste de Perícia",
          content: dialogContent,
          buttons: {
            fechar: { label: "Fechar" }
          },
          render: (html) => {
            const select = html[0].querySelector("#periciaSelect");
            const valorSpan = html[0].querySelector("#periciaValor");
            const rolarBtn = html[0].querySelector("#rolarTeste");

            select.addEventListener("change", () => {
              const selKey = select.value;
              const valor = selectedActor.system.pericias[selKey]?.value ?? 0;
              valorSpan.innerText = `Valor: ${valor}`;
            });

            rolarBtn.addEventListener("click", async () => {
              const selKey = select.value;
              const pericia = selectedActor.system.pericias[selKey];
              const valor = pericia?.value ?? 0;

              const roll = new Roll(`1d20 + ${valor}`);
              await roll.evaluate();

              if (game.dice3d) await game.dice3d.showForRoll(roll, game.user, true);

              roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: selectedActor }),
                flavor: `Teste de ${game.i18n.localize(pericia.label || selKey)}`
              });

              d.close();
            });
          }
        });

        d.render(true);
        return;
      }

      if (tab === "poderes") {
        const poderes = selectedActor.items.filter(i => i.type === "poder");

        if (poderes.length === 0) {
          ui.notifications.warn("Nenhum poder encontrado.");
          return;
        }

        const content = `
          <style>
            .t20-poderes-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              max-height: 500px;
              overflow-y: auto;
              font-family: sans-serif;
            }
            .t20-poder-item {
              display: flex;
              gap: 10px;
              padding: 6px;
              border: 1px solid #666;
              border-radius: 6px;
              background: #1e1e1e;
              color: white;
              align-items: center;
              cursor: pointer;
            }
            .t20-poder-item:hover {
              background: #333;
            }
            .t20-poder-icon {
              width: 36px;
              height: 36px;
              object-fit: cover;
              border-radius: 4px;
              border: 1px solid #aaa;
            }
            .t20-poder-info {
              display: flex;
              flex-direction: column;
              font-size: 0.85rem;
            }
            .t20-poder-nome {
              font-weight: bold;
            }
            .t20-poder-tooltip {
              position: absolute;
              background: #222;
              color: white;
              padding: 8px;
              border-radius: 6px;
              max-width: 300px;
              font-size: 0.8rem;
              box-shadow: 0 0 6px black;
              z-index: 99999;
              display: none;
            }
          </style>

          <div class="t20-poderes-grid">
            ${poderes.map(p => `
              <div class="t20-poder-item" 
                   data-id="${p.id}" 
                   data-desc="${p.system.descricao?.replace(/"/g, '&quot;') || 'Sem descrição'}"
                   title="${p.name}">
                <img class="t20-poder-icon" src="${p.img}" />
                <div class="t20-poder-info">
                  <div class="t20-poder-nome">${p.name}</div>
                  <div><strong>Tipo:</strong> ${p.system.tipo || "—"}</div>
                  <div><strong>Ativação:</strong> ${p.system.ativacao || "—"}</div>
                </div>
              </div>
            `).join("")}
          </div>
          <div class="t20-poder-tooltip" id="tooltip-poder"></div>
        `;

        const d = new Dialog({
          title: "Poderes",
          content,
          buttons: { fechar: { label: "Fechar" } },
          render: (html) => {
            const tooltip = html[0].querySelector("#tooltip-poder");

            html[0].querySelectorAll(".t20-poder-item").forEach(el => {
              el.addEventListener("mouseenter", (e) => {
                tooltip.innerText = el.dataset.desc;
                tooltip.style.display = "block";
              });

              el.addEventListener("mouseleave", () => {
                tooltip.style.display = "none";
              });

              el.addEventListener("mousemove", (e) => {
                tooltip.style.top = `${e.clientY + 12}px`;
                tooltip.style.left = `${e.clientX + 12}px`;
              });

              el.addEventListener("click", () => {
                const poderId = el.dataset.id;
                const poder = selectedActor.items.get(poderId);
                const event = new MouseEvent("click", { shiftKey: true });
                poder?.roll({ event });
                d.close();
              });
            });
          }
        });

        d.render(true);
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

      ui.notifications.info(`Você clicou em: ${tab}`);
    });
  });
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

    if (item.parent?.id === controlled.actor.id && item.type === "arma") {
      await renderHUD(controlled.actor);
    }
  });
});
