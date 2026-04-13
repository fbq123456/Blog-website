---
title: '那些年，我写过的让人哭笑不得的Bug'
description: '作为程序员，谁还没写过几个让人怀疑人生的Bug呢？今天就来盘点一下我这些年踩过的那些坑，有的心酸，有的搞笑，保证让你感同身受！'
pubDate: '2026-04-17'
tags: ['前端', 'JavaScript', '程序员日常']
---

> 程序员甲："我这代码逻辑完美，怎么可能有问题？"
> 测试乙："你确定？"
> 程序员甲："确定！"
> 测试乙："那你解释一下，为什么用户下单后收到的是一箱矿泉水？"
> 程序员甲："......"

## 📍 Bug 1：价值百万的逗号

那年我刚入职，写了一个用户信息的 Excel 导出功能。上线第一天，财务部的同事打电话来，声音都在颤抖：

> "小王啊，你那个导出功能，是不是有点问题？"

我心想，能有什么问题？不就是循环遍历数据然后写入 Excel 吗？

结果打开导出的文件一看——**所有用户的电话号码都变成了日期格式！**

```javascript
// 原来的代码（错误版）
const exportData = users.map(user => {
  return {
    name: user.name,
    phone: user.phone, // 例如 "13812345678"
    email: user.email
  }
})
```

问题出在哪？原来某一批用户数据中，某个字段没处理，当 Excel 检测到一串数字时，自动把它识别成了日期。

**修复方案**：

```javascript
// 正确做法：确保所有数据都是字符串格式
const exportData = users.map(user => {
  return {
    name: String(user.name),
    phone: String(user.phone).replace(/^'/, ''), // 防止被识别为公式
    email: String(user.email)
  }
})
```

这一行代码的教训：**数据导出时，永远不要相信输入数据的格式。**

---

## 📍 Bug 2：凌晨 3 点的删库跑路

这是我的"高光时刻"，也是我的"至暗时刻"。

那天我信心满满地在服务器上执行了一条删除命令：

```bash
# 我以为我在删除测试环境的数据
rm -rf /data/logs/temp/*
```

执行完后，我心满意足地回去睡觉了。

第二天早上 9 点，产品经理发来一条消息：

> "小王，线上数据怎么全没了？"

我猛地坐起来——**我把生产环境的日志目录删了。更可怕的是，我发现那台服务器的日志目录软链接到了数据目录！**

```bash
# 真实情况是这样的
/data/logs -> /data/database  # 软链接！
```

所以当我执行 `rm -rf /data/logs/temp/*` 时，实际上删的是 `/data/database/temp/*`！

**血的教训**：

1. **删除命令前，先用 `pwd` 确认当前目录**
2. **删除前先用 `ls` 预览要删除的内容**
3. **生产环境的任何操作，都要三思而后行**
4. **最重要的：一定要做好备份！**

---

## 📍 Bug 3：那个让我被祭天的空指针

作为一个 Vue3 开发者，我一直以为自己已经掌握了 JavaScript 的精髓。直到有一天，用户反馈说：

> "点击按钮没反应，你们的 App 是不是挂了？"

我自信满满地打开控制台，开始调试。结果——**我自己的电脑上也复现了这个问题！**

```javascript
// 我的代码是这样的
const userInfo = data.userInfo // 假设从接口获取
console.log(userInfo.name) // Uncaught TypeError: Cannot read property 'name' of null
```

问题很简单：`data.userInfo` 是 `null`！因为接口返回的数据结构发生了变化，但我的代码没有处理这种情况。

**正确的做法**：

```javascript
// 方案一：可选链
const userName = data.userInfo?.name ?? '匿名用户'

// 方案二：默认值
const userName = (data.userInfo && data.userInfo.name) || '匿名用户'

// 方案三：防御性编程
const userName = (() => {
  if (!data.userInfo) {
    console.warn('用户信息为空，请检查接口')
    return '匿名用户'
  }
  return data.userInfo.name
})()
```

**从此以后，可选链 `?.` 成了我的标配。**

---

## 📍 Bug 4：那个让我被全公司群发的"测试邮件"

这是我写过的最尴尬的一个 Bug。

那天我正在测试邮件发送功能，代码是这样的：

