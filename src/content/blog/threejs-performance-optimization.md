---
title: 'Three.js 性能优化：让你的 3D 场景流畅运行'
description: '深入讲解 Three.js 性能优化的核心策略，包括几何体合并、纹理优化、LOD、实例化渲染、按需渲染等实战技巧，让你的 3D 场景告别卡顿。'
pubDate: 2026-04-18
tags:
  - Three.js
  - 3D
  - WebGL
  - 性能优化
---

> 你的 3D 场景加载要 10 秒？帧率只有 15fps？别慌，这篇文章教你从 30 个优化点中榨干 GPU 的每一帧性能。

---

## 前言

做 Three.js 项目最容易踩的坑就是——**本地开发很流畅，上线之后卡成狗**。

为什么？因为你的电脑配置好，但用户的手机可能只有 2GB 内存。

性能优化不是可选项，是**必选项**。尤其是当你的 3D 内容面向 C 端用户时。

---

## 一、诊断：先找出瓶颈在哪

在优化之前，先用 Chrome DevTools 找出瓶颈：

### 1.1 打开性能面板

```
F12 → Performance → 录制 → 操作你的 3D 场景 → 停止 → 分析
```

### 1.2 关键指标

| 指标 | 含义 | 目标值 |
|------|------|--------|
| FPS | 每秒渲染帧数 | ≥ 60（桌面）/ ≥ 30（移动端） |
| Frame Time | 每帧耗时 | ≤ 16.6ms（60fps） |
| GPU Memory | 显存占用 | 尽量低 |
| Draw Calls | 每帧绘制调用次数 | 尽量少（< 100） |
| Triangles | 三角面数 | 移动端 < 50万 |

### 1.3 Three.js 内置统计工具

```javascript
import Stats from 'three/examples/jsm/libs/stats.module.js'

const stats = new Stats()
stats.showPanel(0) // 0: FPS, 1: MS, 2: MB
document.body.appendChild(stats.dom)

function animate() {
  stats.begin()
  // ... 渲染逻辑
  stats.end()
  requestAnimationFrame(animate)
}
```

---

## 二、几何体优化

### 2.1 减少顶点数（最直接的优化）

**原理**：顶点数越少，GPU 计算量越低。

```javascript
// ❌ 高精度球体（32 段 = 1984 个三角面）
const sphere = new THREE.SphereGeometry(1, 32, 32)

// ✅ 根据实际需要降低精度（16 段 = 512 个三角面）
const sphere = new THREE.SphereGeometry(1, 16, 16)

// ✅ 移动端进一步降低
const sphere = new THREE.SphereGeometry(1, 8, 8)
```

**不同精度的对比**：

| 段数 (widthSegments) | 三角面数 | 视觉差异 | 适用场景 |
|---------------------|----------|---------|---------|
| 4 | 32 | 明显棱角 | 极远处物体 |
| 8 | 128 | 轻微棱角 | 中远处物体 |
| 16 | 512 | 几乎看不出 | 近处小物体 |
| 32 | 1984 | 完全光滑 | 近处大物体/主角 |
| 64 | 7936 | 完全光滑 | 特写镜头 |

### 2.2 几何体合并（减少 Draw Call）

**这是 Three.js 性能优化中最重要的一招。**

每个 Mesh 都会产生一次 Draw Call。100 个独立 Mesh = 100 次 Draw Call = 慢。

```javascript
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// ❌ 100 个独立的立方体 = 100 次 Draw Call
for (let i = 0; i < 100; i++) {
  const geo = new THREE.BoxGeometry(1, 1, 1)
  const mesh = new THREE.Mesh(geo, material)
  mesh.position.set(i, 0, 0)
  scene.add(mesh)
}

// ✅ 合并为一个几何体 = 1 次 Draw Call
const geometries = []
for (let i = 0; i < 100; i++) {
  const geo = new THREE.BoxGeometry(1, 1, 1)
  geo.translate(i, 0, 0)  // 先移动，再合并
  geometries.push(geo)
}

const mergedGeo = mergeGeometries(geometries)
const mergedMesh = new THREE.Mesh(mergedGeo, material)
scene.add(mergedMesh)
```

> **注意**：合并后的几何体不能单独移动/旋转了。如果需要单独控制某些物体，考虑用 InstancedMesh。

### 2.3 使用 BufferGeometry

Three.js r125 以后默认就是 BufferGeometry，但如果你用了旧代码，确保没有使用已废弃的 `Geometry`：

```javascript
// ❌ 已废弃，性能差
const geometry = new THREE.Geometry()

// ✅ BufferGeometry（默认）
const geometry = new THREE.BufferGeometry()
```

---

## 三、纹理优化

### 3.1 压缩纹理

