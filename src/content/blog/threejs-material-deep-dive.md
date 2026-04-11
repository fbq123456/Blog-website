---
title: 'Three.js 深入解析：Material（材质）'
description: '全面解析 Three.js 材质系统，从 MeshBasicMaterial 到 MeshPhysicalMaterial，涵盖所有内置材质、纹理贴图、PBR 流程、环境反射、自定义着色器材质，以及实战金属球体与玻璃材质制作。'
pubDate: 2026-04-11
tags:
  - Three.js
  - 3D
  - WebGL
---

> 本文是 Three.js 系列的第六篇。前五篇分别讲解了 [Three.js 三要素](/blog/threejs-three-elements)、[Scene](/blog/threejs-scene-deep-dive)、[Camera](/blog/threejs-camera-deep-dive)、[Renderer](/blog/threejs-renderer-deep-dive)、[Geometry](/blog/threejs-geometry-deep-dive)。今天我们聚焦另一半 —— **Material（材质）**。

---

## 什么是 Material？

在 Three.js 中，材质的核心职责是：**告诉 GPU 如何计算每个像素的颜色。**

```javascript
Mesh = Geometry（几何体）+ Material（材质）
```

- **Geometry** 决定了 3D 物体的**形状**（顶点、面、法线）
- **Material** 决定了 3D 物体的**外观**（颜色、光泽、透明度、纹理）

材质是 Three.js 中最复杂的子系统之一，从简单的纯色材质到复杂的 PBR（基于物理的渲染）材质，能力跨度极大。

---

## 一、材质家族全景图

Three.js 内置了多种材质，按能力从低到高排列：

```
MeshBasicMaterial          → 不受光照影响，纯色/线框
MeshLambertMaterial        → Lambert 漫反射，受光照但无高光
MeshPhongMaterial          → Phong 光照，含高光控制
MeshStandardMaterial       → PBR 标准材质（主流选择）
MeshPhysicalMaterial       → PBR 物理材质，支持更多细节
ShaderMaterial             → 完全自定义 GLSL 着色器
```

此外还有专用材质：
- `LineBasicMaterial`、`LineDashedMaterial` —— 线条
- `PointsMaterial` —— 点云粒子
- `SpriteMaterial` —— 永远朝向相机的 2D 精灵

---

## 二、MeshBasicMaterial —— 不受光照的简单材质

### 2.1 基础用法

`MeshBasicMaterial` 是最简单的材质，**完全忽略光照**，直接显示设定的颜色。适合：
- 几何体线框展示
- 地形、天空盒等不需要光照的物体
- UI 元素与调试辅助

```javascript
import * as THREE from 'three';

// 纯色材质
const basic = new THREE.MeshBasicMaterial({
  color: 0xff5500,
});

// 线框材质
const wireframe = new THREE.MeshBasicMaterial({
  color: 0x00ff88,
  wireframe: true,
});

// 透明材质
const transparent = new THREE.MeshBasicMaterial({
  color: 0x4488ff,
  transparent: true,
  opacity: 0.5,
});

// 可见背面（用于单面物体内部）
const doubleSide = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  side: THREE.DoubleSide,
});
```

### 2.2 side 参数详解

```javascript
material.side = THREE.FrontSide;   // 只渲染正面（默认）
material.side = THREE.BackSide;    // 只渲染背面
material.side = THREE.DoubleSide;  // 双面渲染
```

```
正面（FrontSide）：        背面（BackSide）：
   ┌─────┐                     ┌─────┐
   │ → → │ 法线朝外             │ ← ← │ 法线朝内
   └─────┘                     └─────┘
```

**使用场景**：
- `DoubleSide`：开放的壳体（如纸片、旗帜、单面墙的内部）
- `BackSide`：建筑内表面、天空球内部

---

## 三、MeshLambertMaterial —— 漫反射材质

`MeshLambertMaterial` 基于 **Lambert 余弦定律**计算漫反射，受光照影响，但无高光反射。适合模拟纸张、布料、未抛光木材等**无光泽表面**。

