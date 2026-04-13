---
title: 'Three.js 深入解析：Animation（动画系统）'
description: 'Three.js的动画系统是创建3D交互体验的核心。本篇文章将深入解析AnimationMixer、KeyframeTrack、AnimationClip等核心概念，带你掌握Three.js动画编程的精髓。'
pubDate: '2026-04-26'
tags: ['Three.js', '3D', 'WebGL']
---

> "一个不会动的 3D 场景，就像一张静态 PPT。"
> "但如果加了动画...那就是一场视觉盛宴！"

## 🎬 动画系统的核心概念

Three.js 的动画系统由几个核心组件构成：

```markdown
📌 AnimationMixer - 动画播放器，负责播放动画
📌 AnimationClip - 动画片段，包含关键帧数据
📌 KeyframeTrack - 关键帧轨道，存储属性变化
📌 PropertyBinding - 属性绑定，将动画应用到 3D 对象
```

**它们的关系**：

```
AnimationClip（动画片段）
    ↓
    ├── KeyframeTrack（位置轨道）
    ├── KeyframeTrack（旋转轨道）
    └── KeyframeTrack（缩放轨道）
    ↓
AnimationMixer（播放器）→ 作用到 3D对象
```

---

## 🚀 最简单的动画：旋转的立方体

先来看一个最基础的例子——让立方体旋转：

```javascript
import * as THREE from 'three'

// 1. 创建场景
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// 2. 创建立方体
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 })
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

// 3. 简单动画（不用AnimationMixer）
function animate() {
  requestAnimationFrame(animate)

  // 让立方体旋转
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01

  renderer.render(scene, camera)
}
animate()
```

**运行结果**：立方体会持续旋转。

---

## 💫 AnimationMixer：专业的动画播放器

上面的例子用 `requestAnimationFrame` 手动更新，但 Three.js 提供了更强大的**AnimationMixer**：

```javascript
import * as THREE from 'three'
import { AnimationMixer, AnimationClip, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three'

// 创建场景...（省略基础代码）

// 1. 创建立方体
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 })
const cube = new THREE.Mesh(geometry, material)
cube.name = 'cube' // 命名，方便查找
scene.add(cube)

// 2. 创建动画片段
// 位置关键帧：从 (0,0,0) → (3,0,0) → (3,3,0) → (0,3,0)
const positionKF = new VectorKeyframeTrack(
  '.position', // 目标属性路径
  [0, 1, 2, 3], // 时间点（秒）
  [
    0,
    0,
    0, // 时间点0：初始位置
    3,
    0,
    0, // 时间点1：向右移动
    3,
    3,
    0, // 时间点2：向上移动
    0,
    3,
    0 // 时间点3：向左移动
  ]
)

// 旋转关键帧
const quaternionKF = new QuaternionKeyframeTrack(
  '.quaternion',
  [0, 1, 2, 3],
  [
    ...new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)).toArray(),
    ...new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)).toArray(),
    ...new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI * 2, 0)).toArray(),
    ...new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI * 4, 0)).toArray()
  ]
)

// 3. 创建动画片段
const clip = new AnimationClip('moveAround', 4, [positionKF, quaternionKF])

// 4. 创建动画混合器
const mixer = new AnimationMixer(cube)

// 5. 将动画片段添加到混合器
const action = mixer.clipAction(clip)

// 6. 播放动画
action.play()

// 7. 在渲染循环中更新混合器
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)

  // 更新动画混合器，传入自上次更新以来的时间增量
  mixer.update(clock.getDelta())

  renderer.render(scene, camera)
}
animate()
```

**核心流程**：

```
创建 KeyframeTrack（关键帧数据）
    ↓
创建 AnimationClip（封装动画片段）
    ↓
创建 AnimationMixer（播放器）
    ↓
添加 Action（动作）
    ↓
在渲染循环中 update
```

---

## 🎯 KeyframeTrack：关键帧轨道详解

### 常用关键帧类型

