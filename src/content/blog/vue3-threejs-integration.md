---
title: 'Vue3 + Three.js：如何在项目中集成3D效果'
description: '从零开始在 Vue3 项目中集成 Three.js，完整讲解环境搭建、组件封装、响应式绑定、性能优化等实用技巧，附实战案例代码。'
pubDate: 2026-04-08
tags:
  - Vue
  - Three.js
  - 3D
  - 前端
---

> 还在纠结 Vue3 项目怎么引入 Three.js？别慌，这篇文章手把手带你从零搭建，5分钟让你的页面拥有炫酷 3D 效果。

---

## 前言

你有没有遇到过这样的需求：

- 产品经理说：「我要在首页加个 3D 产品展示」
- 设计师发来一个炫酷的 3D 模型说：「把这个实现一下」
- 老板看了竞品网站说：「他们的 3D 地球效果不错，我们也搞一个」

如果你只会 Vue3，面对 Three.js 一脸懵，这篇文章就是为你准备的。

我会从**最基础的集成方式**讲到**生产级的组件封装**，每个步骤都有可运行的代码。

---

## 一、为什么选择 Vue3 + Three.js？

先回答一个常见问题：**为什么不直接用原生 JS？**

```
原生 JS + Three.js          Vue3 + Three.js
├── 全局变量满天飞           ├── 组件化管理，代码清晰
├── 手动管理生命周期         ├── onMounted/onUnmounted 自动管理
├── 状态同步困难             ├── ref/reactive 响应式绑定
└── 难以复用                 └── Props/Emits 组件通信
```

Vue3 的组合式 API 天然适合 Three.js 这种「创建 → 更新 → 销毁」的生命周期管理。

---

## 二、项目搭建

### 2.1 创建 Vue3 项目

```bash
# 使用 Vite 创建项目（推荐）
npm create vite@latest my-3d-app -- --template vue
cd my-3d-app
npm install
```

### 2.2 安装 Three.js

```bash
npm install three
```

> **提示**：不需要安装额外的 `three-vue` 之类的库，原生 Three.js 就够了。

### 2.3 项目结构

建议这样组织代码：

```
src/
├── components/
│   └── three/              # Three.js 相关组件
│       ├── Scene.vue       # 3D 场景容器
│       ├── Model.vue       # 3D 模型加载
│       └── OrbitControls.vue # 交互控制
├── composables/
│   └── useThree.js         # Three.js 组合式函数
└── utils/
    └── three/              # 工具函数
        └── renderer.js     # 渲染器配置
```

---

## 三、最简集成：30 秒出效果

先来个最基础的版本，让你快速看到效果：

```vue
<!-- Scene.vue -->
<template>
  <div ref="containerRef" class="three-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

const containerRef = ref(null)

// Three.js 核心对象
let scene, camera, renderer, animationId

onMounted(() => {
  init()
  animate()
})

onBeforeUnmount(() => {
  // 清理资源
  cancelAnimationFrame(animationId)
  renderer.dispose()
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) obj.material.dispose()
  })
})

function init() {
  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  // 1. 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  // 2. 创建相机
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.z = 5

  // 3. 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  // 4. 添加物体 —— 一个旋转的立方体
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  // 5. 添加灯光
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(5, 5, 5)
  scene.add(light)

  const ambientLight = new THREE.AmbientLight(0x404040)
  scene.add(ambientLight)

  // 6. 响应窗口变化
  window.addEventListener('resize', onResize)
}

function onResize() {
  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function animate() {
  animationId = requestAnimationFrame(animate)

  // 让立方体旋转
  scene.rotation.y += 0.01

  renderer.render(scene, camera)
}
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
```

就这样！一个能在 Vue3 中运行的 Three.js 场景就搞定了。

---

## 四、进阶：封装可复用的组合式函数

上面的代码能用，但还不够优雅。把 Three.js 的逻辑抽成组合式函数，才能真正发挥 Vue3 的优势。

