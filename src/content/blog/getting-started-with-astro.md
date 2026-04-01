---
title: 'Astro 入门：从零开始构建高性能博客'
description: '探索 Astro 框架的核心概念，学习如何利用 Islands Architecture 构建极速网站。'
pubDate: 2026-03-28
tags:
  - Astro
  - 前端
---

Astro 是最新一代的静态站点生成器，它的设计理念是「发送更少的 JavaScript」。不同于传统的 SPA（单页应用），Astro 默认只发送 HTML，JavaScript 只在需要交互的地方加载。

## 为什么选择 Astro？

传统的 React/Vue 应用在首屏加载时需要下载完整的框架代码，而 Astro 采用了 **Islands Architecture（群岛架构）**，将页面拆分成独立的组件，只有需要交互的组件才会加载 JavaScript。

## 快速开始

创建一个新的 Astro 项目非常简单：

```bash
npm create astro@latest my-blog
cd my-blog
npm run dev
```

## 核心概念

### 1. Astro 组件

Astro 组件使用 `.astro` 后缀，语法类似 JSX，但在服务端渲染。组件可以包含前端组件（React、Vue、Svelte）作为「岛屿」。

### 2. 内容集合

Astro 的内容集合（Content Collections）提供了 Markdown/MDX 文件的类型安全访问，非常适合博客场景。

> Astro 的零 JS 默认策略可以让你的网站获得接近纯静态网站的速度，同时保留现代前端框架的开发体验。

## 部署到 Vercel

Vercel 对 Astro 有原生支持，只需要：

```bash
npm i -g vercel
vercel
```

推送代码后，Vercel 会自动检测 Astro 项目并完成部署。

## 总结

Astro 为内容驱动的网站提供了完美的解决方案。它结合了静态站点的性能优势和现代前端框架的开发效率。如果你正在考虑搭建博客或文档站点，Astro 绝对值得一试。
