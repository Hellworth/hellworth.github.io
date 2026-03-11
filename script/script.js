const LOADER_THRESHOLD = 200;
const NEWS_LIST_MAX = 5;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

async function loadNavbar() {
    const container = document.getElementById('navbar-container');
    if (!container) return;
    
    const page = location.pathname.split('/').pop() || 'index.html';
    const isHomepage = page === 'index.html' || page === '';
    
    const navbar = await fetch('assets/navbar.html').then(r => r.text());
    container.innerHTML = navbar;
    
    // Adjust links based on current page
    document.querySelectorAll('.navbar-links a').forEach(link => {
        const href = link.getAttribute('href');
        const dataLink = link.getAttribute('data-link');
        
        if (isHomepage) {
            // On index.html: convert "index.html#..." to "#..."
            if (href.startsWith('index.html#')) {
                link.setAttribute('href', '#' + href.split('#')[1]);
            } else if (href === 'credits.html') {
                link.setAttribute('href', 'credits.html');
            }
        } else {
            // On credits.html: links already point to index.html#...
        }
    });
    
    initNavbar();
}

async function loadLoader() {
    const container = document.getElementById('loader-container');
    if (!container) return;
    
    const loader = await fetch('assets/loader.html').then(r => r.text());
    container.innerHTML = loader;
}

async function loadFooter() {
    const container = document.getElementById('footer-container');
    if (!container) return;
    
    const footer = await fetch('assets/footer.html').then(r => r.text());
    container.innerHTML = footer;
}

function initNavbar() {
    const page = location.pathname.split('/').pop() || 'index.html';
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

function createNewsCard(item, small = false) {
    const card = document.createElement('div');
    card.className = 'news-card' + (small ? ' news-card--small' : '');
    const icon = item.type === 'update' ? 'images/UPD.png' : 'images/NEWS.png';
    card.innerHTML = `
        <div class="news-card-image"><img src="${item.image}" alt="${item.title}"></div>
        <div class="news-card-text">
            <h3>${item.title}</h3>
            <p class="news-card-desc">${item.description}</p>
            <span class="news-card-date">${formatDate(item.date)}</span>
        </div>
        <div class="news-card-circle"><img src="${icon}" alt=""></div>
    `;
    card.addEventListener('click', () => {
        window.location.href = 'news.html?title=' + encodeURIComponent(item.title);
    });
    return card;
}

function createNewsListItem(item) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#">${item.title}<span class="news-list-date">${formatDate(item.date)}</span></a>`;
    return li;
}

function renderNewsColumn(items, cardContainerId, listId, showMoreId) {
    const cardContainer = document.getElementById(cardContainerId);
    const list = document.getElementById(listId);
    const showMore = document.getElementById(showMoreId);

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

    // Create a map to fetch member data easily securely using their ID
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
    await loadNavbar();
    await loadFooter();
    await loadLoader();
    initLoader();
    initNews();
    initFaq();
    initCredits();
    initWiki();
    initWikiPage();
})();
