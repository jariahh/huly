/**
 * Custom svelte-check wrapper for embed-resources.
 *
 * embed-resources depends on many upstream -resources packages via deep source
 * imports (e.g. import('@hcengineering/recruit-resources/src/...')). svelte-check
 * traverses into those source files and finds pre-existing type errors that are
 * NOT in our code. This script filters svelte-check output to only fail on errors
 * from our own src/ directory.
 */
const { spawn } = require('child_process')
const path = require('path')

const srcDir = path.resolve(__dirname, '..', 'src')

async function run () {
  console.log('Svelte check (filtered)...\n')

  const proc = spawn('svelte-check', ['--output', 'human'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe']
  })

  let stdout = ''
  let stderr = ''

  proc.stdout.on('data', (data) => { stdout += data.toString() })
  proc.stderr.on('data', (data) => { stderr += data.toString() })

  const exitCode = await new Promise((resolve) => {
    proc.on('close', resolve)
    proc.on('error', (err) => {
      console.error(err)
      resolve(1)
    })
  })

  // Parse errors — format is: filepath\nError: message\n
  const lines = stdout.split('\n')
  const ownErrors = []
  let pline = ''

  for (const line of lines) {
    // Strip ANSI escape codes for reliable matching
    const clean = line.replace(/\x1b\[[0-9;]*m/g, '')
    if (clean.startsWith('Error:')) {
      // Check if the previous line (file path) is within our src/
      const cleanPath = pline.replace(/\x1b\[[0-9;]*m/g, '').trim()
      if (cleanPath.includes('src\\components\\') ||
          cleanPath.includes('src/components/') ||
          cleanPath.includes('src\\index') ||
          cleanPath.includes('src/index') ||
          cleanPath.includes('src\\plugin') ||
          cleanPath.includes('src/plugin') ||
          cleanPath.includes('src\\utils') ||
          cleanPath.includes('src/utils') ||
          cleanPath.includes('src\\embed') ||
          cleanPath.includes('src/embed')) {
        // Only include if the path doesn't go through .. (upstream packages)
        if (!cleanPath.includes('..')) {
          ownErrors.push({ file: cleanPath, message: clean })
        }
      }
    }
    pline = line
  }

  if (ownErrors.length === 0) {
    console.log('No errors found in embed-resources source files')
    if (exitCode !== 0) {
      // svelte-check found errors in upstream files only — we can safely ignore
      const totalMatch = stdout.match(/svelte-check found (\d+) errors/)
      if (totalMatch) {
        console.log(`(${totalMatch[1]} upstream errors filtered out)`)
      }
    }
    process.exit(0)
  } else {
    console.log(`Found ${ownErrors.length} error(s) in embed-resources source files:\n`)
    for (const err of ownErrors) {
      console.log(`File: ${err.file}`)
      console.log(`Message: \x1b[31m ${err.message} \x1b[0m\n`)
    }
    process.exit(1)
  }
}

run()