```javascript
// composables/useThree.js
import { ref, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as THREE from 'three'

export function useThree(options = {}) {
  const containerRef = ref(null)
  const scene = shallowRef(null)
  const camera = shallowRef(null)
  const renderer = shallowRef(null)

  let animationId = null
  const callbacks = []

  // 注册动画回调
  function onAnimate(callback) {
    callbacks.push(callback)
  }

  function init() {
    const container = containerRef.value
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    // 创建场景
    const newScene = new THREE.Scene()
    if (options.background) {
      newScene.background = new THREE.Color(options.background)
    }
    scene.value = newScene

    // 创建相机
    const fov = options.fov || 75
    const near = options.near || 0.1
    const far = options.far || 1000
    const newCamera = new THREE.PerspectiveCamera(fov, width / height, near, far)
    newCamera.position.set(...(options.cameraPosition || [0, 0, 5]))
    camera.value = newCamera

    // 创建渲染器
    const newRenderer = new THREE.WebGLRenderer({
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? false,
    })
    newRenderer.setSize(width, height)
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.value = newRenderer

    container.appendChild(newRenderer.domElement)

    // 默认灯光
    if (options.defaultLights !== false) {
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
      directionalLight.position.set(5, 5, 5)
      newScene.add(directionalLight)

      const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
      newScene.add(ambientLight)
    }

    window.addEventListener('resize', onResize)
  }

  function onResize() {
    const container = containerRef.value
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    camera.value.aspect = width / height
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(width, height)
  }

  function animate() {
    animationId = requestAnimationFrame(animate)
    callbacks.forEach((cb) => cb())
    renderer.value.render(scene.value, camera.value)
  }

  function dispose() {
    cancelAnimationFrame(animationId)
    window.removeEventListener('resize', onResize)
    renderer.value.dispose()
    scene.value.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
  }

  onMounted(() => {
    init()
    animate()
  })

  onBeforeUnmount(() => {
    dispose()
  })

  return {
    containerRef,
    scene,
    camera,
    renderer,
    onAnimate,
  }
}
```

**使用方式：**

```vue
<template>
  <div ref="containerRef" class="scene"></div>
</template>

<script setup>
import { watch } from 'vue'
import { useThree } from '@/composables/useThree'

// 通过 props 控制颜色
const props = defineProps({
  color: { type: String, default: '#00ff88' },
  speed: { type: Number, default: 0.02 },
})

const { containerRef, scene, onAnimate } = useThree({
  background: '#0a0a1a',
  cameraPosition: [0, 2, 5],
})

onAnimate(() => {
  // 每帧的动画逻辑
  if (scene.value) {
    scene.value.children.forEach((child) => {
      if (child.isMesh) {
        child.rotation.x += props.speed
        child.rotation.y += props.speed * 0.5
      }
    })
  }
})

// 响应式更新颜色
watch(() => props.color, (newColor) => {
  if (scene.value) {
    const mesh = scene.value.children.find(c => c.isMesh)
    if (mesh) mesh.material.color.set(newColor)
  }
})
</script>
```

> **重点**：这里用 `shallowRef` 而不是 `ref`，因为 Three.js 对象非常庞大，深度响应式代理会导致严重的性能问题。

---

## 五、实战案例：3D 产品展示卡片

来个贴近实际业务场景的例子 —— 3D 产品展示：

```vue
<template>
  <div class="product-card">
    <div ref="containerRef" class="product-3d"></div>
    <div class="product-info">
      <h3>{{ name }}</h3>
      <p>{{ description }}</p>
      <button @click="toggleAutoRotate">
        {{ autoRotate ? '⏸ 暂停旋转' : '▶ 开始旋转' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useThree } from '@/composables/useThree'

defineProps({
  name: String,
  description: String,
  modelColor: { type: String, default: '#6366f1' },
})

const autoRotate = ref(true)

const { containerRef, scene, camera, renderer, onAnimate } = useThree({
  background: '#0f0f1a',
  cameraPosition: [3, 3, 3],
  fov: 45,
})

// 添加控制器
let controls = null

onAnimate(() => {
  if (controls) controls.update()
})
</script>

<style scoped>
.product-card {
  border-radius: 16px;
  overflow: hidden;
  background: #0f0f1a;
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);
}

.product-3d {
  width: 100%;
  height: 400px;
  cursor: grab;
}

.product-3d:active {
  cursor: grabbing;
}

.product-info {
  padding: 24px;
}

.product-info h3 {
  font-size: 1.25rem;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.product-info p {
  color: #94a3b8;
  margin-bottom: 16px;
}

.product-info button {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.product-info button:hover {
  transform: scale(1.05);
}
</style>
```

