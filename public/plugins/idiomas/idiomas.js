const idiomasCss = `
.language-plugin{width:100%;height:100%;display:flex;align-items:center;justify-content:center;box-sizing:border-box}
.language-content{position:relative;display:inline-flex;align-items:center;justify-content:center}
.language-toggle{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:54px;min-height:42px;padding:5px 9px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;color:#374151;cursor:pointer;transition:background-color .2s,border-color .2s,box-shadow .2s,transform .15s}
.language-toggle:hover{background:#f9fafb;border-color:#d1d5db;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.language-toggle:active{transform:scale(.97)}
.language-toggle:focus-visible{outline:2px solid #6366f1;outline-offset:2px}
.language-current-icon{width:27px;height:27px;object-fit:cover;border-radius:50%;display:block}
.language-current-code{font-size:13px;font-weight:600;line-height:1;text-transform:uppercase}
.language-chevron{display:flex;align-items:center;justify-content:center;transition:transform .2s}
.language-toggle.is-open .language-chevron{transform:rotate(180deg)}
.language-options{position:absolute;top:calc(100% + 8px);left:50%;width:180px;max-height:280px;overflow:auto;transform:translateX(-50%);display:flex;flex-direction:column;padding:5px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,.1),0 2px 6px rgba(0,0,0,.05);z-index:999999}
.language-options[hidden]{display:none}
.item-option{display:flex;align-items:center;width:100%;padding:8px;border:0;background:transparent;text-align:left;border-radius:7px;box-sizing:border-box;cursor:pointer}
.item-option:hover,.item-option:focus-visible{background:#f3f4f6;outline:none}
.item-option.active{background:#eef2ff}
.item-option img{width:30px;height:30px;object-fit:cover;border-radius:50%;flex-shrink:0}
.item-option-content{display:flex;flex-direction:column;margin-left:10px;min-width:0}
.item-option-name{font-size:13px;font-weight:600;color:#111827;white-space:nowrap}
.item-option-code{margin-top:2px;font-size:11px;color:#9ca3af;text-transform:uppercase}
.item-option-check{margin-left:auto;color:#6366f1;display:none}
.item-option.active .item-option-check{display:flex}
.language-empty{padding:12px;text-align:center;color:#9ca3af;font-size:12px}
.language-toggle.disabled{opacity:.6;cursor:default}
`;

function idiomasPluginEvent(idPlugin) {
    loadIdiomasPlugin(idPlugin);
}

