# Check language shortcuts

## What will change
- Add a **Change to** shortcut row below the Check language selector, matching Style and Dictionary.
- Let users switch the Check language with one click and add more shortcut languages from the existing simple dropdown.
- Keep shortcut changes local to the current session on the Check page.
- Add **Language shortcuts** to the Check section in Settings, saved immediately and used when Check next loads.

## Technical details
- Extend saved settings with `checkShortcuts`, defaulting to English, Italian, and Chinese (Simplified), while preserving older saved settings.
- Initialize Check's language and shortcut list once from Settings so temporary in-page changes are not overwritten.
- Reuse existing translated labels and established pill/dropdown styling.