**纹理通常是显存占用的大头。**

| 纹理尺寸 | 像素数 | 显存占用（RGBA） |
|----------|--------|-----------------|
| 256×256 | 65,536 | 256 KB |
| 512×512 | 262,144 | 1 MB |
| 1024×1024 | 1,048,576 | 4 MB |
| 2048×2048 | 4,194,304 | 16 MB |
| 4096×4096 | 16,777,216 | 64 MB |

**优化策略**：

```javascript
const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load('texture.jpg')

// ✅ 压缩纹理尺寸
texture.image = resizeTexture(texture.image, 512, 512)

// ✅ 关闭 mipmap（如果不需要）
texture.generateMipmaps = false

// ✅ 设置合适的过滤模式
texture.minFilter = THREE.LinearFilter
texture.magFilter = THREE.LinearFilter

// ✅ 使用压缩纹理格式（需要预处理）
// 使用 tools like texconv 或 gltf-pipeline 生成
// .ktx2 / .basis 格式，显存占用降低 50-75%
```

### 3.2 纹理图集（Texture Atlas）

把多个小纹理合成一张大图，减少 Draw Call 和显存占用。

```
之前：4 个独立纹理 → 4 次采样
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ 草地  │ │ 石头  │ │ 水面  │ │ 沙漠  │
└──────┘ └──────┘ └──────┘ └──────┘

之后：1 张图集 → 1 次采样
┌──────┬──────┐
│ 草地  │ 石头  │
├──────┼──────┤
│ 水面  │ 沙漠  │
└──────┴──────┘
```

### 3.3 合理使用各向异性过滤

```javascript
// ✅ 适当开启（不需要太高）
texture.anisotropy = renderer.capabilities.getMaxAnisotropy()

// 或者根据场景需要手动设置
texture.anisotropy = 4  // 1-16 之间，值越大越清晰但越耗性能
```

---

## 四、材质优化

### 4.1 选择合适的材质

```
性能排序（从高到低）：

MeshBasicMaterial    >  MeshLambertMaterial  >  MeshPhongMaterial  >  MeshStandardMaterial  >  MeshPhysicalMaterial
   无光照计算              漫反射+环境光           漫反射+高光          PBR 完整光照              PBR+高级效果
   最快                   较快                  中等               较慢                    最慢
```

**原则**：能用简单的就不用复杂的。

```javascript
// ❌ 远处的建筑不需要 PBR
const building = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
  roughness: 0.3,
  metalness: 0.8,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
}))

// ✅ 远处物体用 Lambert 就够了
const building = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
  color: 0x888888,
}))

// ✅ 背景物体甚至可以用 Basic（不受光照影响）
const background = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
  color: 0x333333,
}))
```

### 4.2 共享材质

```javascript
// ❌ 每个物体创建新材质（浪费内存）
for (let i = 0; i < 100; i++) {
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
  const mesh = new THREE.Mesh(geometry, material)
}

// ✅ 共享同一个材质
const sharedMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
for (let i = 0; i < 100; i++) {
  const mesh = new THREE.Mesh(geometry, sharedMaterial)
}
```

---

## 五、实例化渲染（InstancedMesh）

**当你需要渲染大量相同几何体时，InstancedMesh 是终极武器。**

```javascript
// ❌ 1000 个立方体 = 1000 个 Mesh = 1000 次 Draw Call
for (let i = 0; i < 1000; i++) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(Math.random() * 100, 0, Math.random() * 100)
  scene.add(mesh)
}

// ✅ InstancedMesh = 1 次 Draw Call
const count = 1000
const instancedMesh = new THREE.InstancedMesh(geometry, material, count)

const dummy = new THREE.Object3D()
for (let i = 0; i < count; i++) {
  dummy.position.set(Math.random() * 100, 0, Math.random() * 100)
  dummy.rotation.y = Math.random() * Math.PI
  dummy.updateMatrix()
  instancedMesh.setMatrixAt(i, dummy.matrix)
}

instancedMesh.instanceMatrix.needsUpdate = true
scene.add(instancedMesh)
```

**性能对比**：

| 方案 | Draw Calls | FPS（1000个物体） |
|------|-----------|-----------------|
| 1000 个独立 Mesh | 1000 | ~15 fps |
| InstancedMesh | 1 | ~60 fps |

> **适用场景**：树木、建筑群、粒子系统、大量重复物体。

---

## 六、LOD（Level of Detail）

**远处的东西不需要那么精细。**

LOD 根据物体与相机的距离，自动切换不同精度的模型：

