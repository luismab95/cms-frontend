const css = `
.language-plugin {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.language-content {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

/* Toggle */

.language-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;

    min-width: 54px;
    height: 42px;

    padding: 5px 9px;

    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;

    color: #374151;

    cursor: pointer;

    transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.15s ease;
}

.language-toggle:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.language-toggle:active {
    transform: scale(0.97);
}

.language-toggle:focus-visible {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
}

/* Current language */

.language-current-icon {
    width: 27px;
    height: 27px;

    object-fit: cover;

    border-radius: 50%;

    display: block;
}

.language-current-code {
    font-size: 13px;
    font-weight: 600;
    line-height: 1;

    text-transform: uppercase;
}

/* Chevron */

.language-chevron {
    display: flex;
    align-items: center;
    justify-content: center;

    transition: transform 0.2s ease;
}

.language-toggle.is-open .language-chevron {
    transform: rotate(180deg);
}

/* Dropdown */

.language-options {
    position: absolute;

    top: calc(100% + 8px);
    left: 50%;

    width: 180px;

    transform:
        translateX(-50%)
        translateY(-6px);

    transform-origin: top center;

    display: flex;
    flex-direction: column;

    padding: 5px;

    background: #ffffff;

    border: 1px solid #e5e7eb;
    border-radius: 10px;

    box-shadow:
        0 10px 25px rgba(0, 0, 0, 0.10),
        0 2px 6px rgba(0, 0, 0, 0.05);

    opacity: 0;
    visibility: hidden;
    pointer-events: none;

    transition:
        opacity 0.18s ease,
        transform 0.18s ease,
        visibility 0.18s ease;

    z-index: 999999;
}

.language-options.show {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;

    transform:
        translateX(-50%)
        translateY(0);
}

/* Option */

.item-option {
    display: flex;
    align-items: center;

    width: 100%;

    padding: 8px;

    border-radius: 7px;

    box-sizing: border-box;

    cursor: pointer;

    transition:
        background-color 0.15s ease;
}

.item-option:hover {
    background: #f3f4f6;
}

.item-option.active {
    background: #eef2ff;
}

/* Icon */

.item-option img {
    width: 30px;
    height: 30px;

    object-fit: cover;

    border-radius: 50%;

    flex-shrink: 0;
}

/* Text */

.item-option-content {
    display: flex;
    flex-direction: column;

    margin-left: 10px;

    min-width: 0;
}

.item-option-name {
    font-size: 13px;
    font-weight: 600;

    color: #111827;

    white-space: nowrap;
}

.item-option-code {
    margin-top: 2px;

    font-size: 11px;

    color: #9ca3af;

    text-transform: uppercase;
}

/* Check */

.item-option-check {
    margin-left: auto;

    color: #6366f1;

    display: none;
}

.item-option.active .item-option-check {
    display: flex;
}

/* Empty state */

.language-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    gap: 6px;

    min-height: 70px;

    padding: 12px;

    text-align: center;

    color: #9ca3af;

    font-size: 12px;
}

.language-empty svg {
    width: 20px;
    height: 20px;
}

/* Disabled */

.language-toggle.disabled {
    opacity: 0.6;
    cursor: default;
}

.language-toggle.disabled:hover {
    background: #ffffff;
    border-color: #e5e7eb;
    box-shadow: none;
}
`;

function idiomasPluginEvent(idPlugin) {
    loadIdiomasPlugin(idPlugin);
}

