const imagenDefaultSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <rect width="300" height="200" fill="#f9fafb"/>
  <g transform="translate(150 75)">
    <rect x="-35" y="-25" width="70" height="50" rx="6" fill="none" stroke="#9ca3af" stroke-width="3"/>
    <circle cx="-12" cy="-8" r="6" fill="#9ca3af"/>
    <path d="M-30 18 L-8 -2 L5 10 L15 0 L30 18" fill="none" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="150" y="145" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">Sin imagen</text>
</svg>`;

function imagenPluginEvent(idPlugin) {
    loadImagenPlugin(idPlugin);
}

function loadImagenPlugin(idPlugin) {
    const plugin = document.getElementById(`div-${idPlugin}`);
    if (!plugin) return;

    const container = plugin.querySelector('#imageContent');
    const image = plugin.querySelector('#imageElement');
    if (!container || !image) return;

    let data;
    try {
        data = JSON.parse(plugin.getAttribute('data-properties') || '{}');
    } catch (error) {
        console.error('Configuración inválida del plugin Imagen:', error);
        return;
    }

    const properties = data?.properties;
    if (!properties) return;

    const config = properties.config ?? {};
    const imagePath = config.image;
    const alt = String(properties.text?.alt ?? '');

    container.className = '';
    if (typeof properties.class === 'string') {
        properties.class.split(/\s+/).filter(Boolean).forEach(name => {
            if (/^[a-zA-Z_][\w-]*$/.test(name)) container.classList.add(name);
        });
    }

    image.alt = alt;
    image.title = alt;
    image.style.width = '';
    image.style.height = '';
    image.style.objectFit = 'cover';

    const fallback = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(imagenDefaultSvg)}`;
    const imageUrl = imagenSafeUrl(imagePath, properties.urlStatics);

    image.onerror = () => {
        image.onerror = null;
        image.src = fallback;
        image.style.width = '200px';
        image.style.height = '200px';
        image.style.objectFit = 'contain';
    };

    if (imageUrl) {
        image.src = imageUrl;
    } else {
        image.onerror = null;
        image.src = fallback;
        image.style.width = '200px';
        image.style.height = '200px';
        image.style.objectFit = 'contain';
    }
}

function imagenSafeUrl(value, baseUrl) {
    if (typeof value !== 'string' || !value.trim() || value === 'null') return null;

    try {
        const base = baseUrl ? new URL(baseUrl, window.location.origin) : new URL('/', window.location.origin);
        const url = new URL(value.trim().replace(/\\/g, '/'), base);
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        return url.href;
    } catch {
        return null;
    }
}
