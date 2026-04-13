---
title: 'Three.js 深入解析：Light（光照系统）完全指南'
description: '深度解析 Three.js 光照系统的全部类型，从原理到实战，掌握 AmbientLight、DirectionalLight、PointLight、SpotLight 等光源，让你的3D场景真实感飙升。'
pubDate: '2026-04-23'
tags: ['Three.js', '3D', 'WebGL', '前端', 'JavaScript']
---

# Three.js 深入解析：Light（光照系统）完全指南

在 Three.js 的世界里，**光照是区分"会动的积木"和"3D 场景"的核心**。

没有光，再精细的模型也只是一张平面贴图。有了光，普通的几何体也能产生层次感、真实感和氛围感。

本篇是 Three.js 深度系列第七篇，我们来彻底吃透光照系统。

---

## 为什么光照这么重要？

来对比一下：

```javascript
// 没有光，只有MeshStandardMaterial的效果
const geometry = new THREE.SphereGeometry(1, 32, 32)
const material = new THREE.MeshStandardMaterial({ color: 0xff6b35 })
const sphere = new THREE.Mesh(geometry, material)
scene.add(sphere)
// 结果：黑色！因为没有光源照亮它
```

这是初学者最常遇到的坑——用了 `MeshStandardMaterial`（物理材质）但没加光，整个场景漆黑一片。

> 💡 **关键知识点**：
>
> - `MeshBasicMaterial`：不受光照影响，直接显示颜色
> - `MeshStandardMaterial` / `MeshPhongMaterial`：需要光源才能看到效果

---

## Three.js 光源类型总览

| 光源类型           | 中文名 | 是否产生阴影 | 性能消耗 | 适用场景               |
| ------------------ | ------ | ------------ | -------- | ---------------------- |
| `AmbientLight`     | 环境光 | ❌           | 极低     | 基础照明，消除纯黑区域 |
| `DirectionalLight` | 平行光 | ✅           | 中等     | 模拟太阳光             |
| `PointLight`       | 点光源 | ✅           | 较高     | 灯泡、蜡烛             |
| `SpotLight`        | 聚光灯 | ✅           | 较高     | 舞台灯、手电筒         |
| `HemisphereLight`  | 半球光 | ❌           | 低       | 室外场景天空/地面光    |
| `RectAreaLight`    | 面光源 | ❌           | 高       | 荧幕、窗口柔光         |

---

## 一、AmbientLight（环境光）

### 基本用法

```javascript
const ambientLight = new THREE.AmbientLight(
  0xffffff, // 颜色（白色）
  0.5 // 强度（0~1，也可以更高）
)
scene.add(ambientLight)
```

### 特性

- 均匀照亮场景中的**所有物体**
- **没有方向**，不产生阴影
- 用于消除完全黑暗的区域，让暗面不纯黑

### 最佳实践

```javascript
// 几乎每个场景都需要一个弱环境光
const ambient = new THREE.AmbientLight(0xffffff, 0.3) // 强度不要太高
scene.add(ambient)

// 配合主光源使用
const sun = new THREE.DirectionalLight(0xffffff, 1.5)
sun.position.set(5, 10, 7.5)
scene.add(sun)
```

> ⚠️ 环境光强度不要超过 0.5，否则会让整个场景"扁平化"，失去立体感。

---

## 二、DirectionalLight（平行光）

模拟太阳光：光线平行，照射方向固定，**无论物体离光源多远，光照强度不变**。

### 基本用法

```javascript
const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(5, 10, 7.5) // 设置光的方向（光源从这里朝原点照射）
scene.add(dirLight)
```

### 开启阴影

```javascript
// 1. 渲染器开启阴影
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap // 柔和阴影

// 2. 光源开启阴影投射
dirLight.castShadow = true
dirLight.shadow.mapSize.width = 2048 // 阴影贴图分辨率
dirLight.shadow.mapSize.height = 2048

// 3. 阴影相机范围（决定哪些物体产生阴影）
dirLight.shadow.camera.near = 0.5
dirLight.shadow.camera.far = 50
dirLight.shadow.camera.left = -10
dirLight.shadow.camera.right = 10
dirLight.shadow.camera.top = 10
dirLight.shadow.camera.bottom = -10

// 4. 物体设置：投射阴影 + 接收阴影
mesh.castShadow = true // 会产生阴影
ground.receiveShadow = true // 会接收阴影
```

### 阴影调试辅助

```javascript
// 可视化平行光的阴影相机范围
const helper = new THREE.DirectionalLightHelper(dirLight, 5)
scene.add(helper)

const shadowCameraHelper = new THREE.CameraHelper(dirLight.shadow.camera)
scene.add(shadowCameraHelper)
```

---

## 三、PointLight（点光源）

像灯泡一样，向四面八方均匀发光，**光照强度随距离衰减**。

### 基本用法

