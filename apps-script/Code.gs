/**
 * Expense Tracker — Google Apps Script backend
 * ------------------------------------------------
 * Bind this script to a Google Sheet (Extensions > Apps Script from the sheet),
 * then Deploy > New deployment > Web app:
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Copy the /exec URL into the app's ⚙ settings.
 *
 * Sheet layout:
 *   - The FIRST tab that is not named "Expenses" is treated as the category
 *     source. Its row 1 (header titles) becomes the category list.
 *   - Expenses are appended to a tab named "Expenses" with columns:
 *       Date | Category | Description | Amount | Logged At
 *     (created automatically if missing)
 */

var EXPENSES_TAB = 'Expenses';
var HEADERS = ['Date', 'Category', 'Description', 'Amount', 'Logged At'];

/** GET: return categories + all expenses as JSON. */
function doGet() {
  try {
    return jsonOutput({
      ok: true,
      categories: getCategories(),
      expenses: getExpenses()
    });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err && err.message || err) });
  }
}

/** POST: append one expense row, return updated data. */
function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    // Delete action: { action:'delete', row:<sheetRow>, loggedAt:<optional guard> }
    if (String(body.action || '').toLowerCase() === 'delete') {
      return deleteExpense(body);
    }

    var date = body.date ? String(body.date) : todayISO();
    var category = String(body.category || '').trim();
    var description = String(body.description || '').trim();
    var amount = parseFloat(body.amount);
    if (!isFinite(amount)) amount = 0;

    if (!category) throw new Error('Category is required');
    if (!(amount > 0)) throw new Error('Amount must be greater than 0');

    var sheet = getExpensesSheet();
    sheet.appendRow([date, category, description, amount, new Date()]);

    return jsonOutput({
      ok: true,
      categories: getCategories(),
      expenses: getExpenses()
    });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err && err.message || err) });
  }
}

/** Delete a single expense row by its sheet row number. */
function deleteExpense(body) {
  var row = parseInt(body.row, 10);
  if (!isFinite(row) || row < 2) throw new Error('Invalid row');

  var sheet = getExpensesSheet();
  var lastRow = sheet.getLastRow();
  if (row > lastRow) throw new Error('Row out of range');

  // Optional guard: if loggedAt was provided, make sure it matches this row
  // so a stale client can't delete the wrong entry after rows shifted.
  if (body.loggedAt) {
    var current = toISO(sheet.getRange(row, 5).getValue());
    if (current && String(current) !== String(body.loggedAt)) {
      throw new Error('Row changed, please refresh');
    }
  }

  sheet.deleteRow(row);

  return jsonOutput({
    ok: true,
    categories: getCategories(),
    expenses: getExpenses()
  });
}

/* ------------------------- helpers ------------------------- */

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/** Category source = first tab that is not the Expenses tab; its row 1 titles. */
function getCategories() {
  var ss = getSpreadsheet();
  var sheets = ss.getSheets();
  var source = null;
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() !== EXPENSES_TAB) { source = sheets[i]; break; }
  }
  if (!source) return [];

  var lastCol = source.getLastColumn();
  if (lastCol < 1) return [];

  var row1 = source.getRange(1, 1, 1, lastCol).getValues()[0];
  var cats = [];
  for (var c = 0; c < row1.length; c++) {
    var title = String(row1[c] == null ? '' : row1[c]).trim();
    if (title !== '') cats.push(title);
  }
  return cats;
}

/** Ensure the Expenses tab exists with a header row, return it. */
function getExpensesSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(EXPENSES_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(EXPENSES_TAB);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** All expense rows (excluding header) as objects. */
function getExpenses() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(EXPENSES_TAB);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    // skip fully-empty rows
    if (String(r[0]).trim() === '' && String(r[1]).trim() === '' &&
        String(r[3]).trim() === '') {
      continue;
    }
    out.push({
      row: i + 2, // actual sheet row number (header is row 1)
      date: toDateString(r[0]),
      category: String(r[1] || ''),
      description: String(r[2] || ''),
      amount: toNumber(r[3]),
      loggedAt: toISO(r[4])
    });
  }
  return out;
}

function toNumber(v) {
  var n = parseFloat(v);
  return isFinite(n) ? n : 0;
}

function toDateString(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v == null ? '' : v);
}

function toISO(v) {
  if (v instanceof Date) return v.toISOString();
  return String(v == null ? '' : v);
}

function todayISO() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
