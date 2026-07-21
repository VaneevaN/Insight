(function () {
  // ---------- Конфигурация страниц ----------
  const pages = {
    dashboard: { title: 'Дашборд', subtitle: 'Обзор активности', action: 'Экспорт' },
    heatmap: { title: 'Тепловые карты', subtitle: 'Детальный анализ', action: 'Экспорт' },
    segments: { title: 'Сравнение сегментов', subtitle: 'Анализ по группам', action: 'Экспорт' },
    calibration: { title: 'Калибровка взгляда', subtitle: 'Проверка отслеживания', action: 'Начать' },
    sites: { title: 'Мои сайты', subtitle: 'Управление подключёнными сайтами', action: 'Добавить сайт' },
    campaigns: { title: 'Кампании', subtitle: 'Активные кампании', action: 'Запустить' },
    export: { title: 'Экспорт данных', subtitle: 'Выгрузка отчётов', action: 'Экспорт' },
    settings: { title: 'Настройки аккаунта', subtitle: 'Управление профилем', action: 'Сохранить' }
  };

  // ---------- Моковые данные дашборда ----------
  const dashboardData = {
    metrics: [
      { label: 'Сессий всего', value: '1 482', hint: '+12%', hintClass: 'metric-card__hint--positive' },
      { label: 'Средний фокус', value: '72%', hint: '-3%', hintClass: 'metric-card__hint--negative' },
      { label: 'Ср. длительность', value: '2:14', hint: '+5%', hintClass: 'metric-card__hint--positive' },
      { label: 'Сегментов', value: '5', hint: 'без изменений', hintClass: 'metric-card__hint--neutral' }
    ],
    segments: [
      { name: '18–24', value: 78, barClass: 'segment-item__bar--green' },
      { name: '25–34', value: 71, barClass: 'segment-item__bar--purple-light' },
      { name: '35–44', value: 65, barClass: 'segment-item__bar--purple' },
      { name: '45–54', value: 58, barClass: 'segment-item__bar--purple-dark' },
      { name: '55+',   value: 42, barClass: 'segment-item__bar--orange' }
    ],
    campaigns: [
      { name: 'Тест главной', domain: 'site.ru', date: '06.07.2026', sessions: 48, status: 'active' },
      { name: 'Распродажа', domain: 'shop.site.ru', date: '05.02.2026', sessions: 23, status: 'ended' }
    ],
    topElements: [
      { name: 'Баннер-герой', percent: 92 },
      { name: 'Кнопка CTA', percent: 85 },
      { name: 'Блок цен', percent: 74 },
      { name: 'Форма подписки', percent: 61 },
      { name: 'Меню навигации', percent: 48 }
    ]
  };

  // Моковые данные сегментов
  const segmentsData = {
    age: [
      { segment: '18–24', sessions: 14, focus: 78, time: '1:24', topElement: 'Баннер-герой' },
      { segment: '25–34', sessions: 18, focus: 71, time: '1:51', topElement: 'Блок цены' },
      { segment: '35–44', sessions: 10, focus: 65, time: '2:10', topElement: 'Форма' },
      { segment: '45–54', sessions: 4, focus: 58, time: '3:02', topElement: 'Меню' },
      { segment: '55+', sessions: 2, focus: 42, time: '4:15', topElement: 'Футер' }
    ],
    gender: [
      { segment: 'Мужской', sessions: 25, focus: 73, time: '1:40', topElement: 'Баннер' },
      { segment: 'Женский', sessions: 23, focus: 69, time: '2:30', topElement: 'Блок цен' }
    ],
    profession: [
      { segment: 'Студенты', sessions: 8, focus: 70, time: '1:50', topElement: 'Баннер' },
      { segment: 'Работающие', sessions: 20, focus: 68, time: '2:20', topElement: 'Блок цен' },
      { segment: 'Предприниматели', sessions: 5, focus: 55, time: '3:10', topElement: 'Форма' },
      { segment: 'Пенсионеры', sessions: 3, focus: 48, time: '3:50', topElement: 'Меню' }
    ]
  };

  const avatarIcons = [
    'fa-user', 'fa-users', 'fa-user-secret',
    'fa-shop', 'fa-hospital', 'fa-university', 'fa-eye',
    'fa-cat', 'fa-dog'
  ];
  let currentAvatar = localStorage.getItem('avatar') || 'fa-user-circle';

  const exportHistory = [{ campaign: 'Тест главной', format: 'CSV', date: '10.07.2026' }];
  let sites = [];

  // ---------- DOM-элементы ----------
  const sidebar = document.getElementById('sidebar');
  const mainArea = document.getElementById('mainArea');
  const pageTitleEl = document.getElementById('pageTitle');
  const pageSubtitleEl = document.getElementById('pageSubtitle');
  const pageActionEl = document.getElementById('pageAction');
  const contentArea = document.getElementById('contentArea');
  const modalContainer = document.getElementById('modalContainer');
  const toastContainer = document.getElementById('toastContainer');
  const navItems = document.querySelectorAll('.nav-item');

  // Страница входа
  const loginWrapper = document.getElementById('loginWrapper');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const regName = document.getElementById('regName');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const registerSubmitBtn = document.getElementById('registerSubmitBtn');
  const formError = document.getElementById('formError');
  const toggleLoginPassword = document.getElementById('toggleLoginPassword');
  const toggleRegPassword = document.getElementById('toggleRegPassword');
  const logoutBtn = document.getElementById('logoutBtn');
  const tabButtons = document.querySelectorAll('.login-tab');

  let currentTab = 'login';
  let dashboardLoaded = false;
  let currentHeatmapSegment = 'age';
  let heatmapLoading = false;
  let currentModalStep = 1;
  let activeSegmentsTab = 'age';

  // ---------- Утилиты ----------
  function isLoggedIn() { return localStorage.getItem('loggedIn') === 'true'; }
  function setLoggedIn(value) { value ? localStorage.setItem('loggedIn', 'true') : localStorage.removeItem('loggedIn'); }
  function showAppLayout() { sidebar.style.display = 'flex'; mainArea.style.display = 'flex'; loginWrapper.style.display = 'none'; }
  applyAvatar();
  function showLoginLayout() {
    sidebar.style.display = 'none';
    mainArea.style.display = 'none';
    loginWrapper.style.display = 'flex';
    clearErrors();
    loginForm.reset();
    registerForm.reset();
    switchTab('login');
  }

  function clearErrors() {
    formError.style.display = 'none';
    [loginEmail, loginPassword, regName, regEmail, regPassword].forEach(f => {
      if (f) f.classList.remove('input--error');
    });
  }

  function showFormError(fields = []) {
    formError.style.display = 'block';
    fields.forEach(f => { if (f) f.classList.add('input--error'); });
  }

  function simulateLoading(button, loadingText, callback) {
    const btnText = button.querySelector('.btn-text');
    const btnSpinner = button.querySelector('.btn-spinner');
    const originalText = btnText.textContent;
    button.disabled = true;
    btnText.textContent = loadingText;
    btnSpinner.style.display = 'inline-block';
    setTimeout(() => {
      button.disabled = false;
      btnText.textContent = originalText;
      btnSpinner.style.display = 'none';
      if (callback) callback();
    }, 1000);
  }

  // ---------- Toast ----------
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
  }

  // ---------- Аутентификация ----------
  function handleLogin(e) {
    e.preventDefault();
    clearErrors();
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    if (!email || !password) {
      showFormError([loginEmail, loginPassword]);
      showToast('Заполните все поля', 'error');
      return;
    }
    simulateLoading(loginSubmitBtn, 'Входим…', () => {
      setLoggedIn(true);
      dashboardLoaded = false;
      showAppLayout();
      navigateTo('dashboard');
    });
  }

  function handleRegister(e) {
    e.preventDefault();
    clearErrors();
    const name = regName.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value.trim();
    if (!name || !email || !password) {
      showFormError([regName, regEmail, regPassword]);
      showToast('Заполните все поля', 'error');
      return;
    }
    simulateLoading(registerSubmitBtn, 'Создаём аккаунт…', () => {
      setLoggedIn(true);
      dashboardLoaded = false;
      showAppLayout();
      navigateTo('dashboard');
    });
  }

  function handleLogout() {
    setLoggedIn(false);
    dashboardLoaded = false;
    showLoginLayout();
    navigateTo('login');
  }

  function switchTab(tab) {
    currentTab = tab;
    tabButtons.forEach(btn => btn.classList.toggle('login-tab--active', btn.getAttribute('data-tab') === tab));
    loginForm.style.display = tab === 'login' ? 'flex' : 'none';
    registerForm.style.display = tab === 'register' ? 'flex' : 'none';
    clearErrors();
  }

  function togglePasswordVisibility(input, btn) {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    const icon = btn.querySelector('i');
    if (icon) {
        icon.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    }
  }

  function applyAvatar(iconClass) {
    currentAvatar = iconClass || currentAvatar;
    localStorage.setItem('avatar', currentAvatar);
    const avatarEl = document.getElementById('sidebarAvatar');
    if (avatarEl) {
      avatarEl.innerHTML = `<i class="fa-solid ${currentAvatar}"></i>`;
    }
  }

  // ---------- Модальное окно ----------
  function openModal(html, closableByOverlay = true) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modalOverlay';
    overlay.innerHTML = `<div class="modal"><button class="modal__close" id="modalCloseBtn">&times;</button>${html}</div>`;
    modalContainer.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('modal-overlay--visible');
      overlay.querySelector('.modal').classList.add('modal--visible');
    });

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);

    if (closableByOverlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }
    document.addEventListener('keydown', handleModalEscape);
  }

  function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.classList.remove('modal-overlay--visible');
      overlay.querySelector('.modal').classList.remove('modal--visible');
      setTimeout(() => overlay.remove(), 300);
    }
    document.removeEventListener('keydown', handleModalEscape);
    currentModalStep = 1;
  }

  function handleModalEscape(e) {
    if (e.key === 'Escape' && currentModalStep !== 2) closeModal();
  }

  function openAddSiteModal() {
    currentModalStep = 1;
    const html = `
      <h3 class="modal__title">Добавить сайт</h3>
      <div class="modal__body">
        <div class="modal__field"><label class="modal__label">Название проекта</label><input type="text" class="modal__input" id="siteName" placeholder="Мой проект"></div>
        <div class="modal__field"><label class="modal__label">Домен</label><input type="text" class="modal__input" id="siteDomain" placeholder="example.com"></div>
        <div class="modal__actions">
          <button class="modal__btn modal__btn--secondary" id="modalCancelBtn">Отмена</button>
          <button class="modal__btn modal__btn--primary" id="modalAddBtn">Добавить</button>
        </div>
      </div>
    `;
    openModal(html, true);
    document.getElementById('siteName').focus();
    document.getElementById('modalAddBtn').addEventListener('click', handleAddSite);
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  }

  function handleAddSite() {
    const name = document.getElementById('siteName').value.trim();
    const domain = document.getElementById('siteDomain').value.trim();
    if (!name || !domain) {
      showToast('Заполните все поля', 'error');
      return;
    }
    const newSite = {
      id: Date.now(),
      name,
      domain,
      siteId: 'site_' + Math.random().toString(36).substring(2, 10),
      addedDate: new Date().toLocaleDateString('ru-RU'),
      campaigns: 3,
      sessions: 48
    };
    sites.push(newSite);
    currentModalStep = 2;
    const snippet = `<script src="https://cdn.insight-app.ru/sdk.js" data-site-id="${newSite.siteId}"></script>`;
    const modal = document.querySelector('.modal');
    modal.innerHTML = `
      <button class="modal__close" id="modalCloseBtn">&times;</button>
      <h3 class="modal__title">Сайт добавлен</h3>
      <div class="modal__body">
        <p style="font-size:14px; margin-bottom:8px;">Разместите этот код на своём сайте перед закрывающим тегом <code>&lt;/body&gt;</code>:</p>
        <div class="code-snippet">${snippet}</div>
        <div class="modal__actions">
          <button class="modal__btn modal__btn--secondary" id="modalCopyBtn">Скопировать</button>
          <button class="modal__btn modal__btn--primary" id="modalDoneBtn">Готово</button>
        </div>
      </div>
    `;
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('modalDoneBtn').addEventListener('click', () => { closeModal(); renderSitesPage(); });
    document.getElementById('modalCopyBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(snippet)
        .then(() => showToast('Код скопирован', 'success'))
        .catch(() => showToast('Не удалось скопировать', 'error'));
    });
  }

  // ---------- Плавная смена контента ----------
  function setContent(html, callback) {
    contentArea.style.opacity = 0;
    setTimeout(() => {
      contentArea.innerHTML = html;
      contentArea.style.opacity = 1;
      if (typeof callback === 'function') {
        requestAnimationFrame(() => {
          callback();
        });
      }
    }, 200);
  }

  // ---------- Дашборд ----------
  function renderSkeletonDashboard() {
    return `
      <div class="metrics-row">
        <div class="skeleton skeleton--metric"></div><div class="skeleton skeleton--metric"></div><div class="skeleton skeleton--metric"></div><div class="skeleton skeleton--metric"></div>
      </div>
      <div class="dashboard-row">
        <div class="dashboard-row__left">
          <div class="dashboard-card">
            <div class="dashboard-card__header"><div class="skeleton" style="width:120px; height:20px;"></div><div class="skeleton" style="width:180px; height:28px;"></div></div>
            <div class="skeleton skeleton--heatmap"></div>
            <div class="skeleton skeleton--legend"></div>
          </div>
        </div>
        <div class="dashboard-row__right">
          <div class="dashboard-card">
            <div class="skeleton" style="width:100px; height:20px; margin-bottom:16px;"></div>
            ${Array(5).fill('<div class="skeleton skeleton--segment-item"></div>').join('')}
          </div>
        </div>
      </div>
      <div class="dashboard-row">
        <div class="dashboard-row__left">
          <div class="dashboard-card">
            <div class="skeleton" style="width:140px; height:20px; margin-bottom:12px;"></div>
            ${Array(2).fill('<div class="skeleton skeleton--campaign-item"></div>').join('')}
          </div>
        </div>
        <div class="dashboard-row__right">
          <div class="dashboard-card">
            <div class="skeleton" style="width:160px; height:20px; margin-bottom:12px;"></div>
            ${Array(5).fill('<div class="skeleton skeleton--top-element-item"></div>').join('')}
          </div>
        </div>
      </div>
    `;
  }

  function getHeatmapContent(segment) {
    if (segment === 'profession') {
      return `<div class="heatmap-empty"><div class="heatmap-empty__icon">⚠</div><div class="heatmap-empty__title">Нет данных для этого сегмента</div><div class="heatmap-empty__desc">Попробуйте выбрать другой сегмент</div></div>`;
    }
    return `<div class="heatmap-preview"><div class="heatmap-blur"></div></div><div class="heatmap-legend"><span>Низкий</span><div class="legend-gradient"></div><span>Высокий</span></div>`;
  }

  function getHeatmapSkeleton() {
    return `<div class="skeleton skeleton--heatmap"></div><div class="skeleton skeleton--legend"></div>`;
  }

  function switchHeatmapSegment(segment) {
    if (segment === currentHeatmapSegment || heatmapLoading) return;
    currentHeatmapSegment = segment;
    heatmapLoading = true;

    const tabs = document.querySelectorAll('.segment-tab');
    tabs.forEach(tab => {
      const seg = tab.getAttribute('data-segment');
      tab.classList.toggle('segment-tab--active', seg === segment);
    });
    const container = document.getElementById('heatmapContainer');
    if (container) {
      container.innerHTML = getHeatmapSkeleton();
    }

    setTimeout(() => {
      heatmapLoading = false;
      const updatedContainer = document.getElementById('heatmapContainer');
      if (updatedContainer) {
        updatedContainer.innerHTML = getHeatmapContent(segment);
      }
    }, 1500);
  }

  function renderRealDashboard() {
    const d = dashboardData;
    const metricsHTML = d.metrics.map(m => `
      <div class="metric-card">
        <span class="metric-card__label">${m.label}</span>
        <span class="metric-card__value">${m.value}</span>
        <span class="metric-card__hint ${m.hintClass}">${m.hint}</span>
      </div>
    `).join('');

    const segmentsHTML = d.segments.map(s => {
    return `
      <div class="segment-item">
        <span class="segment-item__name">${s.name}</span>
        <div class="segment-item__bar-wrapper">
          <div class="segment-item__bar ${s.barClass}" style="width: ${s.value}%;"></div>
        </div>
        <span class="segment-item__value">${s.value}%</span>
      </div>
      `;
    }).join('');;

    const campaignsHTML = d.campaigns.map(c => {
      const statusClass = c.status === 'active' ? 'campaign-item__status--active' : 'campaign-item__status--ended';
      const statusText = c.status === 'active' ? 'Активна' : 'Завершена';
      return `
        <div class="campaign-item">
          <div class="campaign-item__info">
            <span class="campaign-item__name">${c.name}</span>
            <span class="campaign-item__meta">${c.domain} · ${c.date}</span>
          </div>
          <span class="campaign-item__sessions">${c.sessions} сессий</span>
          <span class="campaign-item__status ${statusClass}">${statusText}</span>
        </div>
      `;
    }).join('');

    const topElementsHTML = d.topElements.map((el, i) => `
      <div class="top-element-item">
        <span class="top-element-item__number">${i + 1}</span>
        <span class="top-element-item__name">${el.name}</span>
        <div class="top-element-item__bar-wrapper">
          <div class="top-element-item__bar" style="width: ${el.percent}%;"></div>
        </div>
        <span class="top-element-item__percent">${el.percent}%</span>
      </div>
    `).join('');

    const heatmapContent = getHeatmapContent(currentHeatmapSegment);

    return `
    <div class="metrics-row">${metricsHTML}</div>
    <div class="dashboard-row">
      <div class="dashboard-row__left">
        <div class="dashboard-card">
          <div class="dashboard-card__header">
            <h2 class="dashboard-card__title">Тепловая карта</h2>
            <div class="segment-tabs" id="segmentTabs">
              <button class="segment-tab ${currentHeatmapSegment === 'age' ? 'segment-tab--active' : ''}" data-segment="age">Возрастные группы</button>
              <button class="segment-tab ${currentHeatmapSegment === 'gender' ? 'segment-tab--active' : ''}" data-segment="gender">Пол</button>
              <button class="segment-tab ${currentHeatmapSegment === 'profession' ? 'segment-tab--active' : ''}" data-segment="profession">Профессия</button>
            </div>
          </div>
          <div id="heatmapContainer">${heatmapContent}</div>
        </div>
      </div>
      <div class="dashboard-row__right">
        <div class="dashboard-card">
          <h2 class="dashboard-card__title" style="margin-bottom: 16px;">Фокус по сегментам</h2>
          <div class="segment-list">${segmentsHTML}</div>
        </div>
        <!-- Вставляем Топ элементов сюда -->
        <div class="dashboard-card" style="margin-top: 12px;">
          <h2 class="dashboard-card__title" style="margin-bottom: 12px;">Топ элементов по вниманию</h2>
          <div class="top-elements-list">${topElementsHTML}</div>
        </div>
      </div>
    </div>
    <div class="dashboard-row">
      <div class="dashboard-row__left" style="flex: 1;">
        <div class="dashboard-card">
          <h2 class="dashboard-card__title" style="margin-bottom: 12px;">Активные кампании</h2>
          <div class="campaign-list">${campaignsHTML}</div>
        </div>
      </div>
    </div>
    `;
  }

  function renderDashboard() {
    if (!dashboardLoaded) {
      setContent(renderSkeletonDashboard());
      dashboardLoaded = true;
      setTimeout(() => {
        if (window.location.hash.slice(1) === 'dashboard') {
          setContent(renderRealDashboard());
          attachDashboardEvents();
        }
      }, 1500);
    } else {
      setContent(renderRealDashboard());
      attachDashboardEvents();
    }
  }

  function attachDashboardEvents() {
    const tabs = document.querySelectorAll('.segment-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function () {
        const segment = this.getAttribute('data-segment');
        switchHeatmapSegment(segment);
      });
    });
  }

  // ---------- Сайты ----------
  function renderSitesPage() {
    if (sites.length === 0) {
      setContent(`
        <div class="sites-empty">
          <div class="sites-empty__icon"><i class="fa-solid fa-globe"></i></div>
          <div class="sites-empty__title">Добавьте первый сайт</div>
          <div class="sites-empty__subtitle">Вставьте наш скрипт на сайт, чтобы начать собирать данные</div>
          <button class="btn-add-site" id="btnAddFirstSite">Добавить сайт</button>
        </div>
      `);
      document.getElementById('btnAddFirstSite').addEventListener('click', openAddSiteModal);
    } else {
      const cardsHTML = sites.map(site => `
        <div class="site-card">
          <div class="site-card__header">
            <span class="site-card__icon"><i class="fa-solid fa-globe"></i></span>
            <span>${site.domain}</span>
          </div>
          <div class="site-card__meta">Добавлен ${site.addedDate}</div>
          <div class="site-card__stats">${site.campaigns} кампании · ${site.sessions} сессий</div>
          <div class="site-card__actions">
            <button class="site-card__btn site-card__btn--primary copy-site-code" data-site-id="${site.siteId}">Скопировать код</button>
            <button class="site-card__btn go-to-campaigns" data-site-id="${site.id}">Перейти</button>
          </div>
        </div>
      `).join('');

      setContent(`<div class="sites-grid">${cardsHTML}</div>`);

      document.querySelectorAll('.copy-site-code').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const siteId = e.target.dataset.siteId;
          const snippet = `<script src="https://cdn.insight-app.ru/sdk.js" data-site-id="${siteId}"></script>`;
          navigator.clipboard.writeText(snippet)
            .then(() => showToast('Код скопирован', 'success'))
            .catch(() => showToast('Не удалось скопировать', 'error'));
        });
      });

      document.querySelectorAll('.go-to-campaigns').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const siteId = e.target.dataset.siteId;
          navigateTo(`sites/${siteId}/campaigns`);
        });
      });
    }
  }

  function renderSiteCampaigns(hash) {
    const siteId = hash.split('/')[1];
    setContent(`
      <div style="padding: 40px; text-align: center;">
        <h2 style="font-size: 20px; font-weight: 500;">Кампании сайта #${siteId}</h2>
        <p style="color: #888; margin-top: 12px;">Страница в разработке</p>
      </div>
    `);
    pageTitleEl.textContent = 'Кампании сайта';
    pageSubtitleEl.textContent = '';
    pageActionEl.textContent = '';
  }

  // ---------- Тепловая карта ----------
  function renderHeatmapPage() {
    const html = `
      <div class="heatmap-page-filters">
        <select id="filterSite"><option>myshop.ru</option></select>
        <select id="filterCampaign"><option>Тест главной</option></select>
        <select id="filterSegmentBy"><option>Возраст</option><option>Пол</option><option>Профессия</option></select>
        <select id="filterSegmentValue"><option>18–24</option><option>25–34</option><option>35–44</option><option>45–54</option><option>55+</option></select>
        <button class="btn-apply-filters" id="applyFiltersBtn">Применить</button>
      </div>
      <label class="compare-checkbox">
        <input type="checkbox" id="compareMode">
        Сравнить два сегмента
      </label>
      <div id="heatmapCanvasContainer" class="heatmap-canvas-container">
        <div class="heatmap-canvas" id="singleHeatmap">
          <div class="heatmap-mock-content">
            <div class="heatmap-mock-block"></div>
            <div class="heatmap-mock-block heatmap-mock-block--short"></div>
            <div class="heatmap-mock-block heatmap-mock-block--long"></div>
            <div class="heatmap-mock-block"></div>
            <div class="heatmap-mock-block heatmap-mock-block--short"></div>
          </div>
          <div class="heatmap-spots"></div>
        </div>
      </div>
      <div class="heatmap-legend">
        <span>Низкий</span>
        <div class="legend-gradient"></div>
        <span>Высокий</span>
      </div>
    `;
    setContent(html);

    document.getElementById('applyFiltersBtn').addEventListener('click', () => {
      showToast('Фильтры применены', 'success');
    });

    const compareCheckbox = document.getElementById('compareMode');
    compareCheckbox.addEventListener('change', toggleCompareMode);
  }

  function toggleCompareMode() {
    const container = document.getElementById('heatmapCanvasContainer');
    const isChecked = document.getElementById('compareMode').checked;
    if (isChecked) {
      container.innerHTML = `
        <div class="heatmap-compare-wrapper">
          <div class="heatmap-compare-row">
            <div class="heatmap-compare-col">
              <div class="heatmap-segment-label">Сегмент А</div>
              <div class="heatmap-canvas" style="max-width: 100%; height: 400px;">
                <div class="heatmap-mock-content">
                  <div class="heatmap-mock-block"></div>
                  <div class="heatmap-mock-block heatmap-mock-block--short"></div>
                  <div class="heatmap-mock-block heatmap-mock-block--long"></div>
                  <div class="heatmap-mock-block"></div>
                  <div class="heatmap-mock-block heatmap-mock-block--short"></div>
                </div>
                <div class="heatmap-spots"></div>
              </div>
            </div>
            <div class="heatmap-compare-col">
              <div class="heatmap-segment-label">Сегмент Б</div>
              <div class="heatmap-canvas" style="max-width: 100%; height: 400px;">
                <div class="heatmap-mock-content">
                  <div class="heatmap-mock-block"></div>
                  <div class="heatmap-mock-block heatmap-mock-block--short"></div>
                  <div class="heatmap-mock-block heatmap-mock-block--long"></div>
                  <div class="heatmap-mock-block"></div>
                  <div class="heatmap-mock-block heatmap-mock-block--short"></div>
                </div>
                <div class="heatmap-spots"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="heatmap-canvas" id="singleHeatmap">
          <div class="heatmap-mock-content">
            <div class="heatmap-mock-block"></div>
            <div class="heatmap-mock-block heatmap-mock-block--short"></div>
            <div class="heatmap-mock-block heatmap-mock-block--long"></div>
            <div class="heatmap-mock-block"></div>
            <div class="heatmap-mock-block heatmap-mock-block--short"></div>
          </div>
          <div class="heatmap-spots"></div>
        </div>
      `;
    }
  }

  // ---------- Сегменты ----------
  function renderSegmentsTable(data) {
    const rows = data.map(item => `
      <tr class="clickable-row" data-segment="${item.segment}">
        <td>${item.segment}</td>
        <td>${item.sessions}</td>
        <td>${item.focus}%</td>
        <td>${item.time}</td>
        <td>${item.topElement}</td>
      </tr>
    `).join('');

    return `
      <table class="segments-table">
        <thead><tr><th>Сегмент</th><th>Сессий</th><th>Ср. фокус</th><th>Ср. время</th><th>Топ-элемент</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function renderSegmentsChart(data) {
    const sorted = [...data].sort((a, b) => b.focus - a.focus);
    const purpleShades = [
      'segment-bar-fill--purple-light',
      'segment-bar-fill--purple',
      'segment-bar-fill--purple-dark'
    ];

    const classMap = new Map();
    sorted.forEach((item, index) => {
      if (index === 0) {
        classMap.set(item, 'segment-bar-fill--green');          // самый высокий
      } else if (index === sorted.length - 1) {
        classMap.set(item, 'segment-bar-fill--orange');         // самый низкий
      } else {
        const shadeIndex = index - 1;
        if (shadeIndex < purpleShades.length) {
          classMap.set(item, purpleShades[shadeIndex]);
        } else {
          classMap.set(item, 'segment-bar-fill--purple');     // запас
        }
      }
    });

    const bars = data.map(item => {
        const barClass = classMap.get(item) || 'segment-bar-fill--purple';
        return `
            <div class="segment-bar-row">
                <span class="segment-bar-label">${item.segment}</span>
                <div class="segment-bar-track">
                    <div class="segment-bar-fill ${barClass}" style="width: ${item.focus}%;"></div>
                </div>
                <span class="segment-bar-value">${item.focus}%</span>
            </div>
        `;
    }).join('');

    return `
        <h2 class="dashboard-card__title" style="margin-bottom: 16px;">Фокус по сегментам</h2>
        <div class="segments-chart">${bars}</div>
    `;
}

  function renderSegmentsContent() {
    const data = segmentsData[activeSegmentsTab] || [];
    const tableHTML = renderSegmentsTable(data);
    const chartHTML = renderSegmentsChart(data);

    const html = `
      <div class="segments-tabs" id="segmentsTabs">
        <button class="segments-tab ${activeSegmentsTab === 'age' ? 'segments-tab--active' : ''}" data-tab="age">Возраст</button>
        <button class="segments-tab ${activeSegmentsTab === 'gender' ? 'segments-tab--active' : ''}" data-tab="gender">Пол</button>
        <button class="segments-tab ${activeSegmentsTab === 'profession' ? 'segments-tab--active' : ''}" data-tab="profession">Профессия</button>
      </div>
      ${tableHTML}
      ${chartHTML}
    `;

    setContent(html, () => {
      // Обработчики для аватарок
      document.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', function () {
          const icon = this.getAttribute('data-icon');
          applyAvatar(icon);
          renderSettingsPage(); // перерисовать для обновления выделения
        });
      });

      document.getElementById('saveProfileBtn').addEventListener('click', () => showToast('Профиль обновлён', 'success'));

      // Вешаем обработчики на табы
      document.querySelectorAll('.segments-tab').forEach(btn => {
        btn.addEventListener('click', function () {
          const tab = this.getAttribute('data-tab');
          if (tab === activeSegmentsTab) return;
          activeSegmentsTab = tab;
          renderSegmentsContent();   // рекурсивный вызов
        });
      });

      // Обработчики на строки таблицы
      document.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', function () {
          const segment = this.getAttribute('data-segment');
          navigateTo(`heatmap?segment=${encodeURIComponent(segment)}`);
        });
      });
    });
  }

  function renderSegmentsPage() {
    activeSegmentsTab = 'age';
    renderSegmentsContent();
  }

  // ---------- Экспорт ----------
  function renderExportPage() {
    const historyRows = exportHistory.map(item => `
      <tr>
        <td>${item.campaign}</td>
        <td>${item.format}</td>
        <td>${item.date}</td>
        <td><button class="btn-download-icon" data-campaign="${item.campaign}">↓</button></td>
      </tr>
    `).join('');

    setContent(`
      <div class="export-form">
        <select id="exportSite"><option>myshop.ru</option></select>
        <select id="exportCampaign"><option>Тест главной</option></select>
        <select id="exportFormat"><option>CSV</option><option>JSON</option></select>
        <button class="btn-download" id="btnDownload">Скачать</button>
      </div>
      <h3 class="dashboard-card__title" style="margin-bottom: 12px;">История экспортов</h3>
      <table class="export-history-table">
        <thead><tr><th>Кампания</th><th>Формат</th><th>Дата</th><th></th></tr></thead>
        <tbody>${historyRows}</tbody>
      </table>
    `);

    document.getElementById('btnDownload').addEventListener('click', () => {
      showToast('Экспорт запущен', 'info');
      setTimeout(() => showToast('Файл готов, проверьте загрузки', 'success'), 2000);
    });

    document.querySelectorAll('.btn-download-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const campaign = e.target.dataset.campaign;
        showToast(`Скачивание ${campaign}...`, 'info');
      });
    });
  }

  // ---------- Настройки ----------
  function renderSettingsPage() {
    const html = `
      <div class="settings-section">
        <h2 class="settings-section__title">Профиль</h2>
        <div class="settings-field">
          <label>Имя</label>
          <input type="text" id="profileName" value="Наталья">
        </div>
        <div class="settings-field">
          <label>Email</label>
          <input type="email" id="profileEmail" value="vnm@vnm.com" readonly>
        </div>
        <div class="settings-field">
          <label>Аватар</label>
          <div class="avatar-selector" id="avatarSelector">
            ${avatarIcons.map(icon => `
              <div class="avatar-option ${currentAvatar === icon ? 'avatar-option--selected' : ''}" data-icon="${icon}">
                <i class="fa-solid ${icon}"></i>
              </div>
            `).join('')}
          </div>
        </div>
        <button class="btn-save-settings" id="saveProfileBtn">Сохранить</button>
      </div>
      
      <div class="settings-section">
        <h2 class="settings-section__title">Безопасность</h2>
        <div class="settings-field">
          <label>Текущий пароль</label>
          <input type="password" id="currentPassword" placeholder="••••••••">
        </div>
        <div class="settings-field">
          <label>Новый пароль</label>
          <input type="password" id="newPassword" placeholder="••••••••">
        </div>
        <div class="settings-field">
          <label>Подтвердите пароль</label>
          <input type="password" id="confirmPassword" placeholder="••••••••">
        </div>
        <button class="btn-change-password" id="changePasswordBtn">Изменить пароль</button>
      </div>
      <div class="settings-section">
        <h2 class="settings-section__title">Аккаунт</h2>
        <button class="btn-delete-account" id="deleteAccountBtn">Удалить аккаунт</button>
      </div>
    `;

    setContent(html, () => {
      document.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', function () {
          const icon = this.getAttribute('data-icon');
          applyAvatar(icon);
          renderSettingsPage(); // обновляем выделение
        });
      });

      document.getElementById('saveProfileBtn').addEventListener('click', () => showToast('Профиль обновлён', 'success'));

      document.getElementById('changePasswordBtn').addEventListener('click', () => {
        const current = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        if (!current || !newPass || !confirm) {
          showToast('Заполните все поля', 'error');
          return;
        }
        if (newPass !== confirm) {
          showToast('Пароли не совпадают', 'error');
          return;
        }
        showToast('Пароль изменён', 'success');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
      });

      document.getElementById('deleteAccountBtn').addEventListener('click', showDeleteAccountModal);
    });
  }

  function showDeleteAccountModal() {
    const html = `
      <h3 class="modal__title">Удаление аккаунта</h3>
      <div class="modal__body">
        <p style="font-size:14px;">Вы уверены, что хотите удалить аккаунт? Это действие необратимо.</p>
        <div class="modal__actions">
          <button class="modal__btn modal__btn--secondary" id="cancelDeleteBtn">Отмена</button>
          <button class="modal__btn modal__btn--danger" id="confirmDeleteBtn">Удалить</button>
        </div>
      </div>
    `;
    openModal(html, false);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
      closeModal();
      setLoggedIn(false);
      showToast('Аккаунт удалён', 'info');
      showLoginLayout();
      navigateTo('login');
    });
  }

  // ---------- Роутинг ----------
  function navigateTo(hash) {
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    window.location.hash = cleanHash;
  }

  function updateUI() {
    let currentHash = window.location.hash.slice(1);

    if (!isLoggedIn()) {
      if (currentHash !== 'login') { navigateTo('login'); return; }
      showLoginLayout();
      return;
    }

    showAppLayout();

    if (!currentHash || currentHash === 'login') {
      navigateTo('dashboard');
      return;
    }

    if (currentHash.startsWith('sites/') && currentHash.endsWith('/campaigns')) {
      renderSiteCampaigns(currentHash);
      navItems.forEach(item => item.classList.remove('nav-item--active'));
      const sitesNav = document.querySelector('.nav-item[data-hash="sites"]');
      if (sitesNav) sitesNav.classList.add('nav-item--active');
      return;
    }

    if (!pages[currentHash]) {
      navigateTo('dashboard');
      return;
    }

    const page = pages[currentHash];
    pageTitleEl.textContent = page.title;
    pageSubtitleEl.textContent = page.subtitle;

    if (currentHash === 'sites') {
      pageActionEl.textContent = 'Добавить сайт';
      pageActionEl.onclick = openAddSiteModal;
    } else {
      pageActionEl.textContent = page.action;
      pageActionEl.onclick = null;
    }

    navItems.forEach(item => {
      const itemHash = item.getAttribute('data-hash');
      item.classList.toggle('nav-item--active', itemHash === currentHash);
    });

    switch (currentHash) {
      case 'dashboard': renderDashboard(); break;
      case 'sites': renderSitesPage(); break;
      case 'heatmap': renderHeatmapPage(); break;
      case 'segments': renderSegmentsPage(); break;
      case 'calibration': renderCalibrationPage(); break;
      case 'export': renderExportPage(); break;
      case 'settings': renderSettingsPage(); break;
      default: setContent('<p style="color: #888; font-size: 14px; padding: 24px;">Страница в разработке</p>');
    }
  }

  // ---------- Обработчики событий ----------
  window.addEventListener('hashchange', updateUI);

  navItems.forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      const hash = this.getAttribute('data-hash');
      if (hash) navigateTo(hash);
    });
  });

  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);

  tabButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab'))));

  toggleLoginPassword.addEventListener('click', () => togglePasswordVisibility(loginPassword, toggleLoginPassword));
  toggleRegPassword.addEventListener('click', () => togglePasswordVisibility(regPassword, toggleRegPassword));

  logoutBtn.addEventListener('click', handleLogout);

  // ---------- Инициализация ----------
  updateUI();
  window.navigateTo = navigateTo;

  function renderCalibrationPage() {
    console.log('window.startCalibration =', window.startCalibration);
    if (typeof webgazer === 'undefined') {
      setContent('<p style="color: #888; padding: 24px;">Ошибка загрузки WebGazer. Обновите страницу.</p>');
      return;
    }
    if (window.startCalibration) {
      window.startCalibration();
    } else {
      setContent('<p style="color: #888; padding: 24px;">Модуль калибровки не найден.</p>');
    }
}
})();