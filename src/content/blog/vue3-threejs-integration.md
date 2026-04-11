---
title: 'Vue3 + Three.js 实战：打造一个炫酷的 3D 粒子星空系统'
description: '从零开始，在 Vue3 项目中集成 Three.js，实现一个交互式的 3D 粒子星空效果。包含完整代码、性能优化和最佳实践。'
pubDate: 2026-04-10
tags:
  - Vue
  - Three.js
  - 3D
  - WebGL
  - 实战
---

> 本文是 Vue3 与 Three.js 集成的实战教程，我们将从零搭建一个 Vue3 项目，实现一个**可交互的 3D 粒子星空系统**。文章包含完整代码、性能优化技巧和工程化最佳实践。

---

## 最终效果预览

先看一下我们要实现的效果：

- 🌌 数千个粒子构成的动态星空
- ✨ 鼠标移动时粒子产生涟漪效果
- 🎨 渐变色背景和发光效果
- ⚡ 60fps 流畅运行

![效果预览](https://via.placeholder.com/800x400/0a0a1a/00d4ff?text=3D+Particle+Starfield+Preview)

---

## 一、项目初始化

### 1.1 创建 Vue3 项目

使用 Vite 快速创建项目：

```bash
npm create vite@latest particle-starfield -- --template vue-ts
cd particle-starfield
npm install
```

### 1.2 安装 Three.js 及类型定义

```bash
npm install three
npm install -D @types/three
```

### 1.3 项目结构

```
src/
├── components/
│   └── ParticleStarfield.vue    # 粒子星空组件
├── composables/
│   └── useThree.ts              # Three.js 封装组合式函数
├── utils/
│   └── starfield.ts             # 星空场景逻辑
├── App.vue
└── main.ts
```

---

## 二、核心实现

### 2.1 封装 useThree 组合式函数

在 Vue3 中使用 Three.js，最佳实践是将其封装成可复用的组合式函数：

```typescript
// src/composables/useThree.ts
import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import * as THREE from 'three'

interface UseThreeOptions {
  antialias?: boolean
  alpha?: boolean
  pixelRatio?: number
}

export function useThree(containerRef: Ref<HTMLElement | null>, options: UseThreeOptions = {}) {
  const { antialias = true, alpha = true, pixelRatio = 2 } = options

  // ✅ 用普通变量保存 Three.js 实例，避免 ref 的响应式代理干扰 Three.js 内部对象
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let animationId = 0

  // 暴露给外部的只读 ref（仅用于模板绑定，不直接操作）
  const sceneRef = ref<THREE.Scene | null>(null)
  const cameraRef = ref<THREE.PerspectiveCamera | null>(null)

  // 响应式调整 —— 需要在 init 前声明，供 addEventListener 引用同一函数
  const handleResize = () => {
    if (!containerRef.value || !camera || !renderer) return

    const width = containerRef.value.clientWidth
    const height = containerRef.value.clientHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  // 初始化 Three.js 环境
  const init = () => {
    if (!containerRef.value) return

    const container = containerRef.value
    const width = container.clientWidth
    const height = container.clientHeight

    // 创建场景
    scene = new THREE.Scene()
    sceneRef.value = scene

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 50
    cameraRef.value = camera

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias, alpha })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio))

    // 添加到 DOM
    container.appendChild(renderer.domElement)

    // 监听窗口变化
    window.addEventListener('resize', handleResize)
  }

  // 渲染循环 —— 直接使用局部变量，不经过 .value 访问，避免每帧触发响应式追踪
  const startRender = (callback?: () => void) => {
    if (!renderer || !scene || !camera) return

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      callback?.()
      renderer!.render(scene!, camera!)
    }
    animate()
  }

  // 清理资源
  const dispose = () => {
    window.removeEventListener('resize', handleResize)
    cancelAnimationFrame(animationId)

    if (renderer) {
      // ✅ 先取消挂载，再 dispose，顺序不能颠倒
      if (containerRef.value && renderer.domElement.parentNode === containerRef.value) {
        containerRef.value.removeChild(renderer.domElement)
      }
      renderer.dispose()
      renderer = null
    }

    // 清理场景中的对象（Points / Mesh 都要处理）
    scene?.traverse(object => {
      if (object instanceof THREE.Points || object instanceof THREE.Mesh) {
        object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach(m => m.dispose())
      }
    })

    scene = null
    camera = null
    sceneRef.value = null
    cameraRef.value = null
  }

  onMounted(init)
  onUnmounted(dispose)

  return {
    // ✅ 返回局部变量的 getter，确保使用方拿到的是实际实例
    getScene: () => scene,
    getCamera: () => camera,
    getRenderer: () => renderer,
    sceneRef,
    cameraRef,
    startRender,
    dispose
  }
}
```

### 2.2 粒子星空场景逻辑

```typescript
// src/utils/starfield.ts
import * as THREE from 'three'

export interface StarfieldOptions {
  particleCount?: number
  particleSize?: number
  color1?: string
  color2?: string
  mouseRadius?: number
  mouseForce?: number
}

export class Starfield {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private geometry: THREE.BufferGeometry
  private material: THREE.PointsMaterial
  private particles: THREE.Points
  private originalPositions: Float32Array
  private velocities: Float32Array
  private mouse: THREE.Vector2
  private raycaster: THREE.Raycaster
  private mouseTarget: THREE.Vector3
  private options: Required<StarfieldOptions>

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, options: StarfieldOptions = {}) {
    this.scene = scene
    this.camera = camera
    this.options = {
      particleCount: 3000,
      particleSize: 0.5,
      color1: '#00d4ff',
      color2: '#ff00a0',
      mouseRadius: 25,
      mouseForce: 2.0,
      ...options
    }

    this.mouse = new THREE.Vector2(9999, 9999)
    this.raycaster = new THREE.Raycaster()
    this.mouseTarget = new THREE.Vector3(9999, 9999, -80)

    this.init()
  }

  private createCircleTexture(): THREE.CanvasTexture {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // 径向渐变：中心白色不透明 → 边缘完全透明，形成发光圆点效果
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)')
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    return new THREE.CanvasTexture(canvas)
  }

  private init() {
    const { particleCount } = this.options

    this.geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    this.originalPositions = new Float32Array(particleCount * 3)
    this.velocities = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    const color1 = new THREE.Color(this.options.color1)
    const color2 = new THREE.Color(this.options.color2)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      // 随机星空分布：球壳内随机
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 80 + Math.random() * 50

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = -Math.abs(radius * Math.cos(phi)) - 10

      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z

      this.originalPositions[i3] = x
      this.originalPositions[i3 + 1] = y
      this.originalPositions[i3 + 2] = z

      this.velocities[i3] = (Math.random() - 0.5) * 0.02
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.02
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.02

      // 多样化颜色：恒星类型模拟
      const colorType = Math.random()
      let finalColor: THREE.Color

      if (colorType < 0.15) {
        // 15% 蓝巨星 (极热)
        finalColor = new THREE.Color('#aaddff')
      } else if (colorType < 0.35) {
        // 20% 蓝白星 (热)
        finalColor = new THREE.Color('#88ccff')
      } else if (colorType < 0.55) {
        // 20% 白色 (中等)
        finalColor = new THREE.Color('#ffffff')
      } else if (colorType < 0.75) {
        // 20% 黄白色 (类似太阳)
        finalColor = new THREE.Color('#ffeebb')
      } else if (colorType < 0.9) {
        // 15% 橙色 (较冷)
        finalColor = new THREE.Color('#ffcc88')
      } else {
        // 10% 红色 (极冷/红巨星)
        finalColor = new THREE.Color('#ff6644')
      }

      // 随机亮度变化
      const brightness = 0.7 + Math.random() * 0.3
      finalColor.multiplyScalar(brightness)

      colors[i3] = finalColor.r
      colors[i3 + 1] = finalColor.g
      colors[i3 + 2] = finalColor.b
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    this.material = new THREE.PointsMaterial({
      size: 1.5,
      map: this.createCircleTexture(),
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      alphaTest: 0.001
    })

    this.particles = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.particles)
  }

  updateMouse(normalizedX: number, normalizedY: number) {
    this.mouse.set(normalizedX, normalizedY)
  }

  update() {
    const { particleCount, mouseRadius, mouseForce } = this.options
    const posAttr = this.geometry.attributes.position
    const positions = posAttr.array as Float32Array

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const ray = this.raycaster.ray

    const targetZ = -80
    const t = (targetZ - ray.origin.z) / ray.direction.z
    if (t > 0) {
      this.mouseTarget.copy(ray.origin).add(ray.direction.clone().multiplyScalar(t))
    }

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      const curX = positions[i3]
      const curY = positions[i3 + 1]
      const curZ = positions[i3 + 2]

      const origX = this.originalPositions[i3]
      const origY = this.originalPositions[i3 + 1]
      const origZ = this.originalPositions[i3 + 2]

      // 微扰：在原始位置附近用 sin/cos 产生"呼吸"效果，不做无限累加
      const time = Date.now() * 0.001
      const breathX = Math.sin(time + i * 0.1) * 0.05
      const breathY = Math.cos(time + i * 0.13) * 0.05

      const dx = curX - this.mouseTarget.x
      const dy = curY - this.mouseTarget.y
      const distXY = Math.sqrt(dx * dx + dy * dy)

      let repelX = 0,
        repelY = 0,
        repelZ = 0
      if (distXY < mouseRadius && distXY > 0.001) {
        const force = (1 - distXY / mouseRadius) * mouseForce
        repelX = (dx / distXY) * force
        repelY = (dy / distXY) * force
        repelZ = (curZ - this.mouseTarget.z > 0 ? 1 : -1) * force * 0.3
      }

      const returnForce = 0.02
      const newX = curX + (origX - curX) * returnForce + breathX + repelX
      const newY = curY + (origY - curY) * returnForce + breathY + repelY
      const newZ = curZ + (origZ - curZ) * returnForce + repelZ

      positions[i3] = newX
      positions[i3 + 1] = newY
      positions[i3 + 2] = newZ
    }

    posAttr.needsUpdate = true
  }

  dispose() {
    this.geometry.dispose()
    this.material.map?.dispose()
    this.material.dispose()
    this.scene.remove(this.particles)
  }
}
```

### 2.3 Vue 组件实现

```vue
<!-- src/components/ParticleStarfield.vue -->
<template>
  <div ref="containerRef" class="starfield-container">
    <div class="overlay">
      <h1 class="title">3D 粒子星空</h1>
      <p class="subtitle">移动鼠标与粒子互动</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useThree } from '../composables/useThree'
import { Starfield } from '../utils/starfield'

const containerRef = ref<HTMLElement | null>(null)
let starfield: Starfield | null = null

const { getScene, getCamera, startRender } = useThree(containerRef, {
  antialias: true,
  alpha: true,
  pixelRatio: 2
})

// 鼠标移动处理
const handleMouseMove = (event: MouseEvent) => {
  if (!containerRef.value || !starfield) return

  const rect = containerRef.value.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  starfield.updateMouse(x, y)
}

// 触摸支持
const handleTouchMove = (event: TouchEvent) => {
  if (!containerRef.value || !starfield || event.touches.length === 0) return
  event.preventDefault() // ✅ 阻止页面滚动

  const rect = containerRef.value.getBoundingClientRect()
  const touch = event.touches[0]
  const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1

  starfield.updateMouse(x, y)
}

// ✅ useThree 的 onMounted(init) 和本组件的 onMounted 都在同一 tick 排队执行
//    Vue 保证同一组件内 onMounted 按注册顺序执行，
//    但 useThree 是在 setup() 中调用的（早于本 onMounted 注册），
//    所以 useThree 的 init 一定先执行，getScene()/getCamera() 在此处已有值。
onMounted(() => {
  const scene = getScene()
  const camera = getCamera()

  if (!scene || !camera) {
    console.error('[ParticleStarfield] scene or camera is null after init')
    return
  }

  starfield = new Starfield(scene, camera, {
    particleCount: 3000,
    particleSize: 0.8,
    color1: '#00d4ff',
    color2: '#ff00a0',
    mouseRadius: 25,
    mouseForce: 2.0
  })

  // 启动渲染循环
  startRender(() => {
    starfield?.update()
  })

  // 添加事件监听
  const el = containerRef.value
  if (el) {
    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
  }
})

onUnmounted(() => {
  const el = containerRef.value
  if (el) {
    el.removeEventListener('mousemove', handleMouseMove)
    el.removeEventListener('touchmove', handleTouchMove)
  }
  starfield?.dispose()
  starfield = null
})
</script>

<style scoped>
.starfield-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d1a 100%);
}

.starfield-container :deep(canvas) {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
}

.overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  z-index: 10;
}

.title {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #ff00a0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 2px;
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  .subtitle {
    font-size: 1rem;
  }
}
</style>
```

### 2.4 App.vue 入口

```vue
<!-- src/App.vue -->
<template>
  <ParticleStarfield />
</template>

<script setup lang="ts">
import ParticleStarfield from './components/ParticleStarfield.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}
</style>
```

---

## 三、性能优化技巧

### 3.1 粒子数量控制

根据设备性能动态调整粒子数量：

```typescript
const getParticleCount = () => {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)
  const isLowPower = navigator.hardwareConcurrency <= 4

  if (isMobile || isLowPower) return 1500
  return 3000
}

const starfield = new Starfield(scene, {
  particleCount: getParticleCount()
  // ...
})
```

### 3.2 使用 requestAnimationFrame 节流

```typescript
let lastTime = 0
const targetFPS = 60
const frameInterval = 1000 / targetFPS

const animate = (currentTime: number) => {
  animationId = requestAnimationFrame(animate)

  const deltaTime = currentTime - lastTime
  if (deltaTime < frameInterval) return

  lastTime = currentTime - (deltaTime % frameInterval)

  // 更新和渲染
  starfield.update()
  renderer.render(scene, camera)
}
```

### 3.3 离屏时暂停渲染

```typescript
// 使用 Page Visibility API
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId)
  } else {
    animate()
  }
})
```

---

## 四、扩展思路

基于这个基础，你可以进一步扩展：

| 功能           | 实现思路                                           |
| -------------- | -------------------------------------------------- |
| **粒子连线**   | 计算粒子间距离，小于阈值时绘制线条（类似星座效果） |
| **音频可视化** | 结合 Web Audio API，让粒子随音乐律动               |
| **文字粒子**   | 用 Canvas 绘制文字，采样像素位置生成粒子           |
| **VR 支持**    | 使用 WebXR API，添加 VR 渲染支持                   |
| **后处理效果** | 引入 EffectComposer，添加 Bloom 辉光效果           |

---

## 五、常见问题

### Q1: 粒子数量多了很卡怎么办？

- 减少 `particleCount` 到 1000-1500
- 关闭 `antialias`
- 使用 `gl_PointSize` 替代 `PointsMaterial` 的 `size`
- 考虑使用 `InstancedMesh` 或 GPU 粒子系统

### Q2: 移动端显示不正常？

- 确保设置了正确的 viewport meta 标签
- 触摸事件使用 `touchmove` 而非 `mousemove`
- 降低粒子数量和渲染分辨率

### Q3: 如何添加 Bloom 辉光效果？

需要引入 Three.js 的后处理模块（已包含在 `three` 包内，无需单独安装）：

```typescript
// ✅ 正确写法：从 three/addons 引入（three r152+ 推荐路径）
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

// 替换渲染循环中的 renderer.render(scene, camera)
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
composer.addPass(
  new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, // strength  辉光强度
    0.4, // radius    辉光扩散半径
    0.85 // threshold 亮度阈值，超过才发光
  )
)

// 渲染循环改为：
// composer.render();
```

---

## 小结

本文我们实现了一个完整的 Vue3 + Three.js 项目，涵盖了：

- ✅ Vue3 Composition API 与 Three.js 的集成模式
- ✅ 可复用的 `useThree` 组合式函数
- ✅ 面向对象的粒子系统封装
- ✅ 鼠标/触摸交互实现
- ✅ 性能优化和响应式处理

这个模式可以应用到任何 Three.js 项目中，是 Vue3 与 3D 图形结合的最佳实践。

---
