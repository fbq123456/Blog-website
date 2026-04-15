---
title: "Three.js 深入解析：Particles（粒子系统）"
description: "全面解析 Three.js 粒子系统的核心原理与实战技巧，从 Points/BufferGeometry/PointsMaterial 基础到 GPU 粒子优化、着色器粒子特效，助你打造震撼的粒子动画效果。"
pubDate: "2026-04-28"
tags: ["Three.js", "3D", "WebGL", "前端", "JavaScript"]
---

# Three.js 深入解析：Particles（粒子系统）

> 系列第十篇 · 粒子系统是 Three.js 中最具视觉冲击力的技术之一——星空、烟雾、爆炸、魔法特效，背后都是成千上万个粒子在跳舞。本文带你从零掌握粒子系统的核心原理与高性能实践。

---

## 一、粒子系统是什么？

粒子系统（Particle System）是用大量细小的点或图像来模拟自然现象的一种渲染技术。在 Three.js 中，粒子系统的核心由三部分组成：

| 组件 | 类 | 职责 |
|------|-----|------|
| 几何体 | `BufferGeometry` | 存储粒子位置、颜色等顶点属性 |
| 材质 | `PointsMaterial` | 控制粒子的外观（大小、颜色、贴图） |
| 渲染对象 | `Points` | 将几何体与材质组合并添加到场景 |

```js
import * as THREE from 'three'

const geometry = new THREE.BufferGeometry()
const material = new THREE.PointsMaterial({ size: 0.05, color: 0x00ffff })
const points = new THREE.Points(geometry, material)
scene.add(points)
```

---

## 二、BufferGeometry 存储粒子数据

粒子的所有属性（位置、颜色、大小）都通过 `BufferAttribute` 写入 `BufferGeometry`。

### 2.1 创建随机粒子

```js
const COUNT = 5000

// 每个粒子 3 个分量 (x, y, z)
const positions = new Float32Array(COUNT * 3)

for (let i = 0; i < COUNT * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 20  // 范围 -10 ~ 10
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
```

### 2.2 添加逐顶点颜色

```js
const colors = new Float32Array(COUNT * 3)

for (let i = 0; i < COUNT * 3; i++) {
  colors[i] = Math.random()  // R/G/B 随机值 0~1
}

geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

// 材质需开启 vertexColors
const material = new THREE.PointsMaterial({
  size: 0.05,
  vertexColors: true,
})
```

> **性能提示**：`BufferGeometry` 比已废弃的 `Geometry` 快得多，始终使用 `BufferGeometry`。

---

## 三、PointsMaterial 详解

`PointsMaterial` 是粒子专属材质，控制粒子的一切外观参数。

```js
const material = new THREE.PointsMaterial({
  size: 0.1,               // 粒子大小（世界单位）
  sizeAttenuation: true,   // 远小近大（透视衰减）
  color: new THREE.Color('#ff6b35'),
  map: particleTexture,    // 粒子贴图
  transparent: true,
  alphaMap: alphaTexture,  // alpha 贴图（控制形状）
  depthWrite: false,       // 关闭深度写入，避免粒子间遮挡穿帮
  blending: THREE.AdditiveBlending,  // 加法混合：叠加发光效果
  vertexColors: false,     // 是否使用顶点颜色
})
```

### 关键参数说明

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `sizeAttenuation` | 粒子大小是否随距离衰减 | `true`（透视感更真实） |
| `depthWrite` | 写入深度缓冲区 | `false`（避免粒子互相遮挡产生黑块） |
| `blending` | 混合模式 | `AdditiveBlending`（发光/火焰效果） |
| `alphaMap` | 透明度贴图 | 用于圆形/星形等自定义形状 |

---

## 四、粒子贴图：从方块到圆点

默认粒子是正方形，需要用 `alphaMap` 或 `map` 实现圆形粒子。

### 4.1 使用 Canvas 动态生成圆形贴图

