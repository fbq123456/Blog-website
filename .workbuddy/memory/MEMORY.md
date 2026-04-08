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

### Three.js 系列（进行中）

1. `threejs-three-elements.md` — Three.js 三要素：Scene、Camera、Renderer（2026-04-01）
2. `threejs-scene-deep-dive.md` — Three.js 深入解析：Scene（场景）（2026-04-07）
3. `threejs-camera-deep-dive.md` — Three.js 深入解析：Camera（相机）（2026-04-08）
4. `threejs-renderer-deep-dive.md` — Three.js 深入解析：Renderer（渲染器）（2026-04-08）
- 待写：Geometry（几何体）深度解析

## 样式风格

- 风格：赛博朋克炫酷深色主题（玻璃态、霓虹光效、粒子背景）
- 样式主文件：`src/styles/global.css`
- 修复过问题：`.tag-btn` 曾有 `opacity: 0` 导致标签不显示，已修复

## 组件改动记录

- `Header.astro`：增加炫酷光效
- `src/pages/index.astro`：重写首页，增加 Hero 光效、技术栈 Grid 展示
- `src/pages/blog/index.astro`：重写文章列表页，标签筛选修复
- `src/pages/blog/[slug].astro`：添加顶部和底部"返回"按钮
