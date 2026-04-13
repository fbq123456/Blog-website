---
title: 'React Hooks避坑指南：这10个错误让我加了3天班'
description: '从真实踩坑经历出发，深度解析React Hooks最常见的10大错误用法，帮你避开性能陷阱和死循环，写出更优雅的React代码。'
pubDate: '2026-04-13'
tags: ['React', '前端', 'JavaScript', 'TypeScript']
---

上周五下午 5 点，我以为可以准时下班。
然后我打开了同事的 PR，看到了这段代码：

```jsx
useEffect(() => {
  fetchUserData(userId)
}, [userId, fetchUserData]) // 💀 无限循环
```

我盯着屏幕沉默了三秒，然后默默拿出了充电器。

三天后，我整理出了这份"血泪避坑指南"。

---

## 为什么 Hooks 这么容易踩坑？

React Hooks 的设计很优雅，但它对"规则"的要求很严格。一旦用错，轻则警告，重则**无限循环直接崩页面**，更可怕的是**内存泄漏悄悄吃掉你的性能**。

今天这 10 个坑，我至少掉进去过 8 个。😭

---

## 坑 1：useEffect 依赖数组遗漏

### ❌ 错误写法

```jsx
const [count, setCount] = useState(0)
const [name, setName] = useState('')

useEffect(() => {
  console.log(`${name}: ${count}`) // 用到了name，但依赖没写
}, [count]) // 遗漏了name
```

### 问题

`name` 更新时，effect 不会重新执行，拿到的是旧值（**闭包陷阱**）。

### ✅ 正确写法

```jsx
useEffect(() => {
  console.log(`${name}: ${count}`)
}, [count, name]) // 完整列出所有依赖
```

> 💡 **小技巧**：安装 `eslint-plugin-react-hooks`，ESLint 会自动检测遗漏的依赖。

---

## 坑 2：依赖数组放了对象/数组导致无限循环

### ❌ 错误写法

```jsx
function UserCard({ userId }) {
  const options = { id: userId, type: 'user' } // 每次render都是新对象！

  useEffect(() => {
    fetchUser(options)
  }, [options]) // 💀 每次render都触发
}
```

### 问题

`options` 是组件内部定义的对象，每次 render 都会创建新的引用，导致 effect 无限执行。

### ✅ 正确写法

```jsx
// 方案1：直接用基本类型
useEffect(() => {
  fetchUser({ id: userId, type: 'user' })
}, [userId]) // 只依赖基本类型

// 方案2：用useMemo稳定引用
const options = useMemo(() => ({ id: userId, type: 'user' }), [userId])
useEffect(() => {
  fetchUser(options)
}, [options])
```

---

## 坑 3：把函数放进依赖数组

### ❌ 错误写法

```jsx
function SearchBar() {
  const handleSearch = keyword => {
    // 每次render都是新函数
    api.search(keyword)
  }

  useEffect(() => {
    handleSearch(defaultKeyword)
  }, [handleSearch]) // 💀 无限循环
}
```

### ✅ 正确写法

```jsx
// 方案1：函数不依赖组件状态，移到组件外部
const handleSearch = keyword => {
  api.search(keyword)
}

// 方案2：用useCallback稳定函数引用
const handleSearch = useCallback(keyword => {
  api.search(keyword)
}, []) // 或者写清楚依赖

useEffect(() => {
  handleSearch(defaultKeyword)
}, [handleSearch]) // ✅ 引用稳定，不会无限循环
```

---

## 坑 4：useCallback 滥用反而降性能

### ❌ 错误写法

```jsx
// 对每个函数都用useCallback
const handleClick = useCallback(() => {
  setCount(c => c + 1)
}, [])

const handleChange = useCallback(e => {
  setValue(e.target.value)
}, [])

const formatDate = useCallback(date => {
  return date.toLocaleDateString()
}, [])
```

### 问题

`useCallback` 本身也有开销（缓存+比较依赖），如果子组件没有用 `React.memo`，`useCallback` 完全没有意义。

### ✅ 使用原则

