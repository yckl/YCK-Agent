/**
 * 权限控制 — 参考 Claude Code 的 permissions 模块
 */

import { getConfig } from '../config/index.js';
import type { ToolCategory } from '../../types/tool.js';

export type PermissionDecision = 'allow' | 'deny' | 'ask';

/** 检查工具是否需要用户确认 */
export function checkToolPermission(toolName: string, category: ToolCategory, isDangerous: boolean): PermissionDecision {
  const cfg = getConfig();
  const perms = cfg.permissions;

  // 危险操作总是需要确认
  if (isDangerous) return 'ask';

  // 按分类自动审批
  switch (category) {
    case 'file':
      // 读操作自动批准
      if (toolName.includes('read') || toolName === 'list_dir' || toolName === 'glob') {
        return perms.autoApproveRead ? 'allow' : 'ask';
      }
      // 写操作
      return perms.autoApproveWrite ? 'allow' : 'ask';

    case 'terminal':
      return perms.autoApproveTerminal ? 'allow' : 'ask';

    case 'search':
      return perms.autoApproveRead ? 'allow' : 'ask';

    case 'web':
      return perms.autoApproveNetwork ? 'allow' : 'ask';

    case 'code':
      return perms.autoApproveRead ? 'allow' : 'ask';

    case 'devops':
      return 'ask'; // DevOps 操作总是需要确认

    default:
      return 'ask';
  }
}
