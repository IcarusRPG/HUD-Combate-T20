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
    button.addEventListener("click", async () => {
      const tab = button.dataset.tab;
      const selectedActor = canvas.tokens.controlled[0]?.actor;
      if (!selectedActor) return;

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
			position: relative;
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
			position: fixed;
			background: #222;
			color: white;
			padding: 8px;
			border-radius: 6px;
			max-width: 300px;
			font-size: 0.8rem;
			box-shadow: 0 0 6px black;
			z-index: 99999;
			display: none;
			pointer-events: none;
			white-space: normal;
		  }
		</style>

		<div class="t20-poderes-grid">
		  ${poderes.map(p => {
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

			const descricao = p.system?.description?.value?.replace(/"/g, '&quot;') || "Sem descrição";

			return `
			  <div class="t20-poder-item" data-id="${p.id}" data-desc="${descricao}">
				<img class="t20-poder-icon" src="${p.img}" />
				<div class="t20-poder-info">
				  <div class="t20-poder-nome">${p.name}</div>
				  <div><strong>Tipo:</strong> ${tipo}</div>
				  <div><strong>Ativação:</strong> ${ativacao}</div>
				  ${infoExtras}
				</div>
			  </div>
			`;
		  }).join("")}
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
