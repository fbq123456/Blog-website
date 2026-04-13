# MEMORY.md — 长期记忆

## 项目信息

- **项目类型**：Astro 静态博客
- **项目路径**：`e:/blog`
- **部署平台**：Vercel（已配置 vercel.json）
- **框架**：Astro + React + MDX + TypeScript
- **Node 要求**：>=22.12.0

## 博主技术栈

核心：HTML5、CSS3、JavaScript、TypeScript、Vue3、React、React Native、Uni-app  
构建工具：Vite、Webpack  
UI 库：Element UI、Vant、Ant Design  
其他：Canvas、Three.js、Electron、Fabric.js、Sass/Less、Git、原生小程序

## 写作规范

- 文章存放位置：`src/content/blog/*.md`
- Frontmatter 必填字段：`title`、`description`、`pubDate`（YYYY-MM-DD）、`tags`（数组）
- 标签可用：Three.js、3D、WebGL、Vue、React、前端、JavaScript、TypeScript 等

## 已写文章系列

### 公众号第三轮（2026-04-13 生成）

- `funny-bugs-collection.md` — 那些年我写过的Bug（日常，2026-04-17）✅ 新生成
- `code-review-guide.md` — Code Review避坑指南（成长，2026-04-20）✅ 新生成
- `webpack5-complete-guide.md` — Webpack 5完全指南（干货，2026-04-23）✅ 新生成

### Three.js 系列（进行中）

1. `threejs-three-elements.md` — Three.js 三要素：Scene、Camera、Renderer（2026-04-01）
2. `threejs-scene-deep-dive.md` — Three.js 深入解析：Scene（场景）（2026-04-07）
3. `threejs-camera-deep-dive.md` — Three.js 深入解析：Camera（相机）（2026-04-08）
4. `threejs-renderer-deep-dive.md` — Three.js 深入解析：Renderer（渲染器）（2026-04-08）
5. `threejs-geometry-deep-dive.md` — Three.js 深入解析：Geometry（几何体）（2026-04-10）
6. `threejs-material-deep-dive.md` — Three.js 深入解析：Material（材质）（2026-04-11）
7. `threejs-light-deep-dive.md` — Three.js 深入解析：Light（光照系统）（2026-04-13）
8. `threejs-animation-deep-dive.md` — Three.js 深入解析：Animation（动画系统）（2026-04-26）✅ 新生成
9. `threejs-texture-deep-dive.md` — Three.js 深入解析：Texture（纹理系统）（2026-04-27）✅ 新生成
- 待写：粒子系统（Particles）

### 公众号运营系列（首月排期，2026-04-08 起草）

- `vue3-threejs-integration.md` — Vue3 + Three.js 集成实战（2026-04-10）✅ 已完成
- `programmer-hair-care-guide.md` — 程序员防脱发指南（2026-04-11）✅ 已完成
- `vscode-essential-plugins.md` — VS Code 必备插件清单（2026-04-15）✅ 已完成
- `threejs-performance-optimization.md` — Three.js 性能优化（2026-04-18）✅ 已完成
- `javascript-closure-explained.md` — 闭包详解（2026-04-22）✅ 已完成
- `from-outsourcing-to-big-tech.md` — 外包逆袭大厂经历（2026-04-25）✅ 已完成
- `free-frontend-learning-resources.md` — 免费前端学习资源（2026-04-29）✅ 已完成

### 公众号第二轮（2026-04-13 生成）

- `react-hooks-pitfalls.md` — React Hooks避坑指南：10大错误（2026-04-13）✅ 已完成
- `programmer-sleep-health-guide.md` — 程序员作息自救手册（2026-04-16）✅ 已完成
- `css-modern-techniques.md` — CSS现代技巧：20个必知写法（2026-04-20）✅ 已完成

## 样式风格

- 风格：赛博朋克炫酷深色主题（玻璃态、霓虹光效、粒子背景）
- 样式主文件：`src/styles/global.css`
- 修复过问题：`.tag-btn` 曾有 `opacity: 0` 导致标签不显示，已修复

## 组件改动记录

- `Header.astro`：增加炫酷光效
- `src/pages/index.astro`：重写首页，增加 Hero 光效、技术栈 Grid 展示
- `src/pages/blog/index.astro`：重写文章列表页，标签筛选修复
- `src/pages/blog/[slug].astro`：添加顶部和底部"返回"按钮
