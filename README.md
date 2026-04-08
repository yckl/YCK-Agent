# YCK Agent

全能 AI 智能体系统，支持多模型、多 Agent 协作、工具调用、插件扩展。

## 功能特性

- **多模型支持**：OpenAI / Anthropic / DeepSeek 等主流模型
- **多 Agent 协作**：内置 9 种预设 Agent，支持自定义扩展
- **工具调用**：内置 13+ 工具（文件操作、代码分析、Web 搜索、Git、Docker 等）
- **插件系统**：在 `plugins/` 目录放置插件即可扩展功能
- **交互界面**：终端 UI + 命令行模式，支持 MCP 协议

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置

编辑 `config.json`，填入你的 API Key：

```json
{
  "providers": {
    "openai": { "apiKey": "sk-xxx" },
    "anthropic": { "apiKey": "sk-ant-xxx" }
  },
  "activeProvider": "openai"
}
```

或使用环境变量：

```bash
export OPENAI_API_KEY=sk-xxx
export ANTHROPIC_API_KEY=sk-ant-xxx
```

### 启动

```bash
# 交互模式
npx tsx src/cli/index.ts

# 直接执行
npx tsx src/cli/index.ts "帮我分析代码"

# 查看工具列表
npx tsx src/cli/index.ts tools

# 查看配置
npx tsx src/cli/index.ts config --show
```

## 内置工具

| 工具 | 能力 |
|------|------|
| file_read | 读取文件 |
| file_write | 写入文件 |
| file_edit | 精确编辑 |
| terminal | 执行命令 |
| grep / glob | 搜索文件 |
| web_fetch | 网页抓取 |
| code_analysis | 代码分析 |
| git / docker | Git/Docker 操作 |

## 预设 Agent

- 🧑‍💻 编程专家 — 全栈开发
- 📊 数据分析师 — 数据处理
- 🎨 设计师 — UI/UX
- 📝 文案 — 文档撰写
- 🔍 研究员 — 信息收集
- 🛠️ 运维 — DevOps
- 🔒 安全 — 安全审计
- 🧪 测试 — 自动化测试
- 🏗️ 架构师 — 系统设计

## 项目结构

```
src/
├── core/           # 核心引擎
│   ├── agents/     # 多 Agent 系统
│   ├── tools/     # 工具集
│   ├── config/    # 配置管理
│   ├── plugins/   # 插件加载
│   └── query/     # 查询与压缩
├── cli/            # 命令行界面
│   ├── commands/   # CLI 命令
│   ├── screens/    # 界面组件
│   └── components/ # UI 组件
└── types/          # 类型定义
```

## 插件开发

在 `plugins/` 下创建插件：

```
plugins/
└── your-plugin/
    └── plugin.json   # 插件配置
```

## 命令行命令

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

## License

MIT
