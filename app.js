// --- CATEGORY PARSING & ICONS (Outer Scope) ---
function escapeHtml(text) {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

const categoryKeywords = {
    dev: ['fejleszt', 'dev', 'code', 'program', 'git', 'github'],
    social: ['közösség', 'social', 'chat', 'messenger', 'discord', 'reddit'],
    music: ['zene', 'music', 'spotify', 'dal', 'audio'],
    video: ['videó', 'video', 'film', 'youtube', 'netflix', 'stream'],
    game: ['játék', 'game', 'steam', 'play'],
    work: ['munka', 'work', 'iroda', 'project', 'projekt'],
    finance: ['pénz', 'finance', 'bank', 'kártya', 'wallet', 'számla'],
    news: ['hír', 'news', 'újság', 'cikk'],
    shop: ['bolt', 'shop', 'vásárlás', 'store', 'amazon'],
    tools: ['eszköz', 'tool', 'utility'],
    study: ['tanul', 'study', 'school', 'könyv', 'book', 'iskola'],
    cloud: ['felhő', 'cloud', 'drive'],
    design: ['tervezés', 'design', 'figma', 'art', 'kép'],
    travel: ['utazás', 'travel', 'térkép'],
    health: ['egészség', 'health', 'sport', 'fit'],
    mail: ['mail', 'posta', 'gmail', 'inbox', 'levelezés'],
    search: ['keresés', 'search', 'google'],
    fav: ['kedvenc', 'fav', 'star', 'csillag'],
    weather: ['időjárás', 'weather'],
    settings: ['beállítás', 'config', 'settings', 'setup']
};

function getFolderCategory(title) {
    if (!title) return 'default';
    const t = title.toLowerCase().trim();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => t.includes(keyword))) {
            return category;
        }
    }
    return 'default';
}

function getFolderIconClass(category) {
    const icons = {
        dev: 'bi-code-slash',
        social: 'bi-chat-dots-fill',
        music: 'bi-music-note-beamed',
        video: 'bi-play-btn-fill',
        game: 'bi-controller',
        work: 'bi-briefcase-fill',
        finance: 'bi-credit-card-fill',
        news: 'bi-newspaper',
        shop: 'bi-cart3',
        tools: 'bi-tools',
        study: 'bi-mortarboard-fill',
        cloud: 'bi-cloud-check-fill',
        design: 'bi-palette-fill',
        travel: 'bi-compass-fill',
        health: 'bi-heart-pulse-fill',
        mail: 'bi-envelope-fill',
        search: 'bi-search',
        fav: 'bi-star-fill',
        weather: 'bi-cloud-sun-fill',
        settings: 'bi-gear-fill',
        default: 'bi-folder-fill'
    };
    return icons[category] || icons.default;
}

function getSampleBookmarks() {
    return [
        {
            title: "Fejlesztés",
            children: [
                { title: "GitHub", url: "https://github.com" },
                { title: "Stack Overflow", url: "https://stackoverflow.com" },
                { 
                    title: "Kódolás", 
                    children: [
                        { title: "MDN Web Docs", url: "https://developer.mozilla.org" },
                        { title: "Can I Use", url: "https://caniuse.com" }
                    ] 
                }
            ]
        },
        {
            title: "Közösségi oldalak",
            children: [
                { title: "Facebook", url: "https://facebook.com" },
                { title: "Reddit", url: "https://reddit.com" },
                { title: "Discord", url: "https://discord.com" }
            ]
        },
        {
            title: "Zene és Videó",
            children: [
                { title: "YouTube", url: "https://youtube.com" },
                { title: "Spotify", url: "https://spotify.com" }
            ]
        },
        {
            title: "Tanulás",
            children: [
                { title: "Coursera", url: "https://coursera.org" },
                { title: "LinkedIn Learning", url: "https://linkedin.com/learning" }
            ]
        }
    ];
}

