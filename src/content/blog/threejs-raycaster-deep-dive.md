---
title: "Three.js 深入解析：Raycaster（射线检测与鼠标交互）"
description: "全面解析 Three.js 射线检测（Raycaster）的核心原理与实战技巧，从鼠标拾取、悬停高亮到射线碰撞检测、精确点击，助你打造流畅的 3D 鼠标交互体验。"
pubDate: "2026-04-29"
tags: ["Three.js", "3D", "WebGL", "前端", "JavaScript"]
---

# Three.js 深入解析：Raycaster（射线检测与鼠标交互）

> 系列第十一篇 · 当用户在屏幕上点击，3D 世界里发生了什么？Raycaster 就是那道"从眼睛射入虚空"的光线，帮你找到鼠标和三维物体的交汇点。本文带你彻底搞懂射线检测的原理与最佳实践。

---

## 一、Raycaster 是什么？

在 2D 世界里，判断鼠标是否点中一个元素很简单——比较坐标范围就行。但在 3D 世界里，屏幕上的一个像素点对应的是摄像机到无穷远处的一条直线，要判断点击了哪个物体，就需要 **射线检测（Ray Casting）**。

**核心思路：**

```
屏幕坐标 → 归一化设备坐标（NDC） → 从摄像机发出一条射线 → 检测与哪些物体相交 → 返回相交结果（距离、交点、面等）
```

Three.js 的 `Raycaster` 类封装了这一切。

---

## 二、快速上手：点击拾取物体

### 2.1 基础代码结构

```js
import * as THREE from 'three'

// 初始化场景、相机、渲染器...（省略）

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

// 监听鼠标点击
window.addEventListener('click', (event) => {
  // 1. 将屏幕坐标转为 NDC 坐标（范围 -1 到 1）
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

  // 2. 从相机发出射线
  raycaster.setFromCamera(pointer, camera)

  // 3. 检测射线与场景中哪些物体相交
  const intersects = raycaster.intersectObjects(scene.children)

  if (intersects.length > 0) {
    // 4. 取最近的相交物体（intersects 已按距离排序）
    const hit = intersects[0]
    console.log('点击到了：', hit.object.name)
    console.log('交点坐标：', hit.point)
    console.log('距离：', hit.distance)
  }
})
```

### 2.2 NDC 坐标系说明

NDC（Normalized Device Coordinates，归一化设备坐标）是一个 [-1, 1] 的二维坐标系：

```
(-1,  1) -------- (1,  1)
    |       屏幕中心(0,0)   |
(-1, -1) -------- (1, -1)
```

注意：屏幕 Y 轴朝下，NDC Y 轴朝上，所以需要取反（`-(event.clientY / height) * 2 + 1`）。

---

## 三、intersectObjects 详解

### 3.1 返回值结构

`raycaster.intersectObjects(objects, recursive)` 返回一个数组，按距离从近到远排列：

```ts
interface Intersection {
  distance: number       // 射线起点到交点的距离
  point: THREE.Vector3   // 世界坐标系中的交点
  object: THREE.Object3D // 被击中的物体
  face: THREE.Face | null // 被击中的三角面（仅网格有效）
  faceIndex: number      // 面的索引
  uv: THREE.Vector2      // 交点处的 UV 坐标（用于纹理拾取）
  instanceId?: number    // InstancedMesh 实例的索引
}
```

### 3.2 递归检测子对象

```js
// 只检测直接子级
raycaster.intersectObjects(scene.children, false)

// 递归检测所有后代（默认值）
raycaster.intersectObjects(scene.children, true)

// 只检测特定对象列表
raycaster.intersectObjects([mesh1, mesh2, mesh3])

// 检测单个物体
raycaster.intersectObject(targetMesh)
```

### 3.3 只检测可见物体

```js
const visibleObjects = scene.children.filter(obj => obj.visible)
const intersects = raycaster.intersectObjects(visibleObjects, true)
```

---

## 四、鼠标悬停高亮

悬停高亮是最常见的交互效果，需要在 `mousemove` 事件中实时检测：

