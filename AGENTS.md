# AGENTS.md

## 1. Context First

- Read existing code and project docs before acting
- If no context exists, ask for direction before assuming

## 2. PRD Before Code

If no PRD exists for the implementation:

- **Location:** `docs/prd/YYYY-MM-DD-<slug>.md`
- **Minimum content:** Problem, Goal, Scope / Out of scope, Business rules, Acceptance criteria, Vertical slice plan, Risks

| Change type | Requires PRD? |
|---|---|
| Product or user behavior | Yes → PRD |
| Durable architectural decision | No → ADR |
| Small change, docs, or tests-only | No → context or task is enough |

## 3. TDD Always

When implementing or fixing bugs:

- Minimum: contract test, unit test, or regression test
- Red → Green → Refactor
- If no test is possible, document why

## 4. Vertical Slices

Implement in small but complete vertical slices:

- Each slice has a clear objective
- Business rules in domain modules, not in routes or UI
- No generic files — use domain names
- Leave the system coherent after each slice

## 5. Commit Discipline

- **Ask for permission** before running `git commit` and `git push`
- If authorized: each functional iteration ends with conventional commit + push
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- Commits in English, one commit per logical change

## 6. ADR Tracking

- If a commit introduces a **durable architectural decision**: create or update an ADR in `docs/adr/`

## 7. Architecture Review

For medium, high, or critical changes:

- Review architecture **before** closing the iteration
- Identify shallow modules and transform into deep modules

## 8. Verification Gate

Before considering any change complete, run available build/lint/test commands.
If not runnable, document why.

## 9. No 24/7 Without Authorization

**No cron job, scheduled task, or recurring process may run 24/7 without explicit written authorization from the user.**

