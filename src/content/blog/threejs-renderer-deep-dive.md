---
title: 'Three.js 深入解析：Renderer（渲染器）'
description: '全面解析 Three.js 渲染器的工作原理，WebGLRenderer 的核心参数配置，像素比、阴影、色调映射、后处理等高级渲染技巧。'
pubDate: 2026-04-08
tags:
  - Three.js
  - 3D
  - WebGL
---

> 本文是 Three.js 系列的第四篇，上一篇深入讲解了 [Three.js 深入解析：Camera（相机）](/blog/threejs-camera-deep-dive)。本篇聚焦于三要素的最后一环 —— **Renderer（渲染器）**，从底层原理到生产级调优全面解析。

---

## 什么是 Renderer？

Renderer（渲染器）是 Three.js 的**输出引擎**，它负责将 Scene（场景）中的所有 3D 内容，通过 Camera（相机）的视角，最终**绘制到 HTML Canvas 上**。

可以这样理解三要素的分工：

| 角色 | 职责 |
|------|------|
| Scene | 舞台 —— 存放所有 3D 对象、灯光、雾效 |
| Camera | 导演 —— 决定从哪个角度、用什么镜头观察 |
| **Renderer** | **摄影师** —— 按快门，把画面输出到屏幕 |

---

## Renderer 的继承体系

```
EventDispatcher
└── WebGLRenderer          （最核心、最常用）
    └── WebGL1Renderer     （兼容旧版 WebGL1，已废弃）

其他渲染器：
├── CSS2DRenderer          （将 HTML 元素叠加到 3D 场景中）
├── CSS3DRenderer          （支持 3D transform 的 HTML 叠加）
└── SVGRenderer            （将场景渲染为 SVG，不常用）
```

日常开发 99% 的情况使用 `WebGLRenderer`，本文重点讲解它。

---

## 创建 WebGLRenderer

### 基础创建

```javascript
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
```

`renderer.domElement` 就是一个原生的 `<canvas>` 元素，Three.js 自动创建并管理它。

### 挂载到已有 Canvas

```javascript
const canvas = document.getElementById('my-canvas');

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
```

---

## WebGLRenderer 核心参数详解

创建时可以传入一个配置对象，以下是最常用的参数：

```javascript
const renderer = new THREE.WebGLRenderer({
  canvas,              // 指定已有的 Canvas 元素
  antialias: true,     // 开启抗锯齿（性能消耗中等）
  alpha: true,         // 背景透明（默认 false）
  premultipliedAlpha: true,  // 预乘 Alpha，影响透明混合效果
  precision: 'highp',  // 着色器精度：highp / mediump / lowp
  powerPreference: 'high-performance', // GPU 性能偏好
  logarithmicDepthBuffer: false, // 对数深度缓冲（处理大场景 z-fighting）
  stencil: true,       // 启用模板缓冲
  depth: true,         // 启用深度缓冲
});
```

### antialias（抗锯齿）

锯齿是 3D 渲染中常见的问题，边缘呈现"阶梯状"。`antialias: true` 启用 MSAA（多重采样抗锯齿）：

```javascript
// 移动端性能有限，建议根据设备判断是否开启
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile,
});
```

### alpha（透明背景）

默认背景是黑色。若要透明背景（比如叠加在网页上）：

```javascript
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x000000, 0); // 颜色无关紧要，透明度设为 0
```

---

## 核心 API 详解

### setSize —— 设置渲染尺寸

```javascript
renderer.setSize(width, height);

// 第三个参数 updateStyle 默认为 true，会设置 canvas 的 CSS 尺寸
// 设为 false 时只改变渲染分辨率，不改变 CSS 尺寸
renderer.setSize(width, height, false);
```

### setPixelRatio —— 像素比（高清屏适配）

这是新手最容易忽略的配置之一。在 Retina 屏（devicePixelRatio = 2）上，如果不设置像素比，渲染会显得模糊：

