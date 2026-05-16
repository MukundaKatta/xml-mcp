import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { xmlToJson, jsonToXml } from '../src/server.js';

test('parses simple element', () => {
  const v = xmlToJson('<root><a>hello</a></root>') as { root: { a: string } };
  assert.equal(v.root.a, 'hello');
});

test('captures attributes with @_ prefix', () => {
  const v = xmlToJson('<root id="42">hi</root>') as { root: { '@_id': string; '#text': string } };
  assert.equal(v.root['@_id'], '42');
});

test('handles arrays implicitly via repeated tags', () => {
  const v = xmlToJson('<root><item>a</item><item>b</item></root>') as { root: { item: string[] } };
  assert.deepEqual(v.root.item, ['a', 'b']);
});

test('serializes back to XML', () => {
  const out = jsonToXml({ root: { a: 'hello' } });
  assert.match(out, /<root>/);
  assert.match(out, /<a>hello<\/a>/);
});

test('attributes round-trip', () => {
  const v = xmlToJson('<root id="x"><child>1</child></root>') as Record<string, unknown>;
  const xml = jsonToXml(v);
  assert.match(xml, /id="x"/);
});

test('rejects non-object root in serializer', () => {
  assert.throws(() => jsonToXml('string' as unknown as object));
  assert.throws(() => jsonToXml(null as unknown as object));
});
