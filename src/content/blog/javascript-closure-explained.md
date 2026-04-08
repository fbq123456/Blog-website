---
title: '前端面试必问的闭包，我这次终于讲明白了'
description: '从最基础的作用域讲起，用生活比喻和代码示例层层递进，彻底搞懂 JavaScript 闭包的本质、原理和实际应用场景。'
pubDate: 2026-04-22
tags:
  - JavaScript
  - 前端
  - 面试
---

> 闭包是前端面试中被问烂的知识点，但很多人只是背了定义，遇到实际场景还是一脸懵。这篇文章帮你从根上理解，不背概念也能讲清楚。

---

## 先说结论

**闭包 = 函数 + 它能访问的外部变量**

就这么简单。别被那些复杂的定义吓到了。

---

## 一、先理解「作用域」

要懂闭包，先得懂作用域。这是地基。

### 1.1 什么是作用域？

作用域就是**变量的"活动范围"**。就像人有自己的"势力范围"：

```javascript
function 外卖员() {
  const 我的订单 = '黄焖鸡米饭'
  
  function 顾客() {
    console.log(我要吃什么)  // ❌ 报错：我要吃什么 is not defined
    console.log(我的订单)     // ✅ 可以访问：黄焖鸡米饭
  }
  
  顾客()  // 输出：黄焖鸡米饭
}
```

规则很简单：

1. **内部函数可以访问外部函数的变量**（顾客可以看到外卖员的订单）
2. **外部函数不能访问内部函数的变量**（外卖员不知道顾客想吃什么）
3. **函数执行完毕后，函数内部的变量会被销毁**（外卖员送完单，订单就没了）

### 1.2 但闭包打破了第 3 条规则

```javascript
function 送外卖() {
  let 订单 = '黄焖鸡米饭'
  
  return function 记住订单() {
    return 订单
  }
}

const fn = 送外卖()
console.log(fn())  // 输出：黄焖鸡米饭
```

按理说，`送外卖` 执行完了，`订单` 应该被销毁了对吧？

**但它没有**。因为返回的 `记住订单` 函数还在"记着"这个变量。

**这就是闭包。**

---

## 二、用更通俗的话理解

想象一下：

> 你去图书馆借了一本书（`外部变量`）。
> 
> 正常情况下，图书馆闭馆了，书应该被还回去（`变量被销毁`）。
> 
> 但你偷偷把书带回了家（`内部函数记住了这个变量`），图书馆关门了，你手里的书还在。
> 
> **这本书就是闭包。**

```javascript
function 图书馆() {
  let 书 = 'JavaScript 高级程序设计'
  
  function 借书人() {
    console.log('我借了：' + 书)
  }
  
  return 借书人
}

const 读者 = 图书馆()
读者()  // 输出：我借了：JavaScript 高级程序设计
// 此时图书馆函数已经执行完毕，但 '书' 变量还在
```

---

## 三、闭包的正式定义（现在你能看懂了）

> **闭包是一个函数，它能够访问其词法作用域中的变量，即使这个函数在其词法作用域之外执行。**

翻译成人话：

> **闭包就是一个"记住了它出生地"的函数。哪怕它被拿到别处执行，它还记得家乡的每个变量。**

---

## 四、经典面试题逐个击破

### 4.1 for 循环 + setTimeout（最经典）

```javascript
for (var i = 0; i < 5; i++) {
  setTimeout(function() {
    console.log(i)
  }, 1000)
}
// 输出：5 5 5 5 5
```

**为什么？**

因为 `var` 是函数作用域，不是块级作用域。循环结束后 `i = 5`，所有定时器都读到同一个 `i`。

**用闭包解决：**

```javascript
// 方法一：IIFE 闭包
for (var i = 0; i < 5; i++) {
  (function(j) {
    setTimeout(function() {
      console.log(j)
    }, 1000)
  })(i)
}
// 输出：0 1 2 3 4

// 方法二：let（最推荐）
for (let i = 0; i < 5; i++) {
  setTimeout(function() {
    console.log(i)
  }, 1000)
}
// 输出：0 1 2 3 4
```

`let` 有块级作用域，每次循环都会创建一个新的 `i`，本质上也形成了闭包。

### 4.2 计数器函数

```javascript
function createCounter() {
  let count = 0
  
  return {
    increment() { return ++count },
    decrement() { return --count },
    getCount() { return count }
  }
}

const counter = createCounter()
console.log(counter.increment())  // 1
console.log(counter.increment())  // 2
console.log(counter.decrement())  // 1
console.log(counter.getCount())   // 1

// 外部无法直接访问 count
console.log(count)  // ❌ ReferenceError: count is not defined
```

**这就是闭包的"数据私有化"能力。**

`count` 变量被"封装"在闭包里，外部只能通过暴露的方法来操作它。

### 4.3 函数柯里化