```javascript
// 1. VectorKeyframeTrack - 位置、缩放等向量属性
const positionTrack = new VectorKeyframeTrack(
  '.position',
  [0, 1, 2], // 时间（秒）
  [0, 0, 0, 5, 0, 0, 0, 5, 0] // 对应时间点的值
)

// 2. QuaternionKeyframeTrack - 旋转
const rotationTrack = new QuaternionKeyframeTrack(
  '.quaternion',
  [0, 1, 2],
  [
    ...new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)).toArray(),
    ...new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)).toArray(),
    ...new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI * 2, 0)).toArray()
  ]
)

// 3. NumberKeyframeTrack - 颜色、数值等
const colorTrack = new NumberKeyframeTrack('.material.opacity', [0, 1, 2], [1, 0.5, 1])

// 4. StringKeyframeTrack - 材质、纹理切换等
const materialTrack = new StringKeyframeTrack(
  '.material.map',
  [0, 1],
  ['texture1.jpg', 'texture2.jpg']
)
```

### 插值模式

Three.js 默认使用平滑的样条插值，但你也可以指定其他模式：

```javascript
// 可用的插值方式
const InterpolationModes = {
  Linear: 0, // 线性
  Discrete: 1, // 离散（直接跳转）
  CatmullRom: 2, // Catmull-Rom样条（平滑）
  Cubic: 3, // 三次样条
  Centripetal: 4 // 张力样条
}

// 使用线性插值（逐帧播放动画序列图）
const track = new VectorKeyframeTrack(
  '.position',
  [0, 1, 2, 3, 4],
  [0, 0, 1, 0, 2, 0, 3, 0, 4, 0],
  THREE.InterpolationModes.Linear // 指定插值模式
)
```

---

## 🎮 AnimationAction：动画动作控制

AnimationAction 提供丰富的控制方法：

```javascript
// 创建Action
const action = mixer.clipAction(clip)

// 1. 播放控制
action.play() // 开始播放
action.stop() // 停止播放
action.pause() // 暂停
action.reset() // 重置到开始

// 2. 循环模式
action.setLoop(THREE.LoopOnce, 0) // 播放一次
action.setLoop(THREE.LoopRepeat, 3) // 重复3次
action.setLoop(THREE.LoopPingPong, 2) // 往返播放2次

// 3. 淡入淡出（避免动画突变）
action.fadeIn(0.5) // 0.5秒淡入
action.fadeOut(0.5) // 0.5秒淡出

// 4. 时间控制
action.startAt(2) // 从第2秒开始
action.setDuration(1) // 只播放1秒
action.setLoop(THREE.LoopOnce) // 单次播放

// 5. 速度控制
action.setEffectiveTimeScale(2) // 2倍速播放
action.setEffectiveTimeScale(0.5) // 0.5倍速

// 6. 权重控制（混合多个动画）
action.setEffectiveWeight(1) // 完全权重
```

**实战示例：多个动画平滑切换**：

```javascript
// 假设有一个角色，需要从"站立"动画切换到"行走"动画
const standAction = mixer.clipAction(standClip, character)
const walkAction = mixer.clipAction(walkClip, character)
const runAction = mixer.clipAction(runClip, character)

// 当前播放站立动画
standAction.play()

// 需要切换到行走动画
function switchToWalk() {
  // 行走动画淡入的同时，站立动画淡出
  walkAction.reset()
  walkAction.play()
  walkAction.fadeIn(0.3) // 0.3秒淡入
  standAction.fadeOut(0.3) // 0.3秒淡出
}

// 需要切换到奔跑动画
function switchToRun() {
  runAction.reset()
  runAction.play()
  runAction.fadeIn(0.2) // 快速淡入
  walkAction.fadeOut(0.2) // 快速淡出
}
```

---

## ⚡ AnimationMixer：深入理解

### 多个对象使用同一个 Mixer

