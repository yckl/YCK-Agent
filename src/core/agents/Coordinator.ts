/**
 * 多 Agent 协调器 — 参考 Claude Code 的 Orchestrator 模式
 * 主 Agent 分析任务 → 分解 → 分配给专业 Agent → 汇总结果
 */

import { chatEngine } from '../query/QueryEngine.js';
import { getConfig } from '../config/index.js';
import { Agent } from './Agent.js';
import type { AgentConfig } from '../../types/config.js';
import type { AgentContext, AgentEvent, CoordinatorPlan, CoordinatorTask } from '../../types/agent.js';
import type { Message } from '../../types/message.js';

export class Coordinator {
  private agents = new Map<string, Agent>();

  /** 注册 Agent */
  registerAgent(config: AgentConfig): void {
    this.agents.set(config.name, new Agent(config));
  }

  /** 批量注册 */
  registerAll(configs: AgentConfig[]): void {
    for (const cfg of configs) this.registerAgent(cfg);
  }

  /** 获取 Agent */
  getAgent(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  /** 获取所有 Agent */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /** 获取 Agent 列表摘要 */
  getAgentSummary(): string {
    return this.getAllAgents()
      .map(a => `${a.config.icon || '🤖'} ${a.config.displayName} (${a.config.name}) - ${a.config.description}`)
      .join('\n');
  }

  /** 协调执行 — 分析任务并分配给最合适的 Agent */
  async *coordinate(task: string, context: AgentContext): AsyncGenerator<AgentEvent> {
    // 步骤 1: 分析任务，制定计划
    yield { type: 'status', agentName: 'coordinator', content: '分析任务中...' };

    const plan = await this.planTask(task);

    if (!plan || plan.tasks.length === 0) {
      // 简单任务，直接执行
      const defaultAgent = this.selectBestAgent(task);
      yield { type: 'status', agentName: 'coordinator', content: `分配给 ${defaultAgent.config.displayName}` };
      yield* defaultAgent.run(task, context);
      return;
    }

    // 步骤 2: 按计划执行子任务
    yield { type: 'message', agentName: 'coordinator', content: `\n📋 任务计划: ${plan.goal}\n策略: ${plan.strategy}\n子任务: ${plan.tasks.length} 个\n` };

    const results: Record<string, string> = {};

    for (const subTask of plan.tasks) {
      // 检查依赖
      if (subTask.dependencies?.length) {
        const unmet = subTask.dependencies.filter(d => !results[d]);
        if (unmet.length > 0) {
          yield { type: 'error', agentName: 'coordinator', content: `任务 ${subTask.id} 的依赖未完成: ${unmet.join(', ')}` };
          continue;
        }
      }

      const agent = this.agents.get(subTask.assignedAgent);
      if (!agent) {
        yield { type: 'error', agentName: 'coordinator', content: `Agent "${subTask.assignedAgent}" 未找到` };
        continue;
      }

      yield { type: 'status', agentName: 'coordinator', content: `执行子任务 [${subTask.id}]: ${subTask.description} → ${agent.config.displayName}` };

      let subResult = '';
      const subContext: AgentContext = {
        ...context,
        parentAgentId: 'coordinator',
        sharedMemory: { ...context.sharedMemory, previousResults: results },
      };

      for await (const event of agent.run(subTask.description, subContext)) {
        yield event;
        if (event.type === 'done') subResult = event.content || '';
      }

      results[subTask.id] = subResult;
    }

    // 步骤 3: 汇总结果
    yield { type: 'message', agentName: 'coordinator', content: '\n📊 所有子任务完成，结果汇总:' };
    for (const [id, result] of Object.entries(results)) {
      const preview = result.slice(0, 200);
      yield { type: 'message', agentName: 'coordinator', content: `\n[${id}]: ${preview}${result.length > 200 ? '...' : ''}` };
    }

    yield { type: 'done', agentName: 'coordinator', content: JSON.stringify(results) };
  }

  /** AI 分析任务，生成执行计划 */
  private async planTask(task: string): Promise<CoordinatorPlan | null> {
    const agentList = this.getAgentSummary();
    const planPrompt = `你是一个任务协调器。分析以下任务，决定是否需要拆分给多个 Agent。

可用 Agent:
${agentList}

任务: ${task}

如果任务简单（只需一个 Agent），返回 JSON: {"simple": true}
如果需要多个 Agent 协作，返回 JSON:
{
  "goal": "总目标",
  "strategy": "执行策略",
  "tasks": [
    {"id": "t1", "description": "子任务描述", "assignedAgent": "agent名称", "dependencies": []},
    {"id": "t2", "description": "子任务描述", "assignedAgent": "agent名称", "dependencies": ["t1"]}
  ]
}

只返回 JSON，不要其他文字。`;

    try {
      let response = '';
      for await (const event of chatEngine.chat(
        [{ role: 'user', content: planPrompt, timestamp: Date.now() }],
        { maxTokens: 1000, temperature: 0.3 }
      )) {
        if (event.type === 'text_delta') response += event.content || '';
      }

      // 提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.simple) return null;
      return parsed as CoordinatorPlan;
    } catch {
      return null;
    }
  }

  /** 选择最适合任务的 Agent */
  private selectBestAgent(task: string): Agent {
    const taskLower = task.toLowerCase();
    const agents = this.getAllAgents();

    // 关键词匹配
    const keywords: Record<string, string[]> = {
      'code': ['代码', 'code', '编程', '函数', '类', '实现', 'bug', '修复', '重构', 'typescript', 'javascript', 'python'],
      'data': ['数据', 'data', '分析', 'csv', 'excel', '统计', '图表', '可视化'],
      'design': ['设计', 'design', 'UI', 'UX', '界面', '样式', 'CSS', '布局'],
      'writer': ['文档', '文案', '写作', 'write', '翻译', '总结', '报告', 'markdown'],
      'research': ['搜索', '查找', '研究', 'research', '调查', '对比'],
      'devops': ['部署', 'deploy', 'docker', 'CI/CD', '运维', '服务器', 'nginx'],
      'security': ['安全', 'security', '漏洞', '加密', '认证'],
      'test': ['测试', 'test', '单元测试', '集成测试'],
      'architect': ['架构', '设计模式', '系统设计', '技术选型'],
    };

    for (const [agentName, kws] of Object.entries(keywords)) {
      if (kws.some(kw => taskLower.includes(kw))) {
        const agent = agents.find(a => a.config.name === agentName);
        if (agent) return agent;
      }
    }

    // 默认返回第一个 Agent（通常是 code Agent）
    return agents[0] || new Agent({ name: 'default', displayName: '通用Agent', description: '通用', systemPrompt: '你是一个全能助手。' });
  }
}

/** 全局协调器实例 */
export const coordinator = new Coordinator();
