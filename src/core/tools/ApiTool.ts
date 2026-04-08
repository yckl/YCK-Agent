/**
 * REST API 调用工具
 */
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class ApiTool extends BaseTool {
  name = 'api_request';
  description = '发送 HTTP API 请求（GET/POST/PUT/DELETE），处理 JSON 数据。';
  category = 'web' as const;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], description: 'HTTP 方法' },
      url: { type: 'string', description: '请求 URL' },
      headers: { type: 'object', description: '请求头（JSON 对象）' },
      body: { type: 'string', description: '请求体（JSON 字符串）' },
    },
    required: ['method', 'url'],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    const method = (args.method as string) || 'GET';
    const url = args.url as string;
    const headers = (args.headers as Record<string, string>) || {};
    const body = args.body as string;

    try {
      const opts: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        signal: ctx.abortSignal || AbortSignal.timeout(30000),
      };
      if (body && method !== 'GET') opts.body = body;

      const resp = await fetch(url, opts);
      const contentType = resp.headers.get('content-type') || '';
      let responseBody: string;

      if (contentType.includes('json')) {
        responseBody = JSON.stringify(await resp.json(), null, 2);
      } else {
        responseBody = await resp.text();
      }

      if (responseBody.length > 20000) {
        responseBody = responseBody.slice(0, 20000) + '\n...(截断)';
      }

      return this.success(`${method} ${url}\nStatus: ${resp.status} ${resp.statusText}\n\n${responseBody}`);
    } catch (err: any) {
      return this.error(err.message);
    }
  }
}