```javascript
const pointLight = new THREE.PointLight(
  0xff8800, // 颜色（暖橙色，像灯泡）
  2, // 强度
  20, // 最大照射距离（超出则无光）
  2 // 衰减系数（2=物理衰减，推荐）
)
pointLight.position.set(0, 5, 0)
scene.add(pointLight)
```

### 让灯泡"有形"

光源本身是不可见的，通常配合一个几何体：

```javascript
// 创建发光的灯泡几何体
const bulbGeometry = new THREE.SphereGeometry(0.1, 16, 8)
const bulbMaterial = new THREE.MeshStandardMaterial({
  color: 0xff8800,
  emissive: 0xff8800, // 自发光
  emissiveIntensity: 1
})
const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial)

// 将灯泡添加到光源，一起移动
pointLight.add(bulb)
scene.add(pointLight)
```

### 动态效果：灯光闪烁

```javascript
// 在动画循环中模拟火焰闪烁
function animate() {
  requestAnimationFrame(animate)

  const time = Date.now() * 0.001
  pointLight.intensity = 1.5 + Math.sin(time * 7) * 0.3 // 强度随时间波动
  pointLight.position.y = 3 + Math.sin(time * 3) * 0.1 // 轻微抖动

  renderer.render(scene, camera)
}
```

---

## 四、SpotLight（聚光灯）

锥形照射区域，就像舞台聚光灯或手电筒。

### 基本用法

```javascript
const spotLight = new THREE.SpotLight(
  0xffffff, // 颜色
  3, // 强度
  30, // 距离
  Math.PI / 6, // 锥形角度（30°，单位是弧度）
  0.3, // 边缘柔化程度（0=硬边，1=完全柔化）
  2 // 衰减系数
)
spotLight.position.set(0, 10, 0)
spotLight.target.position.set(0, 0, 0) // 照射目标点
scene.add(spotLight)
scene.add(spotLight.target) // 注意：target也需要加入场景
```

### 参数详解

```javascript
// angle：锥形半角（0 ~ Math.PI/2）
spotLight.angle = Math.PI / 8 // 22.5°，越小越聚焦

// penumbra：边缘柔化
spotLight.penumbra = 0 // 硬边，像老式投影仪
spotLight.penumbra = 0.5 // 柔边，像现代LED聚光灯

// 开启阴影
spotLight.castShadow = true
spotLight.shadow.mapSize.width = 1024
spotLight.shadow.mapSize.height = 1024
```

### 实战：跟随鼠标的聚光灯

```javascript
const mouse = new THREE.Vector2()
const target = new THREE.Vector3()
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const raycaster = new THREE.Raycaster()

window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
})

function animate() {
  requestAnimationFrame(animate)

  // 将鼠标位置投射到地面平面
  raycaster.setFromCamera(mouse, camera)
  raycaster.ray.intersectPlane(plane, target)

  // 聚光灯目标跟随鼠标
  spotLight.target.position.lerp(target, 0.1) // 平滑跟随
  spotLight.target.updateMatrixWorld()

  renderer.render(scene, camera)
}
```

---

## 五、HemisphereLight（半球光）

模拟户外天空光照：天空颜色从上往下照，地面颜色从下往上照，产生自然的环境光。

```javascript
const hemiLight = new THREE.HemisphereLight(
  0x87ceeb, // 天空色（浅蓝）
  0x8b7355, // 地面色（棕褐）
  0.8 // 强度
)
hemiLight.position.set(0, 50, 0)
scene.add(hemiLight)
```

> 💡 **最佳组合**：`HemisphereLight`（环境感）+ `DirectionalLight`（方向感+阴影），这是制作户外场景的标准配方。

```javascript
// 经典户外场景光照配置
const hemi = new THREE.HemisphereLight(0x87ceeb, 0x9a8565, 0.6)
scene.add(hemi)

const sun = new THREE.DirectionalLight(0xfff5e0, 1.2) // 暖黄太阳色
sun.position.set(100, 100, 100)
sun.castShadow = true
sun.shadow.mapSize.setScalar(2048)
scene.add(sun)
```

---

## 六、RectAreaLight（面光源）

模拟窗户、荧幕、发光面板等面状光源，发出柔和的区域光。

> ⚠️ **注意**：`RectAreaLight` 只对 `MeshStandardMaterial` 和 `MeshPhysicalMaterial` 有效，且需要额外引入辅助模块。

```javascript
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'

// 必须先初始化
RectAreaLightUniformsLib.init()

const rectLight = new THREE.RectAreaLight(
  0x00ff78, // 颜色（绿色发光板）
  5, // 强度
  4, // 宽度
  2 // 高度
)
rectLight.position.set(0, 5, -5)
rectLight.lookAt(0, 0, 0) // 朝向场景中心
scene.add(rectLight)

// 可视化辅助
const helper = new RectAreaLightHelper(rectLight)
rectLight.add(helper)
```