---

## 六、性能优化关键点

### 6.1 使用 shallowRef 避免深度代理

```javascript
// ❌ 错误：Three.js 对象被深度代理，严重卡顿
const scene = ref(new THREE.Scene())

// ✅ 正确：shallowRef 只代理一层
const scene = shallowRef(new THREE.Scene())
```

### 6.2 控制渲染帧率

不是所有场景都需要 60fps，有些 30fps 就足够了：

```javascript
let lastTime = 0
const fps = 30
const interval = 1000 / fps

function animate(time) {
  animationId = requestAnimationFrame(animate)

  if (time - lastTime > interval) {
    lastTime = time
    callbacks.forEach((cb) => cb())
    renderer.value.render(scene.value, camera.value)
  }
}
```

### 6.3 按需渲染

当 3D 内容不可见时，停止渲染：

```javascript
import { useIntersectionObserver } from '@vueuse/core'

const { containerRef } = useThree()

useIntersectionObserver(containerRef, ([{ isIntersecting }]) => {
  if (isIntersecting) {
    animate()  // 可见时渲染
  } else {
    cancelAnimationFrame(animationId)  // 不可见时暂停
  }
})
```

### 6.4 组件卸载时清理资源

这是最容易忽略但最重要的一点：

```javascript
onBeforeUnmount(() => {
  // 1. 停止动画循环
  cancelAnimationFrame(animationId)

  // 2. 移除事件监听
  window.removeEventListener('resize', onResize)

  // 3. 释放渲染器
  renderer.dispose()

  // 4. 遍历场景释放所有几何体和材质
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose())
      } else {
        obj.material.dispose()
      }
    }
    if (obj.texture) obj.texture.dispose()
  })

  // 5. 从 DOM 移除 Canvas
  containerRef.value?.removeChild(renderer.domElement)
})
```

---

## 七、常见踩坑与解决方案

### 坑 1：Canvas 尺寸为 0

**现象**：页面空白，控制台报 `canvas width/height is 0`

**原因**：组件 `onMounted` 时容器还没有尺寸

**解决**：加个延迟或用 `nextTick`

```javascript
import { nextTick } from 'vue'

onMounted(async () => {
  await nextTick()
  init()
})
```

### 坑 2：路由切换后内存泄漏

**原因**：离开页面时没有销毁 Three.js 资源

**解决**：确保 `onBeforeUnmount` 中完整清理（参考上面第六部分）

### 坑 3：Vue DevTools 卡死

**原因**：Three.js 对象挂在了响应式数据上

**解决**：用 `markRaw` 标记 Three.js 对象，阻止 Vue 代理

```javascript
import { markRaw } from 'vue'

const geometry = markRaw(new THREE.BoxGeometry(1, 1, 1))
```

### 坑 4：SSR 报错

**原因**：Three.js 依赖浏览器 API，在服务端渲染时会报错

**解决**：动态导入 + `ClientOnly` 组件

```vue
<template>
  <ClientOnly>
    <Scene3D />
  </ClientOnly>
</template>

<script setup>
// Nuxt 3 使用 ClientOnly
// 纯 Vue3 项目可以使用 <Suspense> + defineAsyncComponent
import { defineAsyncComponent } from 'vue'

const Scene3D = defineAsyncComponent(() =>
  import('@/components/three/Scene3D.vue')
)
</script>
```

---

## 八、总结

Vue3 + Three.js 的集成核心就三点：

| 要点 | 说明 |
|------|------|
| **生命周期管理** | `onMounted` 初始化，`onBeforeUnmount` 清理 |
| **响应式策略** | 用 `shallowRef`/`markRaw`，避免深度代理 |
| **性能优化** | 按需渲染、帧率控制、资源回收 |

掌握了这些，你就能在 Vue3 项目中自信地使用 Three.js 了。

---

**下一期预告**：《Three.js 性能优化：让你的 3D 场景流畅运行》，敬请期待！

---

觉得有用？**关注「有头发的帅哥程序员」**，每周分享前端干货 💻

你在 Vue3 中使用 Three.js 时遇到过什么坑？**评论区聊聊** 👇

转发给需要的朋友，一起进步 🚀
