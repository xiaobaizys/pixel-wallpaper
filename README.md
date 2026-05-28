# pixel-wallpaper

---

# 像素壁纸网站开发文档

## 1. 项目概述

**项目名称**：像素壁纸（Pixel Wallpaper）  
**项目类型**：纯静态前端网站  
**核心目标**：为用户提供免费、高清的壁纸浏览与下载服务，界面简洁美观，加载迅速，支持多终端适配。  
**技术栈**：HTML5 + CSS3 + 原生 JavaScript（ES6+）  
**数据来源**：本地静态图片资源，通过 JSON 文件索引管理壁纸信息  
**无后端依赖**：所有数据均为静态，可部署于任何静态文件托管服务（如 GitHub Pages、Vercel、Netlify 等）

---

## 2. 功能模块

### 2.1 用户端功能

- **壁纸浏览**：瀑布流或网格布局展示壁纸缩略图，支持懒加载。
- **分类筛选**：按标签/分类（自然、动漫、抽象、风景、动物等）过滤壁纸。
- **搜索功能**：通过标题或标签关键字实时搜索。
- **壁纸详情**：点击壁纸进入大图预览模式，提供下载按钮（原图下载）、分辨率信息、标签展示。
- **响应式布局**：适配手机、平板、桌面端。
- **暗色/亮色模式**：自动检测系统主题或手动切换。
- **加载与空状态**：Loading 动画、无结果提示、网络错误提示。

### 2.2 管理维护端（可选，纯静态实现）

- **JSON 数据生成脚本**：一个简单的 Node.js 脚本，用于扫描本地图片目录生成 `data.json`（包含路径、标题、标签、分辨率等）。此脚本不部署到线上，仅在开发阶段使用。

---

## 3. 技术方案

### 3.1 整体架构

单页应用（SPA）模式，使用哈希路由实现页面状态管理。

- 路由：基于 `hashchange` 事件，模拟页面切换（首页、详情页）。
- 数据驱动：所有壁纸信息存储在 `data.json` 中，首次加载后缓存于内存，切换路由不重复请求。
- 渲染引擎：使用模板字面量动态生成 HTML，减少 DOM 操作。

### 3.2 核心技术选型

- 无框架，原生 JS 操作 DOM。
- Fetch API 加载 `data.json`。
- CSS Grid / Flexbox 实现响应式布局。
- Intersection Observer API 实现懒加载。
- CSS 自定义属性（变量）实现主题切换。
- LocalStorage 保存用户偏好（主题、最近浏览）。

### 3.3 浏览器兼容性

- 支持现代浏览器（Chrome 90+、Firefox 88+、Safari 14+、Edge 90+）。
- 懒加载、CSS 变量等特性在主流浏览器均支持。

---

## 4. 页面结构与路由设计

### 4.1 路由表

| 路径（Hash）    | 页面            | 说明                     |
| --------------- | --------------- | ------------------------ |
| `#/`            | 首页 / 壁纸列表 | 默认显示全部壁纸，含筛选 |
| `#/detail/{id}` | 壁纸详情页      | 大图预览与下载           |

### 4.2 页面组成

**首页（`#/`）**

- 顶部导航栏：Logo、搜索框、暗色模式切换按钮、分类导航（横向滚动标签）。
- 壁纸网格：每张卡片包含缩略图、标题、分辨率标签，点击进入详情。
- 页脚：版权信息、站内提示。
- 悬浮下载提示（可选）：hover 时显示快速下载图标。

**详情页（`#/detail/{id}`）**

- 返回按钮。
- 大图展示（居中，带加载动画），下方显示标题、分辨率、标签、下载按钮（原图）。
- 相关推荐：底部展示同标签的其他壁纸（横向滚动或小网格）。

---

## 5. 数据结构设计（data.json）

```json
[
  {
    "id": 1,
    "title": "宁静的湖畔",
    "category": "自然",
    "tags": ["湖", "山", "日出"],
    "resolution": "1920x1080",
    "thumbnail": "images/thumbnails/lake_thumb.jpg",
    "original": "images/originals/lake.jpg",
    "author": "Unsplash",
    "license": "免费用于个人和商业用途"
  },
  ...
]
```

**字段说明**：

- `id`：唯一标识，数字自增。
- `title`：壁纸展示名称。
- `category`：分类，用于筛选和推荐。
- `tags`：标签数组，用于搜索和关联。
- `resolution`：分辨率字符串。
- `thumbnail`：缩略图相对路径（建议宽度 400px 左右）。
- `original`：原图路径（用于下载和详情展示）。
- `author` / `license`：可选，用于版权声明。

---

## 6. 文件结构

```
pixel-wallpaper/
├── index.html                # 入口HTML
├── css/
│   ├── style.css             # 全局样式、布局、主题变量
│   └── components.css        # 组件样式（卡片、按钮、模态框等）
├── js/
│   ├── app.js                # 主入口，路由控制、初始化
│   ├── data.js               # 数据加载与缓存模块
│   ├── render.js             # 页面渲染函数（列表、详情、搜索）
│   ├── filters.js            # 分类与搜索逻辑
│   ├── theme.js              # 主题切换逻辑
│   └── utils.js              # 工具函数（节流、防抖、格式化等）
├── images/
│   ├── thumbnails/           # 缩略图目录（命名规范：{id}_thumb.jpg）
│   └── originals/            # 原图目录（命名规范：{id}.jpg）
├── data.json                 # 壁纸元数据索引
└── README.md
```

