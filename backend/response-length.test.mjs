import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';

if (process.env.RIGHTSHORE_TEST_CHILD) {
  globalThis.fetch = async (url, options) => {
    process.send({ request: JSON.parse(options.body) });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Internal reasoning', thought: true }, { text: 'Generated reply' }] } }] }));
  };
  await import('./src/server.js');
} else {
  test('HTTP generation honors each length, preserves context and media, validates values and leaves legacy requests unchanged', async () => {
    const child = fork(new URL(import.meta.url), [], { env: { ...process.env, RIGHTSHORE_TEST_CHILD: '1', GEMINI_API_KEY: 'test-only', PORT: '4399' }, silent: true });
    try {
      await once(child.stdout, 'data');
      const base = { action: 'Reply', text: 'Please confirm the date, venue and transport.', tone: 'professional', language: 'French', instruction: 'We are discussing a team visit.', attachedMedia: { base64: 'aGVsbG8=', mimeType: 'image/png' } };
      for (const [length, budget] of [['short', 768], ['balanced', 2048], ['long', 6144], [undefined, undefined]]) {
        const pending = once(child, 'message');
        const response = await fetch('http://localhost:4399/v1/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...base, responseLength: length }) });
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { text: 'Generated reply' });
        const [{ request }] = await pending;
        assert.equal(request.generationConfig?.maxOutputTokens, budget);
        assert.equal(request.contents[0].parts[0].text, base.text);
        assert.equal(request.contents[0].parts[1].inlineData.data, base.attachedMedia.base64);
        const system = request.systemInstruction.parts[0].text;
        for (const value of [base.tone, base.language, base.instruction]) assert.ok(system.includes(value));
        if (length === 'long') assert.match(system, /every relevant point/);
        if (length === undefined) assert.ok(!system.includes('RESPONSE LENGTH'));
      }
      for (const [action, context, expected] of [
        ['Reply', 'Prefer concise wording', true],
        ['Email', '  ', false],
        ['Translate', 'Prefer concise wording', false]
      ]) {
        const pending = once(child, 'message');
        const response = await fetch('http://localhost:4399/v1/ai', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...base, action, personalContext: context })
        });
        assert.equal(response.status, 200);
        const [{ request }] = await pending;
        assert.equal(request.contents[0].parts[2]?.text, expected ? JSON.stringify({ personalContext: context }) : undefined);
        assert.equal(request.systemInstruction.parts[0].text.includes('separate personalContext field'), expected);
      }
      for (const body of [
        { ...base, personalContext: 'x'.repeat(601) },
        { ...base, personalContext: { preference: 'concise' } },
        { ...base, action: 'constructor' }
      ]) {
        const response = await fetch('http://localhost:4399/v1/ai', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        assert.equal(response.status, 400);
      }
      for (const invalid of ['huge', null, {}, '__proto__']) {
        const response = await fetch('http://localhost:4399/v1/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...base, responseLength: invalid }) });
        assert.equal(response.status, 400);
      }
    } finally { child.kill(); }
  });
}