```js
let hoveredObject = null

window.addEventListener('mousemove', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(meshList)

  if (intersects.length > 0) {
    const newHovered = intersects[0].object

    // 离开上一个物体
    if (hoveredObject && hoveredObject !== newHovered) {
      hoveredObject.material.emissive.set(0x000000) // 恢复
    }

    // 高亮新物体
    hoveredObject = newHovered
    hoveredObject.material.emissive.set(0x00ffff)   // 霓虹蓝高亮

    document.body.style.cursor = 'pointer'
  } else {
    // 没有交点，恢复
    if (hoveredObject) {
      hoveredObject.material.emissive.set(0x000000)
      hoveredObject = null
    }
    document.body.style.cursor = 'default'
  }
})
```

> **提示**：每帧 `mousemove` 都会触发，建议在 `requestAnimationFrame` 里统一做射线检测，避免重复计算。

---

## 五、在动画循环中做射线检测（推荐方式）

把射线检测放进渲染循环，可以精确控制执行时机，也方便做"持续悬停"效果：

```js
let needsRaycast = false

window.addEventListener('mousemove', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  needsRaycast = true // 标记需要检测
})

function animate() {
  requestAnimationFrame(animate)

  if (needsRaycast) {
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(meshList)
    handleHover(intersects)
    needsRaycast = false
  }

  renderer.render(scene, camera)
}

animate()
```

---

## 六、实战：3D 可点击卡片效果

```js
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// 场景初始化
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100)
camera.position.set(0, 0, 6)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

// 创建多个卡片
const cards = []
const colors = [0xff4d6d, 0x00d4ff, 0x7fff00, 0xffb347, 0xda70d6]

for (let i = 0; i < 5; i++) {
  const geo = new THREE.BoxGeometry(1.5, 2, 0.1)
  const mat = new THREE.MeshStandardMaterial({
    color: colors[i],
    roughness: 0.3,
    metalness: 0.6
  })
  const card = new THREE.Mesh(geo, mat)
  card.position.x = (i - 2) * 2
  card.name = `Card_${i}`
  scene.add(card)
  cards.push(card)
}

// 光照
scene.add(new THREE.AmbientLight(0xffffff, 0.5))
const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(5, 5, 5)
scene.add(dirLight)

// 射线检测
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let hoveredCard = null

window.addEventListener('mousemove', (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1
  pointer.y = -(e.clientY / innerHeight) * 2 + 1
})

window.addEventListener('click', () => {
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(cards)
  if (hits.length > 0) {
    const card = hits[0].object
    // 点击后卡片弹出
    card.position.z = card.position.z > 0.5 ? 0 : 1
    console.log(`点击了 ${card.name}`)
  }
})

// 动画循环
function animate() {
  requestAnimationFrame(animate)

  // 每帧做悬停检测
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(cards)

  if (hits.length > 0) {
    const newHover = hits[0].object
    if (hoveredCard !== newHover) {
      if (hoveredCard) hoveredCard.material.emissive.set(0x000000)
      hoveredCard = newHover
      hoveredCard.material.emissive.set(0x333333)
    }
    document.body.style.cursor = 'pointer'
  } else {
    if (hoveredCard) {
      hoveredCard.material.emissive.set(0x000000)
      hoveredCard = null
    }
    document.body.style.cursor = 'default'
  }

  renderer.render(scene, camera)
}
animate()
```

---

## 七、InstancedMesh 的射线检测

`InstancedMesh` 可以用一次 Draw Call 渲染成千上万个实例，但射线检测需要特殊处理：

