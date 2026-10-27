function parrafoPluginEvent(idPlugin) {
    loadParrafoPlugin(idPlugin);
}

function loadParrafoPlugin(idPlugin) {
    const plugin = document.getElementById(`div-${idPlugin}`);
    if (!plugin) return;

    const paragraph = plugin.querySelector('#paragraphContent');
    if (!paragraph) return;

    let data;
    try {
        data = JSON.parse(plugin.getAttribute('data-properties') || '{}');
    } catch (error) {
        console.error('Configuración inválida del plugin Párrafo:', error);
        return;
    }

    const properties = data?.properties;
    if (!properties) return;

    paragraph.textContent = String(properties.text?.parrafo ?? '');
    paragraph.className = '';

    if (typeof properties.class === 'string') {
        properties.class.split(/\s+/).filter(Boolean).forEach(name => {
            if (/^[a-zA-Z_][\w-]*$/.test(name)) paragraph.classList.add(name);
        });
    }
}
