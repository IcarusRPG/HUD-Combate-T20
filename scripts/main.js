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

Hooks.once("ready", async () => {
  if (!game.settings.get("hud-combate-t20", "exibirBarra")) return;
  if (document.querySelector(".t20-quickbar")) return;

  const controlled = canvas.tokens.controlled[0];
  if (!controlled || !controlled.actor) {
    ui.notifications.warn("Nenhum token controlado para mostrar HUD.");
    return;
  }

  const actor = controlled.actor;

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
    pv: actor.system?.attributes?.pv?.value ?? "—",
    pm: actor.system?.attributes?.pm?.value ?? "—",
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
});
