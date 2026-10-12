# Local integration and responsive smoke tests

Run `python tests/triage_integration.py` after building the backend to verify durable AI processing and realtime updates. Install `psycopg[binary]`, `playwright` and Chromium first. The suite creates a uniquely named disposable PostgreSQL database, launches isolated backend/frontend instances on 5179/5180, and uses local fake AI and SMTP servers. The database user needs permission to create/drop the disposable database. It never calls the real AI provider or sends real email. Processes and the test database are removed in a `finally` block. Results are saved to `artifacts/triage/`.

Coverage includes atomic enqueueing, invalid and numeric priorities, malformed JSON, timeout, HTTP 429 retry, concurrent manual edits, duplicate jobs, restart recovery, bounded concurrency, SignalR recipient isolation, missed-update reconciliation, live staff summaries, chat request isolation and independent email failures.

The same suite invokes `workflow_cases.py` to verify ownership and handover actions, lifecycle permissions, stale versions and competing claims, account deactivation/demotion guards, resolution metrics, protected attachment downloads, actual UI request/accept flows, realtime assignee updates and modal keyboard/layout checks at 320x568, 390x480, 844x390 and 1440x900. For just these workflow cases, set `WORKFLOW_ONLY=1` before running the suite. Uploaded test files are removed only when their validated names and paths belong to this run. No production ticket mutations are used.

Start the backend after building it:

```powershell
dotnet build SmartHelpdesk.sln
dotnet run --project SmartHelpdesk.WebApi --launch-profile https --no-build
```

In a separate terminal, start the frontend:

```powershell
cd SmartHelpdesk.Frontend
npm run dev -- --host 127.0.0.1 --port 5178
```

With Python Playwright and Chromium installed, run from the repository root:

```powershell
python tests/smoke.py --api https://localhost:7055 --frontend http://127.0.0.1:5178
```

The suite signs in using local seeded Admin, Agent and Customer accounts. Override credentials with `SMOKE_ADMIN_EMAIL`, `SMOKE_ADMIN_PASSWORD`, `SMOKE_AGENT_EMAIL`, `SMOKE_AGENT_PASSWORD`, `SMOKE_CUSTOMER_EMAIL` and `SMOKE_CUSTOMER_PASSWORD` when needed. TLS certificate checks are disabled only in this local test client.

Checks cover live API authentication, validation, pagination, status/priority filters, role permissions, customer ticket isolation, ticket details/messages, UI login/navigation/search, and responsive layout at 320, 360, 390, 430, 768, 1024 and 1536 pixels. They also check sidebar controls, notification placement, create-form validation, reply-button visibility, persisted dark mode, JavaScript errors and failed API requests.

Results and screenshots are written to the ignored `artifacts/smoke/` directory. Exit code is 1 when an assertion fails. No API mocking is used. The suite reads existing data and submits invalid forms; it does not create tickets, send messages, update user data, or invoke paid AI features.

The .NET solution has no test project and the frontend package has no unit-test command. `dotnet test` currently discovers no unit tests. This smoke suite is integration/browser coverage, not a replacement for unit tests.

The redesigned layout also checks the self-hosted Be Vietnam Pro font, navigation breakpoint at 1024px, and legacy profile redirection to Settings, removal of duplicate profile navigation and Account ID, and hit-testing of the security action to detect overlays.

Run the additional short-screen dialog and keyboard regression checks:

```powershell
python tests/layout_regressions.py
```

This checks profile editing, password and ticket dialogs at 320x568, 390x480, 844x390 and 1440x900, form text size, submit-button visibility, drawer focus trapping, Escape and focus restoration. Screenshots and the report go to `artifacts/redesign/`. These are Chromium viewport simulations, not tests on physical phones.

Run `python tests/themes.py` to verify light/dark palettes, text and badge contrast, portal backgrounds, reload persistence, auth initial theme, system preference, cross-tab synchronization and default/error toast rendering. Theme screenshots and report are saved under `artifacts/themes/`. Toast checks render local previews through the development hook without making API writes.

Run `python tests/settings_modals.py` for the Settings modal flow in both themes at 320x568, 390x480, 844x390 and 1440x900. It checks compact read-only summaries, modal bounds, submit visibility, password mismatch validation, discarded drafts and focus restoration. Reports/screenshots are saved to `artifacts/settings-modals/`.

`notification_cases.py` runs inside the disposable integration harness and verifies assignment recipients, offline delivery, persistence after reload, realtime/reconnect recovery, read/dismiss authorization and idempotent redelivery.
