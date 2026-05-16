# xml-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/xml-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/xml-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)

MCP server: convert between XML and JSON. Backed by `fast-xml-parser`.
Attributes survive as `@_`-prefixed keys, so the round-trip is lossless.

## Tools

- `to_json` — `<root id="42">hi</root>` → `{ root: { "@_id": "42", "#text": "hi" } }`
- `to_xml` — JSON object back to XML.

## Configure

```json
{ "mcpServers": { "xml": { "command": "npx", "args": ["-y", "@mukundakatta/xml-mcp"] } } }
```

## License

MIT.
