const LOADER_THRESHOLD = 200;
const NEWS_LIST_MAX = 5;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function initLoader() {
    const start = Date.now();
    let loaded = false;

    const dismiss = () => {
        const el = document.getElementById('loader');
        if (!el) return;
        el.classList.add('loader-exit');
        setTimeout(() => el.remove(), 1800);
    };

    window.addEventListener('load', () => {
        loaded = true;
        const el = document.getElementById('loader');
        if (Date.now() - start < LOADER_THRESHOLD) {
            el?.remove();
        } else {
            dismiss();
        }
    });

    setTimeout(() => {
        if (!loaded) document.getElementById('loader')?.classList.add('loader-visible');
    }, LOADER_THRESHOLD);
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
    card.style.cursor = 'pointer';
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
    const news = await fetch('news.json').then(r => r.json());
    news.sort((a, b) => new Date(b.date) - new Date(a.date));

    const majorContainer = document.getElementById('major-news-container');
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
    const items = await fetch('faq.json').then(r => r.json());
    const list = document.getElementById('faq-list');

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

initLoader();
initNews();
initFaq();
