/**
 * 页面渲染模块
 * 分页按需加载 · 无限滚动 · 简约风格
 */
const RenderEngine = (() => {

  const PAGE_SIZE = 30;
  let currentPage = 1;
  let allFilteredData = [];
  let hasMore = false;
  let isLoadingMore = false;
  let scrollObserver = null;

  /* ========== 首页 ========== */
  function renderHomePage(data, append) {
    const container = document.getElementById('wallpaper-grid');
    if (!container) return;

    if (!append) {
      // 首屏或重置
      if (!data || data.length === 0) {
        container.innerHTML = renderEmptyState();
        removeSentinel();
        return;
      }
      const paginated = WallpaperData.getPaginated(data, 1, PAGE_SIZE);
      allFilteredData = data;
      currentPage = 1;
      hasMore = paginated.hasMore;

      container.innerHTML = paginated.items.map((item, index) =>
        renderCard(item, index)
      ).join('');

      if (hasMore) addSentinel();
      else removeSentinel();
    } else {
      // 追加下一页
      currentPage++;
      const paginated = WallpaperData.getPaginated(allFilteredData, currentPage, PAGE_SIZE);
      hasMore = paginated.hasMore;

      container.insertAdjacentHTML('beforeend', paginated.items.map((item, index) =>
        renderCard(item, (currentPage - 1) * PAGE_SIZE + index)
      ).join(''));

      if (!hasMore) removeSentinel();
    }

    initLazyLoad();
    initCardMouseGlow();
    if (hasMore) initScrollLoad();
  }

  /* ========== 分页重置 ========== */
  function resetPagination(data) {
    currentPage = 1;
    allFilteredData = data || [];
    hasMore = false;
    isLoadingMore = false;
    removeSentinel();
  }

  /* ========== 哨兵无限滚动 ========== */
  function addSentinel() {
    removeSentinel();
    const grid = document.getElementById('wallpaper-grid');
    if (!grid) return;

    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.innerHTML = `
      <div class="load-more">
        <div class="spinner-ring"></div>
        <span>加载更多...</span>
      </div>
    `;
    grid.appendChild(sentinel);
  }

  function removeSentinel() {
    const old = document.getElementById('scroll-sentinel');
    if (old) old.remove();
    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }
  }

  function initScrollLoad() {
    const sentinel = document.getElementById('scroll-sentinel');
    if (!sentinel) return;

    if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }

    if ('IntersectionObserver' in window) {
      scrollObserver = new IntersectionObserver((entries) => {
        if (entries && entries.length > 0 && entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      }, { rootMargin: '0px 0px 300px 0px' });
      scrollObserver.observe(sentinel);
    } else {
      window.addEventListener('scroll', onScrollCheck, { passive: true });
    }
  }

  function onScrollCheck() {
    if (!hasMore || isLoadingMore) return;
    const sentinel = document.getElementById('scroll-sentinel');
    if (!sentinel) return;
    if (sentinel.getBoundingClientRect().top < window.innerHeight + 300) {
      loadMore();
    }
  }

  function loadMore() {
    if (isLoadingMore || !hasMore) return;
    isLoadingMore = true;
    removeSentinel();

    setTimeout(() => {
      renderHomePage(allFilteredData, true);
      isLoadingMore = false;
    }, 200);
  }

  /* ========== 获取全量（筛选后的）数据 ========== */
  function getAllFilteredData() {
    return allFilteredData;
  }

  /* ========== 单张卡片 ========== */
  function renderCard(item, index) {
    const searchKeyword = FilterManager.getCurrentSearch();
    const delay = (index % 20) * 0.04;
    // hover 显示的完整格式：标题4K高清分类壁纸分辨率
    const hoverText = `${item.title}4K高清${item.category}壁纸${item.resolution}`;

    return `
      <article class="wallpaper-card" data-id="${item.id}"
               style="animation-delay: ${delay}s">
        <div class="card-glow"></div>
        <div class="card-image-wrapper">
          <img
            class="card-image lazy"
            data-src="${item.thumbnail}"
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3Crect fill='%23e8e4f2' width='400' height='225'/%3E%3C/svg%3E"
            alt="${item.title}"
          >
          <!-- hover 才显示的底部信息条 -->
          <div class="card-hover-info">
            <span class="hover-text">${hoverText}</span>
          </div>
          <div class="card-overlay">
            <div class="card-actions">
              <button class="btn-quick-download"
                 title="下载原图"
                 data-url="${item.original}"
                 data-name="${item.title}.jpg"
                 onclick="event.stopPropagation();Downloader.fromCard(this)">
                <svg class="ico-dl" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="ico-load" style="display:none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinning">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  /* ========== 鼠标光效追踪 ========== */
  function initCardMouseGlow() {
    const cards = document.querySelectorAll('.wallpaper-card');
    cards.forEach(card => {
      const glow = card.querySelector('.card-glow');
      if (!glow) return;

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        glow.style.setProperty('--mouse-x', x + '%');
        glow.style.setProperty('--mouse-y', y + '%');
      });
    });
  }

  /* ========== 详情页 ========== */
  function renderDetailPage(id) {
    const item = WallpaperData.getById(id);
    if (!item) { renderNotFound(); return; }

    const container = document.getElementById('detail-container');
    const grid = document.getElementById('wallpaper-grid');
    const homeContainer = document.getElementById('home-container');
    const categoryBar = document.getElementById('category-bar');
    const searchBar = document.getElementById('search-bar');

    if (grid) grid.style.display = 'none';
    if (homeContainer) homeContainer.style.display = 'none';
    if (categoryBar) categoryBar.style.display = 'none';
    if (searchBar) searchBar.style.display = 'none';

    if (container) {
      container.style.display = 'block';
      container.innerHTML = `
        <div class="detail-page" style="animation: detailSlideIn 0.5s var(--ease-spring);">
          <button class="btn-back" onclick="location.hash='/'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>返回</span>
          </button>

          <div class="detail-content">
            <div class="detail-image-wrapper">
              <div class="detail-image-skeleton">
                <div class="skeleton-shimmer"></div>
                <div class="skeleton-spinner">
                  <div class="spinner"></div>
                  <span class="skeleton-text">图片加载中...</span>
                </div>
              </div>
              <img
                class="detail-image"
                src="${item.original}"
                alt="${item.title}"
                onload="const sk=this.previousElementSibling;sk.classList.add('hidden');this.style.opacity='1'"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 600 338%27%3E%3Crect fill=%27%23e8e4f2%27 width=%27600%27 height=%27338%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 fill=%27%23999%27 font-size=%2716%27%3E  图片加载失败%3C/text%3E%3C/svg%3E';const sk=this.previousElementSibling;sk.classList.add('hidden')"
              >
            </div>

            <div class="detail-info">
              <h1 class="detail-title">${item.title}</h1>

              <div class="detail-meta">
                <div class="meta-row">
                  <span class="meta-label">分辨率</span>
                  <span class="meta-value">${item.resolution}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">分类</span>
                  <span class="meta-value">${item.category}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">作者</span>
                  <span class="meta-value">${item.author || '未知'}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">许可</span>
                  <span class="meta-value">${item.license || '-'}</span>
                </div>
              </div>

              <div class="detail-tags">
                ${item.tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('')}
              </div>

              <button class="btn-download"
                 data-url="${item.original}"
                 data-name="${item.title}.jpg"
                 onclick="Downloader.fromDetail(this)">
                <svg class="ico-dl" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>下载原图</span>
              </button>
            </div>
          </div>

          <section class="related-section">
            <h2 class="related-title">相关推荐</h2>
            <div class="related-grid" id="related-grid"></div>
          </section>
        </div>
      `;

      const related = WallpaperData.getRelated(id, 8);
      renderRelated(related);
    }
  }

  /* ========== 相关推荐 ========== */
  function renderRelated(data) {
    const container = document.getElementById('related-grid');
    if (!container) return;

    if (data.length === 0) {
      container.innerHTML = '<p class="no-related">暂无相关推荐</p>';
      return;
    }

    container.innerHTML = data.map((item, i) => `
      <article class="wallpaper-card related-card" data-id="${item.id}"
               style="animation-delay: ${i * 0.06}s">
        <div class="card-glow"></div>
        <div class="card-image-wrapper">
          <img class="card-image lazy" data-src="${item.thumbnail}"
               src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3Crect fill='%23e8e4f2' width='400' height='225'/%3E%3C/svg%3E"
               alt="${item.title}">
          <div class="card-hover-info">
            <span class="hover-text">${item.title} ${item.resolution}</span>
          </div>
          <div class="card-overlay"></div>
        </div>
      </article>
    `).join('');

    container.querySelectorAll('.related-card').forEach(card => {
      card.addEventListener('click', () => {
        location.hash = `#/detail/${card.dataset.id}`;
      });
    });

    initLazyLoad();
    initCardMouseGlow();
  }

  /* ========== 404 ========== */
  function renderNotFound() {
    const homeContainer = document.getElementById('home-container');
    const detailContainer = document.getElementById('detail-container');
    const categoryBar = document.getElementById('category-bar');
    const searchBar = document.getElementById('search-bar');

    if (homeContainer) homeContainer.style.display = 'none';
    if (categoryBar) categoryBar.style.display = 'none';
    if (searchBar) searchBar.style.display = 'none';

    if (detailContainer) {
      detailContainer.style.display = 'block';
      detailContainer.innerHTML = `
        <div class="not-found">
          <div class="nf-code">404</div>
          <h2 class="nf-title">壁纸未找到</h2>
          <p class="nf-desc">这张壁纸可能已经被移除，或者链接地址不正确。</p>
          <a href="#/" class="btn-back-home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>返回首页</span>
          </a>
        </div>
      `;
    }
  }

  /* ========== 空状态 ========== */
  function renderEmptyState() {
    return `
      <div class="empty-state">
        <svg class="empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <h3 class="empty-title">没有找到相关壁纸</h3>
        <p class="empty-desc">试试更换筛选条件或搜索其他关键词吧</p>
      </div>
    `;
  }

  /* ========== Loading — 跳动圆点 + 脉冲光晕 ========== */
  function renderLoading() {
    const container = document.getElementById('wallpaper-grid');
    if (!container) return;

    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
        </div>
        <p class="loading-text">
          正在加载壁纸
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
        </p>
      </div>
    `;
  }

  /* ========== 错误状态 ========== */
  function renderError(message = '数据加载失败') {
    const container = document.getElementById('wallpaper-grid');
    if (!container) return;
    container.innerHTML = `
      <div class="error-state">
        <svg class="error-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <h3 class="error-title">加载失败</h3>
        <p class="error-desc">${message}</p>
        <button class="btn-retry" onclick="location.reload()">重新加载</button>
      </div>
    `;
  }

  /* ========== 首页显示 ========== */
  function showHomePage() {
    const grid = document.getElementById('wallpaper-grid');
    const homeContainer = document.getElementById('home-container');
    const detailContainer = document.getElementById('detail-container');
    const categoryBar = document.getElementById('category-bar');
    const searchBar = document.getElementById('search-bar');

    if (grid) grid.style.display = '';
    if (homeContainer) homeContainer.style.display = '';
    if (categoryBar) categoryBar.style.display = '';
    if (searchBar) searchBar.style.display = '';

    if (detailContainer) {
      detailContainer.style.display = 'none';
      detailContainer.innerHTML = '';
    }
  }

  /* ========== 懒加载：150px 提前 + 模糊→清晰过渡 ========== */
  let lazyLoadObserver = null;
  let lazyLoadTimer = null;

  function initLazyLoad() {
    const lazyImages = document.querySelectorAll('img.lazy');
    if (lazyImages.length === 0) return;

    if ('IntersectionObserver' in window) {
      if (!lazyLoadObserver) {
        lazyLoadObserver = new IntersectionObserver((entries) => {
          const visible = entries.filter(e => e.isIntersecting);
          if (visible.length === 0) return;

          if (lazyLoadTimer) clearTimeout(lazyLoadTimer);
          lazyLoadTimer = setTimeout(() => {
              visible.forEach(entry => {
                const img = entry.target;
                const src = img.dataset.src;
                if (src) {
                  img.loading = 'eager';   // 避免浏览器再次干预懒加载
                  img.src = src;
                  img.addEventListener('load', () => {
                    img.classList.add('loaded');
                  }, { once: true });
                img.removeAttribute('data-src');
                img.classList.remove('lazy');
              }
              lazyLoadObserver.unobserve(img);
            });
          }, 80);
        }, {
          rootMargin: '150px 0px',
          threshold: 0.01
        });
      }
      lazyImages.forEach(img => lazyLoadObserver.observe(img));
    } else {
      lazyImages.forEach(img => {
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.classList.add('loaded');
          img.removeAttribute('data-src');
          img.classList.remove('lazy');
        }
      });
    }
  }

  /* ========== 导航滚动阴影 (RAF 节流) ========== */
  let navScrollTicking = false;
  function initNavScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
      if (!navScrollTicking) {
        requestAnimationFrame(() => {
          navbar.classList.toggle('scrolled', window.scrollY > 10);
          navScrollTicking = false;
        });
        navScrollTicking = true;
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavScroll);
  } else {
    initNavScroll();
  }

  /* ========== 卡片点击委托 ========== */
  function bindCardClicks() {
    const grid = document.getElementById('wallpaper-grid');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.wallpaper-card');
      if (!card) return;
      if (e.target.closest('.btn-quick-download')) return;
      const id = card.dataset.id;
      if (id) location.hash = `#/detail/${id}`;
    });
  }

  return {
    renderHomePage, renderDetailPage, renderNotFound,
    renderLoading, renderError, showHomePage,
    initLazyLoad, initNavScroll, initCardMouseGlow, bindCardClicks,
    resetPagination, getAllFilteredData
  };

})();

