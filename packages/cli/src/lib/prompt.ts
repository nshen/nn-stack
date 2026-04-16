import { createInterface } from 'node:readline/promises'

export async function prompt(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    console.error('Error: interactive input required but stdin is not a TTY.')
    process.exit(1)
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    return (await rl.question(question)).trim()
  } finally {
    rl.close()
  }
}
