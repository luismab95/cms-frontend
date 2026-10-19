function parrafoPluginEvent(idPlugin) {
    loadParrafoPlugin(idPlugin);
}

function loadParrafoPlugin(idPlugin) {
    const parrafoPlugin = document.getElementById(`div-${idPlugin}`);
    const data = JSON.parse(parrafoPlugin.getAttribute('data-properties'));

    const parrafo = parrafoPlugin
        ? parrafoPlugin.querySelector('#paragraphContent')
        : null;

    if (data.properties !== undefined) {
        // Load data
        parrafo.innerText = data.properties.text.parrafo;

        // Load class
        parrafo.classList.add(data.properties.class);

        // Load events

    }
}
