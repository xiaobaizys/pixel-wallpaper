/**
 * 数据生成脚本 - generate-data.js
 *
 * 用法: node tools/generate-data.js
 *
 * 功能:
 *   扫描 images/originals/ 目录中的图片文件，
 *   自动生成 data.json 壁纸索引文件。
 *
 * 注意：此脚本仅在开发阶段使用，不部署到线上。
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  originalsDir: path.resolve(__dirname, '..', 'images', 'originals'),
  thumbnailsDir: path.resolve(__dirname, '..', 'images', 'thumbnails'),
  outputFile: path.resolve(__dirname, '..', 'data.json'),
  // 支持的图片格式
  imageExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'],
  // 默认值
  defaults: {
    category: '未分类',
    resolution: '1920x1080',
    author: '未知',
    license: '免费用于个人和商业用途'
  },
  // 基于文件名的分类映射（文件名包含关键词 -> 分类）
  categoryMap: {
    '自然': ['nature', '自然', 'flower', '花', 'tree', '树', 'mountain', '山', 'lake', '湖', 'sea', '海'],
    '动漫': ['anime', '动漫', '二次元', 'manga'],
    '抽象': ['abstract', '抽象', 'pattern', '纹理'],
    '风景': ['landscape', '风景', 'sunset', '日落', 'sunrise', '日出', 'beach', '海滩'],
    '动物': ['animal', '动物', 'cat', '猫', 'dog', '狗', 'bird', '鸟'],
    '城市': ['city', '城市', 'urban', '都市', 'building', '建筑'],
    '极简': ['minimal', '极简', 'simple', '简约'],
    '科技': ['tech', '科技', 'digital', '数字', 'cyber', '赛博']
  }
};

/**
 * 主函数
 */
function main() {
  console.log(' 像素壁纸 - 数据生成脚本\n');
  console.log(`  原始图片目录: ${CONFIG.originalsDir}`);
  console.log(`  缩略图目录:   ${CONFIG.thumbnailsDir}`);
  console.log(`  输出文件:     ${CONFIG.outputFile}\n`);

  // 检查目录
  if (!fs.existsSync(CONFIG.originalsDir)) {
    console.error(` 错误: 原始图片目录不存在: ${CONFIG.originalsDir}`);
    console.error(' 请先创建目录并放入图片文件。');
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.thumbnailsDir)) {
    console.log(` 创建缩略图目录: ${CONFIG.thumbnailsDir}`);
    fs.mkdirSync(CONFIG.thumbnailsDir, { recursive: true });
  }

  // 读取原始图片
  const files = fs.readdirSync(CONFIG.originalsDir)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return CONFIG.imageExtensions.includes(ext);
    })
    .sort();

  if (files.length === 0) {
    console.error(' 错误: 原始图片目录中没有支持的图片文件。');
    console.error(` 支持的格式: ${CONFIG.imageExtensions.join(', ')}`);
    process.exit(1);
  }

  console.log(` 找到 ${files.length} 张图片\n`);

  // 检查缩略图
  let thumbCount = 0;
  let missingThumbs = [];

  const data = files.map((file, index) => {
    const id = index + 1;
    const ext = path.extname(file);
    const name = path.basename(file, ext);

    // 推测分类
    const category = guessCategory(name);

    // 标题：文件名转中文风格
    const title = formatTitle(name);

    // 缩略图
    const thumbExt = ext.toLowerCase() === '.png' ? '.png' : '.jpg';
    const thumbName = `${id}_thumb${thumbExt}`;
    const thumbnail = `images/thumbnails/${thumbName}`;

    // 检查缩略图是否存在
    const thumbPath = path.join(CONFIG.thumbnailsDir, thumbName);
    if (fs.existsSync(thumbPath)) {
      thumbCount++;
    } else {
      missingThumbs.push(thumbName);
    }

    return {
      id,
      title,
      category,
      tags: generateTags(name, category),
      resolution: CONFIG.defaults.resolution,
      thumbnail,
      original: `images/originals/${file}`,
      author: CONFIG.defaults.author,
      license: CONFIG.defaults.license
    };
  });

  // 写入文件
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(` 已生成 data.json (${data.length} 条记录)`);

  // 统计
  console.log(`\n 统计:`);
  console.log(`   壁纸总数: ${data.length}`);
  console.log(`   已有缩略图: ${thumbCount}/${data.length}`);

  if (missingThumbs.length > 0) {
    console.log(`   缺失缩略图: ${missingThumbs.length} 张`);
    console.log(`   提示: 请使用图片处理工具批量生成缩略图，宽度建议 400px。`);
  }

  // 分类统计
  const categoryStats = {};
  data.forEach(item => {
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
  });

  console.log(`\n 分类分布:`);
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} 张`);
  });

  console.log('\n 完成!');
}

/**
 * 推测分类（基于文件名关键词）
 */
function guessCategory(filename) {
  const lower = filename.toLowerCase();
  for (const [category, keywords] of Object.entries(CONFIG.categoryMap)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return CONFIG.defaults.category;
}

/**
 * 格式化标题
 */
function formatTitle(filename) {
  return filename
    // 移除常见前缀
    .replace(/^(wallpaper|wp|bg|img|image)[-_]/i, '')
    // 连字符/下划线转空格
    .replace(/[-_]/g, ' ')
    // 分割驼峰
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // 分割数字和字母
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    // 清理多余空格
    .replace(/\s+/g, ' ')
    .trim()
    // 首字母大写
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * 生成标签
 */
function generateTags(filename, category) {
  const tags = [category];

  // 从文件名提取关键词
  const words = filename.toLowerCase().split(/[-_\s]+/);

  // 通用标签映射
  const tagMap = {
    'dark': '暗色', 'light': '亮色', 'sunset': '日落', 'sunrise': '日出',
    'mountain': '山', 'ocean': '海', 'forest': '森林', 'sky': '天空',
    'blue': '蓝色', 'red': '红色', 'green': '绿色', 'pink': '粉色',
    'cat': '猫', 'dog': '狗', 'flower': '花', 'tree': '树',
    'night': '夜晚', 'morning': '早晨', 'winter': '冬天', 'summer': '夏天'
  };

  words.forEach(word => {
    if (tagMap[word] && word.length > 2) {
      tags.push(tagMap[word]);
    }
  });

  // 如果是英文词且不在映射中，直接加入
  words.forEach(word => {
    if (!tagMap[word] && /^[a-z]+$/.test(word) && word.length > 2 && word.length < 20) {
      const unique = word.charAt(0).toUpperCase() + word.slice(1);
      if (!tags.includes(unique)) {
        tags.push(unique);
      }
    }
  });

  // 去重并限制数量
  return [...new Set(tags)].slice(0, 6);
}

// 执行
main();
