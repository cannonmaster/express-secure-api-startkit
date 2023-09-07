# Express API 安全模板

这是一个基于 Express.js 的 API 模板，旨在提供一个安全和可靠的 express api 起点，以构建您的 Node.js 应用程序。

## 特性

- 可配置请求的 payload 最大尺寸
- 使用 Helmet 中间件加强安全性, 添加 CSP。
- 防止跨站脚本攻击（XSS）和 HTTP 参数污染（HPP）。
- 使用 Rate Limit 和 Slow Down 中间件来防止恶意请求和拒绝服务攻击。
- 支持 CSRF 保护，以防止跨站请求伪造攻击。
- 集成了 Winston 日志记录器，可记录应用程序的重要事件。
- 提供了一个验证码生成和验证示例。
- 集成了 CORS 支持，允许跨域请求。
- 支持通过环境变量配置。

## 由于每一个项目的不同，用户侧根据项目可以进一步优化的地方

- 对所有用户的输入进行过滤
- 处理数据之前再次进行验证比如验证数据的类型
- 只返回需要的数据
- 对于对象可以防止用户对对象进行扩展，可通过 preventExtension 完成
- 可以使用 acl 进行控制如果有必要
- 不要使用不安全的函数比如 eval
- 使用扫描工具进行项目扫描避免 The Regular Expression Denial of Service (ReDoS) 进攻

## 使用说明

1. 安装依赖：

   ```bash
   npm install
   ```

2. 更改配置文件名
   .example.env -> .env

3. 启动应用程序：

   ```bash
   npm start
   ```

   应用程序将在默认端口 3000 上运行。您可以在`.env`文件中配置端口和其他环境变量。

4. 访问 CSRF 令牌：

   发出 GET 请求以获取 CSRF 令牌：

   ```bash
   curl http://localhost:3000/csrf-token
   ```

5. 访问受保护的端点：

   发出 POST 请求以访问受保护的端点：

   ```bash
   curl -X POST -H "Content-Type: application/json" -H "X-CSRF-Token: your-csrf-token-here" -d '{"data": "example"}' http://localhost:3000/protected_endpoint
   ```

   请替换`your-csrf-token-here`为从第 3 步获取的 CSRF 令牌。

6. 访问验证码：

   发出 GET 请求以获取验证码：

   ```bash
   curl http://localhost:3000/captcha
   ```

   您将获得一个 SVG 格式的验证码图像。

## 环境变量

您可以使用`.env`文件配置应用程序的环境变量。以下是一些可用的环境变量示例：

- `PORT`：指定应用程序的端口号。
- `WINDOW_MS`：Rate Limit 和 Slow Down 中间件的窗口时间。
- `MAX_REQUESTS_PER_IP`：每个 IP 地址允许的最大请求次数。
- `DELAY_AFTER`：Slow Down 中间件在延迟之前允许的请求数量。
- `DELAY_MS`：Slow Down 中间件的延迟时间。
- `LOGGING_FILE_NAME`：日志文件的名称。
- `LOGGING_LEVEL`：日志级别。

## 注意事项

- 在生产环境中，请配置适当的安全性，例如 HTTPS、安全的 CORS 设置等。
- 请根据您的应用程序需求进行自定义和进一步的安全性增强。

## 许可证

此项目根据 MIT 许可证进行许可 - 有关详细信息，请参阅[LICENSE](https://opensource.org/license/mit/)文件。