```javascript
function multiply(a) {
  return function(b) {
    return a * b
  }
}

const double = multiply(2)
const triple = multiply(3)

console.log(double(5))   // 10
console.log(triple(5))   // 15
```

`double` 和 `triple` 分别"记住了"不同的 `a` 值（2 和 3），这就是闭包在起作用。

### 4.4 防抖函数

```javascript
function debounce(fn, delay) {
  let timer = null  // ← 这个 timer 被闭包"记住"了
  
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 使用
const search = debounce((keyword) => {
  console.log('搜索：' + keyword)
}, 500)

input.addEventListener('input', (e) => {
  search(e.target.value)
})
```

每次调用返回的函数时，都能访问到同一个 `timer` 变量，这就是闭包。

---

## 五、闭包的实际应用场景

### 5.1 数据私有化（模块模式）

```javascript
// 模拟私有属性
function createUser(name) {
  let _loginCount = 0  // 私有变量
  
  return {
    name,               // 公开属性
    login() {           // 公开方法
      _loginCount++
      console.log(`${name} 登录了，第 ${_loginCount} 次`)
    },
    getLoginCount() {
      return _loginCount  // 只读访问
    }
  }
}

const user = createUser('FBQ')
user.login()          // FBQ 登录了，第 1 次
user.login()          // FBQ 登录了，第 2 次
user._loginCount = 99 // ❌ 无效，外部无法修改
console.log(user.getLoginCount())  // 2
```

### 5.2 React Hooks 的本质

React 的 `useState` 就是闭包的典型应用：

```javascript
function MyComponent() {
  const [count, setCount] = useState(0)
  
  // count 和 setCount 被 React 内部的闭包"记住"了
  // 每次组件重新渲染，闭包保证了每个组件实例有自己独立的 count
}
```

### 5.3 缓存/记忆化

```javascript
function memoize(fn) {
  const cache = {}  // ← 缓存被闭包保持
  
  return function(...args) {
    const key = JSON.stringify(args)
    if (cache[key]) {
      console.log('从缓存读取')
      return cache[key]
    }
    const result = fn.apply(this, args)
    cache[key] = result
    console.log('计算并存入缓存')
    return result
  }
}

const expensiveCalc = memoize((n) => {
  console.log('正在计算...')
  return n * n
})

expensiveCalc(5)  // 正在计算... → 25
expensiveCalc(5)  // 从缓存读取 → 25
expensiveCalc(10) // 正在计算... → 100
```

### 5.4 回调函数中的状态保持

```javascript
function setupButton(buttonId, message) {
  const button = document.getElementById(buttonId)
  
  button.addEventListener('click', function() {
    // 这个函数记住了 message 参数（闭包）
    console.log(message)
  })
}

setupButton('btn1', '你点击了按钮1')
setupButton('btn2', '你点击了按钮2')
```

每个事件处理函数都"记住"了自己对应的 `message`。

---

## 六、闭包的陷阱

### 6.1 内存泄漏

```javascript
function 问题代码() {
  const hugeData = new Array(1000000).fill('big data')
  
  return function() {
    console.log(hugeData.length)  // 闭包引用了 hugeData
  }
}

const fn = 问题代码()
// hugeData 永远不会被回收，因为 fn 还在引用它

// 解决：用完就释放
fn = null  // 现在 hugeData 可以被垃圾回收了
```

### 6.2 this 指向问题

```javascript
const obj = {
  name: 'FBQ',
  sayHi() {
    setTimeout(function() {
      console.log(this.name)  // ❌ undefined（this 指向 window）
    }, 100)
    
    setTimeout(() => {
      console.log(this.name)  // ✅ 'FBQ'（箭头函数继承外层 this）
    }, 100)
  }
}
```

**解决方式**：

```javascript
// 方法一：箭头函数
// 方法二：bind
setTimeout(function() {
  console.log(this.name)
}.bind(this), 100)

// 方法三：保存 this
const self = this
setTimeout(function() {
  console.log(self.name)
}, 100)
```

---

## 七、面试答题模板

面试官问「什么是闭包？」，你可以这样回答：

> 闭包是指一个函数能够访问它定义时所在的词法作用域中的变量，即使这个函数在其他地方执行。
>
> 比如一个函数 A 内部定义了函数 B，函数 B 引用了函数 A 的变量，那么函数 B 就形成了一个闭包。
>
> 闭包的常见应用场景包括：数据私有化、防抖节流、柯里化、模块模式等。
>
> 使用闭包时要注意内存泄漏问题，不再使用的闭包应该手动置为 null，让垃圾回收器回收相关变量。

---

**总结一句话**：闭包不神秘，就是一个"有记忆"的函数。理解了作用域，闭包就是自然而然的产物。

---

**关注「有头发的帅哥程序员」**，每周分享前端面试干货 💻

**闭包你学废了吗？评论区做道题测试一下** 👇

```javascript
// 这段代码输出什么？
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}
```

转发给正在准备面试的朋友，一起通关 🚀
