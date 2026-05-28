/**
 * 分类筛选与搜索逻辑模块
 */
const FilterManager = (() => {

  let currentCategory = 'all';
  let currentSearch = '';

  /**
   * 初始化筛选器
   */
  function init() {
    renderCategoryTabs();

    // 绑定搜索事件（防抖）
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      const debouncedSearch = Utils.debounce(() => {
        currentSearch = searchInput.value.trim();
        triggerFilterChange();
      }, 300);

      searchInput.addEventListener('input', debouncedSearch);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          currentSearch = '';
          triggerFilterChange();
          searchInput.blur();
        }
      });
    }

    // 绑定分类标签点击事件（事件委托）
    const categoryBar = document.getElementById('category-bar');
    if (categoryBar) {
      categoryBar.addEventListener('click', (e) => {
        const tab = e.target.closest('.category-tab');
        if (!tab) return;
        const category = tab.dataset.category;
        setCategory(category);
      });
    }
  }

  /**
   * 渲染分类标签
   */
  function renderCategoryTabs() {
    const container = document.getElementById('category-bar');
    if (!container) return;

    const categories = WallpaperData.getCategories();
    const tabs = [
      { category: 'all', label: '全部' },
      ...categories.map(cat => ({ category: cat, label: cat })),
      { category: 'recommended', label: '推荐' }
    ];

    container.innerHTML = tabs.map(tab =>
      `<button class="category-tab${currentCategory === tab.category ? ' active' : ''}"
               data-category="${tab.category}">
        ${tab.label}
      </button>`
    ).join('');
  }

  /**
   * 设置当前分类
   */
  function setCategory(category) {
    currentCategory = category;

    // 更新标签激活态
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });

    // 切换分类时平滑滚动到内容区
    const grid = document.getElementById('wallpaper-grid');
    if (grid) {
      const navHeight = 64 + 52; // 导航栏 + 分类栏高度
      window.scrollTo({
        top: grid.getBoundingClientRect().top + window.pageYOffset - navHeight - 8,
        behavior: 'smooth'
      });
    }

    triggerFilterChange();
  }

  /**
   * 获取当前筛选条件
   */
  function getCurrentCategory() {
    return currentCategory;
  }

  function getCurrentSearch() {
    return currentSearch;
  }

  /**
   * 获取筛选后的数据
   */
  function getFilteredData() {
    let data;

    if (currentCategory === 'all') {
      data = WallpaperData.getAll();
    } else if (currentCategory === 'recommended') {
      // 推荐：每个分类取一张
      const categories = WallpaperData.getCategories();
      data = [];
      categories.forEach(cat => {
        const items = WallpaperData.getByCategory(cat);
        if (items.length > 0) data.push(items[0]);
      });
    } else {
      data = WallpaperData.getByCategory(currentCategory);
    }

    // 搜索过滤
    if (currentSearch) {
      const kw = currentSearch.toLowerCase();
      data = data.filter(item =>
        item.title.toLowerCase().includes(kw) ||
        item.tags.some(tag => tag.toLowerCase().includes(kw)) ||
        item.category.toLowerCase().includes(kw)
      );
    }

    return data;
  }

  /**
   * 触发筛选变化（通知渲染模块更新）
   */
  function triggerFilterChange() {
    RenderEngine.resetPagination();
    const data = getFilteredData();
    const event = new CustomEvent('filter-change', {
      detail: { category: currentCategory, search: currentSearch, data }
    });
    document.dispatchEvent(event);
  }

  /**
   * 清空搜索
   */
  function clearSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = '';
      currentSearch = '';
    }
    setCategory('all');
  }

  return {
    init,
    setCategory,
    getCurrentCategory,
    getCurrentSearch,
    getFilteredData,
    clearSearch,
    triggerFilterChange
  };

})();
