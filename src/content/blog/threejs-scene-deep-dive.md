---
title: 'Three.js 深入解析：Scene（场景）'
description: '全面解析 Three.js 场景对象的创建、属性配置、对象管理、背景设置与雾效，掌握构建 3D 世界的第一步。'
pubDate: 2026-04-07
tags:
  - Three.js
  - 3D
  - WebGL
---

> 本文是 Three.js 系列的第二篇，上一篇介绍了 [Three.js 三要素：Scene、Camera、Renderer](/blog/threejs-three-elements)。本篇聚焦于第一要素 —— **Scene（场景）**，深入讲解它的每一个细节。

---

## 什么是 Scene？

Scene（场景）是 Three.js 中所有 3D 内容的根容器。你可以把它想象成一个**无边界的虚拟空间**，所有物体、灯光、相机都在其中存在和运作。

```
Scene
├── Mesh（网格物体）
│   ├── Geometry（几何形状）
│   └── Material（材质）
├── Light（灯光）
├── Camera（相机）
└── Group（分组）
    ├── Mesh
    └── Mesh
```

没有场景，任何对象都无法被渲染出来。

---

## 一、创建场景

创建场景非常简单：

```javascript
import * as THREE from 'three';

const scene = new THREE.Scene();
```

`THREE.Scene` 继承自 `THREE.Object3D`，这意味着它具备所有 3D 对象的通用属性，比如 `position`、`rotation`、`scale` 等。

---

## 二、场景背景

### 2.1 纯色背景

最简单的背景设置，直接赋一个颜色：

```javascript
// 方式一：十六进制颜色
scene.background = new THREE.Color(0x1a1a2e);

// 方式二：CSS 颜色字符串
scene.background = new THREE.Color('#1a1a2e');

// 方式三：RGB 归一化值（0~1）
scene.background = new THREE.Color(0.1, 0.1, 0.18);
```

### 2.2 渐变背景（使用纹理）

可以用 Canvas 绘制渐变，然后作为纹理贴到背景上：

```javascript
// 创建渐变背景纹理
const canvas = document.createElement('canvas');
canvas.width = 2;
canvas.height = 512;

const ctx = canvas.getContext('2d');
const gradient = ctx.createLinearGradient(0, 0, 0, 512);
gradient.addColorStop(0, '#0a0a1a');   // 顶部深蓝
gradient.addColorStop(1, '#1a0a2e');   // 底部深紫

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 2, 512);

const texture = new THREE.CanvasTexture(canvas);
scene.background = texture;
```

### 2.3 全景图背景（CubeTexture）

使用六张图片拼成一个立方体贴图，实现 360° 环境背景：

```javascript
const cubeLoader = new THREE.CubeTextureLoader();
const envMap = cubeLoader.load([
    'textures/px.jpg',  // 正 X（右）
    'textures/nx.jpg',  // 负 X（左）
    'textures/py.jpg',  // 正 Y（上）
    'textures/ny.jpg',  // 负 Y（下）
    'textures/pz.jpg',  // 正 Z（前）
    'textures/nz.jpg',  // 负 Z（后）
]);

scene.background = envMap;
```

### 2.4 HDR 环境贴图背景

更高质量的环境贴图，同时影响材质反射：

```javascript
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const rgbeLoader = new RGBELoader();
rgbeLoader.load('textures/scene.hdr', (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    
    scene.background = envMap;      // 设置为背景
    scene.environment = envMap;     // 同时影响所有物体的环境反射
    
    texture.dispose();
    pmremGenerator.dispose();
});
```

---

## 三、雾效（Fog）

雾效让远处的物体逐渐消失在雾中，增强场景的深度感和真实感。

### 3.1 线性雾（Fog）

在 `near` 到 `far` 范围内线性过渡：

```javascript
// 参数：颜色, near（开始距离）, far（完全消失距离）
scene.fog = new THREE.Fog(0x1a1a2e, 10, 100);

// 注意：雾的颜色最好和背景颜色一致，视觉效果才自然
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 10, 100);
```

### 3.2 指数雾（FogExp2）

更接近自然的雾效，密度从中心向外指数级增加：

```javascript
// 参数：颜色, density（密度，值越大雾越浓）
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.05);
```

### 两种雾效对比

| 类型 | 特点 | 适用场景 |
|------|------|----------|
| `Fog` | 线性过渡，可控性强 | 需要精确控制能见度范围 |
| `FogExp2` | 指数衰减，更真实 | 模拟自然雾、海洋、烟雾 |

### 3.3 禁用雾效

部分物体不受雾影响（如 UI、粒子特效）：

```javascript
const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
material.fog = false;  // 此物体不受雾影响
```

---

## 四、环境贴图（Environment Map）

`scene.environment` 会影响场景中所有使用 `MeshStandardMaterial` 或 `MeshPhysicalMaterial` 的物体的环境反射，不需要单独给每个材质设置：

```javascript
// 设置全局环境贴图
scene.environment = envMap;

// 设置环境贴图强度（Three.js r163+）
scene.environmentIntensity = 1.0;
```

---

## 五、添加与管理对象

