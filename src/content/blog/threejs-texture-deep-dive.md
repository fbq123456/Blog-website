---
title: 'Three.js 深入解析：Texture（纹理系统）'
description: '纹理是让3D场景从"白模"变"成品"的关键。本篇文章将深入解析Texture、TextureLoader、UV映射、纹理贴图、凹凸映射等核心概念，带你掌握Three.js纹理编程的精髓。'
pubDate: '2026-04-27'
tags: ['Three.js', '3D', 'WebGL']
---

> "没有纹理的3D模型，就像没有装修的毛坯房。"
> "加上纹理，才能算真正的'数字世界'。"

## 🎨 纹理系统的核心概念

Three.js 的纹理系统是连接2D图像与3D模型桥梁：

```markdown
📌 Texture - 纹理对象，管理图像和映射参数
📌 TextureLoader - 纹理加载器，从外部加载图片
📌 UV映射 - 将2D坐标映射到3D表面
📌 贴图类型 - 颜色、法线、粗糙度、金属度等
```

**纹理的作用流程**：

```
图片文件（.jpg/.png/.webp）
    ↓
TextureLoader 加载
    ↓
创建 Texture 对象
    ↓
赋值给 Material.map
    ↓
渲染到 3D 表面
```

---

## 🚀 最简单的纹理：给立方体贴图

先来看最基础的例子：

```javascript
import * as THREE from 'three'

// 1. 创建场景（基础代码省略）
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// 2. 使用 TextureLoader 加载纹理
const textureLoader = new THREE.TextureLoader()

// 3. 加载图片作为纹理
const texture = textureLoader.load('/textures/wood.jpg')

// 4. 创建材质并应用纹理
const material = new THREE.MeshStandardMaterial({
  map: texture, // 颜色贴图
})

// 5. 创建立方体
const geometry = new THREE.BoxGeometry(2, 2, 2)
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

// 添加光照（纹理需要光照才能显示立体感）
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

// 6. 渲染循环
function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()
```

---

## 🖼️ Texture 的常用属性

Texture 对象有大量属性控制纹理的显示效果：

```javascript
const texture = textureLoader.load('/textures/wood.jpg')

// 1. 重复平铺
texture.wrapS = THREE.RepeatWrapping // 水平方向重复
texture.wrapT = THREE.RepeatWrapping // 垂直方向重复
texture.repeat.set(4, 4) // 重复4x4次

// 2. 偏移
texture.offset.set(0.5, 0) // 偏移50%

// 3. 旋转
texture.rotation = Math.PI / 4 // 旋转45度
texture.center.set(0.5, 0.5) // 旋转中心点

// 4. 过滤模式
texture.minFilter = THREE.LinearMipmapLinearFilter // 缩小时的过滤
texture.magFilter = THREE.LinearFilter // 放大时的过滤

// 5. 各向异性过滤（提升斜面纹理清晰度）
texture.anisotropy = renderer.capabilities.getMaxAnisotropy()

// 6. 纹素格式
texture.format = THREE.RGBAFormat // RGBA格式

// 7. 编码
texture.encoding = THREE.sRGBEncoding // sRGB色彩空间

// 8. 必须调用！通知GPU更新
texture.needsUpdate = true
```

### 常用过滤模式对比

```javascript
// 缩小时的过滤（minFilter）
THREE.NearestFilter       // 最近邻过滤，最锐利
THREE.LinearFilter         // 双线性过滤，较平滑
THREE.NearestMipmapNearestFilter // 最近+多级渐远
THREE.NearestMipmapLinearFilter  // 最近+线性混合
THREE.LinearMipmapNearestFilter  // 线性+最近
THREE.LinearMipmapLinearFilter   // 线性+线性，最平滑（推荐）

// 放大时的过滤（magFilter）
THREE.NearestFilter       // 最近邻，最快
THREE.LinearFilter         // 双线性（默认）
```

---

## 🎯 UV映射详解

UV映射决定了纹理如何"铺"在3D表面上。

### 什么是UV？

```markdown
UV是2D纹理上的坐标系统：
- U：水平方向，范围 0~1
- V：垂直方向，范围 0~1

(0,0)          (1,0)
  ┌────────────┐
  │            │
  │   纹理     │
  │            │
  └────────────┘
(0,1)          (1,1)
```

### 手动修改UV坐标

