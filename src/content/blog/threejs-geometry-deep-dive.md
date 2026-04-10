---
title: 'Three.js 深入解析：Geometry（几何体）'
description: '全面解析 Three.js 几何体系统，内置几何体一览、BufferGeometry 底层原理、自定义顶点数据、索引几何体、法线与 UV 坐标，以及几何体变换与合并实战。'
pubDate: 2026-04-10
tags:
  - Three.js
  - 3D
  - WebGL
---

> 本文是 Three.js 系列的第五篇。前四篇分别讲解了 [Three.js 三要素](/blog/threejs-three-elements)、[Scene](/blog/threejs-scene-deep-dive)、[Camera](/blog/threejs-camera-deep-dive)、[Renderer](/blog/threejs-renderer-deep-dive)。从这篇开始，我们进入具体的 3D 构建模块 —— **Geometry（几何体）**。

---

## 什么是 Geometry？

在 Three.js 中，一个可见的 3D 物体由两部分组成：

```
Mesh = Geometry（几何体）+ Material（材质）
```

- **Geometry** —— 定义物体的**形状**：顶点坐标、面的连接方式、法线方向、UV 坐标等
- **Material** —— 定义物体的**外观**：颜色、纹理、光照响应等

你可以把 Geometry 理解为**骨架**，Material 是穿在骨架上的**皮肤**。

---

## 一、Three.js 内置几何体一览

Three.js 内置了丰富的几何体，覆盖了大部分常见 3D 形状。

### 1.1 基础几何体

```javascript
import * as THREE from 'three';

// 立方体
const box = new THREE.BoxGeometry(
  width,   // x 方向宽度，默认 1
  height,  // y 方向高度，默认 1
  depth,   // z 方向深度，默认 1
  widthSegments,  // x 方向细分数，默认 1
  heightSegments, // y 方向细分数，默认 1
  depthSegments   // z 方向细分数，默认 1
);

// 球体
const sphere = new THREE.SphereGeometry(
  radius,          // 半径，默认 1
  widthSegments,   // 水平方向分段数，默认 32
  heightSegments,  // 垂直方向分段数，默认 16
  phiStart,        // 水平起始角度，默认 0
  phiLength,       // 水平扫描角度，默认 Math.PI * 2
  thetaStart,      // 垂直起始角度，默认 0
  thetaLength      // 垂直扫描角度，默认 Math.PI
);

// 平面
const plane = new THREE.PlaneGeometry(
  width,           // 宽度，默认 1
  height,          // 高度，默认 1
  widthSegments,   // x 方向细分，默认 1
  heightSegments   // y 方向细分，默认 1
);

// 圆柱体
const cylinder = new THREE.CylinderGeometry(
  radiusTop,       // 顶部半径，默认 1
  radiusBottom,    // 底部半径，默认 1
  height,          // 高度，默认 1
  radialSegments,  // 圆周分段数，默认 32
  heightSegments,  // 高度分段数，默认 1
  openEnded,       // 是否开放两端，默认 false
  thetaStart,
  thetaLength
);

// 圆锥（CylinderGeometry 的特例，顶部半径 = 0）
const cone = new THREE.ConeGeometry(radius, height, radialSegments);

// 圆形（2D 圆面）
const circle = new THREE.CircleGeometry(
  radius,          // 半径，默认 1
  segments,        // 分段数，默认 32
  thetaStart,
  thetaLength
);

// 环形（甜甜圈）
const torus = new THREE.TorusGeometry(
  radius,          // 大圆半径，默认 1
  tube,            // 管道半径，默认 0.4
  radialSegments,  // 管道周向分段数，默认 12
  tubularSegments, // 管道沿圆圈方向分段数，默认 48
  arc              // 弧度，默认 Math.PI * 2
);
```

### 1.2 特殊几何体

