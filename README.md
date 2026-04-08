# YCK Agent — 全能 AI 智能体系统

🤖 支持多模型（OpenAI / Anthropic / DeepSeek）、多 Agent 协作、工具调用、插件扩展的 AI 助手。

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置 API Key
编辑 `config.json`，填入你的 API Key：
```json
{
  "providers": {
    "openai": { "apiKey": "sk-你的key" },
    "anthropic": { "apiKey": "sk-ant-你的key" }
  },
  "activeProvider": "openai"
}
```

或使用环境变量：
```bash
export OPENAI_API_KEY=sk-xxx
export ANTHROPIC_API_KEY=sk-ant-xxx
```

### 3. 启动
```bash
# 交互模式
npx tsx src/cli/index.ts

# 直接执行
npx tsx src/cli/index.ts "帮我分析当前目录的代码"

# 查看工具
npx tsx src/cli/index.ts tools

# 查看配置
npx tsx src/cli/index.ts config --show
```

## 功能特性

### 🛠️ 13+ 内置工具
| 工具 | 能力 |
|------|------|
| file_read | 读取文件内容 |
| file_write | 创建/写入文件 |
| file_edit | 精确编辑文件 |
| multi_edit | 批量多文件编辑 |
| terminal | 执行 Shell 命令 |
| grep | 文本搜索 |
| glob | 文件名匹配 |
| list_dir | 目录列表 |
| web_fetch | 网页抓取 |
| api_request | REST API 调用 |
| code_analysis | 代码分析 |
| git | Git 操作 |
| docker | Docker 操作 |

### 🤖 9 个预设 Agent
- 🧑‍💻 编程专家 — 全栈开发
- 📊 数据分析师 — 数据处理
- 🎨 设计师 — UI/UX
- 📝 文案 — 文档撰写
- 🔍 研究员 — 信息收集
- 🛠️ 运维 — DevOps
- 🔒 安全 — 安全审计
- 🧪 测试 — 自动化测试
- 🏗️ 架构师 — 系统设计

### 🔧 CLI 命令
```
/help     — 帮助
/tools    — 工具列表
/model    — 切换模型
/provider — 切换 Provider
/agent    — 切换 Agent
/clear    — 清空历史
/status   — 状态信息
/exit     — 退出
```

### 🔌 插件系统
在 `plugins/` 目录下创建 `plugin.json` 即可扩展工具和 Agent。

## 项目结构

```
src/
├── core/           ← 核心引擎
│   ├── config/     ← 配置管理（多 Provider）
│   ├── engine/     ← AI 对话引擎
│   ├── tools/      ← 工具系统（13+ 工具）
│   ├── agents/     ← 多 Agent（9 预设 + 协调器）
│   ├── plugins/    ← 插件加载器
│   ├── memory/     ← 会话/长期记忆
│   ├── mcp/        ← MCP 协议
│   └── utils/      ← 工具函数
├── cli/            ← CLI 终端界面
│   ├── ui/         ← 终端 UI
│   ├── commands/   ← 命令处理
│   └── repl.ts     ← 交互式 REPL
└── types/          ← 类型定义
```

## License
MIT
