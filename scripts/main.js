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

  const armas = actor.items.filter(i => i.type === "arma" && i.system?.equipada);
  const armaEquipada = armas[0];
  const armaIcon = armaEquipada?.img ?? "icons/svg/sword.svg"; // fallback padrão

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
              await roll.roll({ async: true });

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

      if (tab === "ataque") {
        const armas = selectedActor.items.filter(i => i.type === "arma" && i.system?.equipada);
        if (armas.length === 0) {
          ui.notifications.warn("Nenhuma arma equipada encontrada.");
          return;
        }

        const arma = armas[0];
        const ataque = arma.system?.ataque ?? "1d20 + 0";
        const dano = arma.system?.dano ?? "1d6";

        const ataqueRoll = new Roll(ataque);
        const danoRoll = new Roll(dano);

        Promise.all([ataqueRoll.roll({ async: true }), danoRoll.roll({ async: true })]).then(async () => {
          if (game.dice3d) {
            await game.dice3d.showForRoll(ataqueRoll, game.user, true);
            await game.dice3d.showForRoll(danoRoll, game.user, true);
          }

          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: selectedActor }),
            flavor: `Ataque com ${arma.name}`,
            content: `
              <strong>Rolagem de Ataque:</strong> ${ataqueRoll.total} <br/>
              <em>${ataqueRoll.formula}</em><br/><br/>
              <strong>Dano:</strong> ${danoRoll.total} <br/>
              <em>${danoRoll.formula}</em>
            `
          });
        });

        return;
      }

      // Placeholder para outras abas
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
});
