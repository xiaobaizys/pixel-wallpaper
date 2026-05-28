/**
 * 主题切换模块
 * 支持暗色/亮色模式切换，自动检测系统主题，持久化到 localStorage
 */
const ThemeManager = (() => {

  const STORAGE_KEY = 'pixel-wallpaper-theme';
  const LIGHT = 'light';
  const DARK = 'dark';
  const SYSTEM = 'system';

  let currentTheme = LIGHT;

  /**
   * 初始化主题
   */
  function init() {
    const saved = localStorage.getItem(STORAGE_KEY) || SYSTEM;

    if (saved === SYSTEM) {
      // 跟随系统
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? DARK : LIGHT);
      currentTheme = SYSTEM;

      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (currentTheme === SYSTEM) {
          applyTheme(e.matches ? DARK : LIGHT);
        }
      });
    } else {
      applyTheme(saved);
      currentTheme = saved;
    }

    // 动画完成后移除过渡锁定
    document.documentElement.addEventListener('transitionend', (e) => {
      if (e.target === document.documentElement && e.propertyName === 'color') {
        document.documentElement.classList.remove('theme-transitioning');
      }
    });
  }

  /**
   * 应用主题
   */
  function applyTheme(theme) {
    document.documentElement.classList.add('theme-transitioning');
    if (theme === DARK) {
      document.documentElement.setAttribute('data-theme', DARK);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  /**
   * 切换主题（亮/暗）
   */
  function toggle() {
    const current = getEffectiveTheme();
    const next = current === DARK ? LIGHT : DARK;
    currentTheme = next;
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    updateToggleButton();
  }

  /**
   * 设置主题为跟随系统
   */
  function setSystem() {
    currentTheme = SYSTEM;
    localStorage.setItem(STORAGE_KEY, SYSTEM);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? DARK : LIGHT);
    updateToggleButton();
  }

  /**
   * 获取当前实际生效的主题
   */
  function getEffectiveTheme() {
    if (currentTheme === SYSTEM) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
    }
    return currentTheme;
  }

  /**
   * 获取主题模式
   */
  function getTheme() {
    return currentTheme;
  }

  /**
   * 判断是否为暗色模式
   */
  function isDark() {
    return getEffectiveTheme() === DARK;
  }

  /**
   * 更新切换按钮图标
   */
  function updateToggleButton() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const iconLight = btn.querySelector('.icon-light');
    const iconDark = btn.querySelector('.icon-dark');
    const isCurrentlyDark = getEffectiveTheme() === DARK;

    if (iconLight && iconDark) {
      iconLight.style.display = isCurrentlyDark ? 'block' : 'none';
      iconDark.style.display = isCurrentlyDark ? 'none' : 'block';
    }
  }

  return {
    init,
    toggle,
    setSystem,
    getTheme,
    getEffectiveTheme,
    isDark,
    updateToggleButton
  };

})();
