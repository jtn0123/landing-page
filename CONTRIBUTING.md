# Contributing

Thanks for your interest in contributing to **neuhard.dev**!

## Getting Started

1. Fork the repo and clone locally
2. `npm ci` to install dependencies
3. `npm run dev` to start the dev server
4. Create a feature branch from `master`

## Pull Request Guidelines

- **One concern per PR** — keep changes focused
- **Write descriptive commit messages** — use conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)
- **Update tests** — new features need unit tests; UI changes need e2e coverage
- **Don't break the build** — all CI checks must pass before merge

## Code Style

- **TypeScript strict mode** — no `any` unless absolutely necessary
- **ESLint + Prettier** — run `npm run lint` and `npm run format:check` before pushing
- **JSDoc comments** on all exported functions
- **CSS** — use CSS custom properties (`var(--*)`) for theming; component styles in `src/css/`

## Testing Requirements

All PRs must pass:

```bash
npm run build          # Production build succeeds
npm run type-check     # No TypeScript errors
npm run lint           # No ESLint errors
npm run test:coverage  # Unit tests pass with coverage
npm run test:e2e       # Playwright e2e tests pass
```

## CI Checks

GitHub Actions runs automatically on PRs targeting `master`:

1. **Unit tests** with coverage (Vitest)
2. **Type checking** (TypeScript strict)
3. **Linting** (ESLint)
4. **Build** verification
5. **Bundle size** check
6. **E2E tests** (Playwright)
7. **Lighthouse** audit (performance, a11y, SEO)

## Project Structure

See [README.md](README.md) for architecture details.

## Questions?

Open an issue or reach out via GitHub.