```js
function createCircleTexture(size = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // 径向渐变，中心亮边缘透明
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  )
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  return new THREE.CanvasTexture(canvas)
}

const material = new THREE.PointsMaterial({
  size: 0.15,
  map: createCircleTexture(),
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
})
```

### 4.2 加载外部粒子贴图

```js
const textureLoader = new THREE.TextureLoader()
const starTexture = textureLoader.load('/textures/star.png')

material.map = starTexture
material.alphaMap = starTexture
material.transparent = true
material.depthWrite = false
```

---

## 五、粒子动画

### 5.1 整体旋转动画

```js
// 在 tick 函数中旋转整个粒子系统
function animate() {
  requestAnimationFrame(animate)

  points.rotation.y += 0.0005
  points.rotation.x += 0.0002

  renderer.render(scene, camera)
}
```

### 5.2 逐粒子动画（波浪效果）

通过直接修改 `BufferAttribute` 数据实现逐粒子控制：

```js
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const elapsed = clock.getElapsedTime()

  const posArray = geometry.attributes.position.array

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3
    const x = posArray[i3]  // 取出 x 坐标

    // 让 y 坐标随 x 和时间产生正弦波动
    posArray[i3 + 1] = Math.sin(elapsed + x)
  }

  // 必须通知 Three.js 该属性已更新
  geometry.attributes.position.needsUpdate = true

  renderer.render(scene, camera)
}
```

> ⚠️ **注意**：频繁更新大量粒子的 `BufferAttribute` 会造成 CPU-GPU 数据传输瓶颈。粒子数量超过 10 万时，建议使用 **着色器（Shader）驱动动画**。

---

## 六、星空特效实战

这是最常见的粒子应用场景，打造一个沉浸式星空背景：

```js
function createStarfield(count = 8000) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  const colorPalette = [
    new THREE.Color('#ffffff'),
    new THREE.Color('#aaccff'),
    new THREE.Color('#ffeedd'),
    new THREE.Color('#ccddff'),
  ]

  for (let i = 0; i < count; i++) {
    const i3 = i * 3

    // 球壳分布：随机半径 + 球坐标系
    const radius = 50 + Math.random() * 50
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    positions[i3]     = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = radius * Math.cos(phi)

    // 随机星色
    const c = colorPalette[Math.floor(Math.random() * colorPalette.length)]
    colors[i3]     = c.r
    colors[i3 + 1] = c.g
    colors[i3 + 2] = c.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.12,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  return new THREE.Points(geometry, material)
}

scene.add(createStarfield())
```

---

## 七、粒子爆炸特效

模拟粒子从中心爆炸向外扩散的效果：

```js
class ParticleExplosion {
  constructor(scene, count = 500) {
    this.count = count
    this.geometry = new THREE.BufferGeometry()
    this.velocities = []
    this.active = false

    const positions = new Float32Array(count * 3)
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    this.material = new THREE.PointsMaterial({
      size: 0.08,
      color: new THREE.Color('#ff4400'),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.points = new THREE.Points(this.geometry, this.material)
    scene.add(this.points)
  }

  explode(origin = new THREE.Vector3()) {
    const positions = this.geometry.attributes.position.array
    this.velocities = []
    this.active = true
    this.age = 0

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3
      positions[i3]     = origin.x
      positions[i3 + 1] = origin.y
      positions[i3 + 2] = origin.z

      // 随机速度方向
      this.velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
      ))
    }

    this.geometry.attributes.position.needsUpdate = true
  }

  update(delta) {
    if (!this.active) return

    this.age += delta
    const positions = this.geometry.attributes.position.array

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3
      const vel = this.velocities[i]

      // 重力拖拽
      vel.y -= 0.005

      positions[i3]     += vel.x
      positions[i3 + 1] += vel.y
      positions[i3 + 2] += vel.z
    }

    // 粒子随时间淡出
    this.material.opacity = Math.max(0, 1 - this.age / 3)
    if (this.material.opacity <= 0) this.active = false

    this.geometry.attributes.position.needsUpdate = true
  }
}
```