```javascript
// 推荐做法：限制最大值，平衡清晰度和性能
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

> **为什么限制到 2？**  
> 部分高端移动设备 `devicePixelRatio` 可达 3 甚至 4，但渲染像素数是平方增长（3倍DPR = 9倍像素），性能代价极高，视觉提升却很有限。

### setClearColor —— 背景颜色

```javascript
// 参数：颜色值，不透明度（0-1）
renderer.setClearColor(0x1a1a2e, 1.0);    // 深蓝黑色背景
renderer.setClearColor('#0d0d1a', 1.0);   // 同上，支持 CSS 颜色字符串
renderer.setClearColor(new THREE.Color(0.1, 0.1, 0.15), 1.0);
```

### render —— 执行渲染

```javascript
// 单次渲染
renderer.render(scene, camera);

// 动画循环（推荐）
function animate() {
  requestAnimationFrame(animate);
  
  // 更新动画
  mesh.rotation.y += 0.01;
  
  // 渲染
  renderer.render(scene, camera);
}
animate();
```

---

## 响应式渲染 —— 窗口自适应

```javascript
window.addEventListener('resize', () => {
  // 更新相机宽高比
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); // 必须调用！
  
  // 更新渲染器尺寸
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
```

---

## 阴影渲染

阴影是提升 3D 场景真实感的关键。Three.js 默认不开启阴影，需要手动配置三处：

### 第一步：开启渲染器阴影

```javascript
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 推荐，柔和阴影
```

阴影类型对比：

| 类型 | 质量 | 性能 | 说明 |
|------|------|------|------|
| `BasicShadowMap` | 低 | 最快 | 硬边阴影 |
| `PCFShadowMap` | 中 | 中 | 过滤锯齿 |
| `PCFSoftShadowMap` | 高 | 中 | 柔和边缘（推荐） |
| `VSMShadowMap` | 很高 | 慢 | 方差阴影贴图 |

### 第二步：开启光源投射阴影

```javascript
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
light.castShadow = true; // 开启此光源的阴影投射

// 调整阴影贴图分辨率（越大越清晰，越耗性能）
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;

// 调整阴影相机范围（影响阴影覆盖区域）
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 50;
light.shadow.camera.left = -10;
light.shadow.camera.right = 10;
light.shadow.camera.top = 10;
light.shadow.camera.bottom = -10;
```

### 第三步：设置物体的阴影属性

```javascript
// 投射阴影的物体（如主角、建筑）
mesh.castShadow = true;

// 接收阴影的物体（如地面、墙壁）
floor.receiveShadow = true;

// 可以同时设置两者
pillar.castShadow = true;
pillar.receiveShadow = true;
```

---

## 色调映射（Tone Mapping）

真实的物理渲染中，光照亮度范围远超显示器能表现的范围。色调映射（Tone Mapping）负责将高动态范围（HDR）压缩到可显示的范围：

```javascript
// 开启物理校正光照（必须配合色调映射使用）
renderer.useLegacyLights = false;

// 选择色调映射算法
renderer.toneMapping = THREE.ACESFilmicToneMapping; // 推荐，电影级效果
renderer.toneMappingExposure = 1.0; // 曝光度，默认 1
```

色调映射算法对比：

| 类型 | 效果 | 适用场景 |
|------|------|----------|
| `NoToneMapping` | 无处理（默认） | 简单场景 |
| `LinearToneMapping` | 线性压缩 | 不推荐 |
| `ReinhardToneMapping` | 自然，略暗 | 通用场景 |
| `CineonToneMapping` | 胶片感，温暖 | 艺术风格 |
| `ACESFilmicToneMapping` | 电影级，对比鲜明 | **推荐，写实场景** |
| `AgXToneMapping` | 现代，细节丰富 | Three.js r152+ |

---

## 输出编码（Output Color Space）

正确的颜色空间设置避免颜色过亮或偏色：

```javascript
// Three.js r150+ 使用 outputColorSpace
renderer.outputColorSpace = THREE.SRGBColorSpace; // 推荐

// 旧版 API（已废弃）
// renderer.outputEncoding = THREE.sRGBEncoding;
```

> **注意**：如果你使用了纹理贴图，需要确保纹理的颜色空间一致：
> ```javascript
> texture.colorSpace = THREE.SRGBColorSpace; // 颜色贴图
> normalMap.colorSpace = THREE.LinearSRGBColorSpace; // 法线/粗糙度贴图
> ```

---

## 渲染器信息与调试

`renderer.info` 提供实时渲染统计，是性能优化的利器：

```javascript
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  
  // 输出渲染统计
  console.log({
    drawCalls: renderer.info.render.calls,     // 绘制调用次数
    triangles: renderer.info.render.triangles, // 三角面数量
    textures:  renderer.info.memory.textures,  // 纹理数量
    geometries: renderer.info.memory.geometries // 几何体数量
  });
}
```

> **Draw Calls 是性能核心指标**。每次调用 `gl.draw*` 都有固定的 CPU/GPU 通信开销。减少 Draw Calls 的常见方法：合并几何体（`mergeGeometries`）、使用实例化渲染（`InstancedMesh`）。

---

## 内存管理 —— 避免内存泄漏

Three.js 中创建的几何体、材质、纹理都会占用 GPU 显存。如果不手动释放，会造成内存泄漏：

```javascript
// 移除并释放一个 Mesh
function disposeMesh(mesh) {
  scene.remove(mesh);
  mesh.geometry.dispose();        // 释放几何体
  
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(m => disposeMaterial(m));
  } else {
    disposeMaterial(mesh.material);
  }
}

