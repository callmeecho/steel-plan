import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

const DEFAULT_WORKDIR = 'D:\\南京钢铁\\南京钢铁后端\\双定尺模型\\ShuangDingChi_MySQL'
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000

export type AlgorithmRunResult = {
  ok: boolean
  command: string
  args: string[]
  cwd: string
  stdout: string
  stderr: string
  durationMs: number
  code: number | null
}

export async function runLegacyOptimizer(taskId: string): Promise<AlgorithmRunResult> {
  const cwd = process.env.LEGACY_ALGO_WORKDIR || DEFAULT_WORKDIR
  const startedAt = Date.now()

  const configured = parseCommand(process.env.LEGACY_ALGO_COMMAND || '')
  const python = findPythonExecutable(cwd)
  const defaultArgs = [...python.prefixArgs, '-c', 'import controller; controller.main()']
  const command = configured.command || python.command
  const args = configured.args.length > 0 ? configured.args : defaultArgs

  const result = await runProcess(command, args, cwd, DEFAULT_TIMEOUT_MS, taskId)
  const durationMs = Date.now() - startedAt

  return {
    ...result,
    command,
    args,
    cwd,
    durationMs,
  }
}

function findPythonExecutable(cwd: string) {
  const venvPython = path.join(cwd, 'venv', 'Scripts', 'python.exe')
  if (fs.existsSync(venvPython) && canRunPython(venvPython, [])) {
    return { command: venvPython, prefixArgs: [] as string[] }
  }

  if (process.platform === 'win32') {
    if (canRunPython('python', [])) {
      return { command: 'python', prefixArgs: [] as string[] }
    }

    if (canRunPython('py', ['-3'])) {
      return { command: 'py', prefixArgs: ['-3'] as string[] }
    }

    return { command: 'py', prefixArgs: [] as string[] }
  }

  return { command: 'python3', prefixArgs: [] as string[] }
}

function canRunPython(command: string, args: string[]) {
  try {
    const probe = spawnSync(command, [...args, '--version'], {
      windowsHide: true,
      timeout: 4000,
      stdio: 'pipe',
    })

    return !probe.error && probe.status === 0
  } catch {
    return false
  }
}

function parseCommand(raw: string) {
  const value = raw.trim()
  if (!value) return { command: '', args: [] as string[] }

  const parts = value.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []
  const normalized = parts.map((item) => item.replace(/^"(.*)"$/, '$1'))
  const [command = '', ...args] = normalized
  return { command, args }
}

function runProcess(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
  taskId: string,
) {
  return new Promise<{
    ok: boolean
    stdout: string
    stderr: string
    code: number | null
  }>((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      env: {
        ...process.env,
        STEEL_PLAN_TASK_ID: taskIdSafe(taskId),
      },
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill('SIGTERM')
      resolve({
        ok: false,
        stdout,
        stderr: `${stderr}\n[timeout] algorithm exceeded ${timeoutMs} ms`,
        code: null,
      })
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })

    child.on('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({
        ok: false,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        code: null,
      })
    })

    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({
        ok: code === 0,
        stdout,
        stderr,
        code,
      })
    })
  })
}

function taskIdSafe(value: string) {
  const normalized = String(value || '')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 64)
  if (normalized) return normalized
  return new Date().toISOString().replace(/[^\d]/g, '').slice(0, 14)
}
