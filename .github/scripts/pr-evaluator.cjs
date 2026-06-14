const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define files and paths
const AGENTS_DIR = path.join(process.cwd(), '.github', 'agents');
const REPORT_JSON = path.join(process.cwd(), 'evaluation-report.json');
const REPORT_MD = path.join(process.cwd(), 'evaluation-report.md');

// Extract inputs
const baseBranch = process.env.GITHUB_BASE_REF || 'main';
const buildStatus = process.env.BUILD_STATUS || 'success';
const testStatus = process.env.TEST_STATUS || 'success';
const baseSha = process.env.BASE_SHA;
const headSha = process.env.HEAD_SHA;
const diffTarget = (baseSha && headSha) ? `${baseSha}...${headSha}` : `origin/${baseBranch}...HEAD`;

// Read GITHUB_EVENT_PATH if available
let prBody = process.env.PR_BODY || '';
let prTitle = process.env.PR_TITLE || '';
let branchName = '';

if (process.env.GITHUB_EVENT_PATH && fs.existsSync(process.env.GITHUB_EVENT_PATH)) {
  try {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    if (event.pull_request) {
      prBody = event.pull_request.body || '';
      prTitle = event.pull_request.title || '';
      branchName = event.pull_request.head.ref || '';
    }
  } catch (err) {
    console.error('Error reading GitHub event path:', err);
  }
}

// Fallbacks for local testing
if (!branchName) {
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (err) {
    branchName = 'local-branch';
  }
}

// -------------------------------------------------------------
// Helper Functions
// -------------------------------------------------------------

function runGit(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (err) {
    console.error(`Error running command "${command}":`, err.message);
    return '';
  }
}

function matchGlob(filePath, glob) {
  // Safe glob to regex converter using placeholders to avoid overlapping replacements
  const regexStr = glob
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
  return regex.test(filePath);
}

function parseAgentProfile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!frontmatterMatch) return null;

  const yamlLines = frontmatterMatch[1].split('\n');
  const data = { name: '', applyTo: [] };
  let currentKey = '';

  yamlLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') && currentKey === 'applyTo') {
      data.applyTo.push(trimmed.substring(1).trim());
    } else {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        if (key === 'name') {
          data.name = value;
        } else if (key === 'applyTo') {
          currentKey = 'applyTo';
        } else {
          currentKey = '';
        }
      }
    }
  });

  return data;
}

// -------------------------------------------------------------
// Core Checks
// -------------------------------------------------------------

// 1. Agent Detection
let isAgent = false;
if (branchName.startsWith('agent/') || branchName.startsWith('copilot/')) {
  isAgent = true;
}
if (prTitle.startsWith('[agent]')) {
  isAgent = true;
}
if (prBody.includes('Author Type: AI Agent') || prBody.includes('Author Type: (AI Agent)')) {
  isAgent = true;
}

// 2. Plan Gate Check
const planGate = {
  status: 'passed',
  details: []
};

if (isAgent) {
  if (!prBody || prBody.trim() === '' || prBody === 'null') {
    planGate.status = 'failed';
    planGate.details.push('PR description is empty.');
  } else {
    const hasPlanHeader = prBody.includes('## 📋 Agentic Plan & Rationale') || prBody.includes('## Agentic Plan & Rationale');
    if (!hasPlanHeader) {
      planGate.status = 'failed';
      planGate.details.push('Missing required plan header: "## 📋 Agentic Plan & Rationale"');
    }

    const placeholders = [
      '(Describe the issue, user prompt, or bug being resolved)',
      '(List directories/files that will be affected by this run)',
      '(Identify potential breaking changes',
      '(Provide detailed rollback instructions',
      '(URL of the GitHub Actions run)',
      '(URL pointing to test reports'
    ];

    placeholders.forEach(placeholder => {
      if (prBody.includes(placeholder)) {
        planGate.status = 'failed';
        planGate.details.push(`Template placeholder left in description: "${placeholder}"`);
      }
    });
  }
} else {
  planGate.status = 'bypassed';
  planGate.details.push('PR authored by a Human Developer; Plan Gate validation bypassed.');
}

// 3. Scope & Boundary Compliance Check
const scopeCheck = {
  status: 'passed',
  matchedProfile: 'none',
  details: [],
  changedFiles: []
};

// Retrieve changed files in PR
const changedFilesRaw = runGit(`git diff --name-only ${diffTarget}`);
const changedFiles = changedFilesRaw ? changedFilesRaw.split('\n').filter(Boolean) : [];
scopeCheck.changedFiles = changedFiles;

