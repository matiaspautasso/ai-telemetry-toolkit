# Skill Registry — ai-telemetry-toolkit

Generated: 2026-05-13
Persistence: engram

## User Skills (global: ~/.claude/skills/)

| Skill | Trigger |
|-------|---------|
| sdd-explore | Investigate ideas before committing to a change |
| sdd-propose | Create change proposal with intent and scope |
| sdd-spec | Write specifications with requirements and scenarios |
| sdd-design | Create technical design document |
| sdd-tasks | Break down a change into implementation task checklist |
| sdd-apply | Implement tasks from the change |
| sdd-verify | Validate implementation matches specs |
| sdd-archive | Sync delta specs and archive a completed change |
| judgment-day | Parallel adversarial review protocol |
| go-testing | Go testing patterns (Bubbletea TUI) |
| skill-creator | Creates new AI agent skills |
| branch-pr | PR creation workflow |
| issue-creation | Issue creation workflow |
| use-railway | Operate Railway infrastructure |
| uxui | UI/UX design patterns |

## Compact Rules

### TypeScript Monorepo
- Use pnpm workspaces; each package has its own package.json
- All packages extend tsconfig.base.json at root
- Shared types live in packages/core — never duplicate models
- ESLint + Prettier enforced at root level

### Testing (Vitest)
- Unit tests co-located: `src/**/*.test.ts`
- Integration tests: `src/**/*.integration.test.ts`
- Run: `pnpm test`, coverage: `pnpm test:coverage`

### Commits
- Conventional commits only: feat, fix, docs, chore, refactor, test
- No AI attribution, no Co-Authored-By