```jsx
// 只在这两种情况下用useCallback：
// 1. 函数作为props传给memo化的子组件
const MemoChild = React.memo(({ onClick }) => <button onClick={onClick}>click</button>)

const Parent = () => {
  const handleClick = useCallback(() => {
    doSomething()
  }, []) // ✅ 有意义：避免子组件不必要的重渲染

  return <MemoChild onClick={handleClick} />
}

// 2. 函数是useEffect的依赖
const fetchData = useCallback(async () => {
  const data = await api.get()
  setData(data)
}, [])

useEffect(() => {
  fetchData()
}, [fetchData]) // ✅ 有意义
```

---

## 坑 5：异步 useEffect 中的内存泄漏

### ❌ 错误写法

```jsx
useEffect(() => {
  fetch('/api/user')
    .then(res => res.json())
    .then(data => {
      setUser(data) // 💀 组件已卸载，还在setState
    })
}, [])
```

### 问题

组件卸载后，请求可能还在进行，`setUser` 在已卸载的组件上执行 → 内存泄漏 + 警告。

### ✅ 正确写法

```jsx
useEffect(() => {
  let cancelled = false // 取消标志

  fetch('/api/user')
    .then(res => res.json())
    .then(data => {
      if (!cancelled) {
        // 检查是否已取消
        setUser(data)
      }
    })

  return () => {
    cancelled = true // 清理时设置取消标志
  }
}, [])

// 更优雅：使用AbortController
useEffect(() => {
  const controller = new AbortController()

  fetch('/api/user', { signal: controller.signal })
    .then(res => res.json())
    .then(data => setUser(data))
    .catch(err => {
      if (err.name !== 'AbortError') throw err // 忽略取消错误
    })

  return () => controller.abort() // 组件卸载时取消请求
}, [])
```

---

## 坑 6：useState 的函数式更新被忽视

### ❌ 错误写法

```jsx
const [count, setCount] = useState(0)

// 在异步回调或useCallback中直接用count
const handleClick = useCallback(() => {
  setTimeout(() => {
    setCount(count + 1) // 💀 count是闭包里的旧值
  }, 1000)
}, []) // 依赖为空，count永远是0
```

### ✅ 正确写法

```jsx
const handleClick = useCallback(() => {
  setTimeout(() => {
    setCount(prev => prev + 1) // ✅ 函数式更新，永远是最新值
  }, 1000)
}, []) // 不需要依赖count
```

> 💡 **规则**：当新状态依赖旧状态时，**永远用函数式更新** `setState(prev => newValue)`。

---

## 坑 7：useRef 的值更新不触发重渲染（但你以为会）

### ❌ 错误写法

```jsx
const countRef = useRef(0)

const handleClick = () => {
  countRef.current += 1
  console.log(countRef.current) // 值是对的
}

return <div>Count: {countRef.current}</div> // 💀 页面永远不更新！
```

### 问题

`ref.current` 变化**不会触发重渲染**，所以界面上显示的值永远是初始值。

### ✅ 使用原则

```jsx
// useRef适合存储：
// 1. DOM引用
const inputRef = useRef(null)

// 2. 不需要显示在界面上的可变值（定时器ID、上一次的值等）
const timerRef = useRef(null)
const prevValueRef = useRef(value)

// 3. 需要在回调中访问最新值（配合useEffect）
const latestCallback = useRef(callback)
useEffect(() => {
  latestCallback.current = callback
})

// 需要显示在界面上 → 用useState
const [count, setCount] = useState(0)
```

---

## 坑 8：在循环/条件中使用 Hooks

### ❌ 错误写法

```jsx
function UserList({ users, isAdmin }) {
  if (isAdmin) {
    const [adminData, setAdminData] = useState(null) // 💀 条件中使用Hook
  }

  return users.map((user, index) => {
    const [selected, setSelected] = useState(false) // 💀 循环中使用Hook
    return <div key={user.id}>{user.name}</div>
  })
}
```

### ✅ 正确写法

