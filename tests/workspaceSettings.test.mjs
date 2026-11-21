import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const moduleURL = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64');
const typesURL = moduleURL(await readFile(new URL('../types.ts', import.meta.url), 'utf8'));
const helpers = await readFile(new URL('../services/workspaceSettings.ts', import.meta.url), 'utf8');
const { normalizeSettings, searchEntries, persistableRequest } = await import(moduleURL(helpers.replaceAll("'../types'", JSON.stringify(typesURL))));

test('stored settings round-trip and invalid/legacy settings get safe defaults', () => {
  const settings = { tone:'professional',language:'French',length:'long',customPrompt:'Use a courteous greeting.',chatVibe:null,chatGoal:'Confirm logistics' };
  assert.deepEqual(normalizeSettings(JSON.parse(JSON.stringify(settings))), settings);
  assert.equal(normalizeSettings({tone:'unknown',language:'missing',length:'huge'}).length, 'balanced');
  assert.equal(normalizeSettings(null).language, 'English (US)');
  assert.equal(normalizeSettings({tone:'casual'}).tone, 'casual');
});

test('history/library searches match source, reply, title and multiple terms without changing saved data', () => {
  const entries = [{id:'1',inputText:'Thursday team visit',outputText:'Vegetarian lunch',mode:'RESPOND BACK',tone:'professional',title:'Travel plan'}, {id:'2',inputText:'Invoice',outputText:'Payment received',mode:'EMAIL ARCHITECT',tone:'natural'}];
  const before = JSON.stringify(entries);
  assert.deepEqual(searchEntries(entries, ' THURSDAY lunch ').map(e=>e.id), ['1']);
  assert.deepEqual(searchEntries(entries, 'travel').map(e=>e.id), ['1']);
  assert.deepEqual(searchEntries(entries, 'no-match'), []);
  assert.equal(searchEntries(entries, '  '), entries);
  assert.equal(JSON.stringify(entries), before);
});

test('persisted regeneration retains original text and instructions without undefined or large image data', () => {
  const request = { text:'Original input',mode:'RESPOND BACK',tone:'professional',language:'French',instruction:'Conversation context',media:undefined };
  assert.deepEqual(JSON.parse(JSON.stringify(persistableRequest(request))), { text:request.text,mode:request.mode,tone:request.tone,language:request.language,instruction:request.instruction });
  assert.equal(persistableRequest({...request,media:{base64:'large-image'}}), null);
  assert.equal(persistableRequest(null), null);
});