```js
const count = 1000
const geo = new THREE.SphereGeometry(0.2)
const mat = new THREE.MeshStandardMaterial({ color: 0xffffff })
const instancedMesh = new THREE.InstancedMesh(geo, mat, count)

const dummy = new THREE.Object3D()
for (let i = 0; i < count; i++) {
  dummy.position.set(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20
  )
  dummy.updateMatrix()
  instancedMesh.setMatrixAt(i, dummy.matrix)
}
instancedMesh.instanceMatrix.needsUpdate = true
scene.add(instancedMesh)

// 点击检测
window.addEventListener('click', (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1
  pointer.y = -(e.clientY / innerHeight) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObject(instancedMesh)

  if (hits.length > 0) {
    const instanceId = hits[0].instanceId // 被点中的实例索引
    console.log(`点中了第 ${instanceId} 个实例`)

    // 修改该实例的颜色
    instancedMesh.setColorAt(instanceId, new THREE.Color(0xff0000))
    instancedMesh.instanceColor.needsUpdate = true
  }
})
```

---

## 八、射线参数精调

### 8.1 设置近远裁切平面

```js
raycaster.near = 0    // 射线起点（默认0）
raycaster.far = 100   // 射线最远距离（默认Infinity）
```

限制 `far` 可以避免检测到远处的无关物体，提升性能。

### 8.2 手动构造射线（非相机视角）

```js
// 从任意起点朝任意方向发射射线
const origin = new THREE.Vector3(0, 10, 0)    // 起点
const direction = new THREE.Vector3(0, -1, 0)  // 方向（需要归一化）
direction.normalize()

raycaster.set(origin, direction)

// 常用场景：地面吸附、NPC 视线检测、碰撞检测
const hits = raycaster.intersectObjects(groundMeshes)
if (hits.length > 0) {
  character.position.y = hits[0].point.y
}
```

### 8.3 线段相交检测（Line）

```js
// 检测与 Line 对象的相交，需要设置 linePrecision
raycaster.params.Line.threshold = 0.1  // 线宽容差，单位：世界坐标
const hits = raycaster.intersectObject(lineObject)
```

### 8.4 点云相交检测（Points）

```js
// 检测粒子系统中的点
raycaster.params.Points.threshold = 0.1  // 点的拾取容差
const hits = raycaster.intersectObject(pointsObject)
```

---

## 九、性能优化策略

### 9.1 缩小检测范围

```js
// ❌ 不要检测整个场景
raycaster.intersectObjects(scene.children, true)

// ✅ 只检测可交互的物体
raycaster.intersectObjects(interactiveObjects)
```

### 9.2 使用 BVH 加速（推荐）

