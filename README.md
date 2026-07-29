# Expense Tracker

**🔗 Live app: https://mian-zaid.github.io/expense-tracker/**

A clean, single-page expense tracker that reads and writes **your own Google Sheet
directly from the browser** — no server, no Apps Script, no build step. It's just
one self-contained `index.html` that talks to the Google Sheets API using your own
Google sign-in.

> First time here? Open the link above, tap **⚙︎**, and follow the
> [Setup](#setup) section to connect your Google Sheet.

- 📱 Mobile-friendly, light **and** dark mode (follows your system)
- 🗓️ Add expenses with date, amount, category, and description
- 🏷️ Categories are pulled live from your Google Sheet header row
- 📊 Big **Total Spent** plus per-category totals with progress bars
- 🗑️ Delete any expense
- ⚡ Optimistic updates + 20-second polling to stay in sync across devices
- 🔐 Signs in with **your** Google account — data never leaves your Sheet
- 💾 Client ID, Sheet ID, and currency saved in your browser (`localStorage`)

Default currency is **Rs** (changeable in ⚙ settings).

---

## Why sign-in (and not just a share link)?

Google **does not allow writing to a Sheet from JavaScript using only a share
link** — every write must be authorized. So instead of a backend, this app uses
Google's browser OAuth: you click **Sign in with Google** once, and the app gets
permission to edit the specific sheet on your behalf. The whole thing stays a
static page you can host on GitHub Pages.

You need two things (both free, one-time):

1. A **Google OAuth Client ID** (created in Google Cloud, ~3 min).
2. A **Google Sheet** you have edit access to.

---

## Sheet layout

The app reads a **single tab** (default name `Expenses`) that contains **one or
more category tables laid out side by side**. Each table is one **category**:

- The **category name** sits in a cell above the table's header row.
- The **header row** has the columns `Description | Amount | Date` (in that order).
- Rows below are the expenses for that category, optionally ending in a `Total` row.
- Tables are separated by one or more blank columns and can each be a different
  length.

Example (two categories side by side — a blank column between them):

| Khalid Thekaydar |        |        |     | Materials |        |        |
|------------------|--------|--------|-----|-----------|--------|--------|
| **Description**  | **Amount** | **Date** | | **Description** | **Amount** | **Date** |
| Advance          | 40,000 | 3 Feb 2026 | | Wire coil | 5,000 | 4 Feb 2026 |
| 1st week         | 23,200 | 12 Feb 2026 | | Water cooler | 12,000 | 6 Feb 2026 |
| Total            | 63,200 |          | | … | | |

The app **auto-detects every table** by finding each `Description` header, and
uses the title above it as the category. You don't configure columns anywhere.

### How adding & deleting works (safe by design)

- **Add** writes the new expense into the first empty row under the chosen
  category's data. It **never inserts or deletes whole rows** (that would shift
  the neighbouring tables) and **never overwrites a non-empty cell**.
- **Delete** just clears that entry's three cells, leaving a blank gap — again,
  no row shifting.
- Your sheet's own `Total` formulas are left untouched. If a Total uses a fixed
  range that doesn't cover the new row, extend that range in the sheet; the app's
  own "By Category" totals always reflect every entry.

---

## Setup

### 1. Create a Google Cloud project + OAuth Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create
   (or pick) a project.
2. **Enable the Sheets API:** APIs & Services → **Library** → search
   *Google Sheets API* → **Enable**.
3. **Configure the consent screen:** APIs & Services → **OAuth consent screen**.
   - User type: **External** → Create.
   - Fill the required app name / email fields.
   - Add your Google account under **Test users** (this lets you use the app while
     it's in "Testing" — no Google verification needed for personal use).
4. **Create the Client ID:** APIs & Services → **Credentials** →
   **Create credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Under **Authorized JavaScript origins**, add the origin(s) you'll open the app
     from, e.g.:
     - `http://localhost:8000` (if testing locally)
     - `https://<your-username>.github.io` (for GitHub Pages)
   - Create, then copy the **Client ID** (ends in `.apps.googleusercontent.com`).

> **Important:** the origin must match exactly where the page is served from.
> GitHub Pages origin is `https://<username>.github.io` (no path).

### 2. Prepare your Sheet

1. Create/open a Google Sheet you can edit.
2. Put your category names in **row 1** of the first tab (see layout above).
3. Copy the sheet URL or ID — you'll paste it into the app.

### 3. Connect the app

1. Open `index.html` (locally or via GitHub Pages — see below).
2. Tap the **⚙︎** icon (top right).
3. Paste your **OAuth Client ID**, your **Sheet link/ID**, the **Tab name** that
   holds your category tables (default `Expenses`), set a currency, and **Save**.
4. Click **Sign in with Google**, choose your account, and allow access.

Categories load and expenses sync straight to your sheet. 🎉

---

## Hosting on GitHub Pages

This repo is already deployed at **https://mian-zaid.github.io/expense-tracker/**.

To host your own copy (it's a single static file, so hosting is free):

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source:** *Deploy from a branch*.
3. Branch **`main`**, folder **`/ (root)`** → **Save**.
4. Your app goes live at `https://<your-username>.github.io/<repo-name>/`
   (for this repo that's `https://mian-zaid.github.io/expense-tracker/`).
5. Make sure that **origin** (`https://mian-zaid.github.io`) is listed under
   your OAuth client's **Authorized JavaScript origins** (step 1.4 above).

Open the URL on any device, connect it once in ⚙ settings, and sign in. Settings
are stored per-browser, so enter them once on each device.

> You do **not** need a custom or "verified" domain — the free `github.io` origin
> works fine. A verified/custom domain is only needed if you want your own URL.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | The entire app — inline HTML, CSS, and JS (Sheets API via OAuth) |
| `README.md` | This file |

---

## Notes & troubleshooting

- **"Access denied (403)":** Confirm your signed-in Google account has **edit**
  access to the sheet, and that the **Google Sheets API** is enabled in your Cloud
  project.
- **Sign-in popup blocked / `redirect_uri_mismatch` / origin error:** the exact
  origin you're serving from must be in **Authorized JavaScript origins**. For
  GitHub Pages that's `https://<username>.github.io` — not the `.../repo/` path.
- **"Sheet not found (404)":** re-check the Sheet link/ID in ⚙ settings.
- **Stuck on "Testing" consent screen:** add your Google account as a **Test user**
  on the OAuth consent screen. Personal use never needs Google's app verification.
- **Privacy:** the app runs entirely in your browser and only ever contacts
  Google's own APIs. Your Client ID and Sheet ID live in `localStorage`; access
  tokens live only in memory and expire automatically.
