/**
 * 网页内容抓取工具
 */
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class WebFetchTool extends BaseTool {
  name = 'web_fetch';
  description = '抓取网页内容，将 HTML 转为纯文本返回。';
  category = 'web' as const;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      url: { type: 'string', description: '要抓取的 URL' },
      maxLength: { type: 'number', description: '最大返回字符数（默认 10000）' },
    },
    required: ['url'],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    const url = args.url as string;
    const maxLength = (args.maxLength as number) || 10000;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'YCK-Agent/1.0' },
        signal: ctx.abortSignal || AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return this.error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let text: string;

      if (contentType.includes('application/json')) {
        const json = await response.json();
        text = JSON.stringify(json, null, 2);
      } else {
        const html = await response.text();
        // 简单 HTML → 文本转换
        text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ')
          .trim();
      }

      if (text.length > maxLength) {
        text = text.slice(0, maxLength) + '\n...(内容被截断)';
      }

      return this.success(`URL: ${url}\n\n${text}`);
    } catch (err: any) {
      return this.error(err.message);
    }
  }
}