---

## 七、阴影性能优化

### 1. 控制阴影贴图分辨率

```javascript
// 阴影质量 vs 性能的平衡
light.shadow.mapSize.width = 512 // 低质量，高性能
light.shadow.mapSize.width = 1024 // 平衡（推荐）
light.shadow.mapSize.width = 2048 // 高质量，性能消耗大
light.shadow.mapSize.width = 4096 // 只在必要时使用
```

### 2. 选择合适的阴影类型

```javascript
renderer.shadowMap.type = THREE.BasicShadowMap // 最快，硬边锯齿
renderer.shadowMap.type = THREE.PCFShadowMap // 默认，柔和
renderer.shadowMap.type = THREE.PCFSoftShadowMap // 更柔和，推荐
renderer.shadowMap.type = THREE.VSMShadowMap // 最高质量，最慢
```

### 3. 精确设置阴影相机范围

```javascript
// 范围越小，阴影精度越高
dirLight.shadow.camera.near = 1
dirLight.shadow.camera.far = 30 // 不要设太大
dirLight.shadow.camera.left = -10
dirLight.shadow.camera.right = 10
// 用CameraHelper可视化范围，再调整
```

### 4. 静态场景关闭自动更新

```javascript
// 场景静止时，阴影贴图不需要每帧重算
light.shadow.autoUpdate = false
light.shadow.needsUpdate = true // 只在场景变化时手动触发一次
```

---

## 八、完整示例：真实感场景光照

```javascript
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// 基础设置
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0a0a1a)
scene.fog = new THREE.Fog(0x0a0a1a, 10, 40)

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100)
camera.position.set(0, 8, 15)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping // 电影级色调映射
renderer.toneMappingExposure = 1.2
document.body.appendChild(renderer.domElement)

// 光照系统
// 1. 微弱环境光（防止全黑）
const ambient = new THREE.AmbientLight(0x112233, 0.5)
scene.add(ambient)

// 2. 月光（蓝白平行光）
const moonLight = new THREE.DirectionalLight(0x9bb7ff, 0.8)
moonLight.position.set(-5, 15, -5)
moonLight.castShadow = true
moonLight.shadow.mapSize.setScalar(2048)
moonLight.shadow.camera.near = 0.5
moonLight.shadow.camera.far = 50
moonLight.shadow.camera.left = -15
moonLight.shadow.camera.right = 15
moonLight.shadow.camera.top = 15
moonLight.shadow.camera.bottom = -15
scene.add(moonLight)

// 3. 路灯（暖橙点光源）
const lampColors = [0xff9944, 0xff7700, 0xffaa22]
lampColors.forEach((color, i) => {
  const lamp = new THREE.PointLight(color, 3, 10, 2)
  lamp.position.set(-6 + i * 6, 4, 0)
  lamp.castShadow = true

  // 灯泡模型
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.1),
    new THREE.MeshStandardMaterial({ emissive: color, emissiveIntensity: 2 })
  )
  lamp.add(bulb)
  scene.add(lamp)
})

// 地面
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9, metalness: 0.1 })
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

// 建筑物
for (let i = 0; i < 5; i++) {
  const h = 2 + Math.random() * 6
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, h, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x16213e, roughness: 0.8 })
  )
  building.position.set(-8 + i * 4, h / 2, -5)
  building.castShadow = true
  building.receiveShadow = true
  scene.add(building)
}

// 控制器 & 动画
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0, 0)

const clock = new THREE.Clock()
function animate() {
  requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  // 路灯闪烁
  scene.traverse(obj => {
    if (obj.isPointLight) {
      obj.intensity = 2.5 + Math.sin(t * 4 + obj.position.x) * 0.3
    }
  })

  controls.update()
  renderer.render(scene, camera)
}
animate()
```

---

## 总结

| 场景     | 推荐光照方案                                                    |
| -------- | --------------------------------------------------------------- |
| 室外白天 | `HemisphereLight` + `DirectionalLight`                          |
| 室外夜晚 | 弱 `AmbientLight` + 蓝色 `DirectionalLight` + 多个 `PointLight` |
| 室内     | `AmbientLight` + `RectAreaLight`（窗户）+ `PointLight`（灯具）  |
| 产品展示 | 3 点布光：主光 + 补光 + 背光（均用 `DirectionalLight`）         |
| 游戏场景 | 尽量减少动态阴影光源数量，多用预烘焙光照贴图                    |

---

## 下期预告

下一篇我们将深入解析 **Three.js 动画系统（AnimationMixer）**，包括：

- GLTF 模型动画的加载与播放
- 动画混合与过渡
- 自定义关键帧动画

如果你有想了解的 Three.js 知识点，欢迎在评论区留言！

> 觉得有收获？关注「有头发的帅哥程序员」，每周持续更新 Three.js 深度系列 💪
