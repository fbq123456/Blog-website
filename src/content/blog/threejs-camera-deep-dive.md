---
title: 'Three.js 深入解析：Camera（相机）'
description: '全面解析 Three.js 相机的类型与原理，透视相机、正交相机的参数详解，以及相机控制、裁切、多视口等高级用法。'
pubDate: 2026-04-08
tags:
  - Three.js
  - 3D
  - WebGL
---

> 本文是 Three.js 系列的第三篇，上一篇深入讲解了 [Three.js 深入解析：Scene（场景）](/blog/threejs-scene-deep-dive)。本篇聚焦于第二要素 —— **Camera（相机）**，从原理到实战全面解析。

---

## 什么是 Camera？

Camera（相机）是 Three.js 中定义**"我们从哪里、以什么方式观察场景"**的对象。它本质上是一个数学模型，将三维空间中的内容投影到二维屏幕上。

没有相机，场景里的所有内容都无法被"看到"。

Three.js 的相机继承体系如下：

```
Object3D
└── Camera
    ├── PerspectiveCamera   （透视相机，最常用）
    ├── OrthographicCamera  （正交相机）
    ├── CubeCamera          （立方体相机，用于环境反射）
    └── StereoCamera        （立体相机，用于 VR）
```

---

## 一、透视相机（PerspectiveCamera）

透视相机模拟**人眼的视觉规律**：近处的物体大，远处的物体小。这是 3D 游戏和场景中最常用的相机类型。

### 1.1 创建透视相机

```javascript
const camera = new THREE.PerspectiveCamera(
    75,                                     // fov：垂直视野角度（度）
    window.innerWidth / window.innerHeight, // aspect：宽高比
    0.1,                                    // near：近裁切面距离
    1000                                    // far：远裁切面距离
);
```

### 1.2 四个参数详解

#### fov（Field of View，视野角度）

fov 是相机垂直方向的可视角度，单位为**度（°）**。

```
         ___________
        /           \
       /    场景内容   \
      /               \
相机 ●        fov       
      \               /
       \             /
        \___________/
```

```javascript
// fov 越小：视野窄，物体看起来更大（类似长焦镜头/望远镜）
camera.fov = 30;

// fov 越大：视野宽，物体看起来更小，边缘会有透视变形
camera.fov = 90;

// 修改后必须更新投影矩阵
camera.updateProjectionMatrix();
```

| fov 值 | 效果 | 类比 |
|--------|------|------|
| 30° 以下 | 窄视野，物体放大 | 望远镜 |
| 45°~75° | 正常视野（推荐） | 人眼正常视角 |
| 90° 以上 | 广角，边缘变形 | 鱼眼镜头 |

#### aspect（宽高比）

相机的宽高比必须和渲染器输出的宽高比一致，否则画面会被拉伸。

```javascript
// 全屏渲染
camera.aspect = window.innerWidth / window.innerHeight;

// 固定区域渲染（比如画中画）
camera.aspect = 800 / 600;

// 窗口大小变化时更新
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```

#### near 和 far（裁切面）

只有处于 `near` 和 `far` 之间的物体才会被渲染，这两个平面围成的锥形空间叫做**视锥体（Frustum）**。

```
         near    far
相机 ●----[  |-----|  ]
          近    远
          (只渲染这个范围内的内容)
```

```javascript
// near 设太小会导致 Z-fighting（深度冲突，物体表面闪烁）
camera.near = 0.1;  // 推荐不要小于 0.1

// far 设太大会降低深度缓冲精度
camera.far = 1000;  // 根据实际场景大小设置

camera.updateProjectionMatrix();
```

> ⚠️ **Z-fighting 问题**：当 `near` 极小而 `far` 极大时，深度缓冲精度下降，两个贴近的面会交替闪烁。解决方法是缩小 `far/near` 的比值。

---

## 二、正交相机（OrthographicCamera）

正交相机没有透视效果，**所有物体无论远近，大小保持不变**。适合 2D 界面、工程图纸、像素风游戏等场景。

### 2.1 创建正交相机

```javascript
// 参数：left, right, top, bottom, near, far
const camera = new THREE.OrthographicCamera(
    -10,  // left：左边界
     10,  // right：右边界
     10,  // top：上边界
    -10,  // bottom：下边界
     0.1, // near
    1000  // far
);
```

