# Contributing to TURNBOX.js

## Setup

```bash
git clone https://github.com/kazuhi-ra/turnbox.git
cd turnbox
pnpm install
```

## Development

```bash
pnpm storybook      # start Storybook dev server
pnpm test:watch     # run tests in watch mode
```

## Before Submitting a PR

```bash
pnpm test           # all tests must pass
pnpm lint           # no lint errors
pnpm typecheck      # no type errors
```

## Commit Style

Use conventional commits: `fix:`, `feat:`, `test:`, `docs:`, `chore:`, `refactor:`.

## Package Structure

| Package | Contents |
| --- | --- |
| `packages/core` | Pure functions, no DOM dependency |
| `packages/dom` | Vanilla JS adapter |
| `packages/react` | React compound component + hook |
| `packages/vue` | Vue compound component + composable |

Changes to `packages/core` affect all packages — update tests accordingly.
