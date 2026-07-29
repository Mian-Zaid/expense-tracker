# Architecture Brief: Serverless Google-Sheets App

A reusable blueprint for building **static, backend-free web apps that use a Google
Sheet as their database**, with Google login and live data. This repo's expense
tracker is one implementation of the pattern — hand this document to a new session
to build a different app on the same architecture.

## What it is

A **100% static single-page app** (`index.html`, inline CSS+JS, no build step, no
server) that uses a **Google Sheet as its database**, reads/writes it **directly
from the browser** via the Google Sheets API, authorized with **client-side Google
OAuth**. Hosted free on **GitHub Pages**.

## The core pattern (reuse this for any app)

```
Static page (GitHub Pages)
      │  Google Identity Services (GIS) → OAuth access token (in-memory)
      ▼
Google Sheets API v4 (gapi client)  ──►  User's Google Sheet
   values.get / values.update / values.append / batchUpdate
```

## Key technical decisions & why

1. **No backend at all.** Everything runs in the browser. The "server" is Google's
   own Sheets API.
2. **Auth = Google Identity Services token client**
   (`google.accounts.oauth2.initTokenClient`), scope
   `https://www.googleapis.com/auth/spreadsheets`. NOT a share link — **a share
   link CANNOT authorize writes**; only an OAuth token can. This is the #1 thing
   people get wrong.
3. **Two Google scripts loaded:** `https://apis.google.com/js/api.js` (gapi, for
   the Sheets API) + `https://accounts.google.com/gsi/client` (GIS, for the token).
   Wait for both globals before init.
4. **gapi init** with
   `discoveryDocs:['https://sheets.googleapis.com/$discovery/rest?version=v4']`,
   then `gapi.client.setToken({access_token})` after each token grant. No API key
   needed when using OAuth.
5. **Token lifecycle:** tokens last ~1h, live only in memory (never localStorage).
   On load, try silent `requestAccessToken({prompt:''})`; on 401, silently
   re-request; if that fails, show a "Sign in" button (`prompt:'consent'`).
6. **Config in localStorage:** OAuth Client ID, Spreadsheet ID (parsed from a full
   URL via regex `/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/`), tab name, plus
   app-specific settings.
7. **Live data:** optimistic UI update → API call → re-fetch to reconcile; plus
   **20s polling** (paused when `document.visibilityState !== 'visible'`, and
   refetch on tab focus).
8. **Safe writes into human-maintained sheets:** never insert/delete whole rows
   (that shifts other content) and **never overwrite a non-empty cell** — re-read
   fresh, find an empty target row, verify it's blank, then `values.update` a
   specific A1 range. Delete = clear cells, not delete the row. This protects real
   user data.

## Sheets API calls used

| Purpose | Call |
|---------|------|
| Read all cells of a tab | `spreadsheets.values.get({range:"'TabName'", valueRenderOption:"FORMATTED_VALUE"})` |
| Tab names / gids | `spreadsheets.get({fields:"sheets.properties(sheetId,title)"})` |
| Write a cell range | `spreadsheets.values.update({range, valueInputOption:"USER_ENTERED", resource:{values}})` |
| Append a row | `spreadsheets.values.append({range, valueInputOption, insertDataOption:"INSERT_ROWS", resource:{values}})` |
| Add tab / delete row | `spreadsheets.batchUpdate({resource:{requests:[...]}})` |

## One-time Google Cloud setup (the only real config burden)

1. Cloud Console → new project → **enable Google Sheets API**.
2. **OAuth consent screen** (External) → add yourself under **Test users** (no
   verification needed for personal use; the app can stay in "Testing").
3. **Credentials → OAuth client ID → Web application** → add **Authorized
   JavaScript origins** = the exact hosting origin, e.g. `https://<user>.github.io`
   (origin only, no path).
4. Paste the Client ID into the app's settings.

## Gotchas that cost time

- **Share link ≠ write access.** Must use OAuth.
- **Authorized JavaScript origins must match exactly** — GitHub Pages origin is
  `https://<user>.github.io`, NOT the `/repo/` path. Mismatch = sign-in fails.
- **Workspace sheets** (company Google accounts) often **block public export/CSV**
  and public sharing by admin policy — you can't read them via CSV endpoints; only
  the OAuth'd user in their own browser can.
- **"Access blocked: app not verified"** = add your account to **Test users**, or
  Publish the consent screen (accept the unverified warning for personal use).
- **`FORMATTED_VALUE`** returns amounts with commas ("40,000") and dates as display
  strings — strip non-numerics when parsing amounts. `UNFORMATTED_VALUE` gives raw
  numbers but dates as serials (needs conversion). Pick per need.
- **Don't touch users' existing `=SUM()` formulas** when writing; compute your own
  totals in-app.

## Handling messy, human-maintained sheets

Real sheets are rarely a clean flat table. This app's sheet had **multiple
side-by-side "category" tables** on one tab, each with a title cell above a
`Description | Amount | Date` header, variable lengths, and `Total` rows. The
parser **auto-detects each block** by scanning for `Description` header cells
(column = Description, +1 = Amount, +2 = Date) and reads the nearest non-empty cell
above as the category title. Design your parser to discover structure from anchors,
not fixed cell coordinates. Also useful: a configurable **ignore list** to skip
tables that aren't real data (e.g. recovery/"wasoli" tables).

## Recommended file layout

- `index.html` — entire app. Internal structure: helpers → parse/render →
  auth/API → event handlers → polling → init.
- `README.md` — Google Cloud setup, sheet layout, GitHub Pages hosting,
  troubleshooting.
- `ARCHITECTURE.md` — this file.
- No backend files. (An earlier version used a Google Apps Script Web App as the
  backend; it was removed in favor of pure client-side OAuth, which is genuinely
  "no backend.")

## Two backend-free options (pick per use case)

| Option | Setup | Sign-in? | Read | Write |
|--------|-------|----------|------|-------|
| **Client-side OAuth** (this app) | Google Cloud OAuth Client ID | Yes, once | ✅ | ✅ |
| Apps Script Web App | Paste script, Deploy as Web App | No | ✅ | ✅ |

Client-side OAuth keeps the app fully static (no deployed script) but needs an
OAuth Client ID and a Google sign-in. An Apps Script Web App needs no sign-in and
no Cloud project, but the `/exec` endpoint is technically a (Google-hosted)
backend. Choose OAuth for "truly static"; choose Apps Script for "zero Cloud
setup, no sign-in."

## Reusable starting prompt for the next app

> Build a static single-page `index.html` (inline CSS+JS, no backend, no build)
> that uses a Google Sheet as its database via the Sheets API v4 with **client-side
> Google OAuth** (Google Identity Services token client, scope
> `.../auth/spreadsheets`). Load `api.js` + `gsi/client`. Store OAuth Client ID +
> Sheet ID + tab name in localStorage. Silent token on load, sign-in button on 401.
> Read the sheet, render [MY UI], write back with optimistic updates + 20s polling
> paused when the tab is hidden. Writes must be safe: re-read fresh, only write into
> empty cells, never insert/delete rows. Mobile-first, light/dark, rounded cards.
> Host on GitHub Pages — remind me to add the Pages origin to Authorized JavaScript
> origins. Then write a README with the Google Cloud setup steps.