```javascript
const geometry = new THREE.BoxGeometry(2, 2, 2)

// 获取UV属性
const uvAttribute = geometry.attributes.uv

console.log('UV数量:', uvAttribute.count)
console.log('UV范围:', uvAttribute.getX(0), uvAttribute.getY(0))

// 修改UV坐标（让纹理平铺更密）
for (let i = 0; i < uvAttribute.count; i++) {
  uvAttribute.setX(i, uvAttribute.getX(i) * 2)
  uvAttribute.setY(i, uvAttribute.getY(i) * 2)
}

uvAttribute.needsUpdate = true
```

### 常见UV问题与解决

```javascript
// 问题1：纹理被拉伸
// 解决：调整几何体的UV或使用平铺

// 问题2：接缝处有裂缝
// 解决：使用无缝纹理，或在接缝处重叠UV

// 问题3：纹理显示模糊
// 解决：提高 anisotropy 或使用 NearestFilter
```

---

## 🗺️ PBR材质的多重纹理

现代3D渲染使用PBR（基于物理的渲染），需要多种贴图配合：

### 1. 颜色贴图（Albedo/Base Color）

```javascript
const albedoTexture = textureLoader.load('/textures/diffuse.jpg')
const material = new THREE.MeshStandardMaterial({
  map: albedoTexture, // 基础颜色
})
```

### 2. 法线贴图（Normal Map）

法线贴图让低面数模型看起来有凹凸细节：

```javascript
const normalTexture = textureLoader.load('/textures/normal.jpg')
const material = new THREE.MeshStandardMaterial({
  map: albedoTexture,      // 颜色
  normalMap: normalTexture, // 法线
  normalScale: new THREE.Vector2(1, 1), // 法线强度
})
```

### 3. 粗糙度贴图（Roughness）

控制表面的光滑程度：

```javascript
const roughnessTexture = textureLoader.load('/textures/roughness.jpg')
const material = new THREE.MeshStandardMaterial({
  map: albedoTexture,
  roughnessMap: roughnessTexture,
  roughness: 0.5, // 基础粗糙度（可被贴图覆盖）
  metalness: 0.8, // 金属度
})
```

### 4. 金属度贴图（Metalness）

控制表面的金属属性：

```javascript
const metalnessTexture = textureLoader.load('/textures/metalness.jpg')
const material = new THREE.MeshStandardMaterial({
  map: albedoTexture,
  metalnessMap: metalnessTexture,
  metalness: 1.0,
  roughness: 0.3,
})
```

### 5. 环境光遮蔽贴图（AO）

增加缝隙和角落的阴影：

```javascript
const aoTexture = textureLoader.load('/textures/ao.jpg')
const material = new THREE.MeshStandardMaterial({
  map: albedoTexture,
  aoMap: aoTexture,
  aoMapIntensity: 1.0, // AO强度
})
```

### 6. 位移贴图（Displacement）

真正改变几何体的顶点位置：

```javascript
const displacementTexture = textureLoader.load('/textures/displacement.jpg')
const geometry = new THREE.PlaneGeometry(4, 4, 64, 64) // 高细分

const material = new THREE.MeshStandardMaterial({
  map: albedoTexture,
  displacementMap: displacementTexture,
  displacementScale: 0.5, // 位移强度
  displacementBias: -0.25, // 位移偏移
})
```

### 完整PBR示例

```javascript
import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

// 加载所有贴图
const textureLoader = new THREE.TextureLoader()
const loadTexture = (path) => {
  const tex = textureLoader.load(path)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

const albedo = loadTexture('/textures/pbr/albedo.jpg')
const normal = loadTexture('/textures/pbr/normal.jpg')
const roughness = loadTexture('/textures/pbr/roughness.jpg')
const metalness = loadTexture('/textures/pbr/metalness.jpg')
const ao = loadTexture('/textures/pbr/ao.jpg')

// HDR环境贴图
new RGBELoader().load('/textures/hdr/warehouse.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = texture
})

const material = new THREE.MeshStandardMaterial({
  map: albedo,
  normalMap: normal,
  roughnessMap: roughness,
  metalnessMap: metalness,
  aoMap: ao,
  aoMapIntensity: 1,
  roughness: 1,
  metalness: 1,
})

const mesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  material
)
scene.add(mesh)
```

---

## 🌐 纹理加载的进阶技巧

### 1. 加载进度显示