```javascript
// 圆环结（Torus Knot）
const torusKnot = new THREE.TorusKnotGeometry(
  radius,          // 默认 1
  tube,            // 管道半径，默认 0.4
  tubularSegments, // 默认 64
  radialSegments,  // 默认 8
  p,               // 绕旋转轴缠绕次数，默认 2
  q                // 绕内部圆缠绕次数，默认 3
);

// 二十面体（Icosahedron）
const icosahedron = new THREE.IcosahedronGeometry(radius, detail);

// 八面体
const octahedron = new THREE.OctahedronGeometry(radius, detail);

// 四面体
const tetrahedron = new THREE.TetrahedronGeometry(radius, detail);

// 十二面体
const dodecahedron = new THREE.DodecahedronGeometry(radius, detail);

// 胶囊体（CapsuleGeometry，r138+）
const capsule = new THREE.CapsuleGeometry(
  radius,     // 半径，默认 1
  length,     // 中间圆柱段长度，默认 1
  capSegments, // 半球分段数，默认 4
  radialSegments // 圆周分段数，默认 8
);

// 管道（沿曲线生成管体）
const path = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(1, 0, 0),
]);
const tube = new THREE.TubeGeometry(
  path,             // 路径曲线
  tubularSegments,  // 沿路径方向分段数，默认 64
  radius,           // 管道半径，默认 1
  radialSegments,   // 管道周向分段数，默认 8
  closed            // 是否闭合，默认 false
);

// 车削几何体（绕 Y 轴旋转 2D 轮廓生成 3D 体）
const points = [
  new THREE.Vector2(0, 0),
  new THREE.Vector2(1, 0.5),
  new THREE.Vector2(0.8, 1),
  new THREE.Vector2(0.3, 1.5),
];
const lathe = new THREE.LatheGeometry(
  points,    // 2D 轮廓点数组
  segments,  // 旋转分段数，默认 12
  phiStart,  // 起始角度，默认 0
  phiLength  // 旋转角度，默认 Math.PI * 2
);
```

### 1.3 几何体速查表

| 几何体 | 类名 | 常用参数 | 典型用途 |
|--------|------|----------|---------|
| 立方体 | `BoxGeometry` | width, height, depth | 地板、墙壁、建筑 |
| 球体 | `SphereGeometry` | radius, wSeg, hSeg | 星球、泡泡、眼球 |
| 平面 | `PlaneGeometry` | width, height | 地面、背景墙 |
| 圆柱 | `CylinderGeometry` | rTop, rBottom, height | 柱子、树干 |
| 圆锥 | `ConeGeometry` | radius, height | 箭头、尖顶 |
| 圆环 | `TorusGeometry` | radius, tube | 甜甜圈、光环 |
| 胶囊 | `CapsuleGeometry` | radius, length | 角色占位体 |
| 管道 | `TubeGeometry` | curve | 管道、路线 |
| 车削 | `LatheGeometry` | points | 花瓶、杯子 |

---

## 二、BufferGeometry —— 几何体的底层结构

所有内置几何体最终都是 `BufferGeometry`。理解它，才能真正掌控几何体。

### 2.1 核心概念

`BufferGeometry` 通过 **Attribute（属性）** 存储几何数据：

```
BufferGeometry
├── attributes.position   → 顶点坐标（必须）
├── attributes.normal     → 法线方向（影响光照）
├── attributes.uv         → UV 坐标（影响纹理映射）
├── attributes.color      → 顶点颜色（可选）
└── index                 → 索引（可选，减少重复顶点）
```

每个 Attribute 都是一个 `BufferAttribute`，本质是 **TypedArray**（Float32Array、Uint16Array 等），直接对应 GPU 缓冲区。

### 2.2 检查内置几何体的数据

```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1);

// 查看顶点数量
console.log('顶点数:', geometry.attributes.position.count); // 24（每面4个，6面）

// 查看位置数据
console.log('位置数组:', geometry.attributes.position.array); // Float32Array

// 查看索引
console.log('索引:', geometry.index.array); // Uint16Array
```

---

## 三、从零手写一个 BufferGeometry

理解底层最好的方式是自己动手创建一个几何体。

### 3.1 创建一个三角形（最简单的情况）

```javascript
// 三角形的 3 个顶点坐标
const vertices = new Float32Array([
  // x,    y,    z
  -1.0, -1.0,  0.0,   // 顶点 0：左下
   1.0, -1.0,  0.0,   // 顶点 1：右下
   0.0,  1.0,  0.0,   // 顶点 2：顶部
]);

const geometry = new THREE.BufferGeometry();

// 每 3 个数值为一组（xyz），所以 itemSize = 3
geometry.setAttribute(
  'position',
  new THREE.BufferAttribute(vertices, 3)
);

const material = new THREE.MeshBasicMaterial({
  color: 0x00ffcc,
  side: THREE.DoubleSide  // 双面渲染
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
```