function loadIdiomasPlugin(idPlugin) {
    const plugin = document.getElementById(`div-${idPlugin}`);
    if (!plugin) return;

    let data;
    try {
        data = JSON.parse(plugin.getAttribute('data-properties') || '{}');
    } catch (error) {
        console.error('Error leyendo data-properties del plugin de idiomas:', error);
        return;
    }

    const properties = data?.properties;
    if (!properties) return;

    const root = plugin.querySelector('#languageContent');
    const button = plugin.querySelector('#toggle-btn');
    const options = plugin.querySelector('#lang-options');
    if (!root || !button || !options) return;

    // Reemplazar handlers previos en caso de que la misma instancia se inicialice otra vez.
    if (root._idiomasCleanup) root._idiomasCleanup();

    const fallbackLanguages = [{
        lang: 'es',
        name: 'Español',
        icon: 'https://flagcdn.com/w40/ec.png'
    }];

    const sourceLanguages = Array.isArray(properties.data) ? properties.data : [];
    const languages = (sourceLanguages.length ? sourceLanguages : fallbackLanguages)
        .filter(item => item && typeof item.lang === 'string' && /^[a-zA-Z]{2,3}(?:-[a-zA-Z]{2,4})?$/.test(item.lang))
        .map(item => ({
            lang: item.lang,
            name: String(item.name || item.label || item.lang),
            icon: idiomasSafeImageUrl(item.icon)
        }));

    const requestedLang = String(properties.lang || 'es');
    let currentLanguage = languages.find(item => item.lang.toLowerCase() === requestedLang.toLowerCase()) || languages[0] || null;

    function renderCurrentLanguage(language) {
        const icon = button.querySelector('.language-current-icon');
        const code = button.querySelector('.language-current-code');
        if (!language) {
            if (icon) { icon.removeAttribute('src'); icon.alt = ''; }
            if (code) code.textContent = '';
            button.title = 'No hay idiomas disponibles';
            return;
        }
        if (icon) {
            if (language.icon) icon.src = language.icon;
            else icon.removeAttribute('src');
            icon.alt = language.name;
        }
        if (code) code.textContent = language.lang;
        button.title = language.name;
    }

    function closeDropdown() {
        options.hidden = true;
        button.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
    }

    function openDropdown() {
        if (!languages.length) return;
        options.hidden = false;
        button.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
    }

    function renderLanguages() {
        options.replaceChildren();

        if (!languages.length) {
            const empty = document.createElement('div');
            empty.className = 'language-empty';
            empty.textContent = 'No hay idiomas disponibles';
            options.appendChild(empty);
            button.disabled = true;
            button.classList.add('disabled');
            return;
        }

        button.disabled = false;
        button.classList.remove('disabled');

        languages.forEach(language => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'item-option';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', String(currentLanguage?.lang === language.lang));
            item.dataset.lang = language.lang;

            if (currentLanguage?.lang === language.lang) item.classList.add('active');

            if (language.icon) {
                const image = document.createElement('img');
                image.src = language.icon;
                image.alt = '';
                image.loading = 'lazy';
                item.appendChild(image);
            }

            const content = document.createElement('span');
            content.className = 'item-option-content';

            const name = document.createElement('span');
            name.className = 'item-option-name';
            name.textContent = language.name;

            const code = document.createElement('span');
            code.className = 'item-option-code';
            code.textContent = language.lang;

            content.append(name, code);
            item.appendChild(content);

            const check = document.createElement('span');
            check.className = 'item-option-check';
            check.setAttribute('aria-hidden', 'true');
            check.textContent = '✓';
            item.appendChild(check);

            item.addEventListener('click', () => selectLanguage(language));
            options.appendChild(item);
        });
    }

    function selectLanguage(language) {
        if (!language) return;

        currentLanguage = language;
        renderCurrentLanguage(language);

        options.querySelectorAll('.item-option').forEach(item => {
            const active = item.dataset.lang === language.lang;
            item.classList.toggle('active', active);
            item.setAttribute('aria-selected', String(active));
        });

        closeDropdown();
        changeLanguage(language.lang);
    }

    function changeLanguage(lang) {
        const url = new URL(window.location.href);
        const segments = url.pathname.split('/');

        // Reemplaza el primer segmento si parece un código de idioma; si no, lo inserta.
        if (segments[1] && /^[a-zA-Z]{2,3}(?:-[a-zA-Z]{2,4})?$/.test(segments[1])) {
            segments[1] = lang;
        } else {
            segments.splice(1, 0, lang);
        }

        url.pathname = segments.join('/');
        window.history.pushState({}, '', url);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }

    function onButtonClick(event) {
        event.preventDefault();
        event.stopPropagation();
        if (options.hidden) openDropdown();
        else closeDropdown();
    }

    function onRootClick(event) {
        const option = event.target.closest('.item-option');
        if (option && options.contains(option)) return;
        // No cerrar al pulsar el propio botón: su handler controla el toggle.
    }

    function onFocusOut(event) {
        if (!root.contains(event.relatedTarget)) closeDropdown();
    }

    function onKeyDown(event) {
        if (event.key === 'Escape') {
            closeDropdown();
            button.focus();
        }
    }

    button.addEventListener('click', onButtonClick);
    root.addEventListener('focusout', onFocusOut);
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('click', onRootClick);

    root._idiomasCleanup = () => {
        button.removeEventListener('click', onButtonClick);
        root.removeEventListener('focusout', onFocusOut);
        root.removeEventListener('keydown', onKeyDown);
        root.removeEventListener('click', onRootClick);
        delete root._idiomasCleanup;
    };

    renderCurrentLanguage(currentLanguage);
    renderLanguages();

    root.className = 'language-plugin';
    if (typeof properties.class === 'string') {
        properties.class.split(/\s+/).filter(Boolean).forEach(name => {
            if (/^[a-zA-Z_][\w-]*$/.test(name)) root.classList.add(name);
        });
    }

    const styleId = `style-${properties.uuid || idPlugin}`;
    document.getElementById(styleId)?.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = idiomasCss;
    document.head.appendChild(style);
}

function idiomasSafeImageUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const url = new URL(value, window.location.href);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}