```javascript
const textureLoader = new THREE.TextureLoader()

textureLoader.load(
  '/textures/wood.jpg',
  (texture) => {
    // 加载成功
    console.log('纹理加载完成')
    material.map = texture
    material.needsUpdate = true
  },
  (xhr) => {
    // 下载进度
    const percent = (xhr.loaded / xhr.total * 100).toFixed(0)
    console.log(`加载进度: ${percent}%`)
    updateProgressBar(percent)
  },
  (error) => {
    // 加载失败
    console.error('纹理加载失败:', error)
  }
)
```

### 2. 跨域纹理（CORS）

```javascript
// 确保服务器设置正确的CORS头
// 或者使用代理服务器

// 加载时设置跨域
const texture = textureLoader.load('/textures/wood.jpg', (tex) => {
  tex.crossOrigin = 'anonymous'
})
```

### 3. 使用Canvas生成纹理

```javascript
// 动态创建纹理
const canvas = document.createElement('canvas')
canvas.width = 512
canvas.height = 512
const ctx = canvas.getContext('2d')

// 绘制渐变
const gradient = ctx.createLinearGradient(0, 0, 512, 512)
gradient.addColorStop(0, '#ff0000')
gradient.addColorStop(0.5, '#00ff00')
gradient.addColorStop(1, '#0000ff')
ctx.fillStyle = gradient
ctx.fillRect(0, 0, 512, 512)

// 绘制文字
ctx.fillStyle = '#ffffff'
ctx.font = 'bold 48px Arial'
ctx.fillText('Dynamic Texture', 100, 280)

// 创建Three.js纹理
const texture = new THREE.CanvasTexture(canvas)
texture.needsUpdate = true
```

### 4. DataTexture：程序化纹理

```javascript
// 从数组数据创建纹理
const width = 256
const height = 256
const data = new Uint8Array(width * height * 4) // RGBA

for (let i = 0; i < width * height; i++) {
  const x = i % width
  const y = Math.floor(i / width)
  
  // 生成棋盘格
  const isWhite = (Math.floor(x / 32) + Math.floor(y / 32)) % 2 === 0
  
  data[i * 4] = isWhite ? 255 : 0     // R
  data[i * 4 + 1] = isWhite ? 255 : 0 // G
  data[i * 4 + 2] = isWhite ? 255 : 0 // B
  data[i * 4 + 3] = 255               // A
}

const texture = new THREE.DataTexture(
  data,
  width,
  height,
  THREE.RGBAFormat
)
texture.needsUpdate = true
```

---

## 🖼️ 视频纹理

Three.js 支持将视频作为纹理使用：

```javascript
// 1. 创建video元素
const video = document.createElement('video')
video.src = '/videos/screen.mp4'
video.loop = true
video.muted = true
video.playsInline = true
video.crossOrigin = 'anonymous'

// 2. 播放视频
video.play()

// 3. 创建视频纹理
const videoTexture = new THREE.VideoTexture(video)
videoTexture.minFilter = THREE.LinearFilter
videoTexture.magFilter = THREE.LinearFilter
videoTexture.format = THREE.RGBAFormat

// 4. 应用到材质
const material = new THREE.MeshBasicMaterial({
  map: videoTexture,
  side: THREE.DoubleSide,
})

// 5. 创建展示视频的平面
const geometry = new THREE.PlaneGeometry(16, 9) // 16:9比例
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)
```

### Webcam 实时纹理

```javascript
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    const video = document.createElement('video')
    video.srcObject = stream
    video.play()

    const webcamTexture = new THREE.VideoTexture(video)
    webcamTexture.minFilter = THREE.LinearFilter
    
    // 将视频应用到材质
    screenMaterial.map = webcamTexture
    screenMaterial.needsUpdate = true
  })
```

---

## 🔄 纹理变换动画

让纹理动起来：

```javascript
const texture = textureLoader.load('/textures/water.jpg')
texture.wrapS = THREE.RepeatWrapping
texture.wrapT = THREE.RepeatWrapping

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)

  const elapsed = clock.getElapsedTime()

  // 1. UV滚动（水流效果）
  texture.offset.x = elapsed * 0.1 // 水平滚动
  texture.offset.y = elapsed * 0.05 // 垂直滚动

  // 2. 旋转
  texture.rotation = elapsed * 0.5

  // 3. 脉冲缩放
  const scale = 1 + Math.sin(elapsed * 2) * 0.1
  texture.repeat.set(scale, scale)

  renderer.render(scene, camera)
}
```

---

## 🎭 精灵图与精灵动画

精灵图（Sprite Sheet）用于2D帧动画：