```javascript
const lambert = new THREE.MeshLambertMaterial({
  color: 0x44aa88,
  emissive: 0x000000,     // 自发光颜色（不受光照影响）
  emissiveIntensity: 1.0,  // 自发光强度
});
```

### Lambert 漫反射原理

```
光照强度 ∝ cos(光线角度) = 法线 · 光线方向

光线直射（90°）：cos = 1，最亮
光线斜射（45°）：cos = 0.7，中等
光线切向（0°）：cos = 0，最暗
```

> **性能优势**：`MeshLambertMaterial` 计算量小，适合大量物体的场景（如树林、石块群）。

---

## 四、MeshPhongMaterial —— Phong 光照材质

`MeshPhongMaterial` 在 Lambert 漫反射基础上增加了**高光（Specular）**计算，物体表面呈现明显的光泽感。适合模拟：
- 抛光塑料
- 涂漆表面
- 光滑金属（有高光但不够真实）

```javascript
const phong = new THREE.MeshPhongMaterial({
  color: 0x2196F3,
  emissive: 0x001133,       // 暗处的基础颜色
  specular: 0xffffff,       // 高光颜色
  shininess: 30,           // 光泽度，控制高光大小（越大越锐利）
  flatShading: false,      // 是否使用平面着色（true = 棱角分明）
});
```

### shininess 效果对比

```
shininess: 5               shininess: 50              shininess: 200
大范围柔和高光             中等高光                   小而锐利的高光
   ████████                    ████                       █
```

### Phong 反射模型

Phong 模型将光照分为三部分：

```
最终颜色 = 环境光(Ambient) + 漫反射(Diffuse) + 高光(Specular)

环境光：scene.add(new THREE.AmbientLight(0xffffff, 0.3))
漫反射：Lambert 漫反射计算
高光：  视线方向的反射光强度
```

> **注意**：Phong 材质的高光是数学上的"假"高光，不符合真实物理规律（如能量守恒）。现代渲染更推荐使用 PBR 材质。

---

## 五、MeshStandardMaterial —— PBR 标准材质（⭐推荐）

`MeshStandardMaterial` 是 Three.js **最核心的材质**，基于 Physically Based Rendering（基于物理的渲染）。它使用金属度-粗糙度（Metallic-Roughness）工作流，是工业级标准。

```javascript
const standard = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.5,          // 粗糙度，0 = 完美镜面，1 = 完全漫反射
  metalness: 0.0,           // 金属度，0 = 非金属，1 = 纯金属
  emissive: 0x000000,       // 自发光
  emissiveIntensity: 1.0,
  envMapIntensity: 1.0,    // 环境贴图强度
});
```

### 5.1 金属度（metalness）

```
metalness = 0.0（非金属）：
┌────────────────────────────────────┐
│ 基础色 = 物体本色（F₀ = 基础色）    │
│ 高光 = 白色高光，有明显边缘衰减      │
│ 反射 = 弱，菲涅尔效应不明显          │
└────────────────────────────────────┘

metalness = 1.0（纯金属）：
┌────────────────────────────────────┐
│ 基础色 = 几乎消失（F₀ = 金属色）    │
│ 高光 = 金属本色，无边缘衰减          │
│ 反射 = 强，环境清晰可见              │
└────────────────────────────────────┘
```

### 5.2 粗糙度（roughness）

```
roughness = 0.0（完美镜面）：     roughness = 0.3（光滑）：      roughness = 0.8（粗糙）：
清晰倒影                     模糊倒影                 无倒影
   ○                          ◑                       ░
```

### 5.3 常用 PBR 材质参数参考

| 材质 | metalness | roughness | 说明 |
|------|-----------|-----------|------|
| 抛光黄金 | 1.0 | 0.1 | 强反射、低粗糙 |
| 粗糙生锈铁 | 0.8 | 0.8 | 高金属度、高粗糙 |
| 塑料（光滑） | 0.0 | 0.2 | 非金属、低粗糙 |
| 木材（未处理） | 0.0 | 0.8 | 非金属、高粗糙 |
| 布料 | 0.0 | 0.9 | 非金属、高粗糙 |
| 玻璃 | 0.0 | 0.05 | 透明物体需单独设置 |

