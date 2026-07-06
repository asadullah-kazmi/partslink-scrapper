chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !isPartslinkUrl(tab.url || "")) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "PL24_TOGGLE_PANEL" });
  } catch (error) {
    if (!String(error.message || "").includes("Receiving end does not exist")) {
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    await chrome.tabs.sendMessage(tab.id, { type: "PL24_TOGGLE_PANEL" });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "PL24_EXPORT_TO_SHEETS") return false;

  exportToSheets(message.payload)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "Sheet export failed." }));

  return true;
});

async function exportToSheets(payload) {
  const spreadsheetId = spreadsheetIdFromUrl(payload?.sheetUrl || "");
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];

  if (!spreadsheetId) throw new Error("Paste a valid Google Sheet link first.");
  if (rows.length === 0) throw new Error("Select at least one row to export.");

  const token = await getAuthToken(true);
  const result = await appendSheetRows(spreadsheetId, payload?.sheetName || "Sheet1", rows, token);
  return { updatedRows: result.updates?.updatedRows || rows.length };
}

function spreadsheetIdFromUrl(url) {
  const match = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : "";
}

function getAuthToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      const error = chrome.runtime.lastError;
      if (error || !token) {
        reject(new Error(error?.message || "Could not authorize Google Sheets access."));
        return;
      }
      resolve(token);
    });
  });
}

async function appendSheetRows(spreadsheetId, sheetName, rows, token, didRetry = false) {
  const range = `${quoteSheetName(sheetName || "Sheet1")}!E:G`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      values: [
        ...rows.map((row) => [
          row.position || "",
          row.partNumber || "",
          row.name || ""
        ]),
        ["", "", ""]
      ]
    })
  });

  if (response.status === 401 && !didRetry) {
    chrome.identity.removeCachedAuthToken({ token });
    return appendSheetRows(spreadsheetId, sheetName, rows, await getAuthToken(true), true);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error?.message || `Google Sheets returned ${response.status}.`);
  }

  return body;
}

function quoteSheetName(name) {
  return `'${String(name).replace(/'/g, "''")}'`;
}

function isPartslinkUrl(url) {
  try {
    return new URL(url).hostname.endsWith("partslink24.com");
  } catch {
    return false;
  }
}
