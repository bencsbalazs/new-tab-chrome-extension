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
        // Standalone web page fallback: open in new browser tabs
        for (const url of urls) {
            window.open(url, '_blank');
        }
        return;
    }

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
    if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.getTree) {
        chrome.bookmarks.getTree((tree) => {
            // A [0].children[0] általában a "Könyvjelzősáv" (Bookmarks Bar)
            const bookmarksBar = tree[0]?.children?.[0];
            if (bookmarksBar?.children) {
                bookmarkTree = bookmarksBar.children;
                renderLevel1(bookmarkTree);
            }
        });
    } else {
        // Fallback: Ha nem Chrome Extension-ben vagyunk (pl. Flask local webserver),
        // betöltünk néhány minta könyvjelzőt a teszteléshez és a látvány kedvéért!
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
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            const url = new URL(chrome.runtime.getURL("/_favicon/"));
            url.searchParams.set("pageUrl", u);
            url.searchParams.set("size", "32");
            return url.toString();
        }
        // Fallback standard böngészőhöz: a Google favicon szolgáltatását használjuk
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
        const bsTheme = (theme === 'light' || theme === 'chrome') ? 'light' : 'dark';
        document.documentElement.dataset.bsTheme = bsTheme;
        localStorage.setItem('bookmarks-theme', theme);
    }

    // ==========================================
    // AI CHAT ASSISTANT SYSTEM (Vanilla JS)
    // ==========================================

    // Chat states
    let conversationHistory = [];
    let isGenerating = false;
    let currentController = null;
    let activeHistoryIndex = -1;

    // Load configs from localStorage or defaults
    const isExtension = typeof chrome !== 'undefined' && chrome?.runtime?.id;
    let apiUrl = localStorage.getItem('bookmarks-qwen-api-url');
    if (!apiUrl) {
        apiUrl = isExtension ? 'http://localhost:5000/prompt' : '/prompt';
    }
    let modelName = localStorage.getItem('bookmarks-qwen-model-name') || 'qwen2.5:7b';
    let chatHistory = JSON.parse(localStorage.getItem('bookmarks-qwen-chat-history')) || [];

    // DOM Elements
    const toggleChatBtn = document.getElementById('toggle-chat-btn');
    const chatCol = document.getElementById('qwen');
    const chatSidebar = document.getElementById('chat-sidebar');
    const collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
    const expandSidebarBtn = document.getElementById('expandSidebarBtn');
    const modelSelectorBtn = document.getElementById('modelSelectorBtn');
    const modelDropdownMenu = document.getElementById('modelDropdownMenu');
    const activeModelName = document.getElementById('active-model-name');
    const configureApiBtn = document.getElementById('configure-api-btn');
    const apiConfigModal = document.getElementById('apiConfigModal');
    const closeApiModalBtn = document.getElementById('close-api-modal-btn');
    const cancelApiModalBtn = document.getElementById('cancel-api-modal-btn');
    const saveApiConfigBtn = document.getElementById('save-api-config-btn');
    const apiUrlInput = document.getElementById('api-url-input');
    const modelNameInput = document.getElementById('model-name-input');
    const promptInput = document.getElementById('promptInput');
    const submitBtn = document.getElementById('submitBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const promptForm = document.getElementById('promptForm');
    const chatContainer = document.getElementById('chatContainer');
    const emptyState = document.getElementById('emptyState');
    const messageFeed = document.getElementById('messageFeed');

    // Layout Toggle
    let chatOpen = localStorage.getItem('bookmarks-chat-open') !== 'false';

    function updateLayout() {
        if (chatOpen) {
            chatCol.classList.remove('d-none');
            toggleChatBtn.classList.add('active');
        } else {
            chatCol.classList.add('d-none');
            toggleChatBtn.classList.remove('active');
        }
    }

    toggleChatBtn.addEventListener('click', () => {
        chatOpen = !chatOpen;
        localStorage.setItem('bookmarks-chat-open', chatOpen);
        updateLayout();
    });

    updateLayout();

    // Sidebar Collapsing
    collapseSidebarBtn.addEventListener('click', () => {
        chatSidebar.classList.add('collapsed');
        expandSidebarBtn.style.display = 'flex';
    });

    expandSidebarBtn.addEventListener('click', () => {
        chatSidebar.classList.remove('collapsed');
        expandSidebarBtn.style.display = 'none';
    });

    // Model Selector Dropdown
    activeModelName.textContent = modelName;
    modelSelectorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modelDropdownMenu.classList.toggle('d-none');
    });

    document.addEventListener('click', () => {
        modelDropdownMenu.classList.add('d-none');
    });

    document.querySelectorAll('.chat-dropdown-item[data-model]').forEach(item => {
        item.addEventListener('click', () => {
            modelName = item.dataset.model;
            localStorage.setItem('bookmarks-qwen-model-name', modelName);
            activeModelName.textContent = modelName;
            document.querySelectorAll('.chat-dropdown-item[data-model]').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Modal Config Handling
    configureApiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        apiUrlInput.value = apiUrl;
        modelNameInput.value = modelName;
        apiConfigModal.classList.remove('d-none');
    });

    const closeModal = () => apiConfigModal.classList.add('d-none');
    closeApiModalBtn.addEventListener('click', closeModal);
    cancelApiModalBtn.addEventListener('click', closeModal);
    apiConfigModal.addEventListener('click', (e) => {
        if (e.target === apiConfigModal) closeModal();
    });

    saveApiConfigBtn.addEventListener('click', () => {
        apiUrl = apiUrlInput.value.trim() || (isExtension ? 'http://localhost:5000/prompt' : '/prompt');
        modelName = modelNameInput.value.trim() || 'qwen2.5:7b';
        localStorage.setItem('bookmarks-qwen-api-url', apiUrl);
        localStorage.setItem('bookmarks-qwen-model-name', modelName);
        activeModelName.textContent = modelName;
        closeModal();
    });

    // Textarea Auto-sizing
    promptInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';

        if (isGenerating) return;

        if (this.value.trim().length > 0) {
            submitBtn.classList.add('active');
        } else {
            submitBtn.classList.remove('active');
        }
    });

    // Suggestion cards click handler
    document.querySelectorAll('.chat-suggestion-card').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.dataset.prompt;
            promptInput.value = prompt;
            promptInput.dispatchEvent(new Event('input'));
            submitForm();
        });
    });

    // Form Event Listeners
    promptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitForm();
    });

    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (isGenerating) return;
            submitForm();
        }
    });

    // New Chat Setup
    newChatBtn.addEventListener('click', newChat);

    function newChat() {
        if (isGenerating && currentController) {
            currentController.abort();
        }
        activeHistoryIndex = -1;
        conversationHistory = [];
        messageFeed.innerHTML = '';
        emptyState.style.display = 'flex';
        promptInput.value = '';
        promptInput.style.height = 'auto';
        resetButtonState();
        document.getElementById('currentChatTab').querySelector('span').textContent = 'Aktuális csevegés';
        document.querySelectorAll('.chat-sidebar-item').forEach(i => i.classList.remove('active-chat-item'));
        document.getElementById('currentChatTab').classList.add('active-chat-item');
    }

    // History rendering and database handlers
    function saveHistory() {
        localStorage.setItem('bookmarks-qwen-chat-history', JSON.stringify(chatHistory));
        renderHistoryList();
    }

    function renderHistoryList() {
        const chatHistoryList = document.getElementById('chatHistoryList');
        const currentTab = document.getElementById('currentChatTab');
        chatHistoryList.innerHTML = '';
        chatHistoryList.appendChild(currentTab);

        chatHistory.forEach((chat, idx) => {
            const item = document.createElement('div');
            item.className = 'chat-sidebar-item px-2 py-2 rounded d-flex align-items-center justify-content-between';
            if (idx === activeHistoryIndex) {
                item.classList.add('active-chat-item');
            }
            item.innerHTML = `
                <div class="d-flex align-items-center overflow-hidden flex-grow-1" style="font-size: 0.85rem;">
                    <i class="bi bi-chat-left-text me-2 flex-shrink-0"></i>
                    <span class="text-truncate">${escapeHtml(chat.title)}</span>
                </div>
                <button class="btn btn-sm p-0 text-muted hover-delete-btn" style="background: transparent; border: none; opacity: 0.6;" data-idx="${idx}">
                    <i class="bi bi-trash-fill small"></i>
                </button>
            `;

            // Delete buttons hover state opacity toggle
            const delBtn = item.querySelector('.hover-delete-btn');
            delBtn.addEventListener('mouseenter', () => delBtn.style.opacity = '1');
            delBtn.addEventListener('mouseleave', () => delBtn.style.opacity = '0.6');

            item.addEventListener('click', (e) => {
                if (e.target.closest('.hover-delete-btn')) {
                    e.stopPropagation();
                    const deleteIdx = Number.parseInt(e.target.closest('.hover-delete-btn').dataset.idx, 10);
                    chatHistory.splice(deleteIdx, 1);
                    saveHistory();
                    if (deleteIdx === activeHistoryIndex) {
                        newChat();
                    } else if (deleteIdx < activeHistoryIndex) {
                        activeHistoryIndex--;
                    }
                    return;
                }
                loadConversation(idx);
            });

            chatHistoryList.appendChild(item);
        });
    }

    function loadConversation(idx) {
        if (isGenerating && currentController) {
            currentController.abort();
        }
        activeHistoryIndex = idx;
        const chat = chatHistory[idx];
        conversationHistory = [...chat.messages];
        renderConversation();

        document.querySelectorAll('.chat-sidebar-item').forEach(i => i.classList.remove('active-chat-item'));
        const items = document.querySelectorAll('.chat-sidebar-item');
        if (items[idx + 1]) {
            items[idx + 1].classList.add('active-chat-item');
        }
    }

    function renderConversation() {
        messageFeed.innerHTML = '';
        if (conversationHistory.length === 0) {
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        conversationHistory.forEach(msg => {
            if (msg.role === 'user') {
                addUserMessage(msg.content);
            } else {
                addAssistantMessage(marked.parse(msg.content));
            }
        });
        scrollToBottom();
    }

    // Active state toggles for send/stop button
    function setButtonToStopState() {
        submitBtn.innerHTML = '<i class="bi bi-stop-fill" style="font-size:1.15rem; line-height:1;"></i>';
        submitBtn.className = 'send-btn btn rounded-circle p-1 d-flex align-items-center justify-content-center stop-btn active';
        submitBtn.setAttribute('title', 'Leállítás');
    }

    function resetButtonState() {
        submitBtn.innerHTML = '<i class="bi bi-arrow-up-short" style="font-size: 1.35rem; line-height: 1;"></i>';
        submitBtn.className = 'send-btn btn rounded-circle p-1 d-flex align-items-center justify-content-center';
        submitBtn.removeAttribute('title');
        
        const prompt = promptInput.value.trim();
        if (prompt.length > 0) {
            submitBtn.classList.add('active');
        } else {
            submitBtn.classList.remove('active');
        }
    }

    // UI Message helpers
    function addUserMessage(message) {
        const html = `
            <div class="message-wrapper user">
                <div class="message-content">
                    <span class="sender-name">Te</span>
                    <div class="message-bubble">${escapeHtml(message)}</div>
                </div>
            </div>
        `;
        messageFeed.insertAdjacentHTML('beforeend', html);
    }

    function addAssistantMessage(htmlContent) {
        const html = `
            <div class="message-wrapper assistant">
                <div class="avatar-circle qwen-avatar flex-shrink-0">Q</div>
                <div class="message-content flex-grow-1">
                    <span class="sender-name">Qwen</span>
                    <div class="message-bubble">${htmlContent}</div>
                </div>
            </div>
        `;
        messageFeed.insertAdjacentHTML('beforeend', html);
        
        // Highlight code
        messageFeed.querySelectorAll('.message-wrapper:last-child pre code').forEach(block => {
            hljs.highlightElement(block);
        });
    }

    function addAssistantPlaceholder() {
        const id = 'assistant_' + Date.now();
        const html = `
            <div class="message-wrapper assistant" id="${id}">
                <div class="avatar-circle qwen-avatar flex-shrink-0">Q</div>
                <div class="message-content flex-grow-1">
                    <span class="sender-name">Qwen</span>
                    <div class="message-bubble"></div>
                </div>
            </div>
        `;
        messageFeed.insertAdjacentHTML('beforeend', html);
        return id;
    }

    function showLoadingIndicator() {
        const id = 'loading_' + Date.now();
        const html = `
            <div class="message-wrapper assistant" id="${id}">
                <div class="avatar-circle qwen-avatar flex-shrink-0">Q</div>
                <div class="message-content">
                    <span class="sender-name">Qwen</span>
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        messageFeed.insertAdjacentHTML('beforeend', html);
        return id;
    }

    function scrollToBottom() {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    function saveCurrentConversationToHistory(prompt) {
        if (activeHistoryIndex === -1) {
            const newChatObj = {
                title: prompt.length > 25 ? prompt.substring(0, 25) + '...' : prompt,
                messages: [...conversationHistory]
            };
            chatHistory.unshift(newChatObj);
            activeHistoryIndex = 0;
        } else {
            chatHistory[activeHistoryIndex].messages = [...conversationHistory];
        }
        saveHistory();
    }

    // Core Submit prompt functionality (supports streaming and dynamic URL targets)
    function submitForm() {
        if (isGenerating) {
            if (currentController) {
                currentController.abort();
            }
            return;
        }

        const prompt = promptInput.value.trim();
        if (!prompt) return;

        promptInput.value = '';
        promptInput.style.height = 'auto';
        submitBtn.classList.remove('active');

        emptyState.style.display = 'none';
        addUserMessage(prompt);
        conversationHistory.push({ role: 'user', content: prompt });

        const loadingId = showLoadingIndicator();
        scrollToBottom();

        isGenerating = true;
        currentController = new AbortController();
        promptForm.setAttribute('novalidate', 'novalidate');
        setButtonToStopState();

        let assistantMessageId = null;
        let assistantText = '';

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                messages: conversationHistory,
                model: modelName
            }),
            signal: currentController.signal
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Hiba a szerverrel való kapcsolatfelvételkor');
            }

            document.getElementById(loadingId)?.remove();

            assistantMessageId = addAssistantPlaceholder();
            const bubbleElement = document.querySelector(`#${assistantMessageId} .message-bubble`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            function readChunk() {
                return reader.read().then(({ done, value }) => {
                    if (done) {
                        conversationHistory.push({ role: 'assistant', content: assistantText });
                        saveCurrentConversationToHistory(prompt);

                        // Update current conversation preview title in sidebar list
                        const currentTab = document.getElementById('currentChatTab');
                        if (currentTab) {
                            const currentTitleNode = currentTab.querySelector('span');
                            if (currentTitleNode) {
                                const previewText = prompt.length > 20 ? prompt.substring(0, 20) + '...' : prompt;
                                currentTitleNode.textContent = previewText;
                            }
                        }
                        return;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) continue;
                        try {
                            const data = JSON.parse(trimmedLine);
                            if (data.error) {
                                bubbleElement.insertAdjacentHTML('beforeend', `<p class="error-msg">${escapeHtml(data.error)}</p>`);
                            } else {
                                const content = data.message?.content || data.response;
                                if (content) {
                                    assistantText += content;
                                    bubbleElement.innerHTML = marked.parse(assistantText);
                                    const codeBlocks = bubbleElement.querySelectorAll('pre code');
                                    for (const block of codeBlocks) {
                                        hljs.highlightElement(block);
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('Hiba a stream sor elemzésekor:', err);
                        }
                    }

                    scrollToBottom();
                    return readChunk();
                });
            }

            return readChunk();
        })
        .catch(error => {
            document.getElementById(loadingId)?.remove();

            if (error.name === 'AbortError') {
                console.log('Kérés leállítva');
                if (assistantText) {
                    conversationHistory.push({ role: 'assistant', content: assistantText });
                    saveCurrentConversationToHistory(prompt);

                    const bubbleElement = document.querySelector(`#${assistantMessageId} .message-bubble`);
                    if (bubbleElement) {
                        bubbleElement.insertAdjacentHTML('beforeend', '<div class="generation-stopped-badge"><i class="bi bi-exclamation-octagon me-1"></i>Megállítva</div>');
                    }
                } else if (assistantMessageId) {
                    document.getElementById(assistantMessageId)?.remove();
                }
            } else if (assistantMessageId) {
                const bubbleElement = document.querySelector(`#${assistantMessageId} .message-bubble`);
                if (bubbleElement) {
                    bubbleElement.insertAdjacentHTML('beforeend', `<p class="error-msg">Hiba: ${error.message || 'Ismeretlen hiba'}</p>`);
                }
            } else {
                addAssistantMessage(`<p class="error-msg">Hiba: ${error.message || 'Ismeretlen hiba'}</p>`);
            }
            scrollToBottom();
        })
        .finally(() => {
            isGenerating = false;
            currentController = null;
            promptForm.removeAttribute('novalidate');
            resetButtonState();
        });
    }

    // Render history on load
    renderHistoryList();

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
            { id: 'feladatkor', el: document.getElementById('feladatkor') },
            { id: 'qwen', el: document.getElementById('qwen') }
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

        // Fetch translations
        fetch(`locales/${lang}.json`)
            .then(res => res.json())
            .then(translations => {
                // Update text content
                document.querySelectorAll('[data-i18n]').forEach(el => {
                    const key = el.dataset.i18n;
                    if (translations[key]) {
                        el.textContent = translations[key];
                    }
                });
                // Update placeholders
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

    // Initialize Language
    setLanguage(currentLang);

    // ==========================================
    // News Section Logic (with Custom Sources & AI Credibility)
    // ==========================================
    const newsSelect = document.getElementById('news-source-select');
    const newsContainer = document.getElementById('news-container');
    const addNewsForm = document.getElementById('add-news-source-form');
    const newNewsInput = document.getElementById('new-news-source-input');

    // Load custom sources
    let customSources = JSON.parse(localStorage.getItem('bookmarks-custom-news') || '[]');
    
    function renderCustomSources() {
        if (!newsSelect) return;
        // Remove existing custom options
        Array.from(newsSelect.options).forEach(opt => {
            if (opt.dataset.custom) opt.remove();
        });
        // Add current custom options
        customSources.forEach(source => {
            const opt = document.createElement('option');
            opt.value = source.url;
            try {
                opt.textContent = new URL(source.url).hostname;
            } catch(e) {
                opt.textContent = source.url;
            }
            opt.dataset.custom = 'true';
            newsSelect.appendChild(opt);
        });
    }

    if (addNewsForm) {
        addNewsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const url = newNewsInput.value.trim();
            if (!url) return;

            if (!customSources.some(s => s.url === url)) {
                customSources.push({ url });
                localStorage.setItem('bookmarks-custom-news', JSON.stringify(customSources));
                renderCustomSources();
            }
            
            newsSelect.value = url;
            newNewsInput.value = '';
            fetchNews(url);
        });
    }

    // AI Credibility Logic
    async function processCredibilityQueue(items) {
        for (let i = 0; i < items.length; i++) {
            await analyzeNewsCredibility(items[i], i);
            // Optional: slight delay between requests
            await new Promise(r => setTimeout(r, 500));
        }
    }

    async function analyzeNewsCredibility(item, index) {
        const badgeContainer = document.getElementById(`badge-${index}`);
        if (!badgeContainer) return;

        // Render loading state
        const loadingText = currentLang === 'en' ? 'Analyzing credibility...' : (currentLang === 'et' ? 'Usaldusväärsuse analüüsimine...' : 'Hitelesség elemzése...');
        badgeContainer.innerHTML = `<span class="credibility-badge badge-analyzing"><span class="spinner-grow-mini"></span> ${loadingText}</span>`;

        const prompt = `You are an expert fact-checker. Evaluate the credibility and realness of the following news item.
Base your decision on these criteria:
1. Is the same news likely available on other major sites?
2. Is it available in other languages?
3. Is the original page trustable?

You MUST return a JSON object containing EXACTLY one key: "realness_probability" (an integer from 0 to 100). Do not include any other text or markdown formatting outside the JSON object.

News Title: ${item.title}
News Source Link: ${item.link}
News Description/Snippet: ${item.description || item.content || ''}`.trim();

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: [{ role: 'user', content: prompt }],
                    model: modelName,
                    stream: false
                })
            });

            if (!response.ok) throw new Error('API error');
            const data = await response.json();
            
            let percentage = 50; // default fallback
            try {
                const textResponse = data.message?.content || data.response || '';
                let jsonStr = textResponse;
                
                // Try to extract JSON from markdown blocks first
                const codeBlockMatch = textResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                if (codeBlockMatch) {
                    jsonStr = codeBlockMatch[1];
                } else {
                    // Find the outermost braces
                    const firstBrace = textResponse.indexOf('{');
                    const lastBrace = textResponse.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        jsonStr = textResponse.substring(firstBrace, lastBrace + 1);
                    }
                }

                if (jsonStr.trim()) {
                    const parsed = JSON.parse(jsonStr);
                    if (typeof parsed.realness_probability === 'number') {
                        percentage = parsed.realness_probability;
                    }
                }
            } catch (e) {
                console.error('Failed to parse AI credibility response:', e);
            }

            let badgeClass = 'badge-medium';
            if (percentage >= 75) badgeClass = 'badge-high';
            else if (percentage < 40) badgeClass = 'badge-low';

            badgeContainer.innerHTML = `<span class="credibility-badge ${badgeClass}"><i class="bi bi-shield-check"></i> ${percentage}%</span>`;
            
        } catch (error) {
            console.error('Failed credibility analysis:', error);
            badgeContainer.innerHTML = `<span class="credibility-badge badge-analyzing"><i class="bi bi-exclamation-triangle"></i> N/A</span>`;
        }
    }

    function fetchNews(url) {
        newsContainer.innerHTML = `
            <div class="text-center text-muted small py-2">
                <div class="spinner-border spinner-border-sm" role="status"></div>
            </div>`;
        
        const rssApiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
        
        fetch(rssApiUrl)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'ok') {
                    newsContainer.innerHTML = '';
                    const items = data.items.slice(0, 5); // Limit to 5 items
                    items.forEach((item, index) => {
                        const date = new Date(item.pubDate).toLocaleDateString();
                        const html = `
                            <div class="news-item border-bottom border-secondary-subtle pb-2 mb-1">
                                <a href="${item.link}" target="_blank" class="text-decoration-none text-primary fw-medium" style="font-size: 0.9rem;">
                                    ${item.title}
                                </a>
                                <div class="text-muted" style="font-size: 0.75rem;">${date}</div>
                                <div class="credibility-badge-container mt-1" id="badge-${index}"></div>
                            </div>
                        `;
                        newsContainer.insertAdjacentHTML('beforeend', html);
                    });

                    // Start background sequential processing for the AI badges
                    processCredibilityQueue(items);

                } else {
                    newsContainer.innerHTML = '<div class="text-danger small">Hiba a hírek betöltésekor.</div>';
                }
            })
            .catch(err => {
                console.error(err);
                newsContainer.innerHTML = '<div class="text-danger small">Hiba a hírek betöltésekor.</div>';
            });
    }

    if (newsSelect && newsContainer) {
        renderCustomSources();
        newsSelect.addEventListener('change', (e) => {
            fetchNews(e.target.value);
        });
        // Initial fetch
        fetchNews(newsSelect.value);
    }
});