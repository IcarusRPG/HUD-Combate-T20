// REGISTRA O MENU NAS CONFIGURAÇÕES
Hooks.once("init", () => {
  game.settings.register("hud-combate-t20", "exibirBarra", {
    name: "Ativar HUD de Combate T20",
    hint: "Exibe ou oculta a barra de ações rápidas para personagens.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
});

// RENDERIZA A BARRA SE A CONFIGURAÇÃO ESTIVER ATIVA
Hooks.on("renderActorSheet", async (app, html, data) => {
  if (!game.settings.get("hud-combate-t20", "exibirBarra")) return;
  if (html.find(".t20-quickbar").length > 0) return;

  const buttons = [
    { id: "pericias", label: "PERÍCIAS", icon: "modules/hud-combate-t20/img/pericias.png", tab: "pericias" },
    { id: "poderes", label: "PODERES", icon: "modules/hud-combate-t20/img/poderes.png", tab: "poderes" },
    { id: "magias", label: "MAGIAS", icon: "modules/hud-combate-t20/img/magias.png", tab: "magias" },
    { id: "inventario", label: "INVENTÁRIO", icon: "modules/hud-combate-t20/img/inventario.png", tab: "inventario" }
  ];

  const quickbarHtml = await renderTemplate(
    "modules/hud-combate-t20/templates/quick-actions.hbs",
    { buttons }
  );

  html.find(".sheet-body").before(quickbarHtml);

  html.find(".t20-button").click(function () {
    const tab = $(this).data("tab");
    app._tabs[0].activate(tab);
  });
});