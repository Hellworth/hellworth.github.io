const LOADER_THRESHOLD = 200;
const NEWS_LIST_MAX = 5;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// helpers -----------------------------------------------------------------
function getCurrentPage() {
    return location.pathname.split('/').pop() || 'index.html';
}

async function loadFragment(src, container) {
    // container may be a node or an id string
    if (typeof container === 'string') container = document.getElementById(container);
    if (!container) return;
    const html = await fetch(src).then(r => r.text());
    container.innerHTML = html;
}
// -------------------------------------------------------------------------

async function loadNavbar() {
    const container = document.getElementById('navbar-container');
    if (!container) return;

    await loadFragment('assets/navbar.html', container);
    // Adjust links based on current page
    const page = getCurrentPage();
    const isHomepage = page === 'index.html' || page === '';

    document.querySelectorAll('.navbar-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (isHomepage) {
            // On index.html: convert "index.html#..." to "#..."
            if (href && href.startsWith('index.html#')) {
                link.setAttribute('href', '#' + href.split('#')[1]);
            }
        }
    });

    initNavbar();
}

async function loadLoader() {
    const container = document.getElementById('loader-container');
    if (!container) return;

    await loadFragment('assets/loader.html', container);
}

async function loadFooter() {
    const container = document.getElementById('footer-container');
    if (!container) return;

    await loadFragment('assets/footer.html', container);
}

function initNavbar() {
    const page = getCurrentPage();
    document.querySelectorAll('.navbar-links a').forEach(link => {
        const href = link.getAttribute('href');
        const isActive = 
            (page === 'index.html' && href === '#main') ||
            (page === 'credits.html' && href === 'credits.html') ||
            (page === 'project.html' && href === 'project.html') ||
            (page === 'wiki.html' && href === 'wiki.html');
        
        if (isActive) link.classList.add('active');
        else link.classList.remove('active');
    });
}

function initLoader() {
    const start = Date.now();

    const dismiss = () => {
        const el = document.getElementById('loader');
        if (!el) return;
        el.classList.add('loader-exit');
        setTimeout(() => el.remove(), 1800);
    };

    const onLoaded = () => {
        const el = document.getElementById('loader');
        if (!el) return;
        if (Date.now() - start < LOADER_THRESHOLD) {
            el.remove();
        } else {
            dismiss();
        }
    };

    if (document.readyState === 'complete') {
        onLoaded();
    } else {
        window.addEventListener('load', onLoaded, { once: true });
        setTimeout(() => {
            const el = document.getElementById('loader');
            if (el && document.readyState !== 'complete') {
                el.classList.add('loader-visible');
            }
        }, LOADER_THRESHOLD);
    }
}

