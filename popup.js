const extractBtn = document.getElementById("extractBtn");
const copyBtn = document.getElementById("copyBtn");
const csvBtn = document.getElementById("csvBtn");
const jsonBtn = document.getElementById("jsonBtn");
const sheetExportBtn = document.getElementById("sheetExportBtn");
const sheetUrlInput = document.getElementById("sheetUrlInput");
const sheetNameInput = document.getElementById("sheetNameInput");
const selectAllBtn = document.getElementById("selectAllBtn");
const clearSelectionBtn = document.getElementById("clearSelectionBtn");
const statusText = document.getElementById("status");
const partsBody = document.getElementById("partsBody");
const partCount = document.getElementById("partCount");
const rowCount = document.getElementById("rowCount");
const candidateCount = document.getElementById("candidateCount");
const selectedCount = document.getElementById("selectedCount");

let latestPayload = null;
let selectedPartIds = new Set();

extractBtn.addEventListener("click", extractVisibleData);
copyBtn.addEventListener("click", copyJson);
csvBtn.addEventListener("click", () => downloadText("csv"));
jsonBtn.addEventListener("click", () => downloadText("json"));
sheetExportBtn.addEventListener("click", exportSelectedToSheet);
sheetUrlInput.addEventListener("input", () => {
  chrome.storage.local.set({ sheetUrl: sheetUrlInput.value.trim() });
  updateSelectionUi();
});
sheetNameInput.addEventListener("input", () => {
  chrome.storage.local.set({ sheetName: sheetNameInput.value.trim() || "Sheet1" });
});
selectAllBtn.addEventListener("click", selectAllParts);
clearSelectionBtn.addEventListener("click", clearSelection);

loadSheetSettings();

async function extractVisibleData() {
  setStatus("Extracting visible page data...");
  setActionsEnabled(false);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !isPartslinkUrl(tab.url || "")) {
      throw new Error("Open a Partslink24 tab before extracting.");
    }

    const response = await requestExtraction(tab.id);
    latestPayload = response;
    renderPayload(response);
    setStatus(`Extracted from ${new URL(response.page.url).hostname}.`);
    setActionsEnabled(true);
  } catch (error) {
    latestPayload = null;
    renderEmpty();
    setStatus(error.message || "Extraction failed.");
  }
}

async function requestExtraction(tabId) {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: "PL24_EXTRACT_VISIBLE" });
  } catch (error) {
    if (!String(error.message || "").includes("Receiving end does not exist")) {
      throw error;
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
    return chrome.tabs.sendMessage(tabId, { type: "PL24_EXTRACT_VISIBLE" });
  }
}

async function copyJson() {
  if (!latestPayload) return;
  const selectedRows = (latestPayload.parts || []).filter((part) => selectedPartIds.has(part.id));

  if (selectedRows.length > 0) {
    await navigator.clipboard.writeText(buildTsv(selectedRows));
    setStatus(`Copied ${selectedRows.length} rows for Sheets.`);
    return;
  }

  await navigator.clipboard.writeText(JSON.stringify(latestPayload, null, 2));
  setStatus("No rows selected, JSON copied instead.");
}

function downloadText(type) {
  if (!latestPayload) return;

  const isCsv = type === "csv";
  const text = isCsv ? buildCsv(latestPayload) : JSON.stringify(latestPayload, null, 2);
  const mime = isCsv ? "text/csv" : "application/json";
  const extension = isCsv ? "csv" : "json";
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const filename = `partslink24-visible-${timestamp()}.${extension}`;

  chrome.downloads.download({ url, filename, saveAs: true }, () => {
    URL.revokeObjectURL(url);
  });
}

function renderPayload(payload) {
  const rows = payload.tables.reduce((sum, table) => sum + table.rows.length, 0);
  const parts = normalizeParts(payload.parts || []);
  latestPayload = {
    ...payload,
    parts
  };

  selectedPartIds = new Set(parts.map((part) => part.id));
  partCount.textContent = String(parts.length);
  rowCount.textContent = String(rows);
  candidateCount.textContent = String(payload.partCandidates.length);

  renderPartsTable(parts);
  updateSelectionUi();
}

function renderEmpty() {
  selectedPartIds.clear();
  partCount.textContent = "0";
  rowCount.textContent = "0";
  candidateCount.textContent = "0";
  selectedCount.textContent = "0";
  partsBody.innerHTML = '<tr><td colspan="4" class="empty">No data extracted yet.</td></tr>';
  setActionsEnabled(false);
  setSelectionActionsEnabled(false);
}