对于大型复杂模型（几万面以上），原生射线检测逐面测试很慢。推荐使用 [`three-mesh-bvh`](https://github.com/gkjohnson/three-mesh-bvh) 库：

```js
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh'

// 扩展 Three.js
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
THREE.Mesh.prototype.raycast = acceleratedRaycast

// 为几何体构建 BVH
mesh.geometry.computeBoundsTree()

// 使用方法与原生 Raycaster 完全相同，速度提升 100x+
const hits = raycaster.intersectObject(mesh)
```

### 9.3 节流控制

```js
import { throttle } from 'lodash'

const onMouseMove = throttle((e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1
  pointer.y = -(e.clientY / innerHeight) * 2 + 1
  doRaycast()
}, 16) // ~60fps

window.addEventListener('mousemove', onMouseMove)
```

### 9.4 排除不必要的对象

```js
// 禁用不需要参与射线检测的对象
backgroundMesh.raycast = () => {} // 空函数，跳过检测
particleSystem.raycast = () => {}
```

---

## 十、常见问题与排查

### Q1：点击没有反应，intersects 永远为空？

**可能原因：**
- 坐标转换错误：没有处理 canvas 偏移（canvas 不铺满全屏时）
- 物体没有加入检测列表
- 物体被其他物体遮挡

**修正坐标计算（canvas 不铺满时）：**

```js
window.addEventListener('click', (e) => {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
})
```

### Q2：检测到了背面？

```js
// 让材质双面渲染，射线会穿透背面
mat.side = THREE.DoubleSide

// 或者设置 raycaster 只检测正面
// （目前 Three.js 暂不直接支持，需手动判断 face.normal 方向）
const hit = intersects[0]
const normal = hit.face.normal.clone()
normal.transformDirection(hit.object.matrixWorld)
if (normal.dot(raycaster.ray.direction) < 0) {
  // 击中正面
}
```

### Q3：OrbitControls 拖拽时误触发点击？

```js
let isDragging = false
let mouseDownTime = 0

renderer.domElement.addEventListener('mousedown', () => {
  isDragging = false
  mouseDownTime = Date.now()
})

renderer.domElement.addEventListener('mousemove', () => {
  if (Date.now() - mouseDownTime > 150) isDragging = true
})

renderer.domElement.addEventListener('click', () => {
  if (!isDragging) {
    // 执行射线检测
    doRaycast()
  }
})
```

### Q4：移动端触摸支持？

```js
renderer.domElement.addEventListener('touchstart', (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(interactiveObjects)
  if (hits.length > 0) handleClick(hits[0])
}, { passive: false })
```

---

## 十一、综合实战：3D 产品展示 + 点击高亮 + 信息卡片

```js
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0a0a1a)

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.01, 100)
camera.position.set(0, 1.5, 4)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(devicePixelRatio)
renderer.setSize(innerWidth, innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// 光照
scene.add(new THREE.AmbientLight(0xffffff, 0.4))
const spot = new THREE.SpotLight(0xffffff, 2)
spot.position.set(3, 5, 3)
spot.castShadow = true
scene.add(spot)

// 加载模型（假设有 product.glb）
const loader = new GLTFLoader()
const clickableParts = []

loader.load('/models/product.glb', (gltf) => {
  scene.add(gltf.scene)
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      // 储存原始颜色
      child.userData.originalColor = child.material.color.clone()
      clickableParts.push(child)
    }
  })
})

// 射线检测
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let selected = null

// 页面上的信息卡片（HTML）
const infoCard = document.getElementById('info-card')

function showInfo(part) {
  infoCard.innerHTML = `
    <h3>${part.name || '零件'}</h3>
    <p>材质：${part.material.name || '标准材质'}</p>
    <p>顶点数：${part.geometry.attributes.position.count}</p>
  `
  infoCard.style.display = 'block'
}

renderer.domElement.addEventListener('click', (e) => {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(clickableParts)

  // 取消上一个选中
  if (selected) {
    selected.material.color.copy(selected.userData.originalColor)
    selected.material.emissive.set(0x000000)
    selected = null
    infoCard.style.display = 'none'
  }

  if (hits.length > 0) {
    selected = hits[0].object
    selected.material.emissive.set(0x003366)
    selected.material.color.set(0x00d4ff)
    showInfo(selected)
  }
})

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
animate()
```

---

## 十二、知识地图

```
Raycaster
├── 设置来源
│   ├── setFromCamera(pointer, camera)  ← 最常用，鼠标拾取
│   └── set(origin, direction)          ← 自定义射线方向
├── 检测方法
│   ├── intersectObject(mesh)           ← 单个物体
│   └── intersectObjects(list, recursive) ← 批量检测
├── 返回值
│   ├── distance / point / object
│   ├── face / faceIndex / uv
│   └── instanceId（InstancedMesh）
├── 参数调整
│   ├── near / far
│   ├── params.Line.threshold
│   └── params.Points.threshold
└── 性能优化
    ├── 缩小检测范围
    ├── three-mesh-bvh（BVH加速）
    ├── 节流控制
    └── 禁用无用对象的 raycast
```

---

## 小结

| 场景 | 方案 |
|------|------|
| 鼠标点击拾取 | `click` + `setFromCamera` + `intersectObjects` |
| 悬停高亮 | `mousemove` + 在动画循环中检测 |
| 复杂模型拾取 | `three-mesh-bvh` 加速 |
| 实例化网格 | `intersectObject` + `instanceId` |
| 地面吸附/碰撞 | 手动 `set(origin, direction)` |
| 移动端触摸 | `touchstart` + touch 坐标转 NDC |

---

> **下一篇预告**：Three.js 深入解析 ——「后期处理（Post-Processing）」，EffectComposer、Bloom 泛光、SSAO 环境光遮蔽，让你的 3D 场景从"好看"变成"惊艳"。关注公众号「有头发的帅哥程序员」，第一时间获取更新 🚀
