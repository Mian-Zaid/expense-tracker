# Expense Tracker

A clean, single-page expense tracker that stores data in **your own Google Sheet**
via a Google Apps Script Web App. No server, no database, no build step — just one
self-contained `index.html` and a small Apps Script backend.

- 📱 Mobile-friendly, light **and** dark mode (follows your system)
- 🗓️ Add expenses with date, amount, category, and description
- 🏷️ Categories are pulled live from your Google Sheet header row
- 📊 Big **Total Spent** plus per-category totals with progress bars
- ⚡ Optimistic updates + 20-second polling to stay in sync across devices
- 💾 Web App URL and currency saved in your browser (`localStorage`)

Default currency is **Rs** (changeable in ⚙ settings).

---

## How it works

```
 index.html  ──GET──▶  Apps Script Web App  ──▶  Google Sheet
   (browser)  ◀─JSON─   (doGet / doPost)          ("Expenses" tab + categories)
             ──POST─▶
```

- **Categories** come from row 1 (the header titles) of the first sheet tab that
  is *not* named `Expenses`.
- **Expenses** are appended to the `Expenses` tab with columns:
  `Date | Category | Description | Amount | Logged At`.

---

## Setup

### 1. Create the Google Sheet

1. Create a new Google Sheet.
2. On the **first tab** (e.g. rename it `Categories`), put your category names in
   **row 1**, one per column — for example:

   | Food | Transport | Bills | Shopping | Health | Other |
   |------|-----------|-------|----------|--------|-------|

   These header titles become the category dropdown in the app.
3. You don't need to create the `Expenses` tab — the script creates it
   automatically on the first save.

### 2. Add the Apps Script backend

1. In your sheet, go to **Extensions → Apps Script**.
2. Delete any starter code and paste the contents of
   [`apps-script/Code.gs`](apps-script/Code.gs).
3. Click **Save**.

### 3. Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Select type **Web app** (gear icon → Web app).
3. Configure:
   - **Description:** Expense Tracker
   - **Execute as:** **Me** (your account)
   - **Who has access:** **Anyone**
4. Click **Deploy**, authorize the script when prompted, and copy the
   **Web app URL** — it ends in `/exec`.

> Whenever you change `Code.gs`, use **Deploy → Manage deployments → Edit → New
> version** so the live `/exec` URL picks up your changes.

### 4. Connect the app

1. Open `index.html` (locally or via hosting — see below).
2. Tap the **⚙︎** icon (top right).
3. Paste your `/exec` URL, optionally change the currency symbol, and **Save**.

That's it — categories load, and new expenses sync to your sheet. 🎉

---

## Hosting on GitHub Pages

Because `index.html` is fully self-contained, you can host it for free:

1. Push this repo to GitHub (already done if you're reading this there).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
4. Choose branch **`main`** and folder **`/ (root)`**, then **Save**.
5. After a minute your app is live at:
   `https://<your-username>.github.io/<repo-name>/`

Open that URL on your phone, connect it in ⚙ settings, and you have a personal
expense tracker on any device. The Web App URL is stored per-browser, so enter it
once on each device you use.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | The entire app — inline HTML, CSS, and JS |
| `apps-script/Code.gs` | Google Apps Script backend (`doGet` / `doPost`) |
| `README.md` | This file |

---

## Notes & troubleshooting

- **CORS:** The app POSTs with `Content-Type: text/plain` on purpose — this avoids
  a CORS preflight, which Apps Script Web Apps don't handle. The body is still JSON.
- **"Could not sync":** Re-check that the URL ends in `/exec` (not `/dev`) and that
  the deployment access is set to **Anyone**.
- **Categories empty:** Make sure your category titles are in **row 1** of a tab
  that is **not** named `Expenses`.
- **Privacy:** Data lives only in your Google Sheet and your browser. There is no
  third-party server involved.
