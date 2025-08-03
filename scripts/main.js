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

  const buttons = [
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
    def: actor.system?.defesa?.total ?? "—"
  };

  const html = await renderTemplate("modules/hud-combate-t20/templates/quick-actions.hbs", context);

  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container.firstElementChild);

  document.querySelectorAll(".t20-button").forEach(button => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;
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
