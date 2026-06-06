# To-Do-List — working notes

## Ship workflow (Ryan's standing instruction, June 2026)

- **Commit directly to `main` and push.** Vercel auto-deploys `main` to
  production, so pushing to `main` ships straight to the live site.
- **Do not open pull requests** for changes — work directly on `main`.
  (This overrides the default "always open a PR" workflow.)
- **Run `npm run build` before pushing** so nothing broken reaches
  production — there is no PR/preview gate anymore.
- To undo a bad change: `git revert <sha>` and push, or use Vercel's
  instant rollback to a previous production deployment.

## Deploy facts

- Vercel's **production branch is `main`** (the git default branch may
  differ; production tracks `main`).
- Supabase env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) must be
  set in Vercel for the task list to load; without them the app shows the
  "Finish the setup" card.
