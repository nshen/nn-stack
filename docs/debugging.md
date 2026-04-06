# UI Debugging Workflow

Use Chrome DevTools MCP to debug frontend issues. Follow these steps in order.

## Step 1: Observe

1. **Take a screenshot** — see the current page state, identify what's visually wrong
2. **Read console messages** — look for JS errors, React warnings, uncaught exceptions
3. **Check network requests** — find failed API calls, CORS errors, 404s, slow responses

## Step 2: Diagnose

4. **Take a DOM snapshot** — check if elements exist, verify their state and attributes
5. **Evaluate JS in page context** — inspect component state, check variables, test selectors
6. **Correlate with source code** — read the relevant source files to find the root cause

## Step 3: Fix & Verify

7. **Fix the code** — make the minimal change to resolve the issue
8. **Take a screenshot again** — confirm the fix visually
9. **Check console is clean** — no new errors introduced

## Common Scenarios

| Symptom | What to check |
|---------|---------------|
| White/blank page | Console for JS errors, network for failed chunk loads |
| Data not showing | Network requests — is the API returning data? |
| Layout broken | Screenshot + DOM snapshot, compare with expected structure |
| Button does nothing | Click it, then check console for errors |
| Stale data | Network tab — is the request firing? Check cache/query invalidation |
| Hydration mismatch | Console warnings, compare server HTML vs client render |
