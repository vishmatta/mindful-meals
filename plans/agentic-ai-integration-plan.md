# Implementation Plan: Implementing Agentic AI Governance & Best Practices

This document outlines the strategic implementation plan to establish Agentic AI governance, secure execution environments, and Model Context Protocol (MCP) tooling controls in the **Mindful Meals** repository.

This plan is compliant with the official GitHub Copilot implementation planner guidelines and grounded in Microsoft Learn and GitHub Docs best practices.

---

## 📋 Table of Contents
1. [Overview](#1-overview)
2. [Technical Approach](#2-technical-approach)
3. [Implementation Plan](#3-implementation-plan)
4. [Considerations](#4-considerations)
5. [Not Included](#5-not-included)
6. [Detailed Scope of Changes: Pull Request Template](#6-detailed-scope-of-changes-pull-request-template)
7. [Open Questions](#7-open-questions)
8. [Grounded Sources Reference](#8-grounded-sources-reference)

---

## 1. Overview

### What problem are we solving and why?
Currently, AI coding agents (such as Antigravity and others) interact with the repository without explicit repository boundaries, structured planning requirements, or automated guardrails. This introduces security and operational risks, including:
* **Planless execution:** Agents making structural code changes without stating their goals, risks, or rollback paths.
* **Over-permissioning:** Workflow runs using excessive default write permissions.
* **Hidden reasoning:** Changesets submitted without traceable evidence, decision trails, or escalation protocols.

By introducing this governance system, we transform the GitHub repository into both a **system of record** and a **control plane** to supervise agent activity.

### Success Criteria (What does "done" look like?)
- [ ] Every agent pull request is blocked from merging until a structured plan is completed and validated.
- [ ] GITHUB_TOKEN permissions are configured as read-only by default across all workflows.
- [ ] High-risk paths (.github, package.json, tsconfig.json, server configs) require CODEOWNERS reviews.
- [ ] Custom agent profiles restrict agent write-access scope using `applyTo` path globs.
- [ ] A documented Safe Iteration Policy gates infinite loop retries and provides human escalation.
- [ ] Copilot Memory is utilized to cache and verify repository facts without bloating prompt instructions.

### Who will use this and how?
* **AI Coding Agents:** Will follow the PR template, validate their plans, respect file boundaries, and follow failure escalation paths.
* **Human Maintainers (`@vishmatta`):** Will review planning proposals first, supervise agent activities, and approve/gate environments and deployments.

---

## 2. Technical Approach

### The Governance Model (Plan → Act → Evaluate)
Following the core lifecycle from [MS Learn: Foundations of Agentic AI (Unit 3)](https://learn.microsoft.com/en-us/training/modules/foundations-agentic-ai/3-explain-agent-lifecycle-plan-act-evaluate), this architecture establishes GitHub as the **system of record** (storing plans, PRs, and execution runs) and the **control plane** (enforcing rules, token limits, and reviews) ([MS Learn: Foundations of Agentic AI (Unit 4)](https://learn.microsoft.com/en-us/training/modules/foundations-agentic-ai/4-describe-github-system-record-control-plane)):
* **Plan Phase:** Bounded scope and stated goals are defined in the PR template before changes are evaluated.
* **Act Phase:** Bounded changes are pushed to an isolated `copilot/` branch by the agent.
* **Evaluate Phase:** Enforced via three layers of feedback loop:
  1. *Automated Validation (Micro-Evaluation):* GitHub Actions build checks and Plan Gate format checks.
  2. *Governance Gating (Macro-Evaluation):* Required branch rulesets and CODEOWNERS approvals.
  3. *Feedback Closed Loop:* The Safe Iteration Policy, which limits agent retries and defines a path for human escalation on failure.

### High-Level Architecture & Integrations
We will use a layered security approach combining repository-level policies, CI/CD Actions workflows, custom agent definitions, and Copilot Memory:

```
                  [ Agent Trigger ]
                         │
                         ▼
        [ Phase 1: Custom Agent Boundaries ]
         (applyTo file restrictions & tool sets)
                         │
                         ▼
       [ Phase 2: Plan-First Pull Request ]
         (pull_request_template.md plan)
                         │
                         ▼
          [ Phase 3: Plan Gate Workflow ] ──(Fails)──► [ Halts Merge ]
        (Validates plan presence in PR body)
                         │
                      (Passes)
                         ▼
       [ Phase 4: CI Validation & CODEOWNERS ] ──(Fails)──► [ Max 2 Retries / Escalation ]
      (npm build/test + required human review)
                         │
                      (Passes)
                         ▼
               [ Merge to default ]
```

### Key Configurations
1. **Plan-First Gating:** Employs a workflow-based regex parser to check PR metadata for a planning header.
2. **Path-Based Ownership:** Leverages GitHub's native `CODEOWNERS` system to mandate approval on files affecting CI/CD and repository structures.
3. **Workspace Isolation:** Custom agents are defined in `.agent.md` files limiting actions to a narrow subset of tools (`read_file`, `write_file`, `grep_search`).
4. **Secrets Boundaries:** Runtime injection of API tokens (like `GEMINI_API_KEY`) via GitHub Secrets, rather than committing them to instruction files.

### Major Decisions and Trade-offs
* **Decision:** Enforce **Plan-first workflows (Option A)** instead of letting agents write code immediately.
* **Trade-off:** This requires slightly more upfront planning and review but significantly reduces reviewer fatigue and prevents unwanted changes from introducing bugs early in the process.

---

## 3. Implementation Plan

### Phase 1: Foundation (Security & Permissions)
Set up core permissions, boundaries, and ownership structures to restrict agent privileges.

* **Task 1.1: Restrict default workflow permissions**
  * *Description:* Update all workflow templates to include global read-only GITHUB_TOKEN configurations.
  * *Complexity:* Small
  * *Dependencies:* None
* **Task 1.2: Define path-based review rules**
  * *Description:* Modify `.github/CODEOWNERS` to ensure `@vishmatta` is required to approve all high-risk paths (`.github/workflows/**`, `Dockerfile`, `package.json`, `tsconfig.json`).
  * *Complexity:* Small
  * *Dependencies:* None

### Phase 2: Core Governance (Planning & Gating)
Establish planning frameworks and programmatically block merges that bypass plan validation.

* **Task 2.1: Upgrade the PR Template**
  * *Description:* Update `.github/pull_request_template.md` to merge existing PR details with structured Agentic Plan, Evidence, and Reviewer checklists.
  * *Complexity:* Small
  * *Dependencies:* None
* **Task 2.2: Implement the Plan Gate Workflow**
  * *Description:* Create `.github/workflows/plan-gate.yml` to parse PR descriptions and fail the build if the Plan section is absent. 
    * *Note on Gating:* The workflow gates strictly on format (verifying the presence of the header). Substantive review and plan validation remains the responsibility of the required CODEOWNERS approval.
    * *UX Optimization:* If the check fails, the workflow must output a friendly explanation stating that plans are only required for agents, with a link to `CONTRIBUTING.md`.
  * *Complexity:* Medium
  * *Dependencies:* Task 2.1
* **Task 2.3: Configure Branch Rulesets**
  * *Description:* Configure rulesets on the `main` branch to require the Plan Gate check and CODEOWNERS approvals before merging.
  * *Complexity:* Medium
  * *Dependencies:* Task 1.2, Task 2.2

### Phase 3: Custom Agents & Tool Gating
Sandbox AI capabilities by defining custom profiles and execution boundaries.

* **Task 3.1: Create Custom Agent Profiles**
  * *Description:* Add specialized `.agent.md` files (e.g., `recipe-assistant.agent.md`) under `.github/agents/` restricting write-access using the `applyTo` parameter.
  * *Complexity:* Medium
  * *Dependencies:* None
* **Task 3.2: Configure Tool Gating and Hooks**
  * *Description:* Define pre-tool hooks to validate shell executions and restrict destructive actions (e.g., deleting files).
  * *Complexity:* Medium
  * *Dependencies:* Task 3.1

### Phase 4: Observability, Memory & Escalation
Define how failures are captured, escalated, and how codebase rules are cached.

* **Task 4.1: Integrate Safe Iteration Policy**
  * *Description:* Update `AGENTS.md` to document the retry limits (max 2) and specify a diagnostic escalation template.
  * *Complexity:* Small
  * *Dependencies:* None
* **Task 4.2: Setup Copilot Memory facts**
  * *Description:* Establish repository-level facts for the project's actual stack: Tailwind CSS loaded via CDN (no build pipeline), Gemini API situated server-side only (secrets must never leak to client), and PostgreSQL database migration in progress (replacing client-side `localStorage`).
    * *Maintenance Owner:* `@vishmatta` (repository maintainer).
    * *Staleness behavior:* If facts expire unnoticed after 28 days, Copilot falls back to standard LLM inference, which increases token consumption and risks generating invalid code suggestions (such as suggesting npm-based Tailwind compile configurations).
  * *Complexity:* Small
  * *Dependencies:* None

---

## 4. Considerations

### Assumptions
* The repository administrator has the required enterprise/organization permissions to enforce branch rulesets, set default Actions permissions, and register custom agents.
* Developers use compatible IDE clients (VS Code/Cursor) that natively support GitHub Copilot Agent configurations and MCP connections.
* **Agent Identity:** Agent identity is self-declared in the PR template's Metadata section. Cryptographic agent identity verification is currently a known limitation in the GitHub ecosystem; therefore, final enforcement of plan compliance relies on human CODEOWNERS review rather than automated verification.

### Constraints
* Custom agents and Copilot Memory are in public preview and are subject to platform API shifts.
* Auto-merging is restricted by GitHub rulesets if manual reviews are pending.

### Risks & Mitigations
* **Risk: Infinite Loop Retries.** The agent gets stuck repeatedly attempting to fix a failing test, consuming resources and token limits.
  * *Mitigation:* The Safe Iteration Policy halts execution after 2 consecutive test failures and triggers a human escalation comment.
* **Risk: Claude Code Integration.** CLI-based agents like Claude Code operate outside of GitHub's Copilot cloud agent boundaries and will bypass pre-tool use.md configs, local workspace hooks, or memory constraints.
  * *Mitigation:* Document this as a known post-exam limitation. Emphasize that all external developer CLI runs must still go through the branch Ruleset validation gates (required reviews & CI status checks) which remain in place.
* **Risk: Prompt Injection through issues/comments.** Malicious third-party comments attempt to hijack the agent's workflow.
  * *Mitigation:* 
    * Only users with write access can trigger the agent.
    * Workflows on agent-authored code are blocked by default until clicked and approved.
    * GitHub filters hidden characters/HTML comments prior to LLM injection.

---

## 5. Not Included
* **Deployment Automation:** We will not configure the agent to auto-deploy to production. Deployments remain gated behind manual human environment gates.
* **Private MCP Registries:** We will leverage allowlists for remote/local endpoints instead of hosting a custom registry infrastructure.
* **Database Schema Rollbacks:** Git revert covers application code changes only; database schema migration rollbacks (which require raw SQL or database migration tool operations) are handled separately and are out of scope for this branch-level code governance layer.

---

## 6. Detailed Scope of Changes: Pull Request Template

To enforce plan-first development, we must modify the existing [.github/pull_request_template.md](../.github/pull_request_template.md). 

### Current Template Gaps
* Missing an explicit, separate, reviewable **Plan & Rationale** section specifying agent scope and implementation details.
* Missing verifiable **Success Criteria** fields (such as CodeQL checks or test suite status).
* Missing **Risks & Mitigations** and **Rollback Paths** required for high-risk automations.
* Missing the **Evidence** container for attaching logs and test run links.

### Proposed Changes
We will merge the existing PR Metadata and Developer checklists with the new agentic governance fields. The updated PR template will be configured as follows:

```markdown
<!-- File: .github/pull_request_template.md -->
## PR Metadata
- **Head Branch**: 
- **Base Branch**: `main`
- **Type**: (Feature / Bug Fix / Chore / Docs / Refactor)
- **Author Type**: (Human Developer / AI Agent)

## 📋 Agentic Plan & Rationale (Mandatory for AI Agents)
*Note: If this PR was generated by an AI Agent, this section MUST be completed before code changes are merged.*

- **Stated Goal:** (Describe the issue, user prompt, or bug being resolved)
- **Scope of Changes:** (List directories/files that will be affected by this run)
- **Implementation Steps:**
  1. [ ] Step 1
  2. [ ] Step 2
- **Success Criteria:**
  - [ ] Code compiles and builds locally (`npm run build`).
  - [ ] App is resilient to invalid inputs/crashes (Unit tests pass).
  - [ ] Target vulnerability/feature is resolved.
- **Risks & Mitigations:** (Identify potential breaking changes or API quota limits and how they are handled)
- **Rollback Path:** (Provide detailed rollback instructions or Git revert commands for recovery)

## Description
*(Mandatory for Humans, optional for Agents if Plan & Rationale is fully descriptive)*

### What
<!-- Describe what changes were made and what this accomplishes -->

### Why
<!-- Explain the reasoning behind this change, benefits, and context -->

### Changes
<!-- List of files added, modified, or deleted with high-level descriptions -->
1. **`file_basename`**
   - Details of changes

### Related Issue
- Closes #

## 🔍 Execution Evidence (Mandatory for AI Agents)
- **Workflow Run Link:** (URL of the GitHub Actions run)
- **Execution Log/Artifact URL:** (URL pointing to test reports or build artifacts)

---

## Developer/Agent Merge Checklist

### Pre-Merge Checklist
- [ ] All files are committed to the feature branch.
- [ ] Commit follows Conventional Commits format (prefixed with `[agent]` if authored by an AI agent).
- [ ] Commit message includes `Closes #XYZ` to auto-link and close the issue.
- [ ] No merge conflicts exist with `main`.
- [ ] Code builds successfully locally (`npm run build`).

### Review Checklist (Required for Merge)
- [ ] Plan reviewed and approved by Code Owners.
- [ ] Required status checks passed.
- [ ] Required reviews satisfied.

### Merge Strategy
- **Method**: Squash and merge
- **Title Format**: `<prefix> <type>(<scope>): <description>`
  - *Example (Agent)*: `[agent] feat(recipes): add energy-level based filtering`
  - *Example (Human)*: `feat(recipes): add energy-level based filtering`
```

This upgraded template ensures both human developers and agents have a unified entry point, while enforcing the audit trail and reasoning visibility requirements of the SDLC.

---

## 7. Open Questions
* Does GitHub Copilot surface a warning or alert notification to developers or repository owners when a repository-level memory fact has expired or failed validation?

---

## 8. Grounded Sources Reference

The recommendations in this plan are grounded in the following sources:
* **SDLC Responsibility & Autonomy:** Grounded in [MS Learn: Designing Agent Architecture (Unit 6)](https://learn.microsoft.com/en-us/training/modules/design-agent-architecture-integration/6-reliable-workflows) and [GitHub Docs: Risks & Mitigations](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations).
* **Plan-First Gating:** Grounded in [MS Learn: Foundations of Agentic AI (Unit 3)](https://learn.microsoft.com/en-us/training/modules/foundations-agentic-ai/3-explain-agent-lifecycle-plan-act-evaluate) and [GitHub Docs: Implementation Planner Tutorial](https://docs.github.com/en/copilot/tutorials/customization-library/custom-agents/implementation-planner).
* **Workflow Gating & Tokens:** Grounded in [MS Learn: Foundations of Agentic AI (Unit 4)](https://learn.microsoft.com/en-us/training/modules/foundations-agentic-ai/4-describe-github-system-record-control-plane) and [GitHub Docs: Build Guardrails](https://docs.github.com/en/copilot/tutorials/cloud-agent/build-guardrails).
* **Escalation & Observability:** Grounded in [MS Learn: Designing Agent Architecture (Unit 7)](https://learn.microsoft.com/en-us/training/modules/design-agent-architecture-integration/7-agent-operations-controls).
* **MCP Governance:** Grounded in [MS Learn: Tooling & MCP Execution (Unit 3)](https://learn.microsoft.com/en-us/training/modules/agent-tooling-mcp-execution-environments/3-model-context-protocol-servers-registries-allow-lists).
* **Custom Agent Parameters (`applyTo`):** Grounded in [GitHub Docs: Custom Agents & Sub-agent Orchestration](https://docs.github.com/en/copilot/how-tos/copilot-sdk/use-copilot-sdk/custom-agents) and [GitHub Docs: Prepare Custom Agents for Organization](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/prepare-for-custom-agents).
* **Copilot Memory & Expirations:** Grounded in [GitHub Docs: About GitHub Copilot Memory](https://docs.github.com/en/copilot/concepts/agents/copilot-memory).
