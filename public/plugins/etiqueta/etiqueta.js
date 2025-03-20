function etiquetaPluginEvent(idPlugin) {
    loadEtiquetaPlugin(idPlugin);
}

function loadEtiquetaPlugin(idPlugin) {
    const etiquetaPlugin = document.getElementById(`div-${idPlugin}`);
    const data = JSON.parse(etiquetaPlugin.getAttribute('data-properties'));

    const etiqueta = etiquetaPlugin
        ? etiquetaPlugin.querySelector('#labelContent')
        : null;

    if (data.properties !== undefined) {
        // Load data
        etiqueta.innerText = data.properties.text.etiqueta;

        // Load class
        etiqueta.classList.add(data.properties.class);

        // Load events

        // Load CSS
        const styleElement = document.createElement('style');
        styleElement.id = `style-${data.properties.uuid}`;
        styleElement.textContent = data.properties.css;
        document.head.appendChild(styleElement);
    }
}