```javascript
// 1. 创建精灵材质
const spriteMaterial = new THREE.SpriteMaterial({
  map: textureLoader.load('/sprites/explosion.png'),
})

// 2. 创建精灵
const sprite = new THREE.Sprite(spriteMaterial)
sprite.scale.set(2, 2, 1)
scene.add(sprite)

// 3. 实现帧动画
class SpriteAnimator {
  constructor(sprite, texture, frameWidth, frameHeight, totalFrames) {
    this.sprite = sprite
    this.material = sprite.material
    this.frameWidth = frameWidth
    this.frameHeight = frameHeight
    this.totalFrames = totalFrames
    this.currentFrame = 0
    
    // 设置纹理属性
    this.material.map.repeat.set(
      frameWidth / texture.image.width,
      frameHeight / texture.image.height
    )
  }

  setFrame(frame) {
    const cols = Math.floor(this.material.map.image.width / this.frameWidth)
    const row = Math.floor(frame / cols)
    const col = frame % cols

    this.material.map.offset.set(
      col * (this.frameWidth / this.material.map.image.width),
      1 - (row + 1) * (this.frameHeight / this.material.map.image.height)
    )
  }

  update(deltaTime) {
    this.currentFrame = (this.currentFrame + deltaTime * 10) % this.totalFrames
    this.setFrame(Math.floor(this.currentFrame))
  }
}

const animator = new SpriteAnimator(
  sprite,
  spriteMaterial.map,
  64, 64, 16 // 每帧64x64，共16帧
)

function animate() {
  requestAnimationFrame(animate)
  animator.update(clock.getDelta())
  renderer.render(scene, camera)
}
```

---

## 🏔️ 环境贴图（Environment Map）

环境贴图用于反射和光照：

### 1. 基础环境贴图

```javascript
// 使用RGBE格式（HDR）
new RGBELoader().load('/textures/hdr/studio.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.environment = texture // 影响所有PBR材质的反射
  
  // 或者应用到特定物体
  const material = new THREE.MeshStandardMaterial({
    envMap: texture,
    envMapIntensity: 1,
  })
})
```

### 2. CubeCamera：实时反射

```javascript
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256)
const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRenderTarget)
scene.add(cubeCamera)

// 需要反射的材质
const reflectiveMaterial = new THREE.MeshStandardMaterial({
  envMap: cubeRenderTarget.texture,
  metalness: 1,
  roughness: 0,
})

// 更新反射
function animate() {
  requestAnimationFrame(animate)
  
  // 隐藏自身，避免自身被反射
  reflectiveMesh.visible = false
  cubeCamera.position.copy(reflectiveMesh.position)
  cubeCamera.update(renderer, scene)
  reflectiveMesh.visible = true
  
  renderer.render(scene, camera)
}
```

### 3. PMREMGenerator：优化的环境贴图

```javascript
new RGBELoader().load('/textures/hdr/night.hdr', (texture) => {
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()
  
  // 生成预过滤的环境贴图
  const envMap = pmremGenerator.fromEquirectangular(texture).texture
  
  scene.environment = envMap
  pmremGenerator.dispose()
})
```

---

## 💡 性能优化建议

```markdown
## 纹理性能优化

1. **纹理尺寸**
   
   - 使用2的幂次方尺寸（256, 512, 1024, 2048）
   - 不要使用过大的纹理，移动设备限制在2048以内
   - 考虑纹理图集（Texture Atlas）合并小纹理

2. **压缩格式**
   
   - WebGL 2 支持 ETC2, ASTC 压缩
   - 使用 Basis Universal（.ktx2）跨平台压缩
   - DXT5/TGTC for Desktop, ASTC for Mobile

3. **多级渐远纹理（Mipmap）**
   
   - 启用 mipmap 减少远处纹理的闪烁
   - 正确设置 minFilter
   - 可以预计算 mipmap

4. **纹理缓存**
   
   - 相同URL的纹理会被缓存复用
   - 避免重复创建相同纹理的Texture对象

5. **异步加载**
   
   - 使用 LoadingManager 统一管理
   - 预加载关键纹理
   - 使用 PlaceholderTexture 占位

6. **释放纹理内存**
   
   texture.dispose() // 释放纹理对象
   material.dispose() // 释放关联材质
```

### 内存计算

```javascript
// 纹理内存计算公式
const width = 2048
const height = 2048
const bytesPerPixel = 4 // RGBA

const memoryBytes = width * height * bytesPerPixel // = 16MB
const memoryMB = memoryBytes / (1024 * 1024) // ≈ 16MB

// 带Mipmap的内存（×1.33倍）
const mipmapMemory = memoryBytes * (4 / 3) // ≈ 21MB
```