---

## 六、MeshPhysicalMaterial —— 物理材质

`MeshPhysicalMaterial` 继承自 `MeshStandardMaterial`，增加了更多高级参数，适合需要更精细物理控制的场景（如汽车漆、宝石、织物）：

```javascript
const physical = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  roughness: 0.2,
  metalness: 0.0,

  // --- 新增参数 ---
  clearcoat: 0.0,           // 清漆层（0-1），模拟汽车漆面
  clearcoatRoughness: 0.1,  // 清漆层粗糙度

  reflectivity: 0.5,        // 反射率，替代 Three.js 旧版的全局反射参数

  // --- 透射（Transmission）---
  transmission: 0.0,        // 透射率（0 = 不透明，1 = 完全透明）
  thickness: 0.5,           // 透射物体的"厚度"（影响折射）
  ior: 1.5,                  // 折射率：1.0=空气，1.5=玻璃，2.0=钻石
  attenuationColor: 0xffffff, // 透射时的衰减颜色
  attenuationDistance: Infinity, // 透射衰减距离

  // --- 各向异性（Anisotropy）---
  anisotropy: 0.0,           // 各向异性强度
  anisotropyRotation: 0.0,   // 各向异性旋转角度

  // --- Sheen（绸缎光泽）---
  sheen: 0.0,               // 绸缎光泽强度
  sheenRoughness: 0.5,      // 绸缎粗糙度
  sheenColor: 0xffffff,     // 绸缎颜色
});
```

### Physical 材质 vs Standard 材质

```
MeshStandardMaterial          MeshPhysicalMaterial
├── color ✓                   ├── color ✓
├── metalness ✓               ├── metalness ✓
├── roughness ✓               ├── roughness ✓
├── emissive ✓                ├── emissive ✓
├── envMapIntensity ✓         ├── envMapIntensity ✓
└──                         ├── clearcoat（清漆层）⭐
                            ├── transmission（透射）⭐
                            ├── 各向异性 ⭐
                            └── sheen（绸缎光泽）⭐
```

### 典型使用场景

```javascript
// 玻璃材质
const glass = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.0,
  roughness: 0.0,
  transmission: 0.95,     // 高度透明
  thickness: 0.5,         // 折射计算用
  ior: 1.5,               // 玻璃折射率
  clearcoat: 1.0,         // 表面有清漆层
  clearcoatRoughness: 0.0,
});

// 汽车漆面
const carPaint = new THREE.MeshPhysicalMaterial({
  color: 0x0033ff,
  metalness: 0.9,
  roughness: 0.15,
  clearcoat: 1.0,
  clearcoatRoughness: 0.03,
});

// 绸缎布料
const satin = new THREE.MeshPhysicalMaterial({
  color: 0xff88aa,
  metalness: 0.0,
  roughness: 0.6,
  sheen: 1.0,
  sheenRoughness: 0.3,
  sheenColor: 0xffffff,
});
```

---

## 七、材质共有属性

所有 Three.js 材质（从 `Material` 基类继承）共享以下属性：

```javascript
// --- 通用属性 ---
material.color = new THREE.Color(0xffffff);    // 主颜色
material.opacity = 1.0;                      // 整体透明度
material.transparent = false;                // 是否启用透明
material.side = THREE.FrontSide;             // 渲染哪一面
material.depthWrite = true;                  // 是否写入深度缓冲
material.depthTest = true;                   // 是否进行深度测试
material.alphaTest = 0.0;                    // Alpha 测试阈值
material.visible = true;                     // 是否渲染

// --- 融合模式 ---
material.blending = THREE.NormalBlending;     // 融合模式
material.blendSrc = THREE.SrcAlphaFactor;    // 源因子
material.blendDst = THREE.OneMinusSrcAlphaFactor; // 目标因子
material.blendEquation = THREE.AddEquation;  // 融合方程

// --- 状态 ---
material.needsUpdate = false;                // 标记需要更新
material.clone();                             // 深拷贝材质
material.copy(source);                       // 从另一个材质复制
material.dispose();                          // 释放显存
```

