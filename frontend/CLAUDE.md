# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (Turbopack, outputs to .next/dev)
npm run build    # Production build (Turbopack)
npm run start    # Start production server
npm run lint     # Run ESLint (eslint CLI directly — NOT next lint)
```

`next build` does **not** run linting automatically in Next.js 16. Run lint separately.

## Architecture

This is a **Next.js 16 App Router** project. The `app/` directory uses file-system routing:

- `app/layout.tsx` — root layout (required; wraps all pages)
- `app/page.tsx` — home route (`/`)
- `app/globals.css` — global styles with Tailwind v4

**Styling**: Tailwind CSS v4 via `@import "tailwindcss"` in CSS (not a `tailwind.config.*` file). Theme tokens are defined with `@theme inline { ... }` inside CSS files.

**Import alias**: `@/*` resolves to the project root (e.g. `@/app/...`, `@/components/...`).

## Next.js 16 — Key Differences from Prior Versions

**Async Request APIs (breaking)**: `cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` are all async. Always `await` them:

```tsx
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  const query = await props.searchParams
}
```

**Type helpers**: Run `npx next typegen` to generate globally available `PageProps<Route>`, `LayoutProps<Route>`, and `RouteContext<Route>` types (already used in `app/layout.tsx`).

**Turbopack is default**: No `--turbopack` flag needed. Use `--webpack` to opt out. Custom `webpack` config in `next.config.ts` will cause `next build` to fail unless `--webpack` is passed.

**`middleware` → `proxy`**: The `middleware.ts` file convention is deprecated. Use `proxy.ts` with a named export `proxy` instead.

**ESLint Flat Config**: Config lives in `eslint.config.mjs` using `defineConfig`. The legacy `.eslintrc` format is not used here.

**Caching APIs**:
- `revalidateTag(tag, cacheLifeProfile)` — now requires a second argument (e.g. `'max'`)
- `updateTag(tag)` — new Server Action API for immediate read-your-writes cache updates
- `refresh()` — refreshes the client router from a Server Action
- `cacheLife` / `cacheTag` — stable, no `unstable_` prefix needed

**Parallel routes**: All `@slot` directories require an explicit `default.js`/`default.tsx` file, or builds will fail.

**PPR**: Enabled via `cacheComponents: true` in `next.config.ts` (not `experimental.ppr`).

**Removed in v16**: AMP support, `next lint` command, `serverRuntimeConfig`/`publicRuntimeConfig`, `experimental.dynamicIO`, `experimental.useCache`.