async function openLinksInTabGroup(urls) {
    if (!urls || urls.length === 0) return;

    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.create) {
        for (const url of urls) {
            window.open(url, '_blank');
        }
        return;
    }

    try {
        const tabIds = [];
        for (const url of urls) {
            const tab = await chrome.tabs.create({ url, active: false });
            tabIds.push(tab.id);
        }

        if (tabIds.length > 0) {
            const groupId = await chrome.tabs.group({ tabIds });
            await chrome.tabGroups.update(groupId, {
                title: 'Csevegők',
                color: 'blue'
            });
        }
    } catch (e) {
        console.error('Hiba a tab csoportosításakor:', e);
        for (const url of urls) {
            chrome.tabs.create({ url });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const l1Container = document.getElementById('level-1-container');
    const l2Wrapper = document.getElementById('level-2-wrapper');
    const l2Container = document.getElementById('level-2-container');

    let bookmarkTree = [];

    // Chrome API: Könyvjelzők lekérése
    if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.getTree) {
        chrome.bookmarks.getTree((tree) => {
            const bookmarksBar = tree[0]?.children?.[0];
            if (bookmarksBar?.children) {
                bookmarkTree = bookmarksBar.children;
                renderLevel1(bookmarkTree);
            }
        });
    } else {
        console.log('chrome.bookmarks API nem elérhető. Minta könyvjelzők betöltése.');
        bookmarkTree = getSampleBookmarks();
        renderLevel1(bookmarkTree);
    }

    // --- RENDER FUNCTIONS ---

    function renderLevel1(nodes) {
        l1Container.innerHTML = '';
        nodes.forEach(node => {
            const item = createTile(node, true);
            l1Container.appendChild(item);
        });
    }

    function renderLevel2(parentNode) {
        l2Container.innerHTML = '';
        if (!parentNode.children || parentNode.children.length === 0) {
            l2Wrapper.classList.add('collapse');
            return;
        }

        l2Wrapper.classList.remove('collapse');

        const category = getFolderCategory(parentNode.title);
        const iconClass = getFolderIconClass(category);
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <i class="bi ${iconClass} icon-category-${category} me-2"></i>
            <span class="fs-5 fw-bold">${parentNode.title}</span>
            <span class="badge rounded-pill ms-2">${parentNode.children.length} db</span>
        `;
        l2Container.appendChild(header);

        parentNode.children.forEach(child => {
            if (child.children) {
                const dropContainer = document.createElement('div');
                dropContainer.className = 'bm-dropdown-container';
                dropContainer.appendChild(createTile(child, false));
                dropContainer.insertAdjacentHTML('beforeend', buildNestedList(child.children));
                l2Container.appendChild(dropContainer);
            } else {
                l2Container.appendChild(createTile(child, false));
            }
        });
    }

    function buildNestedList(nodes) {
        if (!nodes || nodes.length === 0) return '';
        let html = '<ul class="bm-dropdown-menu">';

        nodes.forEach(node => {
            const isFolder = !!node.children;
            let icon = '';

            if (isFolder) {
                const category = getFolderCategory(node.title);
                const iconClass = getFolderIconClass(category);
                icon = `<i class="bi ${iconClass} icon-category-${category} me-2" style="font-size:16px;"></i>`;
            } else {
                icon = `<img src="${getFavicon(node.url)}" alt="">`;
            }

            const dropClass = isFolder ? 'bm-dropend' : '';
            const caret = isFolder ? '<i class="bi bi-chevron-right ms-auto" style="font-size:12px;"></i>' : '';

            html += `
                <li class="${dropClass}">
                    <a class="bm-dropdown-item" href="${isFolder ? '#' : node.url}">
                        ${icon} <span>${node.title}</span> ${caret}
                    </a>
                    ${isFolder ? buildNestedList(node.children) : ''}
                </li>
            `;
        });

        html += '</ul>';
        return html;
    }

    function createTile(node, isLevel1) {
        const isFolder = !!node.children;
        const a = document.createElement('a');
        a.className = 'bm-item';
        a.href = isFolder ? '#' : node.url;

        let iconHtml = '';
        if (isFolder) {
            const category = getFolderCategory(node.title);
            const iconClass = getFolderIconClass(category);
            iconHtml = `<i class="bi ${iconClass} bm-icon icon-category-${category}"></i>`;
        } else {
            iconHtml = `<img src="${getFavicon(node.url)}" class="bm-icon" alt="">`;
        }

        a.innerHTML = `
            ${iconHtml}
            <span class="bm-title" title="${node.title}">${node.title}</span>
        `;

        if (isLevel1 && isFolder) {
            a.addEventListener('mouseenter', () => renderLevel2(node));
        }

        return a;
    }

    function getFavicon(u) {
        if (!u) return '';
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            const url = new URL(chrome.runtime.getURL("/_favicon/"));
            url.searchParams.set("pageUrl", u);
            url.searchParams.set("size", "32");
            return url.toString();
        }
        try {
            return `https://www.google.com/s2/favicons?domain=${new URL(u).hostname}&sz=32`;
        } catch (e) {
            return '';
        }
    }

    // --- QUICK LAUNCH MESSENGERS GROUP ---
    const actionButton = document.getElementById('open-messengers-group');
    if (actionButton) {
        const messengerUrls = [
            'https://www.messenger.com/',
            'https://web.telegram.org/',
            'https://web.wechat.com/'
        ];
        actionButton.addEventListener('click', (e) => {
            e.preventDefault();
            openLinksInTabGroup(messengerUrls);
        });
    }

    // --- QUICK LAUNCH LEARNING GROUP ---
    const actionButtonLearn = document.getElementById('open-learn-group');
    if (actionButtonLearn) {
        const learnUrls = [
            'https://www.linkedin.com/learning/',
            'https://www.skills.google/',
            'https://www.coursera.org/'
        ];
        actionButtonLearn.addEventListener('click', (e) => {
            e.preventDefault();
            openLinksInTabGroup(learnUrls);
        });
    }

    // --- THEME SWITCHER LOGIC ---
    const themeButtons = document.querySelectorAll('.theme-btn');
    const savedTheme = localStorage.getItem('bookmarks-theme') || 'chrome';

    themeButtons.forEach(btn => {
        const btnTheme = btn.dataset.themeVal;
        if (btnTheme === savedTheme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }

        btn.addEventListener('click', () => {
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setTheme(btnTheme);
        });
    });

    function setTheme(theme) {
        document.documentElement.dataset.theme = theme;
        const bsTheme = (theme === 'light' || theme === 'chrome') ? 'light' : 'dark';
        document.documentElement.dataset.bsTheme = bsTheme;
        localStorage.setItem('bookmarks-theme', theme);
    }

    // Smooth scrolling active link highlight (ScrollSpy)
    const navLinks = document.querySelectorAll('.nav-link-custom');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    window.addEventListener('scroll', () => {
        let current = '';
        const sections = [
            { id: 'konyvjelzok', el: document.getElementById('konyvjelzok') },
            { id: 'feladatkor', el: document.getElementById('feladatkor') }
        ];
        
        sections.forEach(sec => {
            if (sec.el) {
                const rect = sec.el.getBoundingClientRect();
                if (rect.top <= 180 && rect.bottom >= 180) {
                    current = sec.id;
                }
            }
        });
        
        if (current) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }
    });

    // ==========================================
    // i18n / Language Switcher Logic
    // ==========================================
    const langButtons = document.querySelectorAll('.lang-btn');
    let currentLang = localStorage.getItem('bookmarks-lang') || 'en';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('bookmarks-lang', lang);
        document.documentElement.lang = lang;
        
        langButtons.forEach(btn => {
            if (btn.dataset.langVal === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        fetch(`locales/${lang}.json`)
            .then(res => res.json())
            .then(translations => {
                document.querySelectorAll('[data-i18n]').forEach(el => {
                    const key = el.dataset.i18n;
                    if (translations[key]) {
                        el.textContent = translations[key];
                    }
                });
                document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                    const key = el.dataset.i18nPlaceholder;
                    if (translations[key]) {
                        el.setAttribute('placeholder', translations[key]);
                    }
                });
            })
            .catch(err => console.error('Error loading translations:', err));
    }

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.langVal);
        });
    });

    setLanguage(currentLang);
});