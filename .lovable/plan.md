# Consistent controls and surfaces

## Goal
Make repeated controls and content surfaces feel like one system across Translate, Check, Style, Dictionary, Settings, and navigation.

## Changes
- Standardize primary actions, secondary pills, add-language controls, icon actions, disabled states, and keyboard focus rings.
- Reuse shared language selector and language-list controls instead of maintaining visually similar copies on each page.
- Align repeated cards, notices, fields, and section spacing while preserving the current calm, spacious layout.
- Keep every existing interaction and all language settings unchanged.
- Check desktop and mobile views for visual consistency, overflow, and accessible focus states.

## Technical details
- Extend the existing shared button styles with pill, compact, and icon treatments using semantic color tokens.
- Add small shared language-control components and replace route-local duplicates.
- Use the logo-matched palette tokens already defined globally; no page-specific hardcoded colors.
- Validate the app build and the central controls on Translate, Check, Style, Dictionary, and Settings.