### 3.2 创建一个自定义平面（带法线和 UV）

```javascript
const geometry = new THREE.BufferGeometry();

// 4 个顶点的坐标
const positions = new Float32Array([
  -1, -1, 0,   // 0: 左下
   1, -1, 0,   // 1: 右下
   1,  1, 0,   // 2: 右上
  -1,  1, 0,   // 3: 左上
]);

// 法线（都朝向 +z 方向）
const normals = new Float32Array([
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
]);

// UV 坐标（0-1 范围，左下角 (0,0)，右上角 (1,1)）
const uvs = new Float32Array([
  0, 0,   // 0: 左下
  1, 0,   // 1: 右下
  1, 1,   // 2: 右上
  0, 1,   // 3: 左上
]);

// 索引：两个三角形组成一个矩形
// 三角形 1: 0→1→2，三角形 2: 0→2→3
const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('normal',   new THREE.BufferAttribute(normals, 3));
geometry.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
geometry.setIndex(new THREE.BufferAttribute(indices, 1));

// 或者直接传数组
geometry.setIndex([0, 1, 2, 0, 2, 3]);
```

---

## 四、索引几何体 vs 非索引几何体

### 4.1 非索引（重复顶点）

```
立方体一个面（矩形）= 2 个三角形 = 6 个顶点（有 2 个重复）

顶点列表：A B C A C D
             ↑       ↑  A 出现了两次
```

### 4.2 索引几何体（共享顶点）

```
顶点列表：A B C D（只存 4 个）
索引列表：0 1 2  0 2 3（指向顶点的编号）
```

**优势**：

```javascript
// 索引几何体的收益
// 一个立方体：8 个顶点 + 36 个索引
// vs 非索引：36 个顶点
// 顶点数减少 77%，显存占用大幅降低
```

> **注意**：当顶点的法线或 UV 在不同面之间不同时，不能共享顶点（比如立方体的棱角处，法线朝向不同，需要重复顶点）。这就是为什么 `BoxGeometry` 有 24 个顶点而不是 8 个。

---

## 五、法线（Normal）详解

法线是从顶点发出的**垂直方向向量**，决定了光照效果。

### 5.1 面法线 vs 顶点法线

```
面法线（Flat Shading）：               顶点法线（Smooth Shading）：
每个面的法线相同，棱角分明。            顶点法线是相邻面法线的平均，表面光滑。

   ↑  ↑  ↑ ↑                            ↑ ↗  ↑  ↖ ↑
  ┌─────────┐                           ┌─────────┐
  │ ←     → │                           │         │
  └─────────┘                           └─────────┘
```

```javascript
// 自动计算顶点法线
geometry.computeVertexNormals();

// 使用平面着色（面法线效果）
const material = new THREE.MeshLambertMaterial({
  flatShading: true  // 使用面法线
});
```

### 5.2 手动设置法线

```javascript
const normals = new Float32Array([
  // 指向 +y（朝上）
  0, 1, 0,
  0, 1, 0,
  0, 1, 0,
]);
geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
```

### 5.3 可视化法线（调试用）

```javascript
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';

const helper = new VertexNormalsHelper(mesh, 0.1, 0x00ff00);
scene.add(helper);
```

---

## 六、UV 坐标与纹理映射

UV 坐标定义了纹理如何"贴"在几何体上。

### 6.1 理解 UV 坐标系

```
纹理图片坐标系：

(0,1) ─────── (1,1)
  │               │
  │   纹理图片    │
  │               │
(0,0) ─────── (1,0)
```

UV 的范围通常是 0 到 1：
- `(0, 0)` —— 纹理左下角
- `(1, 1)` —— 纹理右上角

### 6.2 自定义 UV 实现纹理裁切

```javascript
// 假设纹理图集 2×2，取左下角那张
const uvs = new Float32Array([
  0.0, 0.0,   // 左下角从 (0.0, 0.0) 开始
  0.5, 0.0,   // x 方向只取一半
  0.5, 0.5,   // y 方向也只取一半
  0.0, 0.5,
]);

// 超出 [0,1] 范围时的行为（纹理的 wrapS/wrapT 控制）
texture.wrapS = THREE.RepeatWrapping;  // 重复平铺
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(4, 4);              // x/y 各重复 4 次
```

