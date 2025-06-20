function imagenPluginEvent(idPlugin) {
    loadImagenPlugin(idPlugin);
}

function loadImagenPlugin(idPlugin) {
    const imagenPlugin = document.getElementById(`div-${idPlugin}`);
    const data = JSON.parse(imagenPlugin.getAttribute('data-properties'));

    const imagen = imagenPlugin
        ? imagenPlugin.querySelector('#imageContent')
        : null;

        console.log(data.properties.urlStatics,data.properties.config.image);

    if (data.properties !== undefined) {
        // Load data
        imagen.style.backgroundImage = `url('${data.properties.urlStatics}${data.properties.config.image.replace(/\\/g, "/")}')`;
        imagen.style.backgroundSize = 'cover';
        imagen.style.backgroundPosition = 'center';
        imagen.title = data.properties.text.alt;

        // Load class
        imagen.classList.add(data.properties.class);

        // Load events

        // Load CSS
        const styleElement = document.createElement('style');
        styleElement.id = `style-${data.properties.uuid}`;
        styleElement.textContent = data.properties.css;
        document.head.appendChild(styleElement);
    }
}