### 常用融合模式

```javascript
// 正常混合（透明物体）
material.blending = THREE.NormalBlending;

// 加法混合（发光/火焰效果）
material.blending = THREE.AdditiveBlending;

// 乘积混合（叠加纹理）
material.blending = THREE.MultiplyBlending;

// 自定义混合（实现半透明排序问题）
material.blending = THREE.CustomBlending;
material.blendSrc = THREE.SrcAlphaFactor;
material.blendDst = THREE.OneMinusSrcAlphaFactor;
```

---

## 八、纹理贴图（Texture）

纹理是材质的核心组成部分，为材质提供更丰富的视觉细节。

### 8.1 加载纹理

```javascript
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// 图片纹理
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('/textures/brick-diffuse.jpg');

// HDR 环境贴图
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.load('/textures/warehouse.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture;  // PBR 材质的环境贴图
});
```

### 8.2 纹理属性

```javascript
texture.colorSpace = THREE.SRGBColorSpace;    // 色彩空间（重要！）
texture.wrapS = THREE.RepeatWrapping;        // 水平方向包裹方式
texture.wrapT = THREE.RepeatWrapping;        // 垂直方向包裹方式
texture.repeat.set(2, 2);                    // 重复次数
texture.offset.set(0.5, 0.0);               // 偏移量
texture.rotation = Math.PI / 4;             // 旋转角度（弧度）
texture.center.set(0.5, 0.5);               // 旋转中心
texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // 各向异性过滤
texture.minFilter = THREE.LinearMipmapLinearFilter; // 缩小过滤
texture.magFilter = THREE.LinearFilter;     // 放大过滤
texture.generateMipmaps = true;             // 是否生成多级渐远纹理
```

### 8.3 纹理通道（Map Types）

```javascript
const material = new THREE.MeshStandardMaterial({
  // --- 基础贴图 ---
  map: diffuseTexture,              // 基础色贴图（漫反射颜色）

  // --- PBR 贴图 ---
  roughnessMap: roughnessTexture,   // 粗糙度贴图
  metalnessMap: metalnessTexture,  // 金属度贴图
  normalMap: normalTexture,         // 法线贴图（凹凸细节）
  bumpMap: bumpTexture,             // 凸包贴图（旧版法线替代）
  displacementMap: dispTexture,    // 位移贴图（真实几何位移）

  // --- 环境与反射 ---
  envMap: envTexture,               // 环境贴图
  envMapIntensity: 1.0,            // 环境贴图强度

  // --- 其他 ---
  aoMap: aoTexture,                 // 环境光遮蔽贴图（提高立体感）
  emissiveMap: emissiveTexture,     // 自发光贴图
  lightMap: lightTexture,          // 光照贴图（旧版 LightMap）
  alphaMap: alphaTexture,           // Alpha 透明贴图
});

material.normalScale.set(1, 1);    // 法线强度（可调正负）
material.aoMapIntensity = 1.0;      // AO 强度
material.displacementScale = 0.5;  // 位移强度
```

### 8.4 法线贴图（Normal Map）详解

法线贴图通过存储法线方向变化，在不增加几何体复杂度的情况下，模拟表面凹凸细节：

```
原始平面：                法线贴图添加后：
     ┌─────┐                    ┌─────┐
     │ 平滑 │  ───────→          │ 立体 │
     └─────┘                    └─────┘
几何体：1 个面              视觉上：几百个"面"
Draw Calls: 1              视觉效果：丰富
```

```javascript
// 使用法线贴图
const normalMap = textureLoader.load('/textures/brick-normal.jpg');
// 法线贴图有两种格式：
// - OpenGL 格式：R=(+x→右), G=(+y→上), B=(+z→前)，偏蓝
// - DirectX 格式：G 通道翻转，偏绿

material.normalMap = normalMap;
material.normalScale.set(1, 1); // x/y 方向法线强度可单独控制
```

### 8.5 纹理加载管理器