### 6.3 UV 辅助工具（调试用）

```javascript
// 把 UV 坐标可视化（用于检查 UV 是否正确）
import { UVsDebugHelper } from 'three/addons/helpers/UVsDebugHelper.js';

const helper = new UVsDebugHelper(mesh);
document.body.appendChild(helper.canvas);
```

---

## 七、几何体变换

`BufferGeometry` 提供了一组方便的变换方法，**直接修改顶点数据**（不同于 Mesh 的 position/rotation/scale 变换）。

```javascript
const geometry = new THREE.SphereGeometry(1, 32, 32);

// 平移（修改所有顶点坐标）
geometry.translate(0, 1, 0);   // 向上移动 1 单位

// 旋转（弧度）
geometry.rotateX(Math.PI / 2); // 绕 X 轴旋转 90°
geometry.rotateY(Math.PI);
geometry.rotateZ(Math.PI / 4);

// 缩放
geometry.scale(2, 1, 2);       // x/z 方向放大 2 倍

// 合并以上操作（更高效）
geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(1, 0, 0));
```

> **什么时候用几何体变换，什么时候用 Mesh 变换？**  
> - **Mesh 变换**（position/rotation/scale）：运行时动态改变，开销小，可还原  
> - **几何体变换**（geometry.translate 等）：永久修改顶点数据，适合初始化时调整模型的"基准位置"（比如让物体的中心点与几何体中心对齐）

---

## 八、包围盒与包围球

包围盒/球用于碰撞检测、视锥剔除和距离计算：

```javascript
// 计算包围盒
geometry.computeBoundingBox();
const box = geometry.boundingBox;     // THREE.Box3
console.log('最小点:', box.min);      // Vector3
console.log('最大点:', box.max);      // Vector3

// 获取中心点
const center = new THREE.Vector3();
box.getCenter(center);
console.log('中心:', center);

// 获取尺寸
const size = new THREE.Vector3();
box.getSize(size);
console.log('尺寸 (W×H×D):', size);

// 计算包围球
geometry.computeBoundingSphere();
const sphere = geometry.boundingSphere; // THREE.Sphere
console.log('球心:', sphere.center);
console.log('半径:', sphere.radius);
```

---

## 九、几何体合并（提升性能）

将多个静态几何体合并为一个，大幅减少 Draw Call：

```javascript
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// 创建 100 棵"树"（每棵树 = 锥形 + 圆柱）
const treeGeos = [];
for (let i = 0; i < 100; i++) {
  const x = (Math.random() - 0.5) * 50;
  const z = (Math.random() - 0.5) * 50;

  // 树干
  const trunk = new THREE.CylinderGeometry(0.1, 0.15, 1, 6);
  trunk.translate(x, 0.5, z);

  // 树冠
  const crown = new THREE.ConeGeometry(0.5, 1.5, 6);
  crown.translate(x, 1.75, z);

  treeGeos.push(trunk, crown);
}

// 合并所有几何体 = 只有 1 次 Draw Call
const mergedGeo = mergeGeometries(treeGeos, false);
const forest = new THREE.Mesh(
  mergedGeo,
  new THREE.MeshLambertMaterial({ color: 0x228833 })
);
scene.add(forest);
```

---

## 十、动态修改顶点数据

如果需要在运行时修改几何体的顶点，可以直接操作 `BufferAttribute`：

```javascript
const geometry = new THREE.PlaneGeometry(10, 10, 20, 20);
const posAttr = geometry.attributes.position;

// 把平面变成"波浪"地形
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i);
  const z = posAttr.getZ(i);
  
  // 根据 xz 坐标计算 y 高度
  const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5;
  posAttr.setY(i, y);
}

// 告诉 GPU 这个 Attribute 已经更新
posAttr.needsUpdate = true;

// 重新计算法线（法线变化了，需要更新）
geometry.computeVertexNormals();
```

### 在动画中持续更新

```javascript
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const time = clock.getElapsedTime();
  
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    
    // 动态波浪
    const y = Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time) * 0.5;
    posAttr.setY(i, y);
  }
  
  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
  
  renderer.render(scene, camera);
}
animate();
```