function loadIdiomasPlugin(idPlugin) {

    const idiomasPlugin = document.getElementById(`div-${idPlugin}`);
    if (!idiomasPlugin) {
        return;
    }

    let data = {};

    try {
        data = JSON.parse(
            idiomasPlugin.getAttribute('data-properties') || '{}'
        );
    } catch (error) {
        console.error(
            'Error leyendo data-properties del plugin de idiomas:',
            error
        );
        return;
    }

    const properties = data?.properties;

    if (!properties) {
        return;
    }

    /*
     * ---------------------------------------------
     * Elementos
     * ---------------------------------------------
     */

    const idiomas = idiomasPlugin.querySelector('#languageContent');
    const btn = idiomasPlugin.querySelector('#toggle-btn');
    const langOptions = idiomasPlugin.querySelector('#lang-options');
    if (!idiomas || !btn || !langOptions) {
        return;
    }

    /*
     * ---------------------------------------------
     * Idiomas
     * ---------------------------------------------
     */

    const defaultLanguages = [
        {
            lang: 'es',
            name: 'Español',
            icon: 'https://flagcdn.com/w40/ec.png'
        },
    ];
    const propertiesData = Array.isArray(properties.data)
        ? properties.data
        : [];

    /*
     * Si no vienen idiomas configurados,
     * utilizamos los idiomas por defecto.
     */
    const languages =
        propertiesData.length > 0
            ? propertiesData
            : defaultLanguages;

    /*
     * ---------------------------------------------
     * Idioma guardado
     * ---------------------------------------------
     */

    const savedLang = properties.lang ?? 'es';
    const currentLanguage =
        languages.find(
            language => language.lang === savedLang
        ) || languages[0];

    /*
     * ---------------------------------------------
     * Render actual
     * ---------------------------------------------
     */

    function renderCurrentLanguage(language) {

        if (!language) {
            return;
        }

        const currentIcon =
            btn.querySelector('.language-current-icon');
        const currentCode =
            btn.querySelector('.language-current-code');

        if (currentIcon) {
            currentIcon.src = language.icon || '';
            currentIcon.alt = language.name || language.lang;
        }

        if (currentCode) {
            currentCode.textContent =
                language.lang || '';
        }

        btn.title =
            language.name ||
            language.lang ||
            'Seleccionar idioma';
    }

    /*
     * ---------------------------------------------
     * Render opciones
     * ---------------------------------------------
     */

    function renderLanguages() {

        langOptions.innerHTML = '';

        if (!languages.length) {

            langOptions.innerHTML = `
                <div class="language-empty">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                            stroke="currentColor"
                            stroke-width="2"
                        />

                        <path
                            d="M8 12H16"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                    </svg>

                    <span>
                        No hay idiomas disponibles
                    </span>
                </div>
            `;

            btn.classList.add('disabled');

            return;
        }

        btn.classList.remove('disabled');

        languages.forEach(language => {

            const itemOption =
                document.createElement('div');

            itemOption.className = 'item-option';

            itemOption.setAttribute(
                'role',
                'option'
            );

            itemOption.setAttribute(
                'tabindex',
                '0'
            );

            itemOption.setAttribute(
                'data-lang',
                language.lang
            );

            /*
             * Icon
             */

            const img =
                document.createElement('img');

            img.src =
                language.icon || '';

            img.alt =
                language.name ||
                language.lang;

            img.loading = 'lazy';

            /*
             * Content
             */

            const content =
                document.createElement('div');

            content.className =
                'item-option-content';

            const name =
                document.createElement('span');

            name.className =
                'item-option-name';

            name.textContent =
                language.name ||
                language.label ||
                language.lang;

            const code =
                document.createElement('span');

            code.className =
                'item-option-code';

            code.textContent =
                language.lang;

            content.appendChild(name);
            content.appendChild(code);

            /*
             * Check
             */

            const check =
                document.createElement('span');

            check.className =
                'item-option-check';

            check.innerHTML = `
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M5 12L10 17L19 7"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `;

            /*
             * Construir item
             */

            itemOption.appendChild(img);
            itemOption.appendChild(content);
            itemOption.appendChild(check);

            /*
             * Estado activo
             */

            if (
                currentLanguage &&
                currentLanguage.lang === language.lang
            ) {
                itemOption.classList.add('active');

                itemOption.setAttribute(
                    'aria-selected',
                    'true'
                );
            } else {
                itemOption.setAttribute(
                    'aria-selected',
                    'false'
                );
            }

            /*
             * Click
             */

            itemOption.addEventListener(
                'click',
                () => selectLanguage(language)
            );

            /*
             * Keyboard
             */

            itemOption.addEventListener(
                'keydown',
                event => {

                    if (
                        event.key === 'Enter' ||
                        event.key === ' '
                    ) {
                        event.preventDefault();

                        selectLanguage(language);
                    }
                }
            );

            langOptions.appendChild(itemOption);
        });
    }

    /*
     * ---------------------------------------------
     * Seleccionar idioma
     * ---------------------------------------------
     */

    function selectLanguage(language) {

        if (!language) {
            return;
        }


        renderCurrentLanguage(language);

        /*
         * Actualizar activo
         */

        const items =
            langOptions.querySelectorAll(
                '.item-option'
            );

        items.forEach(item => {
            const itemLang =
                item.getAttribute('data-lang');
            const active =
                itemLang === language.lang;
            item.classList.toggle(
                'active',
                active
            );
            item.setAttribute(
                'aria-selected',
                active ? 'true' : 'false'
            );
        });

        closeDropdown();

        /*
         * Evento personalizado.
         *
         * Esto permite que el CMS pueda reaccionar
         * al cambio de idioma.
         */

        changeLanguage(language.lang);
    }

    /*
      * ---------------------------------------------
      * change language
      * ---------------------------------------------
      */
    function changeLanguage(lang) {
        const path = window.location.pathname;
        const segments = path.split('/');
        segments[1] = lang;
        const newPath = segments.join('/');
        window.history.pushState({}, '', newPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }

    /*
     * ---------------------------------------------
     * Dropdown
     * ---------------------------------------------
     */

    function openDropdown() {

        if (!languages.length) {
            return;
        }

        langOptions.classList.add('show');

        btn.classList.add('is-open');

        btn.setAttribute(
            'aria-expanded',
            'true'
        );
    }

    function closeDropdown() {

        langOptions.classList.remove('show');

        btn.classList.remove('is-open');

        btn.setAttribute(
            'aria-expanded',
            'false'
        );
    }

    function toggleDropdown() {

        if (
            langOptions.classList.contains('show')
        ) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    /*
     * ---------------------------------------------
     * Eventos
     * ---------------------------------------------
     */

    btn.addEventListener(
        'click',
        event => {

            event.preventDefault();
            event.stopPropagation();

            toggleDropdown();
        }
    );

    document.addEventListener(
        'click',
        event => {

            if (
                !idiomasPlugin.contains(event.target)
            ) {
                closeDropdown();
            }
        }
    );

    document.addEventListener(
        'keydown',
        event => {

            if (event.key === 'Escape') {
                closeDropdown();
            }
        }
    );

    /*
     * ---------------------------------------------
     * Inicialización
     * ---------------------------------------------
     */

    renderCurrentLanguage(currentLanguage);

    renderLanguages();

    /*
     * ---------------------------------------------
     * Clase personalizada del CMS
     * ---------------------------------------------
     */

    if (properties.class) {
        idiomas.classList.add(
            properties.class
        );
    }

    /*
     * ---------------------------------------------
     * CSS
     * ---------------------------------------------
     */

    const styleId =
        `style-${properties.uuid || idPlugin}`;

    const oldStyle =
        document.getElementById(styleId);

    if (oldStyle) {
        oldStyle.remove();
    }

    const styleElement =
        document.createElement('style');

    styleElement.id = styleId;

    styleElement.textContent =
        `${properties.css || ''} ${css}`;

    document.head.appendChild(styleElement);
}