```jsx
// Hooks必须在组件顶层调用
function UserList({ users, isAdmin }) {
  const [adminData, setAdminData] = useState(null) // ✅ 顶层

  // 条件逻辑放在Hook内部
  useEffect(() => {
    if (isAdmin) {
      fetchAdminData().then(setAdminData)
    }
  }, [isAdmin])

  return users.map(user => (
    <UserItem key={user.id} user={user} /> // 把有状态的逻辑拆到子组件
  ))
}

// 子组件
function UserItem({ user }) {
  const [selected, setSelected] = useState(false) // ✅ 子组件顶层
  return <div onClick={() => setSelected(!selected)}>{user.name}</div>
}
```

---

## 坑 9：useMemo 依赖计算开销评估不准

### ❌ 错误写法（过度优化）

```jsx
// 对简单计算也用useMemo，反而增加开销
const doubled = useMemo(() => count * 2, [count]) // 完全没必要
const text = useMemo(() => `Hello ${name}`, [name]) // 字符串拼接不需要memo
```

### ❌ 错误写法（该用没用）

```jsx
// 对真正昂贵的计算不用memo
const processedData = data.map(item => ({
  ...item,
  computed: expensiveCalculation(item) // 每次render都重算
}))
```

### ✅ 使用原则

```jsx
// useMemo适合：
// 1. 真正昂贵的计算（排序、过滤大数组等）
const sortedList = useMemo(() => {
  return [...data].sort((a, b) => b.score - a.score)
}, [data])

// 2. 引用稳定性（避免子组件重渲染）
const config = useMemo(
  () => ({
    theme: 'dark',
    userId: user.id
  }),
  [user.id]
)

// 简单计算直接写，不需要memo
const doubled = count * 2
```

---

## 坑 10：自定义 Hook 没有"use"前缀

### ❌ 错误写法

```jsx
// 没有"use"前缀
function fetchUserData(userId) {
  const [data, setData] = useState(null) // 💀 ESLint报错，Hooks规则检测失败

  useEffect(() => {
    api.getUser(userId).then(setData)
  }, [userId])

  return data
}
```

### ✅ 正确写法

```jsx
// 必须以"use"开头
function useUserData(userId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    api
      .getUser(userId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [userId])

  return { data, loading, error }
}

// 使用
function UserCard({ userId }) {
  const { data, loading, error } = useUserData(userId)

  if (loading) return <Spinner />
  if (error) return <Error message={error.message} />
  return <div>{data.name}</div>
}
```

---

## 总结：React Hooks 避坑速查表

| 坑                 | 问题           | 解决方案                           |
| ------------------ | -------------- | ---------------------------------- |
| useEffect 依赖遗漏 | 闭包拿到旧值   | 完整列出依赖 + ESLint              |
| 对象/数组在依赖中  | 无限循环       | 用基本类型 / useMemo 稳定引用      |
| 函数在依赖中       | 无限循环       | useCallback / 移到组件外           |
| useCallback 滥用   | 增加开销       | 只在 memo 子组件或 effect 依赖中用 |
| 异步 effect 泄漏   | 内存泄漏       | cleanup 函数 / AbortController     |
| 忘记函数式更新     | 读到旧 state   | `setState(prev => ...)`            |
| useRef 当 state 用 | 页面不更新     | 显示数据用 useState                |
| 条件/循环中用 Hook | 报错/行为异常  | 必须在顶层调用                     |
| useMemo 过度优化   | 增加复杂度     | 只对真正昂贵的计算用               |
| 自定义 Hook 无前缀 | Hooks 规则失效 | 必须以"use"开头                    |

---

## 最后

这些坑我踩过，你可能也踩过，但重要的是——**踩一次就够了**。

把这张速查表收藏起来，下次 Code Review 时掏出来，说不定能帮你避开一个周末的加班。😄

> 👇 **说说你踩过最惨的一次 Hooks 坑？评论区告诉我！**
>
> 觉得有用？关注「有头发的帅哥程序员」，每周分享真实踩坑记录 💪
>
> 🎁 关注后回复「资料」，领取《前端面试题大全》PDF，保住头发，快乐 coding！