---

## 八、着色器粒子：突破性能瓶颈

当粒子数量达到 **百万级** 时，必须将动画逻辑搬到 GPU 的着色器中执行。

### 8.1 基本着色器粒子

```js
// 顶点着色器 vertex.glsl
attribute float aSize;      // 每个粒子的自定义大小
attribute vec3  aColor;     // 每个粒子的自定义颜色
attribute float aPhase;     // 粒子波动相位偏移

uniform float uTime;
uniform float uPixelRatio;

varying vec3 vColor;

void main() {
  vColor = aColor;

  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  // GPU 驱动的波浪动画
  modelPosition.y += sin(uTime + aPhase) * 0.5;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  // 粒子大小随距离衰减
  gl_PointSize = aSize * uPixelRatio * (100.0 / -viewPosition.z);
}
```

```glsl
// 片元着色器 fragment.glsl
varying vec3 vColor;

void main() {
  // 将粒子从方形渲染为圆形
  float dist = distance(gl_PointCoord, vec2(0.5));
  if (dist > 0.5) discard;

  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  gl_FragColor = vec4(vColor, alpha);
}
```

```js
// JavaScript 端
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexGlsl,
  fragmentShader: fragmentGlsl,
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
})

// 动画循环中更新 uniform
function animate() {
  shaderMaterial.uniforms.uTime.value = clock.getElapsedTime()
}
```

### 8.2 内联着色器写法（无需外部文件）

```js
const vertexShader = /* glsl */`
  uniform float uTime;
  attribute float aPhase;
  varying vec3 vColor;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    mvPosition.y += sin(uTime * 2.0 + aPhase) * 0.3;
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 3.0 * (300.0 / -mvPosition.z);
  }
`

const fragmentShader = /* glsl */`
  varying vec3 vColor;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, 1.0 - d * 2.0);
  }
`
```

---

## 九、粒子性能优化策略

### 9.1 减少 Draw Call

多个粒子系统合并为一个：

```js
// ❌ 低效：100 个独立 Points 对象
for (let i = 0; i < 100; i++) {
  scene.add(new THREE.Points(geo, mat))
}

// ✅ 高效：一个大 BufferGeometry
const mergedGeo = new THREE.BufferGeometry()
// 合并所有粒子位置到同一个 Float32Array
mergedGeo.setAttribute('position', new THREE.BufferAttribute(allPositions, 3))
scene.add(new THREE.Points(mergedGeo, material))
```

### 9.2 视锥体剔除

```js
// 对静态粒子系统开启剔除
points.frustumCulled = true

// 对全屏粒子（如星空）关闭剔除避免闪烁
stars.frustumCulled = false
```

### 9.3 合理控制粒子数量

| 粒子数量 | 推荐方案 |
|---------|---------|
| < 10,000 | `PointsMaterial` + CPU 动画 |
| 10,000 ~ 100,000 | `PointsMaterial` + 极少 CPU 更新 |
| 100,000 ~ 1,000,000 | `ShaderMaterial` + GPU 动画 |
| > 1,000,000 | GPU Instancing / Compute Shader |

### 9.4 避免每帧重建

```js
// ❌ 每帧创建新 BufferAttribute（极度浪费）
geometry.setAttribute('position', new THREE.BufferAttribute(newArray, 3))

// ✅ 复用 Float32Array，只标记更新
const posArray = geometry.attributes.position.array
// ... 修改 posArray 中的值 ...
geometry.attributes.position.needsUpdate = true
```

---

## 十、粒子系统完整示例：银河生成器

