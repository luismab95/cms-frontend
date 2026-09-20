const defaultImage = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <rect width="300" height="200" fill="none"/>

  <g transform="translate(150 75)">
    <rect x="-35" y="-25" width="70" height="50" rx="6"
          fill="none"
          stroke="#9ca3af"
          stroke-width="3"/>

    <circle cx="-12" cy="-8" r="6" fill="#9ca3af"/>

    <path d="M-30 18 L-8 -2 L5 10 L15 0 L30 18"
          fill="none"
          stroke="#9ca3af"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"/>
  </g>

  <text x="150" y="145"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="16"
        fill="#6b7280">
    Sin imagen
  </text>
</svg>
`;

function imagenPluginEvent(idPlugin) {
    loadImagenPlugin(idPlugin);
}

function loadImagenPlugin(idPlugin) {
    const imagenPlugin = document.getElementById(`div-${idPlugin}`);
    const data = JSON.parse(imagenPlugin.getAttribute('data-properties'));

    const imagen = imagenPlugin
        ? imagenPlugin.querySelector('#imageContent')
        : null;

    if (data.properties !== undefined) {
        // Load data
        if (!data.properties.config.image || data.properties.config.image === "" || data.properties.config.image === "null") {
            imagen.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(defaultImage)}")`;
            imagen.style.height = '200px';
            imagen.style.width = '200px';
        } else {
            imagen.style.backgroundImage = `url('${data.properties.urlStatics}${data.properties.config.image.replace(/\\/g, "/")}')`;
        }

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