场景本质上是一个树形结构，所有对象都通过 `add()` 挂载到树上。

### 5.1 添加对象

```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
const cube = new THREE.Mesh(geometry, material);

// 添加到场景
scene.add(cube);

// 同时添加多个
const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5), material);
const torus = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.2), material);
scene.add(sphere, torus);
```

### 5.2 使用 Group 分组管理

`Group` 可以把多个物体组合在一起，统一控制位置、旋转和缩放：

```javascript
const group = new THREE.Group();

// 创建多个小球加入分组
for (let i = 0; i < 5; i++) {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.2),
        new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
    );
    mesh.position.x = i * 0.8 - 1.6;
    group.add(mesh);
}

// 整体旋转分组
group.rotation.y = Math.PI / 4;
scene.add(group);
```

### 5.3 查找场景中的对象

```javascript
// 通过 name 查找
cube.name = 'myCube';
const found = scene.getObjectByName('myCube');

// 通过 id 查找（Three.js 自动分配）
const byId = scene.getObjectById(cube.id);

// 遍历所有子对象
scene.traverse((obj) => {
    if (obj.isMesh) {
        console.log('找到一个 Mesh：', obj.name);
    }
});
```

### 5.4 移除对象

```javascript
// 从场景移除
scene.remove(cube);

// 移除后还需要手动释放内存！
cube.geometry.dispose();
cube.material.dispose();

// 批量清空场景
scene.clear();
```

> ⚠️ **注意**：`scene.remove()` 只是从渲染树中移除对象，不会自动释放 GPU 内存。务必手动调用 `geometry.dispose()` 和 `material.dispose()`，否则会造成内存泄漏。

---

## 六、坐标系与辅助工具

Three.js 使用**右手坐标系**：

```
       Y（上）
       |
       |_____ X（右）
      /
     Z（朝向屏幕）
```

开发时可以添加辅助线来看清坐标方向：

```javascript
// 坐标轴辅助（红=X，绿=Y，蓝=Z）
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 网格辅助（方便看清地面位置）
const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);

// 点光源位置辅助
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(3, 3, 3);
scene.add(pointLight);

const lightHelper = new THREE.PointLightHelper(pointLight, 0.3);
scene.add(lightHelper);
```

---

## 七、完整示例

把本文所有知识点整合成一个完整的可运行示例：

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ========== 场景 ==========
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d1a);

// 添加线性雾
scene.fog = new THREE.Fog(0x0d0d1a, 15, 60);

// ========== 相机 ==========
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 5, 10);

// ========== 渲染器 ==========
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ========== 轨道控制器 ==========
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ========== 辅助工具 ==========
const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(20, 20, 0x333355, 0x222244);
scene.add(gridHelper);

// ========== 灯光 ==========
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x88aaff, 2, 30);
pointLight.position.set(5, 8, 5);
scene.add(pointLight);

// ========== 使用 Group 管理多个物体 ==========
const group = new THREE.Group();
const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xa29bfe];

for (let i = 0; i < 5; i++) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({
            color: colors[i],
            roughness: 0.3,
            metalness: 0.5
        })
    );
    mesh.position.x = (i - 2) * 2;
    mesh.position.y = 0.5;
    mesh.name = `cube_${i}`;
    group.add(mesh);
}

scene.add(group);

// ========== 动画循环 ==========
function animate() {
    requestAnimationFrame(animate);

    // 整组旋转
    group.rotation.y += 0.005;

    controls.update();
    renderer.render(scene, camera);
}

animate();

// ========== 响应窗口变化 ==========
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```

---

## 八、常见问题

**Q：添加了物体但看不见？**
- 检查相机位置是否太近或太远（near/far 范围）
- 检查物体是否在相机视锥体之内
- 是否添加了灯光（`MeshStandardMaterial` 需要光照）

**Q：场景中对象太多，性能变慢？**
- 使用 `InstancedMesh` 批量渲染相同物体
- 对不可见区域使用视锥剔除（Three.js 默认开启）
- 及时调用 `dispose()` 销毁不用的几何体和材质

**Q：雾效颜色和背景不匹配？**
- 确保 `scene.fog` 的颜色和 `scene.background` 的颜色一致

---

## 总结

本文深入讲解了 Three.js `Scene` 的方方面面：

| 知识点 | 关键 API |
|--------|---------|
| 创建场景 | `new THREE.Scene()` |
| 背景设置 | `scene.background` |
| 雾效 | `scene.fog` / `scene.fog = new THREE.FogExp2()` |
| 环境贴图 | `scene.environment` |
| 添加对象 | `scene.add()` |
| 分组管理 | `new THREE.Group()` |
| 查找对象 | `scene.getObjectByName()` / `scene.traverse()` |
| 移除对象 | `scene.remove()` + `dispose()` |
| 辅助工具 | `AxesHelper` / `GridHelper` |

下一篇我们将深入探讨 **Camera（相机）**，了解不同相机类型的原理和使用技巧。

---

**系列导航：**
- 上一篇：[Three.js 三要素：Scene、Camera、Renderer](/blog/threejs-three-elements)
- 下一篇：Three.js 深入解析：Camera（相机）— 即将发布
