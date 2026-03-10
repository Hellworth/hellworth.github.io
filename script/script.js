const LOADER_THRESHOLD = 200;
const NEWS_LIST_MAX = 5;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

async function loadNavbar() {
    const container = document.getElementById('navbar-container');
    if (!container) return;
    
    const page = location.pathname.split('/').pop() || 'index.html';
    const isHomepage = page === 'index.html' || page === '';
    
    const navbar = await fetch('navbar.html').then(r => r.text());
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
    
    const loader = await fetch('loader.html').then(r => r.text());
    container.innerHTML = loader;
}

async function loadFooter() {
    const container = document.getElementById('footer-container');
    if (!container) return;
    
    const footer = await fetch('footer.html').then(r => r.text());
    container.innerHTML = footer;
}

function initNavbar() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-links a').forEach(link => {
        const href = link.getAttribute('href');
        const isActive = 
            (page === 'index.html' && href === '#main') ||
            (page === 'credits.html' && href === 'credits.html');
        
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

    const { categories, guests } = await fetch('datas/credits.json').then(r => r.json());

    if (container) {
        categories.forEach(({ title, members }) => {
            const category = document.createElement('div');
            category.className = 'credits-category';
            category.innerHTML = `<h2>${title}</h2>`;

            const row = document.createElement('div');
            row.className = 'credits-row';

            members.forEach(({ name, alias, image, roles }) => {
                const card = document.createElement('div');
                card.className = 'credit-card';
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

(async () => {
    await loadNavbar();
    await loadFooter();
    initLoader();
    initNews();
    initFaq();
    initCredits();
})();
