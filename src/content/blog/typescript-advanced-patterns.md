---
title: 'TypeScript 高级类型技巧'
description: '挖掘 TypeScript 类型系统的潜力，掌握条件类型、映射类型等高级用法。'
pubDate: 2026-03-15
tags:
  - TypeScript
  - 类型系统
---

TypeScript 的类型系统是其最强大的特性之一。除了基础的类型注解，它还提供了条件类型、映射类型、模板字面量类型等高级特性，让我们能够编写更加精确和灵活的类型代码。

## 条件类型

条件类型允许我们根据输入类型来决定输出类型，类似三元运算符：

```typescript
type IsString<T> = T extends string ? true : false

type A = IsString<'hello'> // true
type B = IsString<42> // false
```

### 实用案例：提取函数返回值类型

内置的 `ReturnType` 工具类型就是条件类型的典型应用：

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never
```

## 映射类型

映射类型允许我们基于已有类型创建新类型，对类型的每个属性进行转换：

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}

type Partial<T> = {
  [P in keyof T]?: T[P]
}
```

> TypeScript 自带的 `Partial`、`Required`、`Readonly` 等工具类型都是基于映射类型实现的。

## 模板字面量类型

TypeScript 4.1 引入的模板字面量类型让我们可以在类型层面操作字符串：

```typescript
type EventName<T extends string> = `on${Capitalize<T>}`

type ClickEvent = EventName<'click'> // 'onClick'
type HoverEvent = EventName<'hover'> // 'onHover'
```

## 实用工具类型组合

```typescript
// 从对象类型中排除函数类型
type NonFunction<T> = {
  [K in keyof T]: T[K] extends Function ? never : T[K]
}[keyof T]

// 将所有属性转换为可选（深度）
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
```

## 总结

高级类型技巧让 TypeScript 不仅仅是一个类型检查器，更是一个类型编程语言。合理使用这些特性可以：

- 提供更精确的类型推断
- 减少运行时错误
- 提升开发体验（更好的 IDE 支持）
- 构建更健壮的公共 API
