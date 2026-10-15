// Workflow plugin smoke test: exercise every script hook in one short run.
// Hooks covered: phase(), log(), agent() (label + schema), parallel(), pipeline(), args.

phase('Discover');
log('smoke-test: phase Discover — running two parallel research agents');

const [fact42, factMoon] = await parallel([
  () => agent(
    'Reply with exactly three short bullet points about the number 42, then a one-sentence conclusion.',
    { label: 'discover-42' },
  ),
  () => agent(
    'Reply with exactly three short bullet points about the Moon, then a one-sentence conclusion.',
    { label: 'discover-moon' },
  ),
]);

log('smoke-test: Discover finished (result lengths ' + String(fact42).length + ' / ' + String(factMoon).length + ')');

phase('Build');
log('smoke-test: phase Build — running a 2-item, 2-stage pipeline');

const headlines = await pipeline(
  ['forty-two', 'moon'],
  (prev, item, index) => agent(
    'You are pipeline stage 1 for item "' + item + '". Condense the following into a single factual sentence: ' + String(prev),
    { label: 'build-' + item + '-stage1' },
  ),
  (prev, item, index) => agent(
    'You are pipeline stage 2 for item "' + item + '". Rewrite the following sentence as a short headline: ' + String(prev),
    { label: 'build-' + item + '-stage2' },
  ),
);

phase('Verify');
log('smoke-test: phase Verify — structured verdict + a written artifact');

const report = await agent(
  'Write a short markdown summary file with the title "Workflow Smoke Test Result". '
  + 'Under a "Headlines" section, list these two lines as bullets:\n'
  + ' - ' + String(headlines[0]) + '\n'
  + ' - ' + String(headlines[1]) + '\n'
  + 'Write the file to the path workflow-smoke-test/smoke-result.md, then reply with exactly "written".',
  { label: 'verify-report' },
);

const verdict = await agent(
  'Given the headline list: ' + JSON.stringify(headlines) + '. '
  + 'Return a JSON object with a "verdict" field that is PASS when there are exactly two non-empty headlines, otherwise FAIL, '
  + 'and a "reasons" array of one or two short strings.',
  {
    label: 'verify-verdict',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['verdict'],
      properties: {
        verdict: { type: 'string', enum: ['PASS', 'FAIL'] },
        reasons: { type: 'array', items: { type: 'string' } },
      },
    },
  },
);

log('smoke-test: verdict=' + (verdict && verdict.verdict) + ' report=' + String(report));

return {
  test: args.smokeTestName,
  phases: ['Discover', 'Build', 'Verify'],
  agentsStarted: 8,
  headlineCount: Array.isArray(headlines) ? headlines.filter(Boolean).length : 0,
  verdict: verdict ? verdict.verdict : null,
  reportAgent: report,
};