```javascript
const lod = new THREE.LOD()

// 创建 3 个精度等级
const highGeo = new THREE.SphereGeometry(1, 32, 32)    // 近处：高精度
const midGeo  = new THREE.SphereGeometry(1, 16, 16)    // 中距离：中精度
const lowGeo  = new THREE.SphereGeometry(1, 8, 8)      // 远处：低精度

lod.addLevel(new THREE.Mesh(highGeo, material), 0)     // 0-20 距离用高精度
lod.addLevel(new THREE.Mesh(midGeo, material), 20)     // 20-50 距离用中精度
lod.addLevel(new THREE.Mesh(lowGeo, material), 50)     // 50+ 距离用低精度

scene.add(lod)
```

---

## 七、按需渲染

### 7.1 不可见时不渲染

```javascript
// ✅ 使用 Frustum Culling（Three.js 默认开启）
mesh.frustumCulled = true  // 默认值，自动跳过视锥外的物体

// ✅ 对于大范围场景，可以手动判断
const distance = camera.position.distanceTo(object.position)
if (distance > visibleRange) {
  object.visible = false
} else {
  object.visible = true
}
```

### 7.2 控制渲染频率

```javascript
// 不是所有场景都需要 60fps
const TARGET_FPS = 30
const frameInterval = 1000 / TARGET_FPS
let lastFrameTime = 0

function animate(currentTime) {
  requestAnimationFrame(animate)

  const elapsed = currentTime - lastFrameTime
  if (elapsed < frameInterval) return

  lastFrameTime = currentTime - (elapsed % frameInterval)

  // 更新和渲染
  update()
  renderer.render(scene, camera)
}
```

### 7.3 页面不可见时暂停

```javascript
// 浏览器标签页不可见时自动暂停
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId)
  } else {
    animate()
  }
})
```

---

## 八、灯光优化

### 8.1 减少灯光数量

```javascript
// ❌ 10 个点光源 = 10 次光照计算 × 每个像素
// 这会让 GPU 爆炸

// ✅ 合理控制灯光数量
// 1 个方向光 + 1 个环境光 + 必要时的 1-2 个点光源
const dirLight = new THREE.DirectionalLight(0xffffff, 1)
const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
scene.add(dirLight, ambientLight)
```

### 8.2 使用光照贴图（Lightmap）

对于静态场景，把光照信息"烘焙"到纹理中，运行时不需要计算光照：

```javascript
// 使用 Blender 或其他 3D 软件烘焙光照贴图
// 运行时使用 MeshBasicMaterial + 光照贴图
const material = new THREE.MeshBasicMaterial({
  map: colorTexture,
  lightMap: bakedLightMap,
})
```

**效果**：场景看起来有真实光照，但运行时零光照计算。

---

## 九、着色器优化

如果你写了自定义着色器，注意：

1. **减少 `discard` 的使用**：会导致 GPU 分支
2. **避免在片段着色器中做复杂计算**：尽量放到顶点着色器
3. **使用 `precision mediump float`**：移动端不需要高精度
4. **减少纹理采样次数**：每次采样都有开销

---

## 十、移动端特别优化

移动端性能差距巨大，需要额外注意：

| 优化项 | 推荐值 |
|--------|--------|
| 最大分辨率 | `window.devicePixelRatio` 限制为 2 |
| 三角面总数 | < 50 万 |
| 纹理最大尺寸 | 1024×1024 |
| Draw Calls | < 50 |
| 同时灯光数 | ≤ 3 |

```javascript
// 移动端分辨率限制
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// 检测移动端
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
if (isMobile) {
  // 降低模型精度、减少粒子数、关闭阴影等
}
```

---

## 十一、性能优化清单

做完优化后，对照这张清单检查一遍：

- [ ] 几何体面数是否合理？
- [ ] 是否合并了静态几何体？
- [ ] 纹理是否压缩？尺寸是否合适？
- [ ] 是否使用了纹理图集？
- [ ] 材质是否选择了最简单的够用的？
- [ ] 大量重复物体是否用了 InstancedMesh？
- [ ] 是否实现了 LOD？
- [ ] 页面不可见时是否暂停了渲染？
- [ ] 灯光数量是否控制在合理范围？
- [ ] 是否限制了移动端的分辨率？
- [ ] `frustumCulled` 是否开启？
- [ ] 内存泄漏是否修复？（组件卸载时是否清理）

---

**总结一句话**：Three.js 性能优化的核心就是 —— **减少 GPU 的工作量**。更少的顶点、更少的 Draw Call、更少的纹理、更少的光照计算 = 更高的帧率。

---

**关注「有头发的帅哥程序员」**，继续学习 Three.js 系列 💻

你的 3D 项目遇到过什么性能问题？**评论区聊聊你的优化经验** 👇

觉得有用？**收藏+转发**，帮更多开发者告别卡顿 🚀