```javascript
import { LoadingManager } from 'three';

const manager = new THREE.LoadingManager();

// 进度回调
manager.onProgress = (url, loaded, total) => {
  console.log(`加载中: ${(loaded / total * 100).toFixed(0)}%`);
};

// 全部完成
manager.onLoad = () => {
  console.log('全部纹理加载完成');
};

// 错误处理
manager.onError = (url) => {
  console.error('加载失败:', url);
};

const loader = new THREE.TextureLoader(manager);
const texture = loader.load('/textures/diffuse.jpg');
```

---

## 九、环境贴图与反射

### 9.1 使用环境贴图

PBR 材质的真实感很大程度上依赖**环境贴图（Environment Map）**：

```javascript
// 创建 PMREMGenerator 生成预过滤环境贴图
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';

const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// 加载 HDR 环境贴图
new RGBELoader()
  .setDataType(THREE.HalfFloatType)
  .load('/textures/studio_small_08_1k.hdr', (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap;      // 全局环境（所有 PBR 材质可用）
    // scene.background = envMap;   // 如果要作为背景

    texture.dispose();
    pmremGenerator.dispose();
  });
```

### 9.2 无 HDR 时的备选方案

```javascript
// 使用 CubeCamera 实时捕捉场景反射
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
scene.add(cubeCamera);

// 需要反射的物体使用
material.envMap = cubeRenderTarget.texture;
material.envMapIntensity = 1.0;
```

### 9.3 三种环境贴图的区别

```javascript
scene.environment = envMap;    // ⭐ 推荐——影响所有 PBR 材质
scene.background = envMap;     // 设为背景图
mesh.material.envMap = envMap; // 仅影响单个材质
```

---

## 十、实战：制作一个真实的金属球体

综合运用 `MeshStandardMaterial` + 环境贴图 + 纹理贴图：

```javascript
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';

// --- 加载 HDR 环境贴图 ---
const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader()
  .setDataType(THREE.HalfFloatType)
  .load('/textures/studio_small_08_1k.hdr', (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    texture.dispose();
  });

// --- 加载纹理贴图 ---
const textureLoader = new THREE.TextureLoader();

// 基础色
const colorMap = textureLoader.load('/textures/metal/color.jpg');
colorMap.colorSpace = THREE.SRGBColorSpace;

// 粗糙度/金属度二合一贴图（Roughness in G，Metalness in B）
const ORMMap = textureLoader.load('/textures/metal/orm.jpg');

// 法线贴图
const normalMap = textureLoader.load('/textures/metal/normal.jpg');

// --- 创建 PBR 材质 ---
const metalBall = new THREE.Mesh(
  new THREE.SphereGeometry(2, 64, 64),
  new THREE.MeshStandardMaterial({
    map: colorMap,              // 基础色贴图
    roughnessMap: ORMMap,        // 粗糙度贴图（ORM 的 G 通道）
    metalnessMap: ORMMap,       // 金属度贴图（ORM 的 B 通道）
    metalness: 1.0,             // 基准金属度（贴图可叠加）
    roughness: 0.15,            // 基准粗糙度
    normalMap: normalMap,       // 法线贴图增加表面细节
    normalScale: new THREE.Vector2(0.5, 0.5),
    envMapIntensity: 1.5,       // 环境反射强度
  })
);

scene.add(metalBall);
```

> **性能提示**：ORM（Occlusion, Roughness, Metalness）三合一贴图只需加载**一张图片**，比分开加载三张更高效，在 glTF 格式中广泛使用。

---

## 十一、透明与折射：玻璃材质

### 11.1 使用 transmission 制作玻璃

```javascript
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const glass = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transmission: 0.95,         // 透射率，近似完全透明
  thickness: 1.0,             // 虚拟厚度（影响折射）
  roughness: 0.0,             // 表面光滑
  ior: 1.5,                   // 折射率（玻璃 = 1.5，钻石 = 2.4）
  clearcoat: 1.0,             // 表面清漆层
  clearcoatRoughness: 0.0,
  envMapIntensity: 1.0,
  transparent: true,          // Three.js 会自动设为 true
  side: THREE.DoubleSide,     // 双面可见
});

// 玻璃几何体（空心球效果更好）
const glassSphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.5, 64, 64),
  glass
);
scene.add(glassSphere);
```

