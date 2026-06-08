#!/usr/bin/env node
/**
 * xml MCP server. Two tools: `to_json`, `to_xml`.
 *
 * Backed by `fast-xml-parser`. Preserves attributes (prefixed with `@_`),
 * keeps CDATA intact, and rebuilds equivalent XML on the way back.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

const VERSION = '0.1.0';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  trimValues: true,
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '  ',
});

export function xmlToJson(xml: string): unknown {
  if (typeof xml !== 'string') {
    throw new Error('XML input must be a string');
  }
  // fast-xml-parser does not validate during parse, so malformed markup
  // (e.g. mismatched tags) would otherwise be silently accepted.
  const valid = XMLValidator.validate(xml);
  if (valid !== true) {
    throw new Error(`invalid XML: ${valid.err.msg} (line ${valid.err.line})`);
  }
  return parser.parse(xml);
}

export function jsonToXml(value: unknown): string {
  if (typeof value !== 'object' || value === null) {
    throw new Error('JSON root must be an object');
  }
  return builder.build(value);
}

const server = new Server({ name: 'xml', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'to_json',
    description:
      'Parse XML and return a JSON-compatible value. Attributes are prefixed with `@_`.',
    inputSchema: {
      type: 'object',
      properties: { xml: { type: 'string' } },
      required: ['xml'],
    },
  },
  {
    name: 'to_xml',
    description:
      'Serialize a JSON object back to XML. Keys starting with `@_` become attributes.',
    inputSchema: {
      type: 'object',
      properties: { value: { type: 'object' } },
      required: ['value'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === 'to_json') {
      const a = args as unknown as { xml: string };
      return jsonResult({ value: xmlToJson(a.xml) });
    }
    if (name === 'to_xml') {
      const a = args as unknown as { value: unknown };
      return textResult(jsonToXml(a.value));
    }
    return errorResult('unknown tool: ' + name);
  } catch (err) {
    return errorResult('xml tool failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function textResult(text: string) {
  return { content: [{ type: 'text', text }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`xml MCP server v${VERSION} ready on stdio\n`);
}