function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/* ====== NEWS POPUP ====== */
function initNewsPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'news-popup-overlay';
    overlay.innerHTML = `
        <div class="news-popup">
            <button class="news-popup-close">&times;</button>
            <div class="news-popup-image"><img src="" alt=""></div>
            <div class="news-popup-body">
                <div class="news-popup-header">
                    <div class="news-popup-icon"><img src="" alt=""></div>
                    <h2 class="news-popup-title"></h2>
                </div>
                <p class="news-popup-date"></p>
                <p class="news-popup-desc"></p>
                <div class="news-popup-content"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.news-popup-close').addEventListener('click', closeNewsPopup);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeNewsPopup(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNewsPopup(); });
}

function openNewsPopup(item) {
    const overlay = document.querySelector('.news-popup-overlay');
    if (!overlay) return;
    const icon = item.type === 'update' ? 'images/UPD.png' : 'images/NEWS.png';
    overlay.querySelector('.news-popup-image img').src = item.image;
    overlay.querySelector('.news-popup-image img').alt = item.title;
    overlay.querySelector('.news-popup-icon img').src = icon;
    overlay.querySelector('.news-popup-title').textContent = item.title;
    overlay.querySelector('.news-popup-date').textContent = formatDate(item.date);
    overlay.querySelector('.news-popup-desc').textContent = item.description;
    overlay.querySelector('.news-popup-content').innerHTML = item.content || '';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeNewsPopup() {
    const overlay = document.querySelector('.news-popup-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function createNewsCard(item, small = false) {
    const card = document.createElement('div');
    card.className = 'news-card' + (small ? ' news-card--small' : '');
    const icon = item.type === 'update' ? 'images/UPD.png' : 'images/NEWS.png';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'news-card-image';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    imgWrap.appendChild(img);

    const textWrap = document.createElement('div');
    textWrap.className = 'news-card-text';
    const h3 = document.createElement('h3');
    h3.textContent = item.title;
    const p = document.createElement('p');
    p.className = 'news-card-desc';
    p.textContent = item.description;
    const span = document.createElement('span');
    span.className = 'news-card-date';
    span.textContent = formatDate(item.date);
    textWrap.append(h3, p, span);

    const circle = document.createElement('div');
    circle.className = 'news-card-circle';
    const iconImg = document.createElement('img');
    iconImg.src = icon;
    iconImg.alt = '';
    circle.appendChild(iconImg);

    card.append(imgWrap, textWrap, circle);
    card.addEventListener('click', () => openNewsPopup(item));
    return card;
}

function createNewsListItem(item) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = item.title;

    const span = document.createElement('span');
    span.className = 'news-list-date';
    span.textContent = formatDate(item.date);
    a.appendChild(span);

    a.addEventListener('click', e => {
        e.preventDefault();
        openNewsPopup(item);
    });
    li.appendChild(a);
    return li;
}

function renderNewsColumn(items, cardContainerId, listId, showMoreId) {
    const cardContainer = document.getElementById(cardContainerId);
    const list = document.getElementById(listId);
    const showMore = document.getElementById(showMoreId);
    if (!cardContainer || !list || !showMore) return; // abort if structure missing

    if (items.length > 0) cardContainer.appendChild(createNewsCard(items[0], true));

    items.slice(1, 1 + NEWS_LIST_MAX).forEach(item => list.appendChild(createNewsListItem(item)));

    if (items.length > 1 + NEWS_LIST_MAX) showMore.style.display = 'block';
}

async function initNews() {
    const majorContainer = document.getElementById('major-news-container');
    if (!majorContainer) return;
    const news = await fetch('datas/news.json').then(r => r.json());
    news.sort((a, b) => new Date(b.date) - new Date(a.date));

    news.filter(n => n.important).forEach(n => majorContainer.appendChild(createNewsCard(n)));

    renderNewsColumn(
        news.filter(n => n.type === 'update'),
        'update-card-container', 'update-list', 'update-show-more'
    );
    renderNewsColumn(
        news.filter(n => n.type === 'announcement'),
        'announcement-card-container', 'announcement-list', 'announcement-show-more'
    );
}

async function initFaq() {
    const list = document.getElementById('faq-list');
    if (!list) return;
    const items = await fetch('datas/faq.json').then(r => r.json());

    items.forEach(({ question, answer }) => {
        const details = document.createElement('details');
        details.className = 'faq-item';
        details.innerHTML = `
            <summary class="faq-question">${question}</summary>
            <p class="faq-answer">${answer}</p>
        `;
        list.appendChild(details);
    });
}

async function initCredits() {
    const container = document.getElementById('credits-container');
    const guestContainer = document.getElementById('credits-guest-container');
    if (!container && !guestContainer) return;

    const creditsData = await fetch('datas/credits.json').then(r => r.json());
    const { categories, guests, team } = creditsData;

    // create a lookup map from member id to data
    const teamMap = new Map((team || []).map(member => [member.id, member]));

    if (container) {
        categories.forEach(({ title, members }) => {
            const category = document.createElement('div');
            category.className = 'credits-category';
            category.innerHTML = `<h2>${title}</h2>`;

            const row = document.createElement('div');
            row.className = 'credits-row';

            members.forEach((creditItem) => {
                const memberData = teamMap.get(creditItem.id) || {};
                
                const name = memberData.name || creditItem.id;
                const alias = memberData.alias;
                const image = memberData.image;
                const link = memberData.link;
                const roles = creditItem.roles; // Roles stay in the credits definition

                const card = document.createElement(link ? 'a' : 'div');
                card.className = 'credit-card';
                if (link) {
                    card.href = link;
                    card.target = '_blank';
                    card.style.textDecoration = 'none';
                    card.style.color = 'inherit';
                }
                const displayName = alias ? `${name}<br>(${alias})` : name;
                const rolesHTML = (roles || []).map(r => `<span class="credit-role">${r}</span>`).join('');
                card.innerHTML = `
                    <img class="credit-pfp" src="${image || 'images/template.png'}" alt="${name}">
                    <span class="credit-name">${displayName}</span>
                    ${rolesHTML}
                `;
                row.appendChild(card);
            });

            category.appendChild(row);
            container.appendChild(category);
        });
    }

    if (guestContainer) {
        guests.forEach(name => {
            const span = document.createElement('span');
            span.textContent = `- ${name}`;
            guestContainer.appendChild(span);
        });
    }
}

async function initWiki() {
    const container = document.getElementById('wiki-container');
    if (!container) return;

    const data = await fetch('datas/wiki.json').then(r => r.json());
    const { categories, groups, entries } = normalizeWikiData(data);

    function createEntryLink(entry) {
        const link = document.createElement('a');
        link.className = 'wiki-entry-link';
        link.href = `wiki-page.html?id=${entry.id}`;
        link.innerHTML = `<img class="wiki-entry-icon" src="${entry.icon}" alt=""><span>${entry.name}</span>`;
        return link;
    }

    function renderWiki() {
        container.innerHTML = '';

        (groups || categories.map(c => [c.id])).forEach(group => {
            const groupCats = group.map(id => categories.find(c => c.id === id)).filter(Boolean);
            const isMulti = groupCats.length > 1;

            const groupEl = document.createElement('div');
            groupEl.className = `wiki-group ${isMulti ? 'wiki-group-multi' : 'wiki-group-single'}`;

            if (isMulti) {
                groupEl.style.gridTemplateColumns = `repeat(${groupCats.length}, 1fr)`;
                groupCats.forEach(cat => {
                    const col = document.createElement('div');
                    col.className = 'wiki-column';

                    const header = document.createElement('div');
                    header.className = 'wiki-category-header';
                    header.innerHTML = `<h2>${cat.name}</h2>`;
                    col.appendChild(header);

                    const list = document.createElement('div');
                    list.className = 'wiki-entries-list';
                    entries.filter(e => e.category === cat.id).forEach(entry => list.appendChild(createEntryLink(entry)));
                    col.appendChild(list);
                    groupEl.appendChild(col);
                });
            } else {
                const cat = groupCats[0];
                if (!cat) return;
                const catEntries = entries.filter(e => e.category === cat.id);

                const header = document.createElement('div');
                header.className = 'wiki-category-header';
                header.innerHTML = `<h2>${cat.name}</h2>`;
                groupEl.appendChild(header);

                const grid = document.createElement('div');
                grid.className = 'wiki-entries-grid';
                catEntries.forEach(entry => grid.appendChild(createEntryLink(entry)));
                groupEl.appendChild(grid);
            }

            container.appendChild(groupEl);
        });

        if (container.children.length === 0) {
            container.innerHTML = '<p style="text-align: center; font-size: 1.5rem; color: #fff; text-shadow: var(--shadow);">No results found.</p>';
        }
    }

    renderWiki();
}

function normalizeWikiData(data) {
    const defaultEntry = {
        icon: 'images/template.png',
        image: 'images/template.png',
        preview: '',
        sections: [],
        ...(data.defaults?.entry || {})
    };

    return {
        ...data,
        categories: data.categories || [],
        groups: data.groups || [],
        entries: (data.entries || []).map(entry => ({
            ...defaultEntry,
            ...entry,
            sections: Array.isArray(entry.sections)
                ? entry.sections
                : [...defaultEntry.sections]
        }))
    };
}

async function initWikiPage() {
    const container = document.getElementById('wiki-page-container');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const entryId = params.get('id');

    if (!entryId) {
        container.innerHTML = `
            <div class="wiki-page-notfound">
                <h2>No entry specified</h2>
                <a href="wiki.html" class="wiki-page-back">← Back to Wiki</a>
            </div>
        `;
        return;
    }

    const data = normalizeWikiData(await fetch('datas/wiki.json').then(r => r.json()));
    const entry = data.entries.find(e => e.id === entryId);
    const category = entry ? data.categories.find(c => c.id === entry.category) : null;

    if (!entry) {
        container.innerHTML = `
            <div class="wiki-page-notfound">
                <h2>Entry not found</h2>
                <p style="color: #fff; margin-bottom: 20px;">The wiki entry "${entryId}" does not exist.</p>
                <a href="wiki.html" class="wiki-page-back">← Back to Wiki</a>
            </div>
        `;
        return;
    }

    // Update page title
    document.title = `${entry.name} - Wiki - Dranima`;

    // Build table of contents
    const tocHTML = entry.sections.map((section, index) => 
        `<li><a href="#section-${index}">${section.title}</a></li>`
    ).join('');

    // Build sections
    const sectionsHTML = entry.sections.map((section, index) => `
        <div class="wiki-page-section" id="section-${index}">
            <h2>${section.title}</h2>
            <div class="wiki-page-section-content">${section.content}</div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="wiki-page-header">
            <div class="wiki-page-title-row">
                <img class="wiki-page-title-icon" src="${entry.icon}" alt="">
                <h1>${entry.name}</h1>
            </div>
            <img class="wiki-page-image" src="${entry.image}" alt="${entry.name}">
        </div>
        <p class="wiki-page-preview">${entry.preview}</p>
        <div class="wiki-page-toc">
            <h3>Summary</h3>
            <ul>${tocHTML}</ul>
        </div>
        ${sectionsHTML}
        <a href="wiki.html" class="wiki-page-back">← Back to Wiki</a>
    `;
}

(async () => {
    // load static fragments in parallel
    await Promise.all([loadNavbar(), loadFooter(), loadLoader()]);
    initLoader();

    // initialize interactive components; they themselves fetch data
    initNewsPopup();
    await Promise.all([initNews(), initFaq(), initCredits(), initWiki(), initWikiPage()]);
})();