function disposeMaterial(material) {
  material.dispose(); // 释放材质
  
  // 释放材质中的所有纹理
  Object.values(material).forEach(value => {
    if (value && value.isTexture) {
      value.dispose();
    }
  });
}

// 销毁整个渲染器（页面卸载时）
renderer.dispose();
```

---

## 完整示例：生产级渲染器配置

以下是一个融合了上述最佳实践的完整初始化示例：

```javascript
import * as THREE from 'three';

// ---- 场景、相机 ----
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

// ---- 渲染器 ----
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});

// 尺寸与像素比
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 色彩
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// 阴影
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

// ---- 响应窗口缩放 ----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ---- 渲染循环 ----
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta(); // 帧间隔时间，用于稳定动画速度
  
  renderer.render(scene, camera);
}
animate();
```

---

## CSS2DRenderer —— 在 3D 场景中叠加 HTML 标签

有时需要在 3D 对象上显示 HTML 标签（如 tooltip、名称标注），`CSS2DRenderer` 是最佳方案：

```javascript
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// 创建 CSS2D 渲染器（叠加在 WebGL Canvas 上）
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none'; // 不拦截鼠标事件
document.body.appendChild(labelRenderer.domElement);

// 创建 HTML 标签并绑定到 3D 对象
const div = document.createElement('div');
div.textContent = '这是一个标注';
div.style.color = '#00ffff';

const label = new CSS2DObject(div);
label.position.set(0, 1.5, 0); // 相对于父对象的偏移位置
mesh.add(label);

// 渲染循环中同步渲染
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera); // 同步渲染标签层
}
```

---

## 小结

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| `antialias` | `true`（桌面端） | 平滑锯齿 |
| `setPixelRatio` | `Math.min(dpr, 2)` | 高清屏适配，限制性能消耗 |
| `outputColorSpace` | `SRGBColorSpace` | 正确颜色显示 |
| `toneMapping` | `ACESFilmicToneMapping` | 电影级色彩效果 |
| `shadowMap.type` | `PCFSoftShadowMap` | 柔和阴影 |
| 内存 | 及时 `.dispose()` | 防止 GPU 内存泄漏 |

至此，Three.js 的三大核心要素 **Scene → Camera → Renderer** 已全部深入解析完毕。下一篇我们将进入具体的 3D 构建模块 —— **Geometry（几何体）**，探索 Three.js 内置的各种形状与自定义几何体的创建方式。

---

*Three.js 系列持续更新中，欢迎关注。*
