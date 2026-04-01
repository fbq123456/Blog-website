---
title: 'Three.js 三要素：Scene、Camera、Renderer'
description: '深入解析 Three.js 的核心三要素，理解场景、相机和渲染器如何协同工作构建 3D 世界。'
pubDate: 2026-04-01
tags:
  - Three.js
  - 3D
  - WebGL
---

## 前言

Three.js 是一个用于在浏览器中创建 3D 图形的 JavaScript 库。它构建在 WebGL 之上，大大降低了 3D 开发的门槛。无论你是想创建游戏、数据可视化，还是交互式艺术作品，理解 Three.js 的核心三要素都是至关重要的。

> 这三个要素：**Scene（场景）**、**Camera（相机）**、**Renderer（渲染器）**，构成了任何 Three.js 项目的基石。

---

## 一、Scene（场景）

场景是所有 3D 对象的容器，你可以把它想象成一个"虚拟世界"。

```javascript
import * as THREE from 'three';

// 创建场景
const scene = new THREE.Scene();

// 设置背景颜色
scene.background = new THREE.Color(0x1a1a2e);

// 添加雾效果（远处的物体会逐渐消失）
scene.fog = new THREE.Fog(0x1a1a2e, 10, 100);
```

### 场景的核心作用

- **承载所有对象**：所有网格、灯光、模型都被添加到场景中
- **定义世界属性**：背景颜色、雾效等都由场景控制
- **方便管理**：可以统一控制场景中所有物体的显示/隐藏

---

## 二、Camera（相机）

相机决定了我们"从哪个角度"观察场景。Three.js 支持多种相机类型，最常用的是 **透视相机**。

### 透视相机（PerspectiveCamera）

模拟人眼的视觉效果，近处的物体大，远处的物体小。

```javascript
// 透视相机参数：
// - fov: 视野角度（度数）
// - aspect: 宽高比
// - near: 近裁切面
// - far: 远裁切面
const camera = new THREE.PerspectiveCamera(
    75,                                    // 视野角度
    window.innerWidth / window.innerHeight, // 宽高比
    0.1,                                   // 近裁切面
    1000                                   // 远裁切面
);

// 设置相机位置
camera.position.set(0, 0, 5);

// 让相机看向场景中心
camera.lookAt(0, 0, 0);
```

### 正交相机（OrthographicCamera）

没有透视效果，适合 2D UI 或技术图纸。

```javascript
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 10;

const camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2,
    frustumSize * aspect / 2,
    frustumSize / 2,
    frustumSize / -2,
    1,
    1000
);
```

### 相机类型对比

| 类型 | 特点 | 适用场景 |
|------|------|----------|
| PerspectiveCamera | 透视效果，近大远小 | 游戏、场景漫游 |
| OrthographicCamera | 无透视，物体大小固定 | 2D UI、数据图表 |

---

## 三、Renderer（渲染器）

渲染器是 Three.js 的"画师"，它负责将场景和相机拍摄的画面绘制到屏幕上。

```javascript
// 创建 WebGL 渲染器
const renderer = new THREE.WebGLRenderer({
    antialias: true,  // 抗锯齿
    alpha: true       // 透明背景
});

// 设置渲染尺寸
renderer.setSize(window.innerWidth, window.innerHeight);

// 设置像素比（适配高清屏）
renderer.setPixelRatio(window.devicePixelRatio);

// 将画布添加到 DOM
document.body.appendChild(renderer.domElement);

// 执行渲染
renderer.render(scene, camera);
```

### 渲染器类型

```javascript
// WebGL 渲染器（常用）
const renderer = new THREE.WebGLRenderer({ antialias: true });

// CSS2D 渲染器（渲染 HTML 元素到 3D 空间）
const renderer = new THREE.CSS2DRenderer();

// SVG 渲染器
const renderer = new THREE.SVGRenderer();
```

---

## 四、三者协同工作

现在让我们把这三个要素组合起来：

```javascript
import * as THREE from 'three';

// 1. 创建场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x16213e);

// 2. 创建相机
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 5;

// 3. 创建渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. 添加一个立方体到场景中
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 5. 创建动画循环
function animate() {
    requestAnimationFrame(animate);

    // 旋转立方体
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // 渲染画面
    renderer.render(scene, camera);
}

animate();
```

---

## 五、完整示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Three.js 三要素示例</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
        }
        canvas {
            display: block;
        }
    </style>
</head>
<body>
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
        }
    }
    </script>
    <script type="module">
        import * as THREE from 'three';

        // 初始化三要素
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        // 添加一个发光球体
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            emissive: 0x224488,
            roughness: 0.2,
            metalness: 0.8
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // 添加灯光
        const light = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(light);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        // 动画循环
        function animate() {
            requestAnimationFrame(animate);
            sphere.rotation.y += 0.005;
            sphere.rotation.x += 0.003;
            renderer.render(scene, camera);
        }

        animate();

        // 响应窗口大小变化
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>
```

---

## 六、图解关系

```
┌─────────────────────────────────────────────────────┐
│                    Renderer (渲染器)                │
│  ┌───────────────────────────────────────────────┐  │
│  │                   Scene (场景)                │  │
│  │                                               │  │
│  │     ┌─────────┐    ┌─────────┐               │  │
│  │     │  Mesh   │    │  Mesh   │               │  │
│  │     │ (物体)  │    │ (物体)  │               │  │
│  │     └─────────┘    └─────────┘               │  │
│  │                                               │  │
│  │                    📷                         │  │
│  │               Camera (相机)                    │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│              输出到 Canvas 画布                      │
└─────────────────────────────────────────────────────┘
```

---

## 总结

Three.js 的三要素是构建任何 3D 项目的基础：

1. **Scene** — 承载所有对象的容器
2. **Camera** — 决定观察角度的"眼睛"
3. **Renderer** — 将 3D 场景绘制成 2D 图像的"画师"

掌握这三者的概念和使用方法，你就迈出了 Three.js 开发的第一步！在后续的文章中，我们将深入探讨**灯光**、**材质**、**几何体**等更多主题。

---

**下一步推荐阅读：**
- [Three.js 几何体与材质](/blog/threejs-geometry-material)
- [Three.js 灯光系统详解](/blog/threejs-lighting)
- [Three.js 动画基础](/blog/threejs-animation-basics)
