/**
 * 工具函数模块
 * 提供防抖、节流、格式化等通用函数
 */
const Utils = (() => {

  /**
   * 防抖 - 延迟执行，在指定时间内多次触发只执行最后一次
   */
  function debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * 节流 - 在指定时间内只执行一次
   */
  function throttle(fn, interval = 300) {
    let lastTime = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastTime >= interval) {
        lastTime = now;
        fn.apply(this, args);
      }
    };
  }

  /**
   * 格式化文件大小
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * 高亮匹配文本
   */
  function highlightText(text, keyword) {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="highlight">$1</mark>');
  }

  /**
   * 获取 CSS 自定义属性值
   */
  function getCSSVar(name, el = document.documentElement) {
    return getComputedStyle(el).getPropertyValue(name).trim();
  }

  /**
   * 设置 CSS 自定义属性值
   */
  function setCSSVar(name, value, el = document.documentElement) {
    el.style.setProperty(name, value);
  }

  /**
   * 检测是否为移动设备
   */
  function isMobile() {
    return window.innerWidth < 768;
  }

  /**
   * 生成唯一ID
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 平滑滚动到元素
   */
  function scrollToElement(el, offset = 0) {
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  /**
   * 下载跨域图片（fetch + Blob）
   */
  async function downloadImage(url, filename, onStateChange) {
    try {
      if (onStateChange) onStateChange('loading');
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('下载失败');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(blobUrl);
      if (onStateChange) onStateChange('done');
      return true;
    } catch (err) {
      // 降级：直接打开原图
      window.open(url, '_blank');
      if (onStateChange) onStateChange('error');
      return false;
    }
  }

  return {
    debounce, throttle, formatFileSize, highlightText,
    getCSSVar, setCSSVar, isMobile, generateId, scrollToElement,
    downloadImage
  };

})();