function renderPartsTable(parts) {
  if (parts.length === 0) {
    partsBody.innerHTML = '<tr><td colspan="4" class="empty">No matching parts found on the visible page.</td></tr>';
    return;
  }

  partsBody.replaceChildren(...parts.map((part) => {
    const row = document.createElement("tr");
    row.append(
      checkboxCell(part),
      tableCell(part.position),
      tableCell(part.partNumber),
      tableCell(part.name)
    );
    return row;
  }));
}

function normalizeParts(parts) {
  return parts.map((part, index) => ({
    id: String(index),
    position: part.position || "",
    partNumber: part.partNumber || "",
    name: part.name || "",
    designation: part.designation || ""
  }));
}

function checkboxCell(part) {
  const cell = document.createElement("td");
  cell.className = "selectCol";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = selectedPartIds.has(part.id);
  checkbox.setAttribute("aria-label", `Select ${part.partNumber || "part"}`);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      selectedPartIds.add(part.id);
    } else {
      selectedPartIds.delete(part.id);
    }
    updateSelectionUi();
  });

  cell.append(checkbox);
  return cell;
}

function tableCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value || "";
  return cell;
}

function setActionsEnabled(enabled) {
  copyBtn.disabled = !enabled;
  csvBtn.disabled = !enabled || selectedPartIds.size === 0;
  jsonBtn.disabled = !enabled;
  sheetExportBtn.disabled = !enabled || selectedPartIds.size === 0 || !sheetUrlInput.value.trim();
}

function setSelectionActionsEnabled(enabled) {
  selectAllBtn.disabled = !enabled;
  clearSelectionBtn.disabled = !enabled;
}

function selectAllParts() {
  const parts = latestPayload?.parts || [];
  selectedPartIds = new Set(parts.map((part) => part.id));
  renderPartsTable(parts);
  updateSelectionUi();
}

function clearSelection() {
  selectedPartIds.clear();
  renderPartsTable(latestPayload?.parts || []);
  updateSelectionUi();
}

function updateSelectionUi() {
  const total = latestPayload?.parts?.length || 0;
  selectedCount.textContent = String(selectedPartIds.size);
  setSelectionActionsEnabled(total > 0);
  csvBtn.disabled = total === 0 || selectedPartIds.size === 0;
  sheetExportBtn.disabled = total === 0 || selectedPartIds.size === 0 || !sheetUrlInput.value.trim();
}

async function loadSheetSettings() {
  const { sheetUrl = "", sheetName = "Sheet1" } = await chrome.storage.local.get(["sheetUrl", "sheetName"]);
  sheetUrlInput.value = sheetUrl;
  sheetNameInput.value = sheetName || "Sheet1";
  updateSelectionUi();
}

async function exportSelectedToSheet() {
  if (!latestPayload) return;

  const rows = (latestPayload.parts || []).filter((part) => selectedPartIds.has(part.id));
  if (rows.length === 0) return;

  setStatus("Exporting selected rows to Google Sheets...");
  sheetExportBtn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "PL24_EXPORT_TO_SHEETS",
      payload: {
        sheetUrl: sheetUrlInput.value.trim(),
        sheetName: sheetNameInput.value.trim() || "Sheet1",
        rows
      }
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Sheet export failed.");
    }

    setStatus(`Exported ${response.updatedRows || rows.length} rows to Google Sheets.`);
  } catch (error) {
    setStatus(error.message || "Sheet export failed.");
  } finally {
    updateSelectionUi();
  }
}

function setStatus(message) {
  statusText.textContent = message;
}

function isPartslinkUrl(url) {
  try {
    return new URL(url).hostname.endsWith("partslink24.com");
  } catch {
    return false;
  }
}

function buildCsv(payload) {
  const rows = (payload.parts || []).filter((part) => selectedPartIds.has(part.id));
  const headers = ["position", "partNumber", "name"];
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header] ?? "")).join(","));
  }
  return lines.join("\n");
}

function csvCell(value) {
  const text = String(value).replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function buildTsv(rows) {
  const headers = ["position", "partNumber", "name"];
  const lines = [headers.join("\t")];

  for (const row of rows) {
    lines.push(headers.map((header) => tsvCell(row[header] ?? "")).join("\t"));
  }

  return lines.join("\n");
}

function tsvCell(value) {
  return String(value)
    .replace(/\r?\n/g, " ")
    .replace(/\t/g, " ")
    .trim();
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
