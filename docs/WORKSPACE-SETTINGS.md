# Workspace settings and search

The response settings panel groups tone, output language and response length in single and batch mode. Existing output length buttons stay synchronized with the panel.

Workspace saves now include response settings and a separate snapshot of the original text generation request. New history and library entries retain their settings so restoring an entry also restores its language, length, custom prompt, conversation goal and vibe. Legacy entries remain readable and restore with default settings where metadata is missing.

Images remain session-only; large image payloads are not copied into history, library or workspace documents by this change.

History and library have independent searches. Search matches all query terms across original text, generated text, mode, tone and library title. Empty searches show the original list; filtering never deletes or reorders entries.

Reply naming uses an inline form with title validation, cancel, saving state and visible save errors, replacing the native browser prompt.

Validation: `npm test`, `npm run lint`, `npm run build`. Browser checks cover search matches/no matches, saving and restoring an entry, settings after reload, and regeneration of the original input after editing the draft. Browser generation uses the real backend with isolated authentication/storage fixtures, so tests do not modify the owner's saved workspace.