if (isAgent && changedFiles.length > 0) {
  // Read all profiles
  const profiles = [];
  if (fs.existsSync(AGENTS_DIR)) {
    const files = fs.readdirSync(AGENTS_DIR);
    files.forEach(file => {
      if (file.endsWith('.agent.md')) {
        const profile = parseAgentProfile(path.join(AGENTS_DIR, file));
        if (profile) profiles.push(profile);
      }
    });
  }

  let activeProfile = null;

  // Step 1: Metadata Parsing (Primary)
  const metadataMatch = prBody.match(/-\s+\*\*Author Type\*\*:\s+AI Agent\s+\(([^)]+)\)/i) || 
                        prBody.match(/-\s+\*\*Agent Profile\*\*:\s+([^\r\n]+)/i);
  if (metadataMatch) {
    const profileName = metadataMatch[1].trim();
    activeProfile = profiles.find(p => p.name === profileName) || null;
  }

  // Step 2: Branch Name Matching (Secondary)
  if (!activeProfile) {
    activeProfile = profiles.find(p => 
      branchName.startsWith(`agent/${p.name}/`) || 
      branchName.startsWith(`agent/${p.name}-`) ||
      branchName === `agent/${p.name}`
    ) || null;
  }

  // Step 3: Single Compatible Profile (Fallback)
  if (!activeProfile) {
    const compatibleProfiles = profiles.filter(p => {
      return changedFiles.every(file => p.applyTo.some(glob => matchGlob(file, glob)));
    });
    if (compatibleProfiles.length === 1) {
      activeProfile = compatibleProfiles[0];
    } else if (compatibleProfiles.length > 1) {
      scopeCheck.status = 'failed';
      scopeCheck.details.push(`Multiple compatible agent profiles found: [${compatibleProfiles.map(p => p.name).join(', ')}]. Please disambiguate in PR metadata.`);
    }
  }

  if (activeProfile) {
    scopeCheck.matchedProfile = activeProfile.name;
    const outOfScope = [];

    changedFiles.forEach(file => {
      const isAllowed = activeProfile.applyTo.some(glob => matchGlob(file, glob));
      if (!isAllowed) {
        outOfScope.push(file);
      }
    });

    if (outOfScope.length > 0) {
      scopeCheck.status = 'failed';
      scopeCheck.details.push(`Changed files violate write boundaries for profile "${activeProfile.name}":`);
      outOfScope.forEach(file => scopeCheck.details.push(`  - ${file}`));
    } else {
      scopeCheck.details.push(`All changes fit within write boundaries for profile "${activeProfile.name}".`);
    }
  } else {
    if (scopeCheck.status !== 'failed') {
      scopeCheck.status = 'failed';
      scopeCheck.details.push('No matching or compatible agent profile identified for this agent PR.');
    }
  }
} else if (isAgent && changedFiles.length === 0) {
  scopeCheck.details.push('No changed files detected.');
} else {
  scopeCheck.status = 'bypassed';
  scopeCheck.details.push('PR authored by a Human Developer; Scope check bypassed.');
}

// 4. Secrets Scanning Check
const secretsCheck = {
  status: 'passed',
  details: [],
  bypasses: []
};

// Retrieve actual added lines in PR diff
const diffContent = runGit(`git diff -U0 ${diffTarget}`);
const diffLines = diffContent ? diffContent.split('\n') : [];

