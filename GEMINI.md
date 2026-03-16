# MoonStudio Sales Dashboard - Project Context

All AI agents MUST read the contents of the `.gemini/context/` directory before starting any task or proposing any changes.

## Mandates
1. **Source of Truth:** The files in `.gemini/context/` represent the current state and agreed-upon direction of the project.
2. **Consistency:** Adhere strictly to the tech stack and architectural patterns defined in `tech_stack.md`.
3. **Feature Tracking:** Refer to `feature_roadmap.md` for the current priorities and planned work.
4. **Data Handling:** Consult `data_processing.md` for details on how to handle CSV imports from various platforms.
5. **Session Logging:** For EVERY implementation (new feature, bug fix, or refactor), the AI MUST create a session log file in the `logs/` directory. The filename should be `YYYY-MM-DD_feature-name.md` and include:
    - **Goal:** What was the objective of the session?
    - **Changes:** List of files modified or created.
    - **Outcome:** Summary of the result and any next steps.

## Current Directory Structure
- `data/`: Sample CSV files from various platforms.
- `planning/`: Preliminary design documents and meeting notes.
- `logs/`: Session logs documenting all AI implementations.
- `.gemini/context/`: Core project specifications and technical standards.
