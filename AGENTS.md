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
