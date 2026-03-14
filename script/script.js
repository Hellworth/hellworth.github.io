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

function renderNewsPopupContent(item) {
    const contentEl = document.querySelector('.news-popup-content');
    if (!contentEl) return;

    contentEl.innerHTML = item.content || '';
}

/* ====== NEWS POPUP ====== */
function initNewsPopup() {
    const template = document.getElementById('news-popup-template');
    if (!template) return;

    const overlay = template.content.firstElementChild.cloneNode(true);
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
    renderNewsPopupContent(item);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
}

function closeNewsPopup() {
    const overlay = document.querySelector('.news-popup-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
}

function createNewsCard(item, small = false) {
    const template = document.getElementById('news-card-template');
    if (!template) return document.createElement('div');

    const card = template.content.firstElementChild.cloneNode(true);
    if (small) card.classList.add('news-card--small');

    const icon = item.type === 'update' ? 'images/UPD.png' : 'images/NEWS.png';

    const img = card.querySelector('.news-card-image img');
    const title = card.querySelector('.news-card-title');
    const desc = card.querySelector('.news-card-desc');
    const date = card.querySelector('.news-card-date');
    const circleImg = card.querySelector('.news-card-circle img');

    if (img) {
        img.src = item.image;
        img.alt = item.title;
    }
    if (title) title.textContent = item.title;
    if (desc) desc.textContent = item.description;
    if (date) date.textContent = formatDate(item.date);
    if (circleImg) {
        circleImg.src = icon;
        circleImg.alt = '';
    }

    card.addEventListener('click', () => openNewsPopup(item));
    return card;
}

function createNewsListItem(item) {
    const template = document.getElementById('news-list-item-template');
    if (!template) return document.createElement('li');

    const li = template.content.firstElementChild.cloneNode(true);
    const title = li.querySelector('.news-list-title');
    const date = li.querySelector('.news-list-date');
    const link = li.querySelector('a');

    if (title) title.textContent = item.title;
    if (date) date.textContent = formatDate(item.date);

    if (link) {
        link.addEventListener('click', e => {
            e.preventDefault();
            openNewsPopup(item);
        });
    }

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
    const template = document.getElementById('faq-item-template');
    if (!list || !template) return;

    const items = await fetch('datas/faq.json').then(r => r.json());

    items.forEach(({ question, answer }) => {
        const details = template.content.firstElementChild.cloneNode(true);
        details.querySelector('.faq-question').textContent = question;
        details.querySelector('.faq-answer').textContent = answer;
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

function initBackToTop() {
    const id = 'back-to-top';
    let btn = document.getElementById(id);
    if (!btn) {
        btn = document.createElement('img');
        btn.id = id;
        btn.src = 'images/UP.png';
        btn.alt = 'Back to top';
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
        document.body.appendChild(btn);
    }

    const showThreshold = 120;

    const updateVisibility = () => {
        if (window.scrollY > showThreshold) btn.classList.add('show');
        else btn.classList.remove('show');
    };

    window.addEventListener('scroll', updateVisibility, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    updateVisibility();
}

(async () => {
    // load static fragments in parallel
    await Promise.all([loadNavbar(), loadFooter(), loadLoader()]);
    initLoader();

    // initialize interactive components; they themselves fetch data
    initNewsPopup();
    await Promise.all([initNews(), initFaq(), initCredits(), initWiki(), initWikiPage()]);
    initBackToTop();
})();
