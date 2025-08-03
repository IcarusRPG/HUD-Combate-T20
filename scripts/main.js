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

  const buttons = [
    { id: "pericias", label: "PERÍCIAS", icon: "modules/hud-combate-t20/img/pericias.png", tab: "pericias" },
    { id: "poderes", label: "PODERES", icon: "modules/hud-combate-t20/img/poderes.png", tab: "poderes" },
    { id: "magias", label: "MAGIAS", icon: "modules/hud-combate-t20/img/magias.png", tab: "magias" },
    { id: "inventario", label: "INVENTÁRIO", icon: "modules/hud-combate-t20/img/inventario.png", tab: "inventario" }
  ];

  const html = await renderTemplate("modules/hud-combate-t20/templates/quick-actions.hbs", { buttons });

  // Injeta diretamente no body da interface
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container.firstElementChild);

  // Eventos dos botões — aqui você define o que eles devem fazer
  document.querySelectorAll(".t20-button").forEach(button => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;
      ui.notifications.info(`Você clicou em: ${tab}`);
      // Você pode aqui adicionar funcionalidades reais depois
    });
  });
});