```js
function createGalaxy(params = {}) {
  const {
    count       = 80000,
    size        = 0.01,
    radius      = 5,
    branches    = 3,
    spin        = 1,
    randomness  = 0.5,
    randomPower = 3,
    insideColor = '#ff6030',
    outsideColor= '#1b3984',
  } = params

  // 清理旧粒子
  if (window._galaxyPoints) {
    window._galaxyPoints.geometry.dispose()
    window._galaxyPoints.material.dispose()
    scene.remove(window._galaxyPoints)
  }

  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors    = new Float32Array(count * 3)

  const colorInside  = new THREE.Color(insideColor)
  const colorOutside = new THREE.Color(outsideColor)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3

    // 径向距离
    const r = Math.random() * radius
    // 螺旋偏转角
    const spinAngle = r * spin
    // 分支角
    const branchAngle = ((i % branches) / branches) * Math.PI * 2

    // 散射偏移（幂函数使粒子向内聚集）
    const rand = () =>
      Math.pow(Math.random(), randomPower) * (Math.random() < 0.5 ? 1 : -1) * randomness

    const rx = rand(), ry = rand(), rz = rand()

    positions[i3]     = Math.cos(branchAngle + spinAngle) * r + rx
    positions[i3 + 1] = ry * 0.3
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + rz

    // 颜色混合：内红外蓝
    const mixedColor = colorInside.clone().lerp(colorOutside, r / radius)
    colors[i3]     = mixedColor.r
    colors[i3 + 1] = mixedColor.g
    colors[i3 + 2] = mixedColor.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  })

  window._galaxyPoints = new THREE.Points(geometry, material)
  scene.add(window._galaxyPoints)
  return window._galaxyPoints
}

// 使用
createGalaxy({
  count: 100000,
  branches: 5,
  spin: 1.2,
  insideColor: '#ff6030',
  outsideColor: '#1b3984',
})
```

---

## 十一、粒子系统常见问题排查

### Q1：粒子之间出现黑色方块/遮挡

**原因**：深度写入导致粒子与粒子之间互相遮挡  
**解决**：

```js
material.depthWrite = false
```

### Q2：粒子颜色叠加不对，偏暗

**原因**：默认混合模式为 `NormalBlending`，粒子叠加相互遮盖  
**解决**：

```js
material.blending = THREE.AdditiveBlending
```

### Q3：修改位置后粒子没有移动

**原因**：忘记通知 Three.js 更新缓冲区  
**解决**：

```js
geometry.attributes.position.needsUpdate = true
```

### Q4：粒子闪烁或突然消失

**原因**：视锥体剔除误判（粒子中心出视锥但粒子体仍在视野内）  
**解决**：

```js
points.frustumCulled = false
```

### Q5：大量粒子帧率骤降

**原因**：CPU 每帧修改 `BufferAttribute` 造成带宽瓶颈  
**解决**：改用 `ShaderMaterial`，把动画逻辑搬到 GPU 顶点着色器

---

## 十二、系列总结与展望

至此，Three.js 深入解析系列已覆盖核心十大模块：

| 篇章 | 主题 |
|------|------|
| 第一篇 | Scene / Camera / Renderer 三要素 |
| 第二篇 | Scene 深度解析 |
| 第三篇 | Camera 深度解析 |
| 第四篇 | Renderer 深度解析 |
| 第五篇 | Geometry 几何体 |
| 第六篇 | Material 材质 |
| 第七篇 | Light 光照系统 |
| 第八篇 | Animation 动画系统 |
| 第九篇 | Texture 纹理系统 |
| **第十篇** | **Particles 粒子系统** |

粒子系统是 Three.js 最具表现力的功能之一。掌握了今天的内容，你已经可以实现：

- ✅ 任意数量的随机粒子场
- ✅ 圆形/图案粒子贴图
- ✅ CPU 驱动的波浪/爆炸动画
- ✅ 银河生成器等复杂粒子效果
- ✅ ShaderMaterial 着色器粒子（百万级）

**下一步探索方向**：
- **Raycaster**：射线检测与鼠标交互
- **Physics**：物理引擎集成（Cannon.js / Rapier）
- **Post-processing**：后处理特效（Bloom、DepthOfField）

---

*如果这篇文章对你有帮助，欢迎关注公众号「有头发的帅哥程序员」，每周持续输出 Three.js 干货！🚀*
