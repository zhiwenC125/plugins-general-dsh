import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyChangedFiles, changedFiles } from './ci-impact.mjs';

test('selects only knowledge checks for knowledge content and connector edits', () => {
  assert.deepEqual(classifyChangedFiles(['docs/knowledge/02-agents-and-dsh.md', 'knowledge/core.mjs']), {
    plugins: false, knowledge: true, bot: false, desktop: false,
  });
});

test('selects independent plugin and bot checks without desktop packaging', () => {
  assert.deepEqual(classifyChangedFiles(['plugins/workflow-studio/src/view.js', 'integrations/bot/core.mjs']), {
    plugins: true, knowledge: false, bot: true, desktop: false,
  });
});

test('runs all checks for unclassified code, missing comparisons, or manual runs', () => {
  const all = { plugins: true, knowledge: true, bot: true, desktop: true };
  assert.deepEqual(classifyChangedFiles(['apps/revolution/runtime.mjs']), all);
  assert.deepEqual(classifyChangedFiles(['scripts/check-release.mjs']), all);
  assert.deepEqual(classifyChangedFiles([]), all);
  assert.equal(changedFiles('0'.repeat(40), '1'.repeat(40)), null);
});

test('knowledge app triggers plugin, knowledge and desktop gates', () => {
  assert.deepEqual(classifyChangedFiles(['plugins/revolution-knowledge/src/service.mjs']), { plugins: true, knowledge: true, bot: false, desktop: true });
});
