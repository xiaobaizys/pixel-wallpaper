/**
 * 应用主入口模块
 * 初始化、路由控制、生命周期管理
 */
const App = (() => {

  /**
   * 路由处理
   */
  function handleRoute() {
    const hash = location.hash.slice(1) || '/';

    // 匹配路由模式 #/detail/{id} 和 #/
    const detailMatch = hash.match(/^\/detail\/(\d+)$/);
    const homeMatch = hash.match(/^\/$/);

    if (detailMatch) {
      const id = parseInt(detailMatch[1]);
      navigateToDetail(id);
    } else if (homeMatch || hash === '/') {
      navigateToHome();
    } else if (hash === '') {
      // 空 hash，重定向到 /
      location.replace('#/');
    } else {
      navigateToHome();
    }
  }

  /**
   * 导航到首页
   */
  function navigateToHome() {
    RenderEngine.showHomePage();
    RenderEngine.bindCardClicks();
    RenderEngine.resetPagination();

    if (WallpaperData.isLoaded()) {
      const data = FilterManager.getFilteredData();
      RenderEngine.renderHomePage(data);

      // 恢复分类标签状态
      const activeCategory = FilterManager.getCurrentCategory();
      document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === activeCategory);
      });
    }
  }

  /**
   * 导航到详情页
   */
  function navigateToDetail(id) {
    if (WallpaperData.isLoaded()) {
      RenderEngine.renderDetailPage(id);
    }
  }

  /**
   * 初始化应用
   */
  async function init() {
    // 初始化主题
    ThemeManager.init();

    // 显示加载状态
    RenderEngine.renderLoading();

    // 加载数据
    try {
      await WallpaperData.load();

      // 初始化筛选器
      FilterManager.init();

      // 绑定卡片点击
      RenderEngine.bindCardClicks();

      // 监听筛选变化
      document.addEventListener('filter-change', (e) => {
        RenderEngine.renderHomePage(e.detail.data);
      });

      // 处理当前路由
      handleRoute();

      // 更新主题按钮
      ThemeManager.updateToggleButton();

    } catch (err) {
      RenderEngine.renderError('无法加载壁纸数据，请检查网络连接后重试。');
    }
  }

  // 监听 hash 变化
  window.addEventListener('hashchange', handleRoute);

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 导出供调试
  return {
    handleRoute,
    init
  };

})();
