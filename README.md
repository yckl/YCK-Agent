# 🤖 YCK-Agent: 高性能自主智能体框架与多模型协作系统
### Enterprise Autonomous Agent Runtime, Multi-LLM Orchestration & Terminal Copilot

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933.svg?style=flat-square&logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/React%20Ink-CLI%20TUI-61DAFB.svg?style=flat-square&logo=react" alt="React Ink" />
  <img src="https://img.shields.io/badge/LLMs-OpenAI%20%7C%20Claude%20%7C%20DeepSeek-FF6F00.svg?style=flat-square" alt="LLMs" />
  <img src="https://img.shields.io/badge/Protocol-MCP%20Ready-purple.svg?style=flat-square" alt="MCP Ready" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License" />
</p>

---

## 📌 项目概述 (Executive Summary)

**YCK-Agent** 是一套面向开发者终端的**生产级轻量化自主 AI 智能体（Autonomous Agent）运行框架与命令行协作助手**。

不同于传统仅能进行流式对话的单轮 Chatbot 工具，YCK-Agent 具备完整的 **「思考（Thought）➔ 规划（Planning）➔ 工具调用（Function Calling）➔ 自主观察验证（Observation）➔ 任务收敛（Reflection）」** Agentic Loop 自主循环能力。

系统原生支持 **OpenAI、Anthropic Claude、DeepSeek** 等多主流基础大模型，通过 **React Ink** 构建了极其优雅的终端交互式 TUI，并内置了包括代码语法分析、全局正则搜索、精准文件补丁（Diff）、Terminal 命令执行在内的 13+ 种安全沙箱化工具与可插拔插件协议。

---

## 🏛️ 系统架构设计 (System Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        人机终端交互层 (TUI & CLI Presentation)         │
│           React 19 + Ink 6 + Inquirer + Marked-Terminal + Chalk        │
├────────────────────────────────────────────────────────────────────────┤
│  - 沉浸式终端会话大屏 / 语法高亮代码差异 Diff 渲染                     │
│  - 多 Agent 角色动态切换弹窗 / 模型参数热载入面板                     │
│  - 任务状态转轮 (Ora Spinner) / Token 消耗与上下文压缩实时监控         │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Query & Message Dispatch
┌────────────────────────────────────▼───────────────────────────────────┐
│                        Agent 核心执行编排引擎 (Agent Core Engine)      │
├────────────────────────────────────────────────────────────────────────┤
│  [Prompt 编排与记忆管理]    动态 System Prompt / 智能会话剪枝与 Token 压缩│
│  [多角色专家路由]          架构师 / 工程师 / 渗透安全 / DevOps 9大预设角色│
│  [ReAct 调度循环中枢]      Thought-Action-Observation 闭环递归状态机     │
│  [Provider 抽象多路适配器] OpenAI GPT-4o / Claude 3.5 Sonnet / DeepSeek │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Tool Call Schema (Zod Validation)
┌────────────────────────────────────▼───────────────────────────────────┐
│                        执行环境与安全工具链 (Toolchain & Sandbox)      │
├────────────────────────────────────────────────────────────────────────┤
│  - 文件精准 Diff 补丁应用 (Diff Engine)   - AST 代码上下文分析器        │
│  - 正则模式匹配 (Grep / Glob)             - 沙箱终端命令执行器 (Exec)   │
│  - 网页内容动态提取 (Web Fetch)           - Git / Docker 自动化编排器   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 核心业务创新与工程亮点 (Key Innovations)

### 1. 深度 ReAct 自主规划与执行闭环 (ReAct Loop)
* 具备自我纠错与任务推进机制：Agent 在执行写文件或 Shell 命令后，会自动读取返回结果（Observation）。若执行出错或报错，自主进入修正流程重新调整参数重试，直至达成目标。

### 2. 9 大预设专业领域智能体矩阵 (Specialized Agents)
针对不同软件工程场景，内置精细化调优的专业系统提示词与专属工具权限：
* 🧑‍💻 **全栈工程师 (Developer)**：代码重构、功能新增、单元测试编写。
* 🏗️ **系统架构师 (Architect)**：模块解耦、技术选型方案评测、高层设计。
* 🔒 **安全审计员 (Security)**：代码审计、漏洞挖掘排查、敏感凭据扫描。
* 🛠️ **DevOps 工程师**：Docker 镜像编排、CI/CD 脚本、环境故障排除。
* 📊 **数据分析师 / 🔍 研究员 / 🎨 UI 设计师 / 🧪 自动化测试 / 📝 技术文案**

### 3. 基于 React Ink 的现代终端 UI 体验
* 告别简陋的单行命令行，利用 React 的组件化声明式开发，实现终端级窗口化渲染：
  * 支持交互式选项列表、多行输入、Markdown 格式化终端输出；
  * 原生支持彩色 Unified Diff 代码差异对比审查，让每一处代码修改一目了然。

### 4. 插件化工具扩展协议 (Pluggable Tool Architecture)
* 采用基于 Zod Schema 的类型安全工具定义标准，支持外部第三方能力热插拔：
  * 任何开发者仅需在 `plugins/` 目录下放置一个包含规范配置与执行逻辑的模块，即可无侵入扩展全新的 Agent 技能。

