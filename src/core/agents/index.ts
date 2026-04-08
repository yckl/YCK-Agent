/**
 * Agent 模块导出
 */

export { Agent } from './Agent.js';
export { Coordinator, coordinator } from './Coordinator.js';
export { presetAgents } from './presets/index.js';

import { coordinator } from './Coordinator.js';
import { presetAgents } from './presets/index.js';

/** 注册所有预设 Agent */
export function registerPresetAgents(): void {
  coordinator.registerAll(presetAgents);
}