```javascript
// 测试发送邮件
async function sendTestEmail() {
  const testEmail = 'test@example.com'
  const subject = '这是一封测试邮件'
  const content = '如果您收到这封邮件，说明测试成功！'

  await emailService.send(testEmail, subject, content)
}

// 批量发送用户邮件（我以为我没调用）
async function notifyAllUsers() {
  // 省略其他代码...
  // 我以为这段代码被注释掉了
  // await sendTestEmail();

  // 实际上...
  sendTestEmail() // 异步调用，没加 await，也没加 await 关键字
}
```

结果就是——**所有用户都收到了一封来自"test@example.com"的测试邮件**！

虽然邮件内容没什么问题，但用户们炸锅了：

> "你们的系统是不是被黑了？"
> "我的邮箱怎么收到奇怪邮件了？"
> "是不是我的信息泄露了？"

**教训**：

1. **测试环境和生产环境的代码一定要严格分离**
2. **发送邮件前，务必确认收件人列表**
3. **异步函数一定要正确处理 `await`**

---

## 📍 Bug 5：让我差点被开除的递归死循环

这是我职业生涯中最危险的一次 Bug。

那天我写了一个计算公司组织架构的函数：

```javascript
// 计算用户所属的部门（错误版）
function getDepartment(user) {
  if (user.parentId) {
    const parent = getUserById(user.parentId)
    return getDepartment(parent) // 递归调用
  }
  return user.department
}
```

看起来没问题对吧？但数据出事了——**有一条数据形成了循环引用**：

```
用户A -> 用户B -> 用户C -> 用户A（循环！）
```

结果就是——**服务器直接 OOM 崩溃了！**

```javascript
// 正确做法：添加visited集合，防止循环引用
function getDepartment(user, visited = new Set()) {
  if (visited.has(user.id)) {
    console.error(`检测到循环引用：${user.id}`)
    return user.department // 或者抛出异常
  }

  visited.add(user.id)

  if (user.parentId) {
    const parent = getUserById(user.parentId)
    return getDepartment(parent, visited)
  }

  return user.department
}
```

**这个 Bug 让我明白了：永远不要相信数据的完整性。**

---

## 🤔 如何避免这些 Bug？

### 1. 写代码前先思考

```
遇到问题时，先不要急着写代码。
问自己三个问题：
1. 我的输入可能有哪些异常情况？
2. 我的输出是否符合预期？
3. 我的代码在边界条件下会发生什么？
```

### 2. 使用 TypeScript

```typescript
// 用TypeScript可以让大部分Bug在编译期就被发现
interface User {
  name: string
  phone: string
  email?: string
}

// 有了类型定义，你就不容易传入错误的数据
function exportUser(user: User): ExportRow {
  return {
    name: user.name,
    phone: user.phone // TypeScript会帮你检查类型
  }
}
```

### 3. 养成写测试的习惯

```javascript
// 不要小看测试用例，它可能是你的救命稻草
describe('getDepartment', () => {
  it('应该正常返回用户部门', () => {
    const user = { id: '1', name: '张三', department: '技术部' }
    expect(getDepartment(user)).toBe('技术部')
  })

  it('应该处理循环引用的情况', () => {
    // 测试循环引用的边界情况
    const cyclicUser = { id: '1', parentId: '2' }
    const parentUser = { id: '2', parentId: '1' } // 形成循环

    // 应该返回默认值，而不是死循环
    expect(getDepartment(cyclicUser)).toBeDefined()
  })
})
```

### 4. 善用 ESLint 和 Prettier

```json
// .eslintrc.js
module.exports = {
  rules: {
    'no-unused-vars': 'error',      // 禁止未使用的变量
    'no-console': 'warn',           // 生产环境禁用console
    'prefer-const': 'error',        // 优先使用const
  }
};
```

---

## 💬 你的 Bug 故事呢？

写了这么多 Bug，我总结出一个道理：

> **Bug 是程序员最好的老师。每一个 Bug，都是一次成长的机会。**

重要的是：

1. 写 Bug 不可怕，可怕的是不敢面对 Bug
2. 复盘 Bug 比修复 Bug 更重要
3. 养成好习惯，才能减少 Bug

**你在开发过程中遇到过哪些奇葩 Bug？欢迎在评论区分享，一起避坑！**

---

🎁 **福利时间**：

> 关注公众号「有头发的帅哥程序员」，回复「资料」领取《前端 Bug 排查手册》，包含 50+真实 Bug 案例分析！
