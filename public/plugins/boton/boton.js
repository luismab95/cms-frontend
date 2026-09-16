// JS
function botonPluginEvent(idPlugin) {
    loadBotonPlugin(idPlugin);
}

function loadBotonPlugin(idPlugin) {
    const buttonPlugin = document.getElementById(`div-${idPlugin}`);
    const data = JSON.parse(buttonPlugin.getAttribute('data-properties'));

    const button = buttonPlugin
        ? buttonPlugin.querySelector('#buttonContent')
        : null;

    if (data.properties !== undefined) {
        // Load data
        if (
            data.properties.config.image === '' ||
            data.properties.config.image === null ||
            data.properties.config.image === undefined
        ) {
            button.innerText = data.properties.text.etiqueta;
        } else {
            button.innerHTML = `
                    <img style="width:15px; margin-right: 6px;" src="${data.properties.urlStatics}${data.properties.config.image}" alt="${data.properties.text.etiqueta}">
                    ${data.properties.text.etiqueta}
                `;
        }

        // Load class
        button.classList.add(data.properties.class);

        // Load events
        button.addEventListener('click', function () {
            window.open(
                data.properties.config.goTo,
                data.properties.config.target
            );
        });

        // Load CSS
        const styleElement = document.createElement('style');
        styleElement.id = `style-${data.properties.uuid}`;
        styleElement.textContent = data.properties.css;
        document.head.appendChild(styleElement);
    }
}
