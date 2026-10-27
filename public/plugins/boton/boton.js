function botonPluginEvent(idPlugin) {
    loadBotonPlugin(idPlugin);
}

function loadBotonPlugin(idPlugin) {
    const plugin = document.getElementById(`div-${idPlugin}`);
    if (!plugin) return;

    const button = plugin.querySelector('#buttonContent');
    if (!button) return;

    let data;
    try {
        data = JSON.parse(plugin.getAttribute('data-properties') || '{}');
    } catch (error) {
        console.error('Configuración inválida del plugin Botón:', error);
        return;
    }

    const properties = data?.properties;
    if (!properties) return;

    const config = properties.config ?? {};
    const text = properties.text ?? {};
    const label = String(text.etiqueta ?? '');
    const imagePath = config.image;

    button.replaceChildren();
    button.disabled = false;

    if (imagePath && imagePath !== 'null') {
        const imageUrl = botonSafeUrl(imagePath, properties.urlStatics);
        if (imageUrl) {
            const image = document.createElement('img');
            image.src = imageUrl;
            image.alt = '';
            image.width = 15;
            image.style.marginRight = '6px';
            button.appendChild(image);
        }
    }

    button.appendChild(document.createTextNode(label));

    button.className = '';
    if (typeof properties.class === 'string') {
        properties.class.split(/\s+/).filter(Boolean).forEach(name => {
            if (/^[a-zA-Z_][\w-]*$/.test(name)) button.classList.add(name);
        });
    }

    const target = typeof config.target === 'string' && config.target.trim()
        ? config.target.trim()
        : '_self';
    const validTarget = /^_(self|blank|parent|top)$/i.test(target)
        || /^[A-Za-z][A-Za-z0-9_-]*$/.test(target);
    const url = botonSafeNavigationUrl(config.goTo);

    if (!url || !validTarget) {
        button.disabled = true;
        button.removeAttribute('title');
        return;
    }

    button.disabled = false;

    button.onclick = () => {
        if (target.toLowerCase() === '_self') {
            window.location.assign(url);
            return;
        }

        if (target.toLowerCase() === '_blank') {
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }

        window.open(url, target);
    };
}

function botonSafeNavigationUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;

    try {
        const url = new URL(value.trim(), window.location.href);
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        return url.href;
    } catch {
        return null;
    }
}

function botonSafeUrl(value, baseUrl) {
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