let currentFile = '';
diffLines.forEach(line => {
  if (line.startsWith('+++ b/')) {
    currentFile = line.substring(6);
  } else if (line.startsWith('+') && !line.startsWith('+++')) {
    const addedContent = line.substring(1);

    // Skip scanning if the line is bypassed
    if (addedContent.includes('pr-evaluator:allow')) {
      secretsCheck.bypasses.push({
        file: currentFile,
        line: addedContent.trim()
      });
      return;
    }

    // Google API Key pattern matching
    const geminiKeyMatch = addedContent.match(/AIzaSy[A-Za-z0-9_\-]{35}/);
    if (geminiKeyMatch) {
      secretsCheck.status = 'failed';
      secretsCheck.details.push(`Potential Google API Key found in ${currentFile}: "${geminiKeyMatch[0].substring(0, 10)}..."`);
    }

    // Explicit GEMINI_API_KEY assignment
    if (addedContent.match(/GEMINI_API_KEY\s*=\s*['"`][A-Za-z0-9_\-]+['"`]/)) {
      secretsCheck.status = 'failed';
      secretsCheck.details.push(`Explicit GEMINI_API_KEY assignment found in ${currentFile}`);
    }

    // Generic key/secret patterns
    if (addedContent.match(/(KEY|SECRET|PASSWORD|TOKEN)\s*=\s*['"`][A-Za-z0-9_\-]{32,}['"`]/i)) {
      // Ignore test/mock files unless it matches the strict Gemini key pattern
      const isTestFile = currentFile.includes('/__tests__/') || currentFile.includes('.test.') || currentFile.includes('.spec.');
      if (!isTestFile) {
        secretsCheck.status = 'failed';
        secretsCheck.details.push(`Potential generic secret/key assignment found in ${currentFile}`);
      }
    }

    // Client-side safety: check if GEMINI_API_KEY or server-side env loads are added in frontend src/
    if (currentFile.startsWith('src/') && !currentFile.startsWith('src/services/')) {
      const isTestFile = currentFile.includes('/__tests__/') || currentFile.includes('.test.') || currentFile.includes('.spec.');
      if (!isTestFile) {
        if (addedContent.includes('dotenv') || addedContent.includes('process.env.GEMINI_API_KEY')) {
          secretsCheck.status = 'failed';
          secretsCheck.details.push(`Client-side safety violation in ${currentFile}: loading server-side secrets or dotenv`);
        }
      }
    }
  }
});

if (secretsCheck.details.length === 0) {
  secretsCheck.details.push('No secrets or hardcoded credentials detected.');
}

// -------------------------------------------------------------
// Report Generation
// -------------------------------------------------------------

const finalReport = {
  isAgent,
  branchName,
  prTitle,
  buildStatus,
  testStatus,
  planGate,
  scopeCheck,
  secretsCheck,
  overallPassed: 
    buildStatus === 'success' &&
    testStatus === 'success' &&
    planGate.status !== 'failed' &&
    scopeCheck.status !== 'failed' &&
    secretsCheck.status !== 'failed'
};

// Write JSON Report
fs.writeFileSync(REPORT_JSON, JSON.stringify(finalReport, null, 2));

// Generate Markdown Report
let markdown = `<!-- MM_PR_EVALUATION_REPORT -->
# 🍲 Mindful Meals — PR Evaluation Report

This pull request was evaluated by the automated **PR Evaluation Agent** following Microsoft and GitHub best practices.

### 📊 Summary Status

| Check | Status | Severity | Details |
| :--- | :---: | :---: | :--- |
| **Plan Gate** | ${planGate.status === 'passed' ? '✅ Passed' : (planGate.status === 'bypassed' ? 'ℹ️ Bypassed' : '❌ Failed')} | Blocking | ${planGate.status === 'passed' ? 'Plan completed' : (planGate.status === 'bypassed' ? 'Human PR' : 'Missing or incomplete plan')} |
| **Boundary Scope** | ${scopeCheck.status === 'passed' ? '✅ Passed' : (scopeCheck.status === 'bypassed' ? 'ℹ️ Bypassed' : '❌ Failed')} | Blocking | ${scopeCheck.status === 'passed' ? `Matches profile: \`${scopeCheck.matchedProfile}\`` : (scopeCheck.status === 'bypassed' ? 'Human PR' : 'Boundary violation or unmatched profile')} |
| **Secrets Scan** | ${secretsCheck.status === 'passed' ? '✅ Passed' : '❌ Failed'} | Blocking | ${secretsCheck.status === 'passed' ? 'No secrets found' : 'Secrets detected'} |
| **Build Run** | ${buildStatus === 'success' ? '✅ Passed' : '❌ Failed'} | Blocking | \`npm run build\` output |
| **Test Run** | ${testStatus === 'success' ? '✅ Passed' : '❌ Failed'} | Blocking | \`npm test\` output |

---

`;

if (planGate.status === 'failed') {
  markdown += `### 📋 Plan Gate Failures\n\n`;
  planGate.details.forEach(detail => {
    markdown += `- ❌ ${detail}\n`;
  });
  markdown += `\n*AI agent PRs must completely fill out the PR description plan template before merging.*\n\n`;
}

if (scopeCheck.status === 'failed') {
  markdown += `### 🔒 Scope Boundary Violations\n\n`;
  scopeCheck.details.forEach(detail => {
    markdown += `${detail}\n`;
  });
  markdown += `\n*Refer to custom profiles in \`.github/agents/\` to verify write scopes.*\n\n`;
}

if (secretsCheck.status === 'failed') {
  markdown += `### 🔑 Secrets Scanning Alerts\n\n`;
  secretsCheck.details.forEach(detail => {
    markdown += `- ⚠️ ${detail}\n`;
  });
  markdown += `\n*Do not commit keys or secrets. To bypass false positives, add \`// pr-evaluator:allow\` to the line.*\n\n`;
}

if (secretsCheck.bypasses.length > 0) {
  markdown += `### 🛡️ Active Bypasses\n\n`;
  markdown += `The following lines skipped secrets validation due to explicit bypass comments:\n\n`;
  markdown += `| File | Line Snippet |\n| :--- | :--- |\n`;
  secretsCheck.bypasses.forEach(b => {
    markdown += `| \`${b.file}\` | \`${b.line}\` |\n`;
  });
  markdown += `\n`;
}

if (buildStatus === 'failure' || testStatus === 'failure') {
  markdown += `### 🛠️ Execution Errors\n\n`;
  if (buildStatus === 'failure') {
    markdown += `- ❌ **Build Failure**: The project failed to build with \`npm run build\`. Check workflow logs for compilation errors.\n`;
  }
  if (testStatus === 'failure') {
    markdown += `- ❌ **Test Failure**: One or more unit tests failed to run successfully under \`CI=true npm test\`.\n`;
  }
  markdown += `\n`;
}

if (finalReport.overallPassed) {
  markdown += `### 🎉 Verification Successful!\n`;
  markdown += `All automated checks have passed. Human codeowners may now complete their reviews and merge.`;
} else {
  markdown += `### ⚠️ Merge Blocked\n`;
  markdown += `One or more blocking checks failed. Please address the errors listed above and push your changes to re-trigger evaluation.`;
}

fs.writeFileSync(REPORT_MD, markdown);

console.log('PR evaluation complete.');
console.log('Overall Passed:', finalReport.overallPassed);

if (!finalReport.overallPassed) {
  process.exit(1);
} else {
  process.exit(0);
}
