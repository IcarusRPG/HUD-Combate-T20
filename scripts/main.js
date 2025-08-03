Hooks.on('ready', () => {
  const actor = canvas.tokens.controlled[0]?.actor;
  if (!actor) return;

  const hud = document.createElement('div');
  hud.id = 'hud-combate-t20';

  const name = actor.name;
  const img = actor.img;
  const pvAtual = actor.system.attributes.pv.value;
  const pvTotal = actor.system.attributes.pv.max;
  const pmAtual = actor.system.attributes.pm.value;
  const pmTotal = actor.system.attributes.pm.max;
  const defesa = actor.system.attributes.defesa.value ?? '—';

  hud.innerHTML = `
    <div class="hud-container">
      <div class="hud-left">
        <img class="hud-img" src="${img}" />
        <div class="hud-info">
          <strong>${name}</strong><br>
          PV: ${pvAtual} / ${pvTotal}<br>
          PM: ${pmAtual} / ${pmTotal}<br>
          DEF: ${defesa}
        </div>
      </div>
      <div class="hud-buttons">
        <button id="btn-pericias"><img src="modules/hud-combate-t20/img/pericias.png" title="Perícias" /></button>
        <button id="btn-poderes"><img src="modules/hud-combate-t20/img/poderes.png" title="Poderes" /></button>
        <button id="btn-magias"><img src="modules/hud-combate-t20/img/magias.png" title="Magias" /></button>
        <button id="btn-inventario"><img src="modules/hud-combate-t20/img/inventario.png" title="Inventário" /></button>
      </div>
    </div>
  `;

  document.body.appendChild(hud);

  document.getElementById('btn-pericias').addEventListener('click', () => {
    const pericias = actor.system.pericias;
    const options = Object.entries(pericias)
      .map(([key, value]) => `<option value="${key}">${key.charAt(0).toUpperCase() + key.slice(1)} (${value.total})</option>`)
      .join('');

    const content = `
      <form>
        <div class="form-group">
          <label>Escolha a Perícia:</label>
          <select id="pericia-select">${options}</select>
        </div>
        <div class="form-group">
          <label id="pericia-valor">Valor: ${Object.values(pericias)[0].total}</label>
        </div>
      </form>
    `;

    new Dialog({
      title: 'Teste de Perícia',
      content,
      buttons: {
        roll: {
          label: '<i class="fas fa-dice-d20"></i> Rolar Teste',
          callback: () => {
            const key = document.getElementById('pericia-select').value;
            const bonus = actor.system.pericias[key].total;
            const roll = new Roll(`1d20 + ${bonus}`);
            roll.evaluate({ async: false });
            roll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor }),
              flavor: `Teste de ${key.charAt(0).toUpperCase() + key.slice(1)}`
            });
          }
        }
      },
      render: html => {
        html.find('#pericia-select').on('change', ev => {
          const key = ev.target.value;
          const val = actor.system.pericias[key].total;
          html.find('#pericia-valor').text(`Valor: ${val}`);
        });
      }
    }).render(true);
  });

  document.getElementById('btn-poderes').addEventListener('click', () => {
    actor.sheet.render(true);
    actor.sheet._tabs.activate('features');
  });

  document.getElementById('btn-magias').addEventListener('click', () => {
    actor.sheet.render(true);
    actor.sheet._tabs.activate('spells');
  });

  document.getElementById('btn-inventario').addEventListener('click', () => {
    actor.sheet.render(true);
    actor.sheet._tabs.activate('inventory');
  });
});
