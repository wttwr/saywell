<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Treat input-language selectors as preferences: AI tools detect the actual language, preserve it, and show a localized mismatch notice when confidently different.
- Listen uses ElevenLabs via a server route (key stays server-side); browser speech is only a fallback when the service fails.
- Saved multilingual rows use group-scoped IDs and are grouped before filtering; this keeps whole cards intact without overwriting standalone bookmarks. Dictionary saves carry a complete entry snapshot so definitions and examples survive navigation.
- Saved detail screens use the Saved route's validated detail search parameter to retain list filters and search while enabling browser back navigation; full content lives in SavedContent, with shared TextActions for text-scoped Listen and Copy controls.

- Feature state that must survive switching between workspace widget and Focus Mode lives in useFeatureState (src/lib/feature-state.ts); features expose a `<XFeature mode>` component and are listed in src/lib/features.ts — so views share one implementation.
- Workspace card layout is a list of FeatureIds in localStorage (saywell.dashboard), validated by sanitizeLayout in src/lib/features.ts — so unknown/removed features never break saved layouts.
- Top navigation lists only Workspace, Saved and Settings: Workspace is the home page and feature sections are reached from their Workspace card, so nav stays calm as features are added.
- The home route renders the Workspace; each feature keeps its own focus route (Translate at /translate) and any moved or renamed route keeps its old path as a permanent redirect, so published addresses keep working.
- Shared UI primitives used by several sections live in src/components/ds/ (e.g. LanguageSelectorBar) — so sections stay visually in sync and new sections like Listen reuse them.