---

## 🧩 内置工具链矩阵 (Tooling Matrix)

| 工具名称 | 功能描述 | 核心安全策略 |
| :--- | :--- | :--- |
| `file_read` | 任意文本/源码文件的精准流式读取 | 目录穿越防护、大文件自动分块 |
| `file_write` | 全新文件创建与全量安全覆盖写入 | 覆盖前自动生成备份与提示 |
| `file_edit` | 基于字符精确定位的块状替换 (精确匹配) | 严格上下文校验，防止误删相邻代码 |
| `diff_apply` | 类似 Git Patch 的标准 Unified Diff 应用 | 补丁前置冲突检测 |
| `terminal` | 本地终端 Shell 命令受控执行 | 支持命令白名单与危险行为中断 |
| `grep / glob` | 全工程快速模式检索与文件树探查 | 忽略 `.git`、`node_modules` 避免性能爆炸 |
| `web_fetch` | 外部技术文档、网络静态页面爬取与提取 | 纯净 Markdown 自动清洗转换 |
| `git / docker` | 本地仓库分支操作、提交管理与容器状态查询 | 标准化 CLI 包装调用 |

---

## 🛠️ 技术选型栈 (Tech Stack)

* **开发语言**：TypeScript 5.x (ESM 模块化规范)
* **运行时基准**：Node.js >= 18.0.0
* **TUI 界面框架**：React 19 + Ink 6 + Marked-Terminal + Cli-Table3
* **LLM 客户端**：`@anthropic-ai/sdk`、`openai`、支持原生 DeepSeek 与兼容接口
* **Schema 验证**：Zod 3.25+
* **网络与代理**：Https-Proxy-Agent / Socks-Proxy-Agent (完美支持全球网络代理)

---

## 📂 源码工程目录结构 (Project Layout)

```text
YCK-Agent/
├── bin/
│   └── ycka.js                            # 全局 CLI 二进制执行入口
├── src/
│   ├── cli/                               # 终端 TUI 交互界面
│   │   ├── commands/                      # CLI 子命令处理器 (config, tools, exec)
│   │   ├── components/                    # React Ink 终端 UI 组件 (Header, Prompt, DiffBox)
│   │   └── screens/                       # 主会话屏幕、设置面板
│   ├── core/                              # 智能体核心引擎
│   │   ├── agents/                        # 9 大预设专业 Agent 角色定义与 Prompt
│   │   ├── config/                        # 配置管理器 (Provider 与 API 密钥动态加载)
│   │   ├── plugins/                       # 外部插件发现与加载调度器
│   │   ├── query/                         # 会话上下文压缩与 Token 预算调度
│   │   └── tools/                         # 13+ 沙箱化工具的具体实现
│   └── types/                             # 全局 TypeScript 接口与 Zod 模型
├── plugins/                               # 第三方自定义插件存放目录
├── config.json                            # 本地模型 Provider 配置
├── package.json
└── README.md                              # 工业级技术文档说明
```

---

## 🚀 快速启动与使用指南 (Quick Start)

### 1. 安装依赖与环境编译
```bash
git clone https://github.com/yckl/YCK-Agent.git
cd YCK-Agent
npm install
npm run build
```

---

### 2. 配置大模型 API 凭据
复制或直接编辑根目录的 `config.json`：
```json
{
  "providers": {
    "openai": {
      "apiKey": "sk-your-openai-key",
      "baseURL": "https://api.openai.com/v1"
    },
    "anthropic": {
      "apiKey": "sk-ant-your-claude-key"
    },
    "deepseek": {
      "apiKey": "sk-your-deepseek-key",
      "baseURL": "https://api.deepseek.com"
    }
  },
  "activeProvider": "openai"
}
```
*亦可通过环境变量快速注入：*
```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

---

### 3. 运行体验

#### 进入交互式沉浸 TUI 界面：
```bash
npx tsx src/cli/index.ts
```

#### 单行命令快速执行任务：
```bash
npx tsx src/cli/index.ts "扫描当前工程并生成架构重构建议"
```

#### 查看已启用的工具与插件：
```bash
npx tsx src/cli/index.ts tools
```

---

## ⌨️ 终端内快捷指令 (In-Session Slash Commands)

在交互式 TUI 会话中，可随时键入斜杠指令进行动态调节：
* `/help` — 显示系统操作指南
* `/agent` — 调出 9 大专家 Agent 切换面板 (如切换为安全专家或架构师)
* `/model` — 动态切换当前模型型号 (如 GPT-4o, Claude 3.5 Sonnet)
* `/provider` — 快速切换 API 厂商 (OpenAI / Anthropic / DeepSeek)
* `/tools` — 检查当前 Agent 所拥有的工具链权限
* `/clear` — 清空上下文历史并重置会话
* `/status` — 查看当前内存、Token 预算消耗与网络代理状态

---

## 📄 开源许可证 (License)

本项目遵循 [MIT License](LICENSE) 开源协议。