```javascript
// 混合器可以同时管理多个对象的动画
const mixer = new AnimationMixer()

// 多个对象共享同一个混合器
const action1 = mixer.clipAction(clip1, object1)
const action2 = mixer.clipAction(clip2, object2)
const action3 = mixer.clipAction(clip3, object3)

// 在同一个渲染循环中更新
function animate() {
  requestAnimationFrame(animate)
  mixer.update(deltaTime) // 所有动画同步更新
  renderer.render(scene, camera)
}
```

### 嵌套 Mixer

```javascript
// 对于有骨骼动画的角色，可能需要嵌套的Mixer
const rootMixer = new AnimationMixer(rootObject)
const detailMixer = new AnimationMixer(detailObject)

// 在渲染循环中更新所有Mixer
function animate() {
  requestAnimationFrame(animate)
  rootMixer.update(deltaTime)
  detailMixer.update(deltaTime)
  renderer.render(scene, camera)
}
```

### 获取当前动画状态

```javascript
// 监听动画事件
action.onStart = () => console.log('动画开始')
action.onLoop = () => console.log('循环一次结束')
action.onComplete = () => console.log('动画播放完毕')

// 或者通过mixer获取当前时间
console.log(mixer.time) // 混合器运行的总时间
console.log(action.time) // 当前action的本地时间
console.log(action.timeScale) // 当前播放速度
console.log(action.paused) // 是否暂停
console.log(action.enabled) // 是否启用
```

---

## 📊 骨骼动画与顶点动画

### 骨骼动画（SkinnedMesh）

Three.js 的动画系统最初是为骨骼动画设计的：

```javascript
// 加载带骨骼动画的模型（如.glb/.gltf）
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loader = new GLTFLoader()
loader.load('robot.glb', gltf => {
  const model = gltf.scene
  scene.add(model)

  // 从模型中获取动画数据
  const mixer = new AnimationMixer(model)

  // GLTF文件中的动画会被解析为AnimationClip数组
  gltf.animations.forEach(clip => {
    mixer.clipAction(clip).play()
  })

  // 保存mixer以便在渲染循环中更新
  model.userData.mixer = mixer
})

// 在渲染循环中更新
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()

  // 更新场景中所有带动画的对象
  scene.traverse(obj => {
    if (obj.userData.mixer) {
      obj.userData.mixer.update(delta)
    }
  })

  renderer.render(scene, camera)
}
```

### 顶点动画（MorphTargets）

除了骨骼动画，还可以用 MorphTargets 做顶点动画：

```javascript
// 创建带变形目标的几何体
const geometry = new THREE.BoxGeometry(1, 1, 1, 8, 8, 8)

// 添加变形目标
const spherePositions = new THREE.SphereGeometry(1, 16, 16).attributes.position
const positions = geometry.attributes.position

for (let i = 0; i < positions.count; i++) {
  positions.setXYZ(i, spherePositions.getX(i), spherePositions.getY(i), spherePositions.getZ(i))
}

// 使用morphAttributes
geometry.morphAttributes.position = [positions]
const material = new THREE.MeshStandardMaterial({
  color: 0x00ff88,
  morphTargets: true // 启用变形目标
})

const mesh = new THREE.Mesh(geometry, material)

// 创建变形动画
const morphInfluences = new Float32Array([0]) // 变形影响值
const track = new NumberKeyframeTrack(
  '.morphTargetInfluences[0]', // 直接引用morph属性
  [0, 0.5, 1],
  [0, 1, 0] // 变形从0→1→0
)

const clip = new AnimationClip('morph', 1, [track])
const mixer = new AnimationMixer(mesh)
mixer.clipAction(clip).play()
```

---

## 🎨 高级技巧

### 1. 自定义 Easing 函数

```javascript
// 使用缓动函数让动画更自然
import * as TWEEN from '@tweenjs/tween.js'

// 或者手动实现
const easingFunctions = {
  // 缓入
  easeIn: t => t * t,

  // 缓出
  easeOut: t => t * (2 - t),

  // 缓入缓出
  easeInOut: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
}

// 创建带缓动的关键帧
function createEasedTrack(name, values, duration) {
  const times = values.map((_, i) => i / (values.length - 1))
  const easedValues = values.map((v, i) => {
    const t = times[i]
    return v * easingFunctions.easeInOut(t)
  })

  return new VectorKeyframeTrack(name, times, easedValues)
}
```