/* ========== 下拉刷新模块 ========== */
const PullToRefresh = (() => {
  let indicator = null;
  let isPulling = false;
  let startY = 0;
  let pullDistance = 0;
  let isRefreshing = false;
  const THRESHOLD = 70; // 触发刷新的阈值
  const MAX_PULL = 120; // 最大下拉距离

  function init() {
    // 创建刷新指示器
    indicator = document.createElement('div');
    indicator.className = 'ptr-indicator';
    indicator.innerHTML = `
      <div class="ptr-spinner">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </div>
      <span class="ptr-text">下拉刷新</span>
    `;

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.insertBefore(indicator, mainContent.firstChild);
    }

    // 触摸事件（移动端）
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);

    // 鼠标事件（桌面端模拟）
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onTouchStart(e) {
    if (isRefreshing) return;
    if (window.scrollY > 5) return;
    if (e.touches.length !== 1) return;

    startY = e.touches[0].clientY;
    isPulling = true;
  }

  function onTouchMove(e) {
    if (!isPulling || isRefreshing) return;
    pullDistance = e.touches[0].clientY - startY;

    if (pullDistance > 0) {
      // 弹性阻尼
      const damped = Math.min(pullDistance * 0.45, MAX_PULL);
      updateIndicator(damped / THRESHOLD);

      if (pullDistance > 10) {
        e.preventDefault();
      }
    }
  }

  function onTouchEnd() {
    if (!isPulling) return;
    isPulling = false;

    if (pullDistance >= THRESHOLD) {
      triggerRefresh();
    } else {
      resetIndicator();
    }
    pullDistance = 0;
  }

  // 桌面端鼠标支持
  function onMouseDown(e) {
    if (isRefreshing || window.scrollY > 5) return;
    startY = e.clientY;
    isPulling = true;
  }

  function onMouseMove(e) {
    if (!isPulling || isRefreshing || !e.buttons) {
      isPulling = false;
      return;
    }
    pullDistance = e.clientY - startY;
    if (pullDistance > 0) {
      const damped = Math.min(pullDistance * 0.45, MAX_PULL);
      updateIndicator(damped / THRESHOLD);
    }
  }

  function onMouseUp() {
    if (!isPulling) return;
    isPulling = false;

    if (pullDistance >= THRESHOLD) {
      triggerRefresh();
    } else {
      resetIndicator();
    }
    pullDistance = 0;
  }

  function updateIndicator(progress) {
    if (!indicator) return;
    const clamped = Math.min(progress, 1.2);
    indicator.style.setProperty('--ptr-progress', clamped);

    const text = indicator.querySelector('.ptr-text');
    const spinner = indicator.querySelector('.ptr-spinner svg');

    if (clamped >= 1) {
      if (text) text.textContent = '释放刷新';
      if (spinner) spinner.style.transform = 'rotate(180deg)';
    } else {
      if (text) text.textContent = '下拉刷新';
      if (spinner) spinner.style.transform = `rotate(${clamped * 180}deg)`;
    }
  }

  function resetIndicator() {
    if (!indicator) return;
    indicator.style.setProperty('--ptr-progress', 0);
    const spinner = indicator.querySelector('.ptr-spinner svg');
    if (spinner) spinner.style.transform = 'rotate(0deg)';
  }

  async function triggerRefresh() {
    if (isRefreshing) return;
    isRefreshing = true;

    if (indicator) {
      indicator.classList.add('refreshing');
      const text = indicator.querySelector('.ptr-text');
      if (text) text.textContent = '刷新中...';
    }

    try {
      // 动态生成新壁纸数据（模拟免费图源）
      const fresh = generateDynamicWallpapers(1024);
      WallpaperData.refresh(fresh);
      resetPagination();

      // 重新渲染
      const data = FilterManager.getFilteredData();
      RenderEngine.renderHomePage(data);
      RenderEngine.bindCardClicks();

      Toast.show('success', '已从免费图源刷新 ' + data.length + ' 张新壁纸');
    } catch (err) {
      // 降级：重新加载静态 JSON
      try {
        const res = await fetch('./data.json?t=' + Date.now());
        const fallback = await res.json();
        WallpaperData.refresh(fallback);
        const data = FilterManager.getFilteredData();
        RenderEngine.renderHomePage(data);
        RenderEngine.bindCardClicks();
        Toast.show('info', '已刷新 ' + data.length + ' 张壁纸');
      } catch (e) {
        Toast.show('error', '刷新失败，请检查网络');
      }
    }

    setTimeout(() => {
      if (indicator) indicator.classList.remove('refreshing');
      resetIndicator();
      isRefreshing = false;
    }, 600);
  }

  /* ========== 动态生成壁纸数据（模拟免费图源） ========== */
  function generateDynamicWallpapers(count) {
    const categories = ['自然', '动漫', '抽象', '风景', '动物', '城市', '极简', '科技'];
    const tagsMap = {
      '自然': ['湖', '山', '日出', '森林', '海洋', '花', '雪', '瀑布'],
      '动漫': ['二次元', '日系', '赛博', '奇幻', '机甲', '少女', '治愈', '魔法'],
      '抽象': ['色彩', '几何', '渐变', '粒子', '流体', '线条', '梦幻', '霓虹'],
      '风景': ['日落', '山峰', '海滩', '田野', '雪景', '沙漠', '星空', '极光'],
      '动物': ['猫', '狗', '鹰', '狐狸', '大象', '海豚', '蝴蝶', '熊猫'],
      '城市': ['夜景', '天际线', '街道', '霓虹', '建筑', '桥梁', '塔', '广场'],
      '极简': ['留白', '禅意', '线条', '纯色', '光影', '水墨', '圆', '素雅'],
      '科技': ['芯片', '数字', 'AI', '量子', 'VR', '卫星', '数据', '代码']
    };
    const resolutions = ['1920x1080', '2560x1440', '1920x1200', '3840x2160', '2560x1080', '3440x1440'];
    const authors = ['zyeoo', 'Pexels', 'Pixabay', 'Freepik', 'Stocksnap'];

    const data = [];
    // 使用当前时间戳作为随机种子，确保每次刷新图片都不同
    const seed = Date.now();

    for (let i = 0; i < count; i++) {
      const catIndex = Math.floor((i / count) * categories.length);
      const category = categories[Math.min(catIndex, categories.length - 1)];
      const tags = tagsMap[category];
      const shuffled = [...tags].sort(() => Math.random() - 0.5);

      data.push({
        id: i + 1,
        title: generateTitle(category, tags, i, seed),
        category: category,
        tags: shuffled.slice(0, 3 + Math.floor(Math.random() * 3)),
        resolution: resolutions[Math.floor(Math.random() * resolutions.length)],
        thumbnail: `https://picsum.photos/seed/r${seed}_${i}/400/225`,
        original: `https://picsum.photos/seed/r${seed}_${i}/1920/1080`,
        author: authors[Math.floor(Math.random() * authors.length)],
        license: '免费使用'
      });
    }
    return data;
  }

  function generateTitle(category, tags, index, seed) {
    // 丰富的真实感标题模板，按分类区分
    const titles = {
      '自然': [
        '晨雾缭绕的远山与湖泊','金色阳光穿透密林','雨后山谷中的彩虹','雪山顶峰的日出','静谧湖畔的倒影',
        '冰川脚下的蓝色冰洞','秋日枫林小径','樱花树下的小溪','日出时分的大峡谷','月光下的瀑布',
        '草原上奔跑的野马','碧波荡漾的海岸线','晨露中的野花','云雾中的松林','火山口上的星空',
        '竹林深处的幽径','黄昏时的麦田','春天盛开的油菜花田','海岸礁石上的灯塔','雨林中的巨树',
        '清澈的溪流穿石而过','雪中的红梅','黄昏沙漠中的驼队','极光下的冰原','朝霞映照的梯田'
      ],
      '动漫': [
        '星空下的魔法少女','赛博朋克都市夜景','龙与少年的奇幻冒险','樱花树下的约定','机甲战士出击',
        '异世界的黄昏','月光下的剑客','奇幻森林中的精灵','蒸汽朋克飞艇','未来都市的天际线',
        '校园天台的风','夏日祭典的烟花','神社前的巫女','魔法学院的大门','海底的龙宫',
        '风之谷的飞行器','星辰大海的航路','夜樱下的武士','镜之国的爱丽丝','云端上的城堡'
      ],
      '风景': [
        '圣托里尼的蓝白日落','阿尔卑斯山下的牧场','冰岛黑沙滩的极光','马尔代夫的水上屋','挪威峡湾的晨雾',
        '托斯卡纳的葡萄园','瑞士小镇的雪景','撒哈拉沙漠的星空','巴厘岛的梯田','北海道薰衣草花田',
        '苏格兰高地的城堡','新西兰霍比屯','约旦佩特拉古城','大堡礁的珊瑚海','土耳其热气球日出',
        '桂林漓江的渔火','黄山云海的日出','九寨沟的五彩池','张家界的悬浮山','元阳梯田的晨光'
      ],
      '动物': [
        '雪地里回眸的狐狸','草原上漫步的大象','树枝上休憩的猫头鹰','深海中游动的鲸鱼','花丛中的蝴蝶',
        '竹林里吃竹子的熊猫','屋顶上晒太阳的猫','雪原中的北极熊','树枝间跳跃的松鼠','溪流中捕鱼的棕熊',
        '天空中翱翔的雄鹰','海边礁石上的海豹','林间觅食的小鹿','草原上的斑马群','冰雪中的企鹅一家',
        '花丛中采蜜的蜂鸟','阳光下打盹的狮子','水中游弋的天鹅','山谷里的狼群','枝头鸣唱的夜莺'
      ],
      '城市': [
        '东京涩谷的十字路口','纽约曼哈顿的天际线','上海外滩的夜景','巴黎埃菲尔铁塔','伦敦塔桥的黄昏',
        '香港维多利亚港','迪拜的摩天大楼','芝加哥的城市峡谷','悉尼歌剧院的日落','新加坡滨海湾',
        '布拉格查理大桥','威尼斯水城的贡多拉','罗马斗兽场的晨曦','京都竹林小道','阿姆斯特丹运河',
        '首尔明洞的霓虹','曼谷大皇宫','巴塞罗那圣家堂','旧金山金门大桥','莫斯科红场的雪'
      ],
      '抽象': [
        '色彩流动的几何幻境','光影交错的数字迷宫','霓虹线条的时空隧道','梦幻渐变的星云漩涡',
        '极简构图的留白意境','流体粒子的律动轨迹','波普风格的颜色碰撞','像素化的城市剪影',
        '金属质感的波纹表面','解构重组的几何形体','迷幻色彩的空间扭曲','光与影的秩序构成',
        '液态金属的流动','彩色玻璃的光影','万花筒般的对称图','丝线交织成的图案','水墨晕染的纹理'
      ],
      '极简': [
        '纯白空间的几何光影','留白的禅意庭院','黑白线条的山峦','单色调的迷雾森林',
        '极简建筑的直角构图','素色海面的地平线','水墨晕染的远山','空灵寂静的冰湖',
        '一根线分割的天空','台阶上的光影交错','圆形窗框中的树影','极简桌面纯色背景',
        '几何形状的留白','素白墙面的树影','平面构成的黑白','负空间的建筑剪影'
      ],
      '科技': [
        '芯片内部的微观世界','数据洪流的可视化','量子计算机的冷光','人工智能的视觉想象',
        '太空站俯瞰地球','虚拟现实的边界','基因螺旋的荧光','纳米材料的表面','卫星轨道上的日出',
        '代码矩阵的绿色瀑布','服务器机房的蓝色光芒','3D打印的复杂结构','光缆中的数据流动',
        '未来城市的全息投影','机器人手臂的精密','太空深处的星云','神经网络的可视化','黑客帝国的数字雨'
      ]
    };

    const pool = titles[category] || titles['自然'];
    const rng = ((seed + index * 7) % pool.length + pool.length) % pool.length;
    return pool[rng];
  }

  return { init };
})();