---

## 7. 核心模块设计

### 7.1 数据加载模块（data.js）

```js
// 单例模式，返回Promise
const WallpaperData = (() => {
  let cache = null;
  return {
    async load() {
      if (cache) return cache;
      const res = await fetch('./data.json');
      if (!res.ok) throw new Error('数据加载失败');
      cache = await res.json();
      return cache;
    },
    getById(id) {
      return cache?.find(item => item.id == id);
    },
    getAll() {
      return cache || [];
    }
  };
})();
```

### 7.2 路由模块（app.js）

```js
function handleRoute() {
  const hash = location.hash.slice(1) || '/';
  const [path, id] = hash.split('/').filter(Boolean);
  switch (path || '/') {
    case '/':
      renderHomePage();
      break;
    case 'detail':
      renderDetailPage(id);
      break;
    default:
      renderNotFound();
  }
}
window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);
```

### 7.3 渲染模块（render.js）

- `renderHomePage(filters)`：根据筛选条件生成卡片网格。

- `renderDetailPage(id)`：加载详情模板，填充数据，渲染推荐区。

- **卡片HTML结构示例**：

  ```html
  <div class="card" data-id="1">
    <img class="card-img lazy" data-src="thumb.jpg" alt="...">
    <div class="card-info">
      <h3>标题</h3>
      <span class="res">1920x1080</span>
    </div>
    <a class="download-btn" href="original.jpg" download>⬇</a>
  </div>
  ```

- 懒加载：使用 `IntersectionObserver`，当图片进入视口时将 `data-src` 赋值给 `src`。

### 7.4 分类与搜索（filters.js）

- 分类：点击标签后修改当前激活分类，重新渲染列表，同时更新URL参数 `#/?category=自然`（可选）。
- 搜索：监听输入框 `input` 事件（防抖300ms），在标题和标签中模糊匹配，过滤后重新渲染。

### 7.5 主题切换（theme.js）

- 使用CSS变量定义主题色：

  ```css
  :root {
    --bg: #fff;
    --text: #222;
  }
  [data-theme="dark"] {
    --bg: #1a1a1a;
    --text: #eee;
  }
  ```

- JS检测 `prefers-color-scheme` 设置初始主题，切换按钮在 `html` 上设置 `data-theme` 属性。

- 偏好存储到 `localStorage`。

### 7.6 下载功能

详情页下载按钮直接指向原图路径，并加上 `download` 属性。对于跨域问题（通常同域下无问题），可增加 `target="_blank"` 兜底。也可使用 `fetch` + Blob 强制下载，但同源下 `<a download>` 最简洁。

---

## 8. 响应式设计策略

- **移动端（<768px）**：卡片2列，导航栏搜索框缩小，分类标签可横向滚动。
- **平板（768px - 1024px）**：卡片3列。
- **桌面（>1024px）**：卡片4-5列，适当增大间距。
- 使用 CSS Grid 的 `grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));` 实现弹性列数。

---

## 9. 性能优化

- 图片懒加载：首屏仅加载可视区域图片。
- 缩略图采用 WebP 格式（提供jpg回退），降低体积。
- JSON 数据压缩：原数据约 1MB 时需考虑分页加载，但初期壁纸数量少（几百张）可一次加载。
- CSS/JS 文件合并压缩（部署时可构建处理）。
- 使用 Service Worker 缓存静态资源，实现离线浏览（可选，作为渐进增强）。

---

## 10. 开发与部署

### 10.1 本地开发

1. 准备图片素材，放入对应文件夹。
2. 运行生成 `data.json` 的脚本（可用 Node.js 编写，递归读取文件夹，提取文件名等信息）。
3. 使用 Live Server 或直接打开 `index.html` 预览（需注意 fetch 跨域，建议起一个本地静态服务器）。

### 10.2 生成 data.json 脚本示例（tools/generate-data.js）

```js
const fs = require('fs');
const path = require('path');
const originalsDir = './images/originals';
const thumbnailsDir = './images/thumbnails';
const files = fs.readdirSync(originalsDir);
const data = files.map((file, index) => {
  const id = index + 1;
  const ext = path.extname(file);
  const name = path.basename(file, ext);
  return {
    id,
    title: name.replace(/-/g, ' '),
    category: '未分类',
    tags: [],
    resolution: '1920x1080', // 可从图片尺寸获取，此处简化
    thumbnail: `images/thumbnails/${id}_thumb.jpg`,
    original: `images/originals/${file}`
  };
});
fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
```

---

## 11. 后续扩展建议

- 引入无限滚动分页加载（当数据量大时）。
- 增加用户收藏功能（基于LocalStorage）。
- 接入第三方图片源（如 Unsplash API）作为动态补充。
- 添加“相似壁纸”推荐算法（基于标签匹配）。
- 集成 PWA，实现添加到主屏和离线缓存。

---

## 12. 注意事项

- **版权问题**：所有壁纸必须是自己创作或来自明确允许商用、免费的图源（如 Unsplash、Pexels），需在网站注明作者和许可。
- **图片压缩**：原图用于下载，缩略图必须高度压缩，否则页面加载极慢。
- **无后端限制**：静态站无服务端逻辑，所有逻辑在前端完成，因此数据量需控制在合理范围（data.json 建议 ≤ 1MB）。