### 11.2 transmission 的注意事项

```javascript
// transmission 需要 WebGL2 和支持泛光（Bloom）后处理才能显示正确的折射
// 如果看到黑色，可能是：
// 1. WebGL 上下文不支持 transmission
// 2. 缺少后处理 Pass

// 渲染透明物体时，渲染器配置
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// 透明物体渲染顺序问题（可选方案）
glassSphere.renderOrder = 1;
```

---

## 十二、材质克隆与复用

避免重复创建相同材质，节省显存：

```javascript
// 克隆材质（独立副本）
const material1 = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const material2 = material1.clone(); // 独立副本，修改不影响原材质
material2.color.set(0x00ff00);

// 复用材质（共享引用，性能更好）
const sharedMaterial = new THREE.MeshStandardMaterial({
  color: 0x4488ff,
  metalness: 0.8,
  roughness: 0.2,
});

const mesh1 = new THREE.Mesh(geometry1, sharedMaterial);
const mesh2 = new THREE.Mesh(geometry2, sharedMaterial);
// mesh1 和 mesh2 共用同一个材质实例
```

---

## 十三、材质与 glTF 模型

Three.js 推荐使用 glTF 格式（`.gltf` / `.glb`）加载带材质的模型：

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();
gltfLoader.load('/models/soldier.glb', (gltf) => {
  const model = gltf.scene;

  // glTF 材质通常是 MeshStandardMaterial 或 MeshPhysicalMaterial
  model.traverse((child) => {
    if (child.isMesh) {
      child.material.envMapIntensity = 1.5; // 调整环境反射强度
    }
  });

  scene.add(model);
});

// 监听加载进度
gltfLoader.load('/models/soldier.glb',
  (gltf) => { /* 成功 */ },
  (progress) => {
    console.log('加载进度:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
  },
  (error) => {
    console.error('加载失败:', error);
  }
);
```

---

## 十四、内存释放

材质和纹理会占用大量显存，使用完毕后必须释放：

```javascript
// 释放纹理
texture.dispose();

// 释放材质
material.dispose();

// 完整清理函数
function disposeMaterial(material) {
  // 遍历材质所有属性
  Object.keys(material).forEach((key) => {
    const value = material[key];
    if (value && typeof value === 'object' && 'isTexture' in value) {
      value.dispose();
    }
  });
  material.dispose();
}

// 清理场景中所有材质和纹理
scene.traverse((object) => {
  if (object.isMesh) {
    object.geometry.dispose();
    if (Array.isArray(object.material)) {
      object.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(object.material);
    }
  }
});
```

---

## 小结

| 材质 | 光照 | 高光 | PBR | 适用场景 |
|------|------|------|-----|---------|
| `MeshBasicMaterial` | ❌ | ❌ | ❌ | 线框、调试、不受光物体 |
| `MeshLambertMaterial` | ✅ | ❌ | ❌ | 纸张、布料、低性能设备 |
| `MeshPhongMaterial` | ✅ | ✅ | ❌ | 旧版抛光塑料（已不推荐） |
| `MeshStandardMaterial` | ✅ | ✅ | ✅ | ⭐ **日常首选**，适合绝大多数场景 |
| `MeshPhysicalMaterial` | ✅ | ✅ | ✅ | 玻璃、汽车漆、宝石、绸缎 |
| `MeshShaderMaterial` | 自定义 | 自定义 | 自定义 | 特殊效果、非物理渲染 |

> **实战建议**：日常开发优先使用 `MeshStandardMaterial`（金属度-粗糙度工作流），需要透射/清漆等高级效果时切换 `MeshPhysicalMaterial`。除非有特殊需求，否则不推荐使用 Phong 和 Lambert 材质。

本系列的基础理论部分到此已接近尾声。下两篇我们将进入**实战与进阶**阶段——讲解**光照系统**（AmbientLight、DirectionalLight、PointLight 等），以及 Three.js 的**动画系统**（AnimationMixer、关键帧、骨骼动画）。

---

*Three.js 系列持续更新中，欢迎关注。*