// 初始化下拉刷新
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PullToRefresh.init());
} else {
  PullToRefresh.init();
}

/* ========== 下载器 ========== */
const Downloader = (() => {
  async function download(el, url, name) {
    const icoDl = el.querySelector('.ico-dl');
    const icoLoad = el.querySelector('.ico-load');

    if (icoDl) icoDl.style.display = 'none';
    if (icoLoad) icoLoad.style.display = 'block';
    el.disabled = true;

    const ok = await Utils.downloadImage(url, name);

    if (icoDl) icoDl.style.display = 'block';
    if (icoLoad) icoLoad.style.display = 'none';
    el.disabled = false;

    if (ok) {
      Toast.show('success', '下载完成');
    } else {
      Toast.show('info', '已在新窗口打开图片');
    }
  }

  function fromCard(el) {
    const url = el.dataset.url;
    const name = el.dataset.name;
    if (url) download(el, url, name);
  }

  function fromDetail(el) {
    const url = el.dataset.url;
    const name = el.dataset.name;
    if (url) download(el, url, name);
  }

  return { fromCard, fromDetail };
})();

/* ========== Toast 通知系统 ========== */
const Toast = (() => {
  let container = null;

  function ensureContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(type = 'info', message, duration = 3000) {
    const c = ensureContainer();
    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
    };

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    c.appendChild(el);

    setTimeout(() => {
      el.classList.add('removing');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  }

  return { show };
})();
