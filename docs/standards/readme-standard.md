# 📝 Module README Standards

This document establishes the standard structure, layout, and best practices for creating and maintaining `README.md` files for directories in the **Mindful Meals** repository. Following this template ensures that sub-folder documentation remains consistent, informative, and easy to maintain without creating unnecessary documentation bloat.

---

## 📌 Standard README.md Template

All directory-level README files should use the following markdown template. Copy and adapt it as needed:

```markdown
# [Icon Emoji] [Directory Name]

[A 1-2 sentence description explaining the high-level role and responsibility of this directory in the codebase.]

---

## 📂 Directory Map

*   **`[filename_or_subfolder/]`**: [Brief description of what this file or folder does].
*   **`[another_filename/]`**: [Brief description].

---

## ⚙️ Development Guidelines & Standards

[Highlight 2-3 critical guidelines relevant to this folder, citing rules from the central engineering standards.]

*   **[Standard Category]**: [Brief summary of the rule]. For detailed rules, see **[Standards Document]([relative_path_to_docs_standards_file])**.
*   **[Standard Category]**: [Brief summary of the rule].

---

## 🔗 Quick Navigation

*   **[Repository Root]([relative_path_to_root]/README.md)**
*   **[Documentation Index]([relative_path_to_docs]/README.md)**
```

---

## 🛠️ Best Practices & Rules

1.  **High-Level Only:** Do not document the internals of functions, variable names, or component states in the README. Code should be self-documenting. Use the README to establish the *why* and *where* of files in that folder.
2.  **Maintain Link Integrity:** Use relative markdown links (e.g., `../README.md`) for standard repository navigation. For absolute reference links targeting workspace files in local IDEs, use the `file:///absolute/path/to/file` scheme.
3.  **Cross-Reference Standards:** Never re-define core engineering standards (like TypeScript typings or Express body limit rules) in a folder README. Always reference and link to the source document in `docs/standards/`.
4.  **Avoid Deep Nesting:** Only create README files for high-level application modules or workspace compartments (e.g. `server/`, `src/`, `plans/`, `scratch/`). Avoid placing README files in deep sub-folders (like `src/components/common/` or `server/routes/`) to minimize maintenance overhead.
