/** Classification only; contents continue through DSH's bounded resource preview. */
export function artifactKind(path) {
  const ext = String(path).split(/[?#]/, 1)[0].split('.').at(-1).toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image';
  if (['json', 'jsonl'].includes(ext)) return 'json';
  if (['diff', 'patch'].includes(ext)) return 'diff';
  if (['md', 'txt', 'csv', 'tsv', 'yaml', 'yml', 'toml', 'xml', 'html', 'js', 'ts', 'py', 'css'].includes(ext)) return 'text';
  return 'file';
}