---

## 📦 完整示例：PBR纹理工作流

```javascript
import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

class PBRDemo {
  constructor() {
    this.init()
    this.setupLights()
    this.loadTextures()
    this.createObjects()
    this.setupControls()
    this.animate()
  }

  init() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 2, 5)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1
    document.body.appendChild(this.renderer.domElement)

    this.clock = new THREE.Clock()
  }

  setupLights() {
    // 环境光
    const ambient = new THREE.AmbientLight(0xffffff, 0.3)
    this.scene.add(ambient)

    // 主光源
    const main = new THREE.DirectionalLight(0xffffff, 2)
    main.position.set(5, 5, 5)
    this.scene.add(main)

    // 补光
    const fill = new THREE.DirectionalLight(0x8888ff, 0.5)
    fill.position.set(-5, 3, -5)
    this.scene.add(fill)
  }

  loadTextures() {
    this.loader = new THREE.TextureLoader()
    this.promises = []

    const loadTex = (name, path, repeat = 1) => {
      return new Promise((resolve) => {
        this.loader.load(path, (tex) => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping
          tex.repeat.set(repeat, repeat)
          tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
          this.textures[name] = tex
          resolve()
        })
      })
    }

    this.textures = {}

    // 使用占位符纹理演示
    const createPlaceholder = (name, color, size = 512) => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = color
      ctx.fillRect(0, 0, size, size)
      ctx.strokeStyle = '#ffffff33'
      for (let i = 0; i < size; i += 32) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, size)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(size, i)
        ctx.stroke()
      }
      const tex = new THREE.CanvasTexture(canvas)
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(2, 2)
      this.textures[name] = tex
    }

    createPlaceholder('albedo', '#8B4513')
    createPlaceholder('normal', '#8080ff')
    createPlaceholder('roughness', '#666666')
    createPlaceholder('metalness', '#808080')
  }

  createObjects() {
    // 加载HDR环境
    // new RGBELoader().load('/textures/hdr/studio.hdr', (tex) => {
    //   tex.mapping = THREE.EquirectangularReflectionMapping
    //   this.scene.environment = tex
    // })

    this.material = new THREE.MeshStandardMaterial({
      map: this.textures.albedo,
      normalMap: this.textures.normal,
      roughnessMap: this.textures.roughness,
      metalnessMap: this.textures.metalness,
      metalness: 0.8,
      roughness: 0.5,
    })

    // 创建多个球体展示不同属性
    const sphereGeo = new THREE.SphereGeometry(0.8, 64, 64)

    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(sphereGeo, this.material.clone())
      mesh.position.x = (i - 2) * 2.2
      this.scene.add(mesh)

      // 调整不同参数
      if (i === 0) mesh.material.metalness = 0
      if (i === 1) mesh.material.roughness = 0.1
      if (i === 2) mesh.material.roughness = 0.5
      if (i === 3) mesh.material.roughness = 0.9
      if (i === 4) mesh.material.roughness = 1
    }
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
  }

  animate() {
    requestAnimationFrame(() => this.animate())

    const delta = this.clock.getDelta()

    // 旋转物体
    this.scene.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.position.y === 0) {
        child.rotation.y += delta * 0.5
      }
    })

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}

new PBRDemo()
```

---

## 💬 总结

**Three.js 纹理系统的核心要点**：

```markdown
🖼️ Texture - 纹理对象，控制图像映射
📐 UV映射 - 2D坐标到3D表面的映射关系
🎨 PBR贴图 - Albedo、Normal、Roughness、Metalness、AO
🌐 环境贴图 - 影响反射和环境光照
📹 视频纹理 - 动态纹理效果
🎭 精灵动画 - 2D帧动画

核心流程：
加载图片 → 创建Texture → 应用到Material → 渲染

常用属性：
wrapS/wrapT - 平铺模式
repeat - 重复次数
offset - 偏移
rotation - 旋转
minFilter/magFilter - 过滤模式
anisotropy - 各向异性
```

**下期预告**：Three.js 粒子系统（Particles），创造漫天星辰！

---

**你在 Three.js 项目中用过哪些纹理技巧？遇到什么问题？欢迎在评论区交流！**

🎁 **福利时间**：

> 关注公众号「有头发的帅哥程序员」，回复「texture」领取《Three.js PBR纹理工作流》，包含全套贴图资源和高清HDR环境图！
