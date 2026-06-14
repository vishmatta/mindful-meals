#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);

// -------------------------------------------------------------
// Helper: Glob matcher (same pattern as pr-evaluator.cjs)
// -------------------------------------------------------------
function matchGlob(filePath, glob) {
  // Normalize windows separators
  const normalizedFile = filePath.replace(/\\/g, '/');
  const normalizedGlob = glob.replace(/\\/g, '/');

  const regexStr = normalizedGlob
    .replace(/[.+^${}()|[\]\\]/g, m => '\\' + m) // escape regex chars except *, ?
    .replace(/\/\*\*\//g, '__DIR_SPLIT__')       // match /**/
    .replace(/\/\*\*/g, '__DIR_END__')           // match /** at the end of path
    .replace(/\*\*/g, '__DOUBLE_STAR__')         // match wildcard **
    .replace(/\*/g, '[^/]*')                     // match single *
    .replace(/\?/g, '[^/]')                      // match ?
    .replace(/__DIR_SPLIT__/g, '/(?:.*/)?')
    .replace(/__DIR_END__/g, '/.*')
    .replace(/__DOUBLE_STAR__/g, '.*');
  const regex = new RegExp('^' + regexStr + '$');
  return regex.test(normalizedFile);
}

// -------------------------------------------------------------
// Helper: Check command for forbidden shell constructs
// -------------------------------------------------------------
function checkForbiddenCommand(command) {
  if (!command || typeof command !== 'string') return null;

  // 1. Force push check: git push with --force, -f, or +branch
  const forcePushMatch = command.match(/\bgit\s+push\s+.*(--force|-f|\+)/i);
  if (forcePushMatch) {
    return `Forbidden git force push detected in command: "${command}"`;
  }

  // 2. Destructive rm recursive removals outside /dist or /tmp
  const rmRecursiveMatch = command.match(/\brm\s+-[a-zA-Z]*r[a-zA-Z]*\b|\brm\s+--recursive\b|\brmdir\s+\/s\b/i);
  if (rmRecursiveMatch) {
    const subCommands = command.split(/;|&&|\|\||\|/);
    for (const subCmd of subCommands) {
      const trimmedSub = subCmd.trim();
      if (trimmedSub.match(/\brm\s+-[a-zA-Z]*r[a-zA-Z]*\b|\brm\s+--recursive\b|\brmdir\s+\/s\b/i)) {
        const parts = trimmedSub.split(/\s+/);
        const rmIdx = parts.findIndex(p => p === 'rm' || p === 'rmdir');
        if (rmIdx !== -1) {
          const targets = parts.slice(rmIdx + 1).filter(p => !p.startsWith('-'));
          if (targets.length === 0) {
            return `Dangerous recursive deletion without explicit target: "${trimmedSub}"`;
          }
          for (let target of targets) {
            target = target.replace(/^['"]|['"]$/g, '');
            const cleanTarget = target.replace(/^\.\//, '');
            const isAllowed = 
              cleanTarget.startsWith('dist') || 
              cleanTarget.startsWith('server/dist') || 
              cleanTarget.startsWith('tmp') || 
              cleanTarget.startsWith('server/tmp') ||
              cleanTarget.startsWith('/tmp');
            if (!isAllowed) {
              return `Forbidden recursive removal targeting "${target}" outside /dist or /tmp. Command: "${command}"`;
            }
          }
        }
      }
    }
  }

  // 3. Write/modification to workflow directories
  if (command.includes('.github/workflows')) {
    const isWrite = command.includes('>') || 
                    command.includes('>>') || 
                    /\b(mv|cp|rm|sed|chmod|rmdir|touch|tee|nano|vi|vim)\b/i.test(command);
    if (isWrite) {
      return `Forbidden write/modification to workflow directory (.github/workflows) detected: "${command}"`;
    }
  }

  return null;
}

// -------------------------------------------------------------
// Helper: Checks content for hardcoded secrets
// -------------------------------------------------------------
function checkSecrets(content, filePath = 'content') {
  if (!content || typeof content !== 'string') return null;

  // Google API Key pattern matching
  const geminiKeyMatch = content.match(/AIzaSy[A-Za-z0-9_\-]{35}/);
  if (geminiKeyMatch && !content.includes('pr-evaluator:allow')) {
    return `Potential Google API Key found in ${filePath}: "${geminiKeyMatch[0].substring(0, 10)}..."`;
  }

  // Explicit GEMINI_API_KEY assignment
  if (content.match(/GEMINI_API_KEY\s*=\s*['"`][A-Za-z0-9_\-]+['"`]/) && !content.includes('pr-evaluator:allow')) {
    return `Explicit GEMINI_API_KEY assignment found in ${filePath}`;
  }

  // Generic key/secret patterns (exclude test/mock files)
  const isTestFile = filePath.includes('/__tests__/') || filePath.includes('.test.') || filePath.includes('.spec.');
  if (!isTestFile && content.match(/(KEY|SECRET|PASSWORD|TOKEN)\s*=\s*['"`][A-Za-z0-9_\-]{32,}['"`]/i) && !content.includes('pr-evaluator:allow')) {
    return `Potential generic secret/key assignment found in ${filePath}`;
  }

  // Client-side safety: check if GEMINI_API_KEY or server-side env loads are added in frontend src/
  if (filePath.startsWith('src/') && !filePath.startsWith('src/services/') && !isTestFile) {
    if ((content.includes('dotenv') || content.includes('process.env.GEMINI_API_KEY')) && !content.includes('pr-evaluator:allow')) {
      return `Client-side safety violation in ${filePath}: loading server-side secrets or dotenv`;
    }
  }

  return null;
}

// =============================================================
// Flow Selection
// =============================================================
if (args.includes('--git-pre-commit')) {
  // Git Pre-Commit Hook logic
  let branchName = '';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (err) {
    branchName = '';
  }

  const isAgent = branchName.startsWith('agent/') || branchName.startsWith('copilot/');

  let stagedFiles = [];
  try {
    stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(f => f.trim() !== '');
  } catch (err) {
    stagedFiles = [];
  }

  let hasViolations = false;
  const errorMessages = [];

  for (const file of stagedFiles) {
    // 1. Check boundary write restrictions to workflows for agents
    if (isAgent && matchGlob(file, '.github/workflows/**')) {
      hasViolations = true;
      errorMessages.push(`[Boundary violation] Agents are forbidden from writing to GitHub workflows: ${file}`);
    }

    // 2. Scan file content changes for secrets
    try {
      const diff = execSync(`git diff -U0 --cached -- "${file}"`, { encoding: 'utf8' });
      const diffLines = diff.split('\n');

      for (const line of diffLines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          const addedContent = line.substring(1);
          const secretErr = checkSecrets(addedContent, file);
          if (secretErr) {
            hasViolations = true;
            errorMessages.push(`[Credential Leak] ${secretErr}`);
          }
        }
      }
    } catch (err) {
      // Fallback: scan whole file if exists
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const secretErr = checkSecrets(content, file);
        if (secretErr) {
          hasViolations = true;
          errorMessages.push(`[Credential Leak] ${secretErr}`);
        }
      }
    }
  }

  if (hasViolations) {
    console.error('\n❌ Git Commit Blocked by Pre-commit Gating:');
    errorMessages.forEach(msg => console.error(`  - ${msg}`));
    console.error('\nPlease fix the violations above before committing.\n');
    process.exit(1);
  }

  process.exit(0);

} else {
  // Claude Code / CLI agent PreToolUse hook logic
  let inputData = '';
  process.stdin.on('data', chunk => {
    inputData += chunk;
  });

  process.stdin.on('end', () => {
    if (!inputData.trim()) {
      process.exit(0);
    }

    try {
      const payload = JSON.parse(inputData);
      const toolName = payload.tool_name || '';
      const toolInput = payload.tool_input || {};

      let violation = null;

      // 1. Intercept shell command executions
      if (toolName.toLowerCase() === 'bash' || toolName.toLowerCase() === 'execute_command') {
        const command = toolInput.command || toolInput.CommandLine || '';
        violation = checkForbiddenCommand(command);
      }

      // 2. Intercept file writes and edits
      const fileWriteTools = [
        'write', 'writefile', 'write_to_file', 
        'edit', 'editfile', 'replace_file_content', 
        'multi_replace_file_content'
      ];

      if (fileWriteTools.includes(toolName.toLowerCase())) {
        const filePath = toolInput.TargetFile || toolInput.filePath || toolInput.path || toolInput.file || '';
        const content = toolInput.CodeContent || toolInput.ReplacementContent || toolInput.content || '';

        // Check workflow boundaries
        if (filePath && matchGlob(filePath, '.github/workflows/**')) {
          violation = `Agent is blocked from writing to workflow directory: ${filePath}`;
        }

        // Check content for secrets
        if (!violation) {
          if (content) {
            violation = checkSecrets(content, filePath);
          }
          if (!violation && Array.isArray(toolInput.ReplacementChunks)) {
            for (const chunk of toolInput.ReplacementChunks) {
              if (chunk.ReplacementContent) {
                const secretErr = checkSecrets(chunk.ReplacementContent, filePath);
                if (secretErr) {
                  violation = secretErr;
                  break;
                }
              }
            }
          }
        }
      }

      if (violation) {
        console.error(`\n❌ Security Gating Blocked Tool Call [${toolName}]:`);
        console.error(`Reason: ${violation}\n`);
        process.exit(2); // Exit code 2 blocks the tool from executing in Claude Code
      }

      process.exit(0);
    } catch (err) {
      console.error('Failed to parse stdin as tool call JSON:', err.message);
      process.exit(0); // Fail open on parse error so we do not block unrelated pipelines
    }
  });
}
