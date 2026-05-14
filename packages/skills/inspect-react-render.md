# Skill: Inspect React Render Performance

## Goal

Detect React components that render excessively and identify missing memoization, virtualization, or state structure issues.

## Inputs

- Frontend metrics from `telemetry.getFrontendMetrics`
- Component render counts and render durations
- LCP, FID, CLS values
- Initial bundle size hints

## Process

1. Call `telemetry.getFrontendMetrics` to retrieve component-level render data.
2. Flag components with render count > 20 in the observation window.
3. Check LCP — if > 2500ms, correlate with large list renders or blocking JS.
4. Identify components rendering full unvirtualized lists (render count correlates with row count).
5. Check for missing `React.memo`, `useMemo`, `useCallback` signals.
6. Recommend: memoization, virtualization (react-window / TanStack Virtual), or state colocation.

## Output Format

```markdown
### React Render Analysis

**Problematic components**:
- `ProductTable`: 450 renders — likely rendering all rows without virtualization
- `PriceCell`: 450 renders — missing React.memo

**LCP**: 3.2s — probable cause: large initial DOM from ProductTable

**Recommended fixes**:
1. Virtualize ProductTable with `@tanstack/react-virtual`
2. Wrap PriceCell with `React.memo`
3. Paginate to max 20 rows per page

**Expected improvement**: LCP < 1.5s, render count < 30
```

## Success Criteria

- Components with > 20 renders are identified
- LCP impact is quantified
- Recommendations include specific library names