正交相机的可视范围是一个**长方体**，而不是透视相机的锥形。

### 2.2 保持正确的宽高比

```javascript
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 20; // 可视范围大小

const camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2,  // left
    frustumSize * aspect /  2,  // right
    frustumSize /  2,           // top
    frustumSize / -2,           // bottom
    0.1,
    1000
);

// 窗口变化时更新
window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left   = frustumSize * aspect / -2;
    camera.right  = frustumSize * aspect /  2;
    camera.top    = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```

### 2.3 两种相机对比

| 特性 | PerspectiveCamera | OrthographicCamera |
|------|------------------|--------------------|
| 透视效果 | 有（近大远小） | 无（大小一致） |
| 参数 | fov、aspect、near、far | left/right/top/bottom、near、far |
| 适用场景 | 3D 游戏、场景漫游 | 2D 界面、工程图、像素游戏 |
| 真实感 | 强 | 弱 |

---

## 三、相机的位置与朝向

相机本身也是一个 `Object3D`，可以自由设置位置和旋转。

### 3.1 设置位置

```javascript
// 直接设置
camera.position.x = 5;
camera.position.y = 3;
camera.position.z = 8;

// 一次性设置
camera.position.set(5, 3, 8);
```

### 3.2 lookAt —— 让相机看向某个点

```javascript
// 看向原点（世界中心）
camera.lookAt(0, 0, 0);

// 看向某个物体
camera.lookAt(cube.position);

// 看向自定义坐标
camera.lookAt(new THREE.Vector3(2, 1, 0));
```

> ⚠️ 注意：使用 `OrbitControls` 等控制器时，不要手动调用 `lookAt()`，否则会产生冲突。

### 3.3 相机朝向的三个轴

```javascript
// 获取相机当前朝向的方向向量
const direction = new THREE.Vector3();
camera.getWorldDirection(direction);
console.log(direction); // Vector3 { x, y, z }

// 获取相机的上方向
console.log(camera.up); // 默认是 { x: 0, y: 1, z: 0 }

// 修改相机的上方向（比如让相机"侧躺"）
camera.up.set(0, 0, 1);
camera.lookAt(0, 0, 0);
```

---

## 四、相机控制器

手动控制相机旋转、缩放很繁琐，Three.js 提供了多种控制器插件。

### 4.1 OrbitControls（轨道控制器）—— 最常用

支持鼠标**旋转、平移、缩放**，围绕目标点运动：

```javascript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);

// 启用阻尼（惯性效果，更顺滑）
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 限制垂直旋转范围（防止相机翻转）
controls.minPolarAngle = 0;              // 最高只到正上方
controls.maxPolarAngle = Math.PI / 2;    // 最低只到水平面

// 限制缩放范围
controls.minDistance = 2;
controls.maxDistance = 50;

// 禁用平移
controls.enablePan = false;

// 注意：启用阻尼后，动画循环中必须调用 update()
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // 必须调用！
    renderer.render(scene, camera);
}
```

### 4.2 FlyControls（飞行控制器）

像飞机一样自由飞行，适合大场景漫游：

```javascript
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';

const controls = new FlyControls(camera, renderer.domElement);
controls.movementSpeed = 10;
controls.rollSpeed = Math.PI / 10;
controls.autoForward = false;
controls.dragToLook = true;

// 需要传入 delta 时间
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    controls.update(delta);
    renderer.render(scene, camera);
}
```

### 4.3 FirstPersonControls（第一人称控制器）

鼠标移动控制视角朝向，适合第一人称游戏：

```javascript
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';

const controls = new FirstPersonControls(camera, renderer.domElement);
controls.lookSpeed = 0.1;
controls.movementSpeed = 5;
```

---

## 五、CubeCamera（立方体相机）

CubeCamera 向六个方向各渲染一次场景，生成一个**立方体环境贴图**，用于实现物体的实时反射效果。

```javascript
// 创建渲染目标
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
});

// 创建立方体相机
const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
scene.add(cubeCamera);

// 使用立方体贴图的反射球
const mirrorSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial({
        envMap: cubeRenderTarget.texture,
        roughness: 0,
        metalness: 1
    })
);
scene.add(mirrorSphere);

// 每帧更新反射（注意先隐藏镜面球，防止自反射）
function animate() {
    requestAnimationFrame(animate);
    mirrorSphere.visible = false;
    cubeCamera.update(renderer, scene);
    mirrorSphere.visible = true;
    renderer.render(scene, camera);
}
```

