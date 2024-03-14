express 构建后台服务

# Swagger 注释规范

Swagger 是一种 API 文档规范，允许开发者通过注释来描述 API 接口，生成可视化的 API 文档。在 JavaScript 中使用 Swagger 注释的规范如下：

## 1. Swagger 注释块

在定义 API 接口的方法上方，使用注释块来描述该接口的信息。注释块以 `/**` 开始，以 `*/` 结束。例如：

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取所有用户
 *     description: 获取所有用户的信息列表
 *     responses:
 *       200:
 *         description: 成功返回用户列表
 *       404:
 *         description: 未找到用户
 */
```

## 2. Swagger 注释标签

在注释块中使用不同的标签来描述接口的各个方面，如路径、请求方法、参数、响应等。常见的标签包括：

- @swagger：标记注释块为 Swagger 格式。
- @summary：概要描述接口的功能。
- @description：详细描述接口的功能。
- @param：描述接口的参数，包括参数名、类型、描述等信息。
- @response：描述接口的响应，包括状态码、描述等信息。

## 3. Swagger 标记使用

在注释中使用标记来描述接口的各个方面。例如：

```javascript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 获取指定用户信息
 *     description: 根据用户 ID 获取用户的详细信息
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 用户 ID
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: 成功返回用户信息
 *       404:
 *         description: 未找到指定用户
 */
```