---

## 十一、内存释放

几何体会占用 GPU 显存，不再使用时必须手动释放：

```javascript
// 释放单个几何体
geometry.dispose();

// 完整的 Mesh 清理流程
function disposeMesh(mesh) {
  mesh.geometry.dispose();
  
  const materials = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];
  
  materials.forEach(mat => {
    // 释放材质中的纹理
    Object.values(mat).forEach(v => {
      if (v && v.isTexture) v.dispose();
    });
    mat.dispose();
  });
  
  scene.remove(mesh);
}
```

---

## 十二、完整示例：程序化生成山地地形

结合本文所有知识点，动手生成一块程序化地形：

```javascript
import * as THREE from 'three';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

// --- 场景初始化 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 30, 60);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 生成地形 ---
const WIDTH = 100, DEPTH = 100;
const SEGS = 128; // 分段数，越大越精细
const SCALE = 10; // 高度缩放系数

const geometry = new THREE.PlaneGeometry(WIDTH, DEPTH, SEGS, SEGS);
geometry.rotateX(-Math.PI / 2); // 平面默认朝上，绕 X 轴转 90° 成为水平地面

const noise = new SimplexNoise();
const posAttr = geometry.attributes.position;

for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i);
  const z = posAttr.getZ(i);

  // 多层噪声叠加（Fractal Brownian Motion）
  let y = 0;
  y += noise.noise(x * 0.02, z * 0.02) * SCALE;       // 大起伏
  y += noise.noise(x * 0.06, z * 0.06) * SCALE * 0.4; // 中起伏
  y += noise.noise(x * 0.15, z * 0.15) * SCALE * 0.1; // 细节

  posAttr.setY(i, y);
}

posAttr.needsUpdate = true;
geometry.computeVertexNormals();
geometry.computeBoundingBox();

// --- 顶点着色（根据高度着色）---
const colors = [];
const yMin = geometry.boundingBox.min.y;
const yMax = geometry.boundingBox.max.y;
const colorLow  = new THREE.Color(0x1a472a);  // 低处：深绿
const colorMid  = new THREE.Color(0x6b8c42);  // 中间：草绿
const colorHigh = new THREE.Color(0x8b8685);  // 高处：灰石

for (let i = 0; i < posAttr.count; i++) {
  const y = posAttr.getY(i);
  const t = (y - yMin) / (yMax - yMin); // 归一化到 0-1
  
  const color = new THREE.Color();
  if (t < 0.5) {
    color.lerpColors(colorLow, colorMid, t * 2);
  } else {
    color.lerpColors(colorMid, colorHigh, (t - 0.5) * 2);
  }
  colors.push(color.r, color.g, color.b);
}

geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

const material = new THREE.MeshLambertMaterial({
  vertexColors: true,  // 使用顶点颜色
});

const terrain = new THREE.Mesh(geometry, material);
terrain.receiveShadow = true;
scene.add(terrain);

// --- 灯光 ---
const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
sun.position.set(30, 60, 20);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.AmbientLight(0x334466, 0.8));

// --- 渲染 ---
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

---

## 小结

| 知识点 | 要点 |
|--------|------|
| 内置几何体 | 涵盖盒、球、平面、圆柱、环形等，参数控制精细度 |
| BufferGeometry | 通过 `attributes.position/normal/uv` 直接操控顶点数据 |
| 索引几何体 | 共享顶点减少显存，但法线/UV 不同时不能共享 |
| 法线 | `computeVertexNormals()` 自动计算，`flatShading` 控制棱角感 |
| UV | 0-1 范围内定义纹理映射，超出范围由 `wrapS/T` 控制 |
| 几何体变换 | `translate/rotate/scale` 永久修改顶点，适合初始化 |
| 动态更新 | 修改 `attribute.array` 后设置 `needsUpdate = true` |
| 释放 | 用完调用 `geometry.dispose()` 防止 GPU 显存泄漏 |

下一篇我们将进入 **Material（材质）深度解析** —— 从 `MeshBasicMaterial` 到 PBR 的 `MeshStandardMaterial`，揭秘 Three.js 材质系统的完整体系。

---

*Three.js 系列持续更新中，欢迎关注。*
