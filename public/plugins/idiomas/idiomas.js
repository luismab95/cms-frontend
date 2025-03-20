const css = `#lang-options {
            background-color: white;
            margin-top: 10px;
            display: none;
            border-radius: 6px;
            border: 1px solid #efefef;
            flex-direction: column;
            position: absolute;
            top: 0px;
            left: 20px;
            width: 60px;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            z-index: 1000;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
        }

        #lang-options.show {
            display: flex;
            opacity: 1;
            transform: translateY(10px);
            box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.3);
        }

        .item-option {
            cursor: pointer;
            padding: 8px;
        }

        .item-option:hover {
            background-color: #efefef;
        }

        #toggle-btn {
            padding: 10px;
            background-color: transparent;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        #toggle-btn:hover {
            background-color: #efefef;
        }`;

function idiomasPluginEvent(idPlugin) {
    loadIdiomasPlugin(idPlugin);
}

function loadIdiomasPlugin(idPlugin) {
    const idiomasPlugin = document.getElementById(`div-${idPlugin}`);
    const data = JSON.parse(idiomasPlugin.getAttribute('data-properties'));

    const idiomas = idiomasPlugin
        ? idiomasPlugin.querySelector('#languageContent')
        : null;

    if (data.properties !== undefined) {
        const btn = document.getElementById('toggle-btn');
        const langOptions = document.getElementById('lang-options');
        const currentLang =
            localStorage.getItem('lang') || data.properties.data[0].lang;

        // Load data
        data.properties.data.forEach((lang) => {
            const itemOption = document.createElement('div');
            itemOption.classList.add('item-option');
            itemOption.setAttribute('data-lang', lang.lang);
            const img = document.createElement('img');
            img.style.width = '60px';
            img.title = lang.lang;
            img.setAttribute('src', lang.icon);
            img.setAttribute('alt', `${lang.lang}`);
            itemOption.appendChild(img);
            langOptions.appendChild(itemOption);
        });
        btn.src = data.properties.data.find(
            (language) => language.lang === currentLang
        ).icon;
        btn.style.width = '60px';
        btn.alt = data.properties.data.find(
            (language) => language.lang === currentLang
        ).lang;

        // Load events
        btn.addEventListener('click', function (event) {
            langOptions.classList.toggle('show');
            event.stopPropagation();
        });
        document.addEventListener('click', function (event) {
            if (!langOptions.contains(event.target) && event.target !== btn) {
                langOptions.classList.remove('show');
            }
        });
        const items = document.querySelectorAll('.item-option');
        items.forEach((item) => {
            item.addEventListener('click', function () {
                const lang = item.getAttribute('data-lang');
                localStorage.setItem('lang', lang);
                btn.src = data.properties.data.find(
                    (language) => language.lang === lang
                ).icon;
                btn.alt = data.properties.data.find(
                    (language) => language.lang === lang
                ).lang;
                langOptions.classList.remove('show');
            });
        });

        // Load class
        idiomas.classList.add(data.properties.class);

        // Load CSS
        const styleElement = document.createElement('style');
        styleElement.id = `style-${data.properties.uuid}`;
        styleElement.textContent = `${data.properties.css} ${css}`;
        document.head.appendChild(styleElement);
    }
}
