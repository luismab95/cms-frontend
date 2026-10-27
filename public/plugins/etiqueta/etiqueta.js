function etiquetaPluginEvent(idPlugin) {
    loadEtiquetaPlugin(idPlugin);
}

function loadEtiquetaPlugin(idPlugin) {
    const plugin = document.getElementById(`div-${idPlugin}`);
    if (!plugin) return;

    const label = plugin.querySelector('#labelContent');
    if (!label) return;

    let data;
    try {
        data = JSON.parse(plugin.getAttribute('data-properties') || '{}');
    } catch (error) {
        console.error('Configuración inválida del plugin Etiqueta:', error);
        return;
    }

    const properties = data?.properties;
    if (!properties) return;

    label.textContent = String(properties.text?.etiqueta ?? '');
    label.className = '';

    if (typeof properties.class === 'string') {
        properties.class.split(/\s+/).filter(Boolean).forEach(name => {
            if (/^[a-zA-Z_][\w-]*$/.test(name)) label.classList.add(name);
        });
    }
}
