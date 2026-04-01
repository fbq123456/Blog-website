---
title: 'CSS Grid 实战指南'
description: '深入理解 Grid 布局的强大能力，通过实际案例掌握现代 CSS 布局技巧。'
pubDate: 2026-03-20
tags:
  - CSS
  - 布局
---

CSS Grid 是现代 CSS 布局的重要组成部分，它是一个二维布局系统，可以同时处理行和列。与 Flexbox 的一维布局形成互补。

## 基本概念

### Grid Container 和 Grid Items

启用 Grid 布局只需要将容器的 `display` 属性设置为 `grid`。容器内的直接子元素会自动成为 Grid Items。

```css
.container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: auto;
  gap: 20px;
}
```

### fr 单位

`fr` 是 Grid 特有的单位，表示可用空间的分数。`1fr 2fr 1fr` 表示三列分别占据 1/4、2/4、1/4 的宽度。

## 实战技巧

### 响应式网格

使用 `repeat()` 和 `auto-fit/auto-fill` 可以轻松创建响应式网格：

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
```

> 这段代码会自动计算每行能容纳多少列，最小宽度 250px，尽可能多地填充。

### 网格区域命名

Grid 的命名功能让布局代码更具可读性：

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main main"
    "footer footer footer";
  grid-template-columns: 200px 1fr 1fr;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
```

## 总结

CSS Grid 是布局工具箱中的强大武器。配合 Flexbox 使用，可以应对几乎所有的布局需求。关键是要理解它们各自的适用场景：

- **Grid**：二维布局、整体页面结构
- **Flexbox**：一维布局、组件内部排列