---

## 六、多视口渲染

在同一个 Canvas 上渲染多个不同角度的视口（类似 3D 软件的四视图）：

```javascript
// 创建两个相机
const cameraLeft = new THREE.PerspectiveCamera(75, 0.5, 0.1, 1000);
cameraLeft.position.set(-5, 3, 8);
cameraLeft.lookAt(0, 0, 0);

const cameraRight = new THREE.PerspectiveCamera(75, 0.5, 0.1, 1000);
cameraRight.position.set(5, 3, 8);
cameraRight.lookAt(0, 0, 0);

function render() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // 渲染左半边
    renderer.setViewport(0, 0, w / 2, h);
    renderer.setScissor(0, 0, w / 2, h);
    renderer.setScissorTest(true);
    renderer.render(scene, cameraLeft);

    // 渲染右半边
    renderer.setViewport(w / 2, 0, w / 2, h);
    renderer.setScissor(w / 2, 0, w / 2, h);
    renderer.setScissorTest(true);
    renderer.render(scene, cameraRight);
}
```

---

## 七、完整实战示例

综合本文所有知识点，实现一个带轨道控制、雾效和正确响应式的场景：

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ========== 场景 ==========
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d1a);
scene.fog = new THREE.Fog(0x0d0d1a, 20, 80);

// ========== 透视相机 ==========
const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);
camera.position.set(0, 6, 14);

// ========== 渲染器 ==========
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ========== 轨道控制器 ==========
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 3;
controls.maxDistance = 40;

// ========== 辅助工具 ==========
scene.add(new THREE.AxesHelper(3));
scene.add(new THREE.GridHelper(30, 30, 0x223355, 0x112244));

// ========== 灯光 ==========
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const dirLight = new THREE.DirectionalLight(0x88ccff, 1.2);
dirLight.position.set(5, 10, 8);
scene.add(dirLight);

// ========== 场景物体 ==========
const geometries = [
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.TorusGeometry(0.8, 0.3, 16, 100),
    new THREE.ConeGeometry(0.8, 2, 32),
    new THREE.OctahedronGeometry(1),
];

const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xa29bfe];

geometries.forEach((geo, i) => {
    const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
            color: colors[i],
            roughness: 0.3,
            metalness: 0.5
        })
    );
    mesh.position.set((i - 2) * 3, 1, 0);
    scene.add(mesh);
});

// ========== 动画循环 ==========
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// ========== 响应窗口大小 ==========
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```

---

## 八、常见问题

**Q：物体渲染后看起来被"切掉"了？**
- 检查 `near` 和 `far` 的范围，物体必须在视锥体内才能被渲染

**Q：`lookAt()` 设置后相机没有朝向正确方向？**
- 如果使用了 `OrbitControls`，`lookAt()` 会被控制器覆盖，改用 `controls.target.set(x, y, z)` 来设置朝向目标

**Q：正交相机物体看起来变形/拉伸？**
- 确保正交相机的 `left/right/top/bottom` 比例和渲染器宽高比一致

**Q：相机抖动或旋转时有"翻转"？**
- 限制 `controls.maxPolarAngle = Math.PI / 2` 防止相机越过正上方翻转

---

## 总结

本文深入讲解了 Three.js `Camera` 的方方面面：

| 知识点 | 关键内容 |
|--------|---------|
| 透视相机 | `fov`、`aspect`、`near`、`far` 四参数 |
| 正交相机 | `left/right/top/bottom` 六参数，无透视变形 |
| 位置与朝向 | `position.set()`、`lookAt()` |
| 轨道控制器 | `OrbitControls` + `enableDamping` |
| 飞行/第一人称 | `FlyControls`、`FirstPersonControls` |
| 立方体相机 | `CubeCamera` 实现实时反射 |
| 多视口 | `setViewport()` + `setScissor()` |

下一篇我们将深入探讨 **Renderer（渲染器）**，揭开 WebGL 渲染管线背后的细节。

---

**系列导航：**
- 上一篇：[Three.js 深入解析：Scene（场景）](/blog/threejs-scene-deep-dive)
- 下一篇：Three.js 深入解析：Renderer（渲染器）— 即将发布
