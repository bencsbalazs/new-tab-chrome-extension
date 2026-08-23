// --- CATEGORY PARSING & ICONS (Outer Scope) ---
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

async function openLinksInTabGroup(urls) {
    if (!urls || urls.length === 0) return;

    try {
        const tabIds = [];
        // Megnyitjuk a linkeket a háttérben
        for (const url of urls) {
            const tab = await chrome.tabs.create({ url, active: false });
            tabIds.push(tab.id);
        }

        // Csoportosítjuk a megnyitott füleket
        if (tabIds.length > 0) {
            const groupId = await chrome.tabs.group({ tabIds });
            await chrome.tabGroups.update(groupId, {
                title: 'Csevegők',
                color: 'blue'
            });
        }
    } catch (e) {
        console.error('Hiba a tab csoportosításakor:', e);
        // Fallback: Ha a csoportosítás meghiúsul (pl. nincs tabGroups API), megnyitjuk őket simán
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
    chrome.bookmarks.getTree((tree) => {
        // A [0].children[0] általában a "Könyvjelzősáv" (Bookmarks Bar)
        const bookmarksBar = tree[0].children[0];
        if (bookmarksBar?.children) {
            bookmarkTree = bookmarksBar.children;
            renderLevel1(bookmarkTree);
        }
    });

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

        // Főkategória fejléc elhelyezése az alkategória doboz tetején
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
                // Ha ez egy mappa az L2-ben, dropdown struktúrát kap (L3+)
                const dropContainer = document.createElement('div');
                dropContainer.className = 'bm-dropdown-container';
                dropContainer.appendChild(createTile(child, false));
                dropContainer.insertAdjacentHTML('beforeend', buildNestedList(child.children));
                l2Container.appendChild(dropContainer);
            } else {
                // Sima link az L2-ben
                l2Container.appendChild(createTile(child, false));
            }
        });
    }

    // Rekurzív listaépítő (L3+)
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

    // Csempe generátor (L1 és L2 gyökér elemekhez)
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
            // "Sticky" hover logika: Csak akkor frissítjük az alsó sort, ha L1 mappára mutatunk
            a.addEventListener('mouseenter', () => renderLevel2(node));
        }

        return a;
    }

    // Favicon lekérése (A Manifest V3 szerinti hivatalos módszer)
    function getFavicon(u) {
        if (!u) return '';
        const url = new URL(chrome.runtime.getURL("/_favicon/"));
        url.searchParams.set("pageUrl", u);
        url.searchParams.set("size", "32");
        return url.toString();
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
    const savedTheme = localStorage.getItem('bookmarks-theme') || 'glass';

    // Aktív gomb beállítása betöltéskor
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
        const bsTheme = (theme === 'light') ? 'light' : 'dark';
        document.documentElement.dataset.bsTheme = bsTheme;
        localStorage.setItem('bookmarks-theme', theme);
    }
});