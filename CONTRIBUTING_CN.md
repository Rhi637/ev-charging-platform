# 贡献指南 (GreenCharge)

> 中文版 · [English](CONTRIBUTING.md)

感谢你对 **GreenCharge** 电动汽车充电管理平台感兴趣！❤️

我们欢迎各种形式的贡献——修复 Bug、添加新功能、改进文档，或提出建议。请在提交 Issue 或 Pull Request 之前阅读本指南。

---

## 目录

- [行为准则](#行为准则)
- [快速开始](#快速开始)
- [开发环境搭建](#开发环境搭建)
- [贡献方式](#贡献方式)
- [提交信息规范](#提交信息规范)
- [Pull Request 流程](#pull-request-流程)
- [编码规范](#编码规范)
- [报告 Bug](#报告-bug)
- [功能建议](#功能建议)
- [报告安全漏洞](#报告安全漏洞)
- [开发者原创声明 DCO](#开发者原创声明-dco)
- [社区交流](#社区交流)
- [许可证](#许可证)

---

## 行为准则

我们致力于为所有参与者提供一个友好、包容的环境。请：

- 在所有交流中保持尊重和专业
- 欢迎不同的观点和经验
- 提供建设性的反馈
- 以社区利益为重
- 对他人保持同理心

不可接受的行为包括骚扰、歧视和任何形式的辱骂。如果你遇到或目睹此类行为，请向项目维护者举报。

---

## 快速开始

1. **Fork 本仓库** 到你的 GitHub 账号
2. **Clone 你的 Fork** 到本地
   ```bash
   git clone https://github.com/YOUR_USERNAME/ev-charging-platform.git
   cd ev-charging-platform
   ```
3. **安装依赖**
   ```bash
   npm install
   ```
4. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 开发环境搭建

### 环境要求

- **Node.js** v18 或更高版本
- **npm** v9 或更高版本
- **Git**
- 基本的 React、Node.js 和全栈开发知识

### 添加上游仓库

```bash
git remote add upstream https://github.com/Rhi637/ev-charging-platform.git
```

### 配置环境变量

在根目录创建 `.env.local` 文件：

```
REACT_APP_API_URL=http://localhost:5000
# 根据需要添加其他环境变量
```

### 启动开发服务器

```bash
npm run dev:all
```

- 前端：`http://localhost:5173`
- 后端 API：`http://localhost:3001`

### 运行测试

```bash
npm test
```

### 项目构建

```bash
npm run build
```

---

## 贡献方式

### 贡献类型

| 类型 | 说明 |
|------|------|
| 🐛 **Bug 报告** | 帮助我们发现和修复问题 |
| 💡 **功能建议** | 建议新功能或改进 |
| 💻 **代码贡献** | 提交 Bug 修复或新功能 |
| 📖 **文档改进** | 改进或添加文档 |
| 🧪 **测试** | 帮助测试功能并报告问题 |
| ⚡ **性能优化** | 优化代码和提升效率 |

### 找到可以做的事情

1. 查看 [Issues](https://github.com/Rhi637/ev-charging-platform/issues) 页面
2. 关注标签：`good first issue` 或 `help wanted`
3. 在 Issue 下留言表示你想要做，避免重复劳动
4. 对于较大的改动，先在 [Discussions](https://github.com/Rhi637/ev-charging-platform/discussions) 中讨论方案

### 分支命名

```bash
# 功能开发
git checkout -b feature/功能名称

# Bug 修复
git checkout -b fix/Bug描述
```

使用清晰描述性的分支名称。

---

## 提交信息规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 格式

```
<类型>(<范围>): <主题>

<正文>

<页脚>
```

### 类型说明

| 类型 | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更改 |
| `style` | 代码格式调整（不影响代码逻辑） |
| `refactor` | 重构（既非新功能也非 Bug 修复） |
| `perf` | 性能优化 |
| `test` | 添加或更新测试 |
| `chore` | 构建过程、依赖、工具配置 |

### 示例

```
feat(充电): 新增直流快充支持

添加了直流快充站的支持，包含实时功率管理。
- 实现直流充电协议处理器
- 添加功率流优化算法
- 集成电网管理系统

Closes #123
```

```
fix(认证): 修复 Token 过期问题

修复了认证 Token 无法正确刷新导致用户被意外登出的 Bug。

Fixes #456
```

---

## Pull Request 流程

### 提交前

1. **同步上游仓库：**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **运行测试和代码检查：**
   ```bash
   npm test
   npm run lint
   ```

3. 确保项目可正常构建：
   ```bash
   npm run build
   ```

### 提交 PR

1. 推送到你的 Fork：
   ```bash
   git push origin feature/你的功能名称
   ```
2. 在主仓库上创建 Pull Request——PR 模板会自动加载
3. 完整填写模板：
   - 清晰描述改动内容
   - 关联相关 Issue（使用 `Closes #123` 或 `Fixes #456`）
   - 列出破坏性变更（如有）
   - UI 变更请附带截图
4. 确保所有 CI/CD 检查通过
5. 等待审核（通常 **1-3 天**内回复）

### PR 检查清单

- [ ] 我的代码遵循项目代码风格
- [ ] 我已添加适当的测试
- [ ] 我已添加必要的文档
- [ ] 所有测试通过，构建无错误

### 审核流程

- 至少需要一位维护者批准
- 所有 CI/CD 检查必须通过
- 及时响应审核反馈
- 鼓励对复杂改动进行讨论

---

## 编码规范

### JavaScript / React

- 使用 ES6+ 语法
- 使用有意义的变量名和函数名
- 保持函数简短、职责单一
- 复杂逻辑需添加 JSDoc 注释
- 提交前移除 `console.log` 调试语句

### 代码质量

- 遵循项目现有代码风格（已配置 ESLint）
- 编写清晰易读的代码——可读性优先
- 避免代码重复（DRY 原则）
- 新增代码应有较高的测试覆盖率

### 注释规范

```javascript
// ✅ 好的注释：解释"为什么"，而非"是什么"
// 使用指数退避策略避免重试时对服务器造成压力
const delay = Math.pow(2, retryCount) * 1000;

// ❌ 避免：显而易见的注释
// i 自增
i++;
```

---

## 报告 Bug

### 报告前

1. 检查[已有 Issues](https://github.com/Rhi637/ev-charging-platform/issues)，避免重复
2. 尝试用最新代码复现 Bug
3. 收集相关信息（浏览器版本、Node.js 版本、复现步骤）

### Bug 报告模板

```markdown
**问题描述**
清晰描述 Bug 现象

**复现步骤**
1. 打开 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 出现错误

**预期行为**
应该发生什么

**实际行为**
实际发生了什么

**运行环境**
- 操作系统: [如 Windows 11, macOS 14]
- Node.js 版本: [如 18.17.0]
- 浏览器: [如 Chrome 120]

**截图**
如有，请附上截图辅助说明
```

---

## 功能建议

### 建议前

1. 查看[已有 Issues](https://github.com/Rhi637/ev-charging-platform/issues) 和 [Discussions](https://github.com/Rhi637/ev-charging-platform/discussions)
2. 考虑该功能是否符合项目定位

### 功能建议模板

```markdown
**功能描述**
清晰描述你希望添加的功能

**动机**
为什么需要添加此功能？

**建议方案**
你建议如何实现？

**考虑的替代方案**
其他你考虑过的方案

**补充说明**
任何其他相关的背景信息或示例
```

---

## 报告安全漏洞

⚠️ **请勿公开提交安全漏洞报告。**

如果你发现安全漏洞，请通过以下方式私下报告：

- **GitHub Security Advisory：** 使用仓库的["Report a vulnerability"](https://github.com/Rhi637/ev-charging-platform/security/advisories/new)功能
- **电子邮件：** 直接联系维护者（联系方式见仓库）

我们认真对待所有安全报告，并将尽快响应。请：

- 在公开披露前给予合理的修复时间
- 提供详细的复现步骤
- 不要超出证明漏洞所需的范围进行操作

---

## 开发者原创声明 (DCO)

向本项目贡献代码，即表示你声明：

1. 该贡献全部或部分由你创建，你有权在 Apache 2.0 许可证下提交
2. 你理解你的贡献将采用 [Apache License 2.0](LICENSE) 许可证
3. 你授予贡献内容所需的必要专利权利

我们遵循 [Developer Certificate of Origin](https://developercertificate.org/) (DCO) 模式。在提交信息中添加 `Signed-off-by` 即表示你确认以上内容：

```bash
git commit -s -m "feat: 添加新功能"
```

---

## 社区交流

| 渠道 | 用途 |
|------|------|
| [**GitHub Issues**](https://github.com/Rhi637/ev-charging-platform/issues) | Bug 报告 & 功能请求 |
| [**GitHub Discussions**](https://github.com/Rhi637/ev-charging-platform/discussions) | 提问、想法交流、一般讨论 |
| **Pull Requests** | 代码审核 & 协作 |

### 获取帮助

- 在 [GitHub Discussions](https://github.com/Rhi637/ev-charging-platform/discussions) 发帖提问
- 查阅 [README](README.md) 和已有文档
- 搜索相关 Issue 寻找类似问题

---

## 额外资源

- [GitHub 贡献指南](https://docs.github.com/en/contributing)
- [开源最佳实践](https://opensource.guide/)
- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [开发者原创声明 (DCO)](https://developercertificate.org/)

---

## 许可证

向 GreenCharge 贡献代码，即表示你同意你的贡献将采用 [Apache License 2.0](LICENSE) 许可证。

---

再次感谢你为 GreenCharge 做出贡献！🎉🚗⚡
