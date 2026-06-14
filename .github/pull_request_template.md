## PR Metadata

- **Head Branch**: 
- **Base Branch**: `main`
- **Type**: (Feature / Bug Fix / Chore / Docs / Refactor)

## Description

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

---

## Developer/Agent Merge Checklist

### Pre-Merge Checklist

- [ ] All files are committed to the feature branch.
- [ ] Commit follows Conventional Commits format (prefixed with `[agent]` if authored by an AI agent).
- [ ] Commit message includes `Closes #XYZ` to auto-link and close the issue.
- [ ] No merge conflicts exist with `main`.
- [ ] Code builds successfully locally (`npm run build`).

### Merge Strategy

- **Method**: Squash and merge
- **Title Format**: `<prefix> <type>(<scope>): <description>`
  - *Example (Agent)*: `[agent] feat(recipes): add energy-level based filtering`
  - *Example (Human)*: `feat(recipes): add energy-level based filtering`