### 2. 动态修改动画

```javascript
// 在动画播放过程中动态修改关键帧
const track = action.getClip().tracks[0]

// 修改某个时间点的值
track.trackValues[3] = 10 // 修改第2个关键帧的X值

// 重要：修改后需要重新更新依赖
action.reset()
action.play()
```

### 3. 动画权重混合

```javascript
// 同时播放多个动画，通过权重混合
const idleAction = mixer.clipAction(idleClip)
const talkAction = mixer.clipAction(talkClip)

// 设置权重
idleAction.setEffectiveWeight(0.7) // 70%的待机动画
talkAction.setEffectiveWeight(0.3) // 30%的说话动画

idleAction.play()
talkAction.play()

// 在渲染循环中更新混合器即可
```

---

## 🔧 性能优化建议

```markdown
## 动画性能优化

1. **减少关键帧数量**

   - 关键帧不需要太多，插值会自动填补
   - 建议：2-3 个关键帧定义一个完整动作

2. **复用 AnimationClip**

   - 同一个 AnimationClip 可以绑定到多个对象
   - action = mixer.clipAction(clip, differentObject);

3. \*\*合理使用 updateShadow】

   - 如果动画不涉及阴影，可以跳过阴影更新

4. **控制动画数量**

   - 同时播放的动画不宜过多
   - 优先播放权重高的动画

5. **使用 requestAnimationFrame**
   - 确保动画在最佳时机更新
   - 避免在后台标签页浪费资源
```

---

## 📦 完整示例：复杂角色动画系统

```javascript
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

class CharacterController {
  constructor() {
    this.mixer = new THREE.AnimationMixer(this.model)
    this.actions = {}
    this.activeAction = null
  }

  loadAnimations(animations) {
    animations.forEach(clip => {
      this.actions[clip.name] = this.mixer.clipAction(clip)
    })
  }

  playAnimation(name, fadeTime = 0.3) {
    const newAction = this.actions[name]
    if (!newAction) return

    if (this.activeAction) {
      // 淡出当前动画，淡入新动画
      newAction.reset()
      newAction.play()
      newAction.fadeIn(fadeTime)
      this.activeAction.fadeOut(fadeTime)
    } else {
      newAction.play()
    }

    this.activeAction = newAction
  }

  update(deltaTime) {
    this.mixer.update(deltaTime)
  }
}

// 使用
const loader = new GLTFLoader()
loader.load('character.glb', gltf => {
  const character = new CharacterController(gltf.scene)
  character.loadAnimations(gltf.animations)

  // 默认播放待机动画
  character.playAnimation('Idle')

  // 根据输入切换动画
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') character.playAnimation('Jump')
    if (e.code === 'KeyW') character.playAnimation('Walk')
    if (e.code === 'ShiftLeft') character.playAnimation('Run')
  })
})
```

---

## 💬 总结

**Three.js 动画系统的核心要点**：

```markdown
🎬 AnimationMixer - 动画播放器，管理所有动画
📼 AnimationClip - 动画片段，包含轨道数据
🎞️ KeyframeTrack - 关键帧轨道，定义属性变化
🎮 AnimationAction - 动画动作，控制播放状态

核心流程：
KeyframeTrack → AnimationClip → AnimationMixer → update(deltaTime)

常用控制：
play() / stop() / pause() / reset()
fadeIn() / fadeOut()
setLoop() / setTimeScale() / setWeight()
```

**下期预告**：Three.js 纹理系统（Texture），让 3D 世界更真实！

---

**你在 Three.js 项目中用过动画系统吗？遇到什么问题？欢迎在评论区交流！**

🎁 **福利时间**：

> 关注公众号「有头发的帅哥程序员」，回复「threejs」领取《Three.js 动画实战项目》，包含角色动画、粒子效果、骨骼绑定等完整案例！
