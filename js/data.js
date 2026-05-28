/**
 * 数据加载与缓存模块
 * 单例模式，管理壁纸数据的一生
 */
const WallpaperData = (() => {

  let cache = null;
  let categoriesCache = null;
  let loading = false;
  let listeners = [];

  /**
   * 加载数据（带缓存）
   */
  async function load() {
    if (cache) return cache;
    if (loading) {
      // 等待已有请求完成
      return new Promise((resolve) => {
        const check = () => {
          if (cache) resolve(cache);
          else setTimeout(check, 50);
        };
        check();
      });
    }

    loading = true;
    try {
      const res = await fetch('./data.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`数据加载失败: ${res.status}`);
      cache = await res.json();
      categoriesCache = [...new Set(cache.map(item => item.category))];
      notifyListeners();
      return cache;
    } catch (err) {
      console.error('WallpaperData load error:', err);
      throw err;
    } finally {
      loading = false;
    }
  }

  /**
   * 根据 ID 获取单条数据
   */
  function getById(id) {
    return cache?.find(item => item.id == id) || null;
  }

  /**
   * 获取所有数据
   */
  function getAll() {
    return cache || [];
  }

  /**
   * 获取所有分类
   */
  function getCategories() {
    return categoriesCache || [];
  }

  /**
   * 按分类筛选
   */
  function getByCategory(category) {
    if (!category || category === 'all') return getAll();
    return cache?.filter(item => item.category === category) || [];
  }

  /**
   * 按关键词搜索（匹配标题和标签）
   */
  function search(keyword) {
    if (!keyword || !keyword.trim()) return getAll();
    const kw = keyword.trim().toLowerCase();
    return cache?.filter(item => {
      return item.title.toLowerCase().includes(kw) ||
             item.tags.some(tag => tag.toLowerCase().includes(kw)) ||
             item.category.toLowerCase().includes(kw);
    }) || [];
  }

  /**
   * 获取相关推荐（同分类且排除当前ID）
   */
  function getRelated(id, limit = 8) {
    const current = getById(id);
    if (!current) return [];

    const sameCategory = cache?.filter(item =>
      item.category === current.category && item.id != id
    ) || [];

    if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

    const others = cache?.filter(item =>
      item.category !== current.category && item.id != id
    ) || [];

    return [...sameCategory, ...others].slice(0, limit);
  }

  /**
   * 获取所有标签（去重）
   */
  function getAllTags() {
    if (!cache) return [];
    const tagSet = new Set();
    cache.forEach(item => item.tags.forEach(tag => tagSet.add(tag)));
    return [...tagSet];
  }

  /**
   * 订阅数据加载完成事件
   */
  function onReady(fn) {
    if (cache) {
      fn(cache);
    } else {
      listeners.push(fn);
    }
  }

  function notifyListeners() {
    listeners.forEach(fn => fn(cache));
    listeners = [];
  }

  /**
   * 是否已加载
   */
  function isLoaded() {
    return cache !== null;
  }

  /**
   * 强制刷新数据（下拉刷新用）
   */
  function refresh(freshData) {
    cache = freshData;
    categoriesCache = [...new Set(freshData.map(item => item.category))];
    notifyListeners();
  }

  /**
   * 分页获取数据
   */
  function getPaginated(data, page, pageSize) {
    const start = (page - 1) * pageSize;
    return {
      items: data.slice(start, start + pageSize),
      hasMore: start + pageSize < data.length,
      total: data.length
    };
  }

  return {
    load,
    getById,
    getAll,
    getCategories,
    getByCategory,
    search,
    getRelated,
    getAllTags,
    onReady,
    isLoaded,
    refresh,
    getPaginated
  };

})();
