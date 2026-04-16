export function table(
  headers: string[],
  rows: string[][],
): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] || '').length)),
  )

  const sep = '  '
  const headerLine = headers
    .map((h, i) => h.padEnd(widths[i]))
    .join(sep)
  const lines = rows.map((row) =>
    row.map((cell, i) => (cell || '').padEnd(widths[i])).join(sep),
  )

  return [headerLine, ...lines].join('\n')
}
