if (!window.__partslink24VisibleExtractorLoaded) {
  window.__partslink24VisibleExtractorLoaded = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "PL24_EXTRACT_VISIBLE") {
      sendResponse(extractVisibleData());
      return false;
    }

    if (message?.type === "PL24_TOGGLE_PANEL") {
      sendResponse(toggleFloatingPanel());
      return false;
    }

    return false;
  });
}

function toggleFloatingPanel() {
  const existing = document.getElementById("pl24-extractor-panel");

  if (existing) {
    existing.remove();
    return { visible: false };
  }

  initFloatingPanel();
  return { visible: true };
}

function initFloatingPanel() {
  if (document.getElementById("pl24-extractor-panel")) return;

  const host = document.createElement("div");
  host.id = "pl24-extractor-panel";
  document.documentElement.append(host);

  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      :host {
        position: fixed;
        top: 88px;
        right: 24px;
        z-index: 2147483647;
        width: 720px;
        height: 440px;
        min-width: 430px;
        min-height: 260px;
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 32px);
        resize: both;
        overflow: hidden;
        border: 1px solid #b8c4d1;
        border-radius: 8px;
        background: #f6f8fb;
        box-shadow: 0 14px 40px rgba(15, 23, 42, 0.24);
        color: #1f2933;
        font-family: Arial, Helvetica, sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      .panel {
        display: grid;
        grid-template-rows: auto auto auto auto auto 1fr;
        height: 100%;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 42px;
        padding: 9px 12px;
        background: #22577a;
        color: #ffffff;
        cursor: move;
        user-select: none;
      }

      .title {
        flex: 1;
        font-size: 14px;
        font-weight: 700;
      }

      .status {
        padding: 8px 12px;
        color: #596675;
        font-size: 12px;
        background: #ffffff;
        border-bottom: 1px solid #d9e1e8;
      }

      .toolbar,
      .selection,
      .sheetExport {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f6f8fb;
        border-bottom: 1px solid #d9e1e8;
      }

      .selection {
        padding-top: 0;
      }

      .sheetExport {
        padding-top: 0;
      }

      button {
        min-height: 30px;
        border: 1px solid #c7d0da;
        border-radius: 6px;
        background: #ffffff;
        color: #1f2933;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        padding: 0 10px;
      }

      button:hover:not(:disabled) {
        border-color: #7b8da1;
        background: #f9fbfd;
      }

      button:disabled {
        color: #98a4b1;
        cursor: not-allowed;
      }

      input[type="url"],
      input[type="text"] {
        min-width: 0;
        min-height: 30px;
        border: 1px solid #c7d0da;
        border-radius: 6px;
        color: #1f2933;
        font: inherit;
        font-size: 12px;
        padding: 0 8px;
      }

      .sheetUrl {
        flex: 1;
      }

      .sheetName {
        width: 92px;
      }

      .primary {
        border-color: #22577a;
        background: #22577a;
        color: #ffffff;
      }

      .header button {
        min-height: 24px;
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        padding: 0 8px;
      }

      .count {
        margin-left: auto;
        color: #405064;
        font-size: 12px;
      }

      .tableWrap {
        min-height: 0;
        overflow: auto;
        background: #ffffff;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        color: #23303f;
        font-size: 12px;
        table-layout: fixed;
      }

      th,
      td {
        border-bottom: 1px solid #edf1f5;
        padding: 8px 9px;
        text-align: left;
        vertical-align: top;
        word-break: break-word;
      }

      th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: #eef3f7;
        color: #304256;
        font-size: 11px;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      tbody tr:hover {
        background: #f8fafc;
      }

      .selectCol {
        width: 64px;
        text-align: center;
      }

      .positionCol {
        width: 74px;
        text-align: center;
      }

      .partCol {
        width: 150px;
        font-weight: 700;
      }

      .nameCol {
        width: auto;
      }

      input[type="checkbox"] {
        width: 15px;
        height: 15px;
        margin: 0;
      }

      .empty {
        height: 140px;
        color: #647282;
        text-align: center;
        vertical-align: middle;
      }

      :host(.collapsed) {
        height: auto;
        resize: none;
      }

      :host(.collapsed) .status,
      :host(.collapsed) .toolbar,
      :host(.collapsed) .selection,
      :host(.collapsed) .sheetExport,
      :host(.collapsed) .tableWrap {
        display: none;
      }
    </style>
    <section class="panel" aria-label="Partslink24 extractor panel">
      <header class="header" id="dragHandle">
        <div class="title">Partslink24 Extractor</div>
        <button type="button" id="minimizeBtn">Minimize</button>
      </header>
      <div class="status" id="panelStatus">Extract visible parts from this page.</div>
      <div class="toolbar">
        <button type="button" class="primary" id="panelExtractBtn">Extract</button>
        <button type="button" id="panelCopyBtn" disabled>Copy table</button>
        <button type="button" id="panelCsvBtn" disabled>CSV</button>
        <button type="button" id="panelJsonBtn" disabled>JSON</button>
      </div>
      <div class="selection">
        <button type="button" id="panelSelectAllBtn" disabled>Select all</button>
        <button type="button" id="panelClearBtn" disabled>Clear selection</button>
        <span class="count"><strong id="panelSelectedCount">0</strong> selected</span>
      </div>
      <div class="sheetExport">
        <input id="panelSheetUrlInput" class="sheetUrl" type="url" placeholder="Paste Google Sheet link">
        <input id="panelSheetNameInput" class="sheetName" type="text" value="Sheet1" aria-label="Sheet tab name">
        <button type="button" id="panelSheetExportBtn" disabled>Export to Sheet</button>
      </div>
      <div class="tableWrap">
        <table>
          <thead>
            <tr>
              <th class="selectCol">Export</th>
              <th class="positionCol">Position</th>
              <th class="partCol">Part Number</th>
              <th class="nameCol">Name / Description</th>
            </tr>
          </thead>
          <tbody id="panelPartsBody">
            <tr><td colspan="4" class="empty">No data extracted yet.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `;

  const state = {
    payload: null,
    selectedIds: new Set()
  };

  const elements = {
    body: root.getElementById("panelPartsBody"),
    status: root.getElementById("panelStatus"),
    selectedCount: root.getElementById("panelSelectedCount"),
    extractBtn: root.getElementById("panelExtractBtn"),
    copyBtn: root.getElementById("panelCopyBtn"),
    csvBtn: root.getElementById("panelCsvBtn"),
    jsonBtn: root.getElementById("panelJsonBtn"),
    sheetExportBtn: root.getElementById("panelSheetExportBtn"),
    sheetUrlInput: root.getElementById("panelSheetUrlInput"),
    sheetNameInput: root.getElementById("panelSheetNameInput"),
    selectAllBtn: root.getElementById("panelSelectAllBtn"),
    clearBtn: root.getElementById("panelClearBtn"),
    minimizeBtn: root.getElementById("minimizeBtn"),
    dragHandle: root.getElementById("dragHandle")
  };

  loadPanelSheetSettings(elements, state);

  elements.extractBtn.addEventListener("click", () => {
    const payload = extractVisibleData();
    const parts = normalizePanelParts(payload.parts || []);
    state.payload = { ...payload, parts };
    state.selectedIds = new Set(parts.map((part) => part.id));
    elements.status.textContent = `Extracted ${parts.length} parts.`;
    renderPanelRows(elements, state);
    updatePanelSelection(elements, state);
  });

  elements.selectAllBtn.addEventListener("click", () => {
    state.selectedIds = new Set((state.payload?.parts || []).map((part) => part.id));
    renderPanelRows(elements, state);
    updatePanelSelection(elements, state);
  });

  elements.clearBtn.addEventListener("click", () => {
    state.selectedIds.clear();
    renderPanelRows(elements, state);
    updatePanelSelection(elements, state);
  });

  elements.csvBtn.addEventListener("click", () => {
    const rows = (state.payload?.parts || []).filter((part) => state.selectedIds.has(part.id));
    downloadPanelText(buildPanelCsv(rows), "text/csv", `partslink24-selected-${timestamp()}.csv`);
  });

  elements.copyBtn.addEventListener("click", async () => {
    const rows = (state.payload?.parts || []).filter((part) => state.selectedIds.has(part.id));
    await copyPanelRows(rows);
    elements.status.textContent = `Copied ${rows.length} rows for Sheets.`;
  });

  elements.jsonBtn.addEventListener("click", () => {
    downloadPanelText(JSON.stringify(state.payload, null, 2), "application/json", `partslink24-debug-${timestamp()}.json`);
  });

  elements.sheetExportBtn.addEventListener("click", async () => {
    await exportPanelRowsToSheet(elements, state);
  });

  elements.sheetUrlInput.addEventListener("input", () => {
    chrome.storage.local.set({ sheetUrl: elements.sheetUrlInput.value.trim() });
    updatePanelSelection(elements, state);
  });

  elements.sheetNameInput.addEventListener("input", () => {
    chrome.storage.local.set({ sheetName: elements.sheetNameInput.value.trim() || "Sheet1" });
  });

  elements.minimizeBtn.addEventListener("click", () => {
    host.classList.toggle("collapsed");
    elements.minimizeBtn.textContent = host.classList.contains("collapsed") ? "Open" : "Minimize";
  });

  enablePanelDrag(host, elements.dragHandle);
}

function extractVisibleData() {
  const tables = extractTables();
  const textBlocks = extractTextBlocks();
  const partCandidates = findPartCandidates(textBlocks);
  const parts = extractParts(tables, textBlocks, partCandidates);

  return {
    extractedAt: new Date().toISOString(),
    page: {
      title: document.title,
      url: location.href
    },
    parts,
    tables,
    partCandidates,
    visibleTextSample: textBlocks.slice(0, 250)
  };
}

function extractParts(tables, textBlocks, partCandidates) {
  const rows = [];

  for (const table of tables) {
    for (const row of table.rows) {
      const part = partFromRecord(row);
      if (part) rows.push({ ...part, source: table.label });
    }
  }

  if (rows.length === 0) {
    rows.push(...partsFromVisibleRows());
  }

  if (rows.length === 0) {
    rows.push(...partsFromTextBlocks(textBlocks, partCandidates));
  }

  return dedupeParts(rows).slice(0, 500);
}

function partFromRecord(record) {
  const entries = Object.entries(record);
  const joined = entries.map(([, value]) => value).join(" ");
  if (isVehicleMetadataText(joined)) return null;

  const hasPartNumberColumn = entries.some(([key]) => /part\s*no\.?|part|number|article|oem|ref/i.test(key));
  const explicitPartNumber = valueByKey(entries, /part\s*no\.?|part|number|article|oem|ref/i);
  const partNumber = explicitPartNumber || (hasPartNumberColumn ? "" : firstPartNumber(joined));
  if (!partNumber) return null;
  if (isOptionCode(partNumber)) return null;

  return repairSplitPartSuffix({
    position: valueByKey(entries, /^pos\.?$|position/i) || firstPosition(joined),
    partNumber,
    name: valueByKey(entries, /name|description|designation|destination|title/i) || "",
    designation: valueByKey(entries, /designation|destination|description|model|vehicle|usage|remark|note/i) || ""
  });
}

function partsFromVisibleRows() {
  const selectors = [
    "tr",
    '[role="row"]',
    "li",
    '[class*="row" i]',
    '[class*="part" i]',
    '[class*="article" i]',
    '[class*="result" i]'
  ];

  return [...document.body.querySelectorAll(selectors.join(","))]
    .filter(isVisible)
    .map((element) => textToPart(cellText(element)))
    .filter(Boolean);
}

function partsFromTextBlocks(textBlocks, partCandidates) {
  const parts = textBlocks.map(textToPart).filter(Boolean);

  if (parts.length > 0) return parts;

  return partCandidates
    .filter((candidate) => {
      const partNumber = firstPartNumber(candidate) || candidate;
      return !isVehicleMetadataText(candidate) && !isOptionCode(partNumber);
    })
    .map((candidate) => ({
      partNumber: firstPartNumber(candidate) || candidate,
    position: "",
    name: "",
      designation: candidate,
      source: "candidate"
    }));
}

function textToPart(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length < 4 || cleaned.length > 240) return null;
  if (isVehicleMetadataText(cleaned)) return null;

  const partNumber = firstPartNumber(cleaned);
  if (!partNumber) return null;
  if (isOptionCode(partNumber)) return null;

  const position = firstPosition(cleaned);
  const remaining = cleaned
    .replace(/^\(?\d{1,3}\)?\s+/, "")
    .replace(partNumber, " ")
    .replace(/^\s*[-:|,;/]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

  return repairSplitPartSuffix({
    partNumber,
    position,
    name: remaining,
    designation: remaining,
    source: "visible text"
  });
}

function valueByKey(entries, pattern) {
  const match = entries.find(([key, value]) => pattern.test(key) && String(value).trim());
  return match ? String(match[1]).trim() : "";
}

function firstPosition(text) {
  const match = String(text).trim().match(/^\(?(\d{1,3})\)?\b/);
  return match ? match[1] : "";
}

function firstPartNumber(text) {
  const source = String(text).toUpperCase().replace(/\s+/g, " ").trim();
  const groupedNumber = source.match(/\b[A-Z0-9]{2,3}\s\d{3}\s\d{3}(?:\s[A-Z])?\b/);
  if (groupedNumber) return groupedNumber[0];

  const bmwNumber = source.match(/\b\d{2}\s\d{2}\s\d\s\d{3}\s\d{3}\b/);
  if (bmwNumber) return bmwNumber[0];

  const compactPartNumber = source.match(/\b[A-Z]{1,4}\d[A-Z0-9._-]{2,}\b/);
  if (compactPartNumber && (compactPartNumber[0].match(/\d/g) || []).length >= 2) {
    return compactPartNumber[0];
  }

  const candidates = String(text)
    .toUpperCase()
    .match(/\b[A-Z0-9][A-Z0-9._-]{2,}(?: [A-Z0-9._-]{2,}){0,3}\b/g) || [];

  const rejectPattern = /^(LOGIN|SEARCH|CATALOG|PARTSLINK24|VEHICLE|MODEL|GROUP|PRICE|QUANTITY|HYDRAULIC|AUTOMATIC|TOURING|POWER|TYPE|CODE|ENGINE)$/i;
  const rejectWords = /\b(MODEL|DESIGNATION|TYPE CODE|ENGINE CODE|POWER|VEHICLE|IDENTIFICATION|DATE OF PRODUCTION|COLOR|UPHOLSTERY|MARKET|DRIVE)\b/i;

  for (const candidate of candidates) {
    const value = candidate.replace(/\s+/g, " ").trim();
    const words = value.split(" ");
    const hasDigit = /\d/.test(value);
    const digitCount = (value.match(/\d/g) || []).length;
    const looksShortEnough = value.length >= 4 && value.length <= 28;
    const hasTooManyWords = words.length > 4;
    const looksLikeSentence = words.filter((word) => /^[A-Z]{4,}$/.test(word)).length > 2;
    const hasDescriptionWord = rejectWords.test(value);
    const weakVehicleCode = /^[A-Z]?\d{2,3}[A-Z]?(\s+[A-Z][A-Z0-9']*){1,2}$/i.test(value);

    if (
      hasDigit &&
      digitCount >= 4 &&
      looksShortEnough &&
      !hasTooManyWords &&
      !looksLikeSentence &&
      !hasDescriptionWord &&
      !weakVehicleCode &&
      !rejectPattern.test(value)
    ) {
      return value;
    }
  }

  return "";
}

function isOptionCode(value) {
  return /^[SA]\d{3,4}A$/i.test(String(value).replace(/\s+/g, "").trim());
}

function repairSplitPartSuffix(part) {
  const suffixPattern = /^\s*(?:\(\d+\)\s*)?([A-Z])\s+(.+)$/i;
  const positionPattern = /^\s*\(\d+\)\s*/;
  const basePattern = /^[A-Z0-9]{2,3}\s\d{3}\s\d{3}$/i;

  if (!basePattern.test(part.partNumber)) {
    return {
      ...part,
      name: String(part.name || "").replace(positionPattern, "").trim(),
      designation: String(part.designation || "").replace(positionPattern, "").trim()
    };
  }

  const nameMatch = String(part.name || "").match(suffixPattern);
  if (!nameMatch) return part;

  const suffix = nameMatch[1].toUpperCase();
  const repairedNumber = `${part.partNumber} ${suffix}`.replace(/\s+/g, " ").trim();
  const repairedName = nameMatch[2].trim();
  const designation = String(part.designation || part.name || "");
  const designationMatch = designation.match(suffixPattern);

  return {
    ...part,
    partNumber: repairedNumber,
    name: repairedName.replace(positionPattern, "").trim(),
    designation: designationMatch ? designationMatch[2].trim() : repairedName
  };
}

function isVehicleMetadataText(text) {
  const normalized = String(text).replace(/\s+/g, " ").trim();
  const metadataPattern = /^(VEHICLE IDENTIFICATION|VEHICLE IDENTIFICATION NO\.?|MODEL DESIGNATION|TYPE CODE|ENGINE CODE|POWER|DATE OF PRODUCTION|COLOR|UPHOLSTERY|MARKET SPECIFICA|MARKET SPECIFICATION|DRIVE)\b/i;
  const hasCatalogNumber = /\b\d{2}\s\d{2}\s\d\s\d{3}\s\d{3}\b/.test(normalized);

  if (hasCatalogNumber) return false;
  if (metadataPattern.test(normalized)) return true;

  return /\b(MODEL DESIGNATION|TYPE CODE|ENGINE CODE|VEHICLE IDENTIFICATION|DATE OF PRODUCTION)\b/i.test(normalized);
}

function dedupeParts(parts) {
  const seen = new Set();
  const result = [];

  for (const part of parts) {
    const key = `${part.position}|${part.partNumber}|${part.name}|${part.designation}`.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(part);
    }
  }

  return result;
}

function normalizePanelParts(parts) {
  return parts.map((part, index) => ({
    id: String(index),
    position: part.position || "",
    partNumber: part.partNumber || "",
    name: part.name || "",
    designation: part.designation || ""
  }));
}

function renderPanelRows(elements, state) {
  const parts = state.payload?.parts || [];

  if (parts.length === 0) {
    elements.body.innerHTML = '<tr><td colspan="4" class="empty">No matching parts found on the visible page.</td></tr>';
    return;
  }

  elements.body.replaceChildren(...parts.map((part) => {
    const row = document.createElement("tr");
    row.append(
      panelCheckboxCell(part, state, elements),
      panelTextCell(part.position, "positionCol"),
      panelTextCell(part.partNumber, "partCol"),
      panelTextCell(part.name, "nameCol")
    );
    return row;
  }));
}

function panelCheckboxCell(part, state, elements) {
  const cell = document.createElement("td");
  cell.className = "selectCol";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.selectedIds.has(part.id);
  checkbox.setAttribute("aria-label", `Select ${part.partNumber || "part"}`);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      state.selectedIds.add(part.id);
    } else {
      state.selectedIds.delete(part.id);
    }
    updatePanelSelection(elements, state);
  });

  cell.append(checkbox);
  return cell;
}

function panelTextCell(value, className) {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = value || "";
  return cell;
}

function updatePanelSelection(elements, state) {
  const total = state.payload?.parts?.length || 0;
  const selected = state.selectedIds.size;

  elements.selectedCount.textContent = String(selected);
  elements.selectAllBtn.disabled = total === 0;
  elements.clearBtn.disabled = total === 0;
  elements.copyBtn.disabled = total === 0 || selected === 0;
  elements.csvBtn.disabled = total === 0 || selected === 0;
  elements.jsonBtn.disabled = !state.payload;
  elements.sheetExportBtn.disabled = total === 0 || selected === 0 || !elements.sheetUrlInput.value.trim();
}

async function loadPanelSheetSettings(elements, state) {
  const { sheetUrl = "", sheetName = "Sheet1" } = await chrome.storage.local.get(["sheetUrl", "sheetName"]);
  elements.sheetUrlInput.value = sheetUrl;
  elements.sheetNameInput.value = sheetName || "Sheet1";
  updatePanelSelection(elements, state);
}

async function exportPanelRowsToSheet(elements, state) {
  const rows = (state.payload?.parts || []).filter((part) => state.selectedIds.has(part.id));
  if (rows.length === 0) return;

  elements.status.textContent = "Exporting selected rows to Google Sheets...";
  elements.sheetExportBtn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "PL24_EXPORT_TO_SHEETS",
      payload: {
        sheetUrl: elements.sheetUrlInput.value.trim(),
        sheetName: elements.sheetNameInput.value.trim() || "Sheet1",
        rows
      }
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Sheet export failed.");
    }

    elements.status.textContent = `Exported ${response.updatedRows || rows.length} rows to Google Sheets.`;
  } catch (error) {
    elements.status.textContent = error.message || "Sheet export failed.";
  } finally {
    updatePanelSelection(elements, state);
  }
}

function buildPanelCsv(rows) {
  const headers = ["position", "partNumber", "name"];
  const lines = [headers.map(csvCell).join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header] || "")).join(","));
  }

  return lines.join("\n");
}

async function copyPanelRows(rows) {
  const tableText = buildPanelTsv(rows);

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(tableText);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = tableText;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function buildPanelTsv(rows) {
  const headers = ["position", "partNumber", "name"];
  const lines = [headers.join("\t")];

  for (const row of rows) {
    lines.push(headers.map((header) => tsvCell(row[header] || "")).join("\t"));
  }

  return lines.join("\n");
}

function tsvCell(value) {
  return String(value)
    .replace(/\r?\n/g, " ")
    .replace(/\t/g, " ")
    .trim();
}

function csvCell(value) {
  const text = String(value).replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadPanelText(text, mimeType, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: `${mimeType};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function enablePanelDrag(host, handle) {
  let drag = null;

  handle.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest("button")) return;

    const rect = host.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };

    host.style.left = `${rect.left}px`;
    host.style.top = `${rect.top}px`;
    host.style.right = "auto";
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const rect = host.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    const nextLeft = clamp(event.clientX - drag.offsetX, 8, maxLeft);
    const nextTop = clamp(event.clientY - drag.offsetY, 8, maxTop);

    host.style.left = `${nextLeft}px`;
    host.style.top = `${nextTop}px`;
  });

  handle.addEventListener("pointerup", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag = null;
    handle.releasePointerCapture(event.pointerId);
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function extractTables() {
  const nativeTables = [...document.querySelectorAll("table")]
    .filter(isVisible)
    .map((table, index) => tableToObject(table, index))
    .filter((table) => table.rows.length > 0);

  const ariaGrids = [...document.querySelectorAll('[role="table"], [role="grid"]')]
    .filter((grid) => isVisible(grid) && grid.querySelector('[role="row"]'))
    .map((grid, index) => ariaGridToObject(grid, index))
    .filter((table) => table.rows.length > 0);

  return [...nativeTables, ...ariaGrids];
}

function tableToObject(table, index) {
  const headerCells = [...table.querySelectorAll("thead th")]
    .map(cellText)
    .filter(Boolean);

  const bodyRows = [...table.querySelectorAll("tbody tr")]
    .filter(isVisible);
  const fallbackRows = bodyRows.length > 0 ? bodyRows : [...table.querySelectorAll("tr")].filter(isVisible);

  const rows = fallbackRows
    .map((row) => [...row.children].filter(isVisible).map(cellText).filter(Boolean))
    .filter((cells) => cells.length > 0);

  const headers = headerCells.length > 0 ? headerCells : buildHeaders(rows);

  return {
    label: nearestLabel(table) || `table-${index + 1}`,
    headers,
    rows: rows.map((cells) => cellsToRecord(headers, cells))
  };
}

function ariaGridToObject(grid, index) {
  const rows = [...grid.querySelectorAll('[role="row"]')]
    .filter(isVisible)
    .map((row) => [...row.querySelectorAll('[role="columnheader"], [role="cell"], [role="gridcell"]')]
      .filter(isVisible)
      .map(cellText)
      .filter(Boolean))
    .filter((cells) => cells.length > 0);

  const firstRowLooksLikeHeader = rows[0]?.every((cell) => !looksLikePartNumber(cell));
  const headers = firstRowLooksLikeHeader ? rows.shift() : buildHeaders(rows);

  return {
    label: nearestLabel(grid) || `grid-${index + 1}`,
    headers,
    rows: rows.map((cells) => cellsToRecord(headers, cells))
  };
}

function extractTextBlocks() {
  const nodes = [...document.body.querySelectorAll("h1, h2, h3, h4, label, button, a, span, div, td, th, li, p")]
    .filter(isVisible)
    .map(cellText)
    .filter((text) => text.length > 1 && text.length < 300);

  return [...new Set(nodes)];
}

function findPartCandidates(textBlocks) {
  const partPattern = /\b[A-Z0-9][A-Z0-9][A-Z0-9 ._-]{3,24}[A-Z0-9]\b/g;
  const rejectPattern = /^(LOGIN|SEARCH|CATALOG|PARTSLINK24|VEHICLE|MODEL|GROUP|PRICE|QUANTITY)$/i;
  const values = new Set();

  for (const block of textBlocks) {
    for (const match of block.toUpperCase().matchAll(partPattern)) {
      const value = match[0].replace(/\s+/g, " ").trim();
      const partNumber = firstPartNumber(value);
      if (!rejectPattern.test(value) && /\d/.test(value) && partNumber && !isOptionCode(partNumber)) {
        values.add(value);
      }
    }
  }

  return [...values].slice(0, 500);
}

function cellsToRecord(headers, cells) {
  const record = {};
  cells.forEach((value, index) => {
    const key = headers[index] || `column_${index + 1}`;
    record[uniqueKey(record, key)] = value;
  });
  return record;
}

function buildHeaders(rows) {
  const width = Math.max(0, ...rows.map((row) => row.length));
  return Array.from({ length: width }, (_value, index) => `column_${index + 1}`);
}

function uniqueKey(record, key) {
  const safeKey = key.trim() || "value";
  if (!(safeKey in record)) return safeKey;

  let index = 2;
  while (`${safeKey}_${index}` in record) index += 1;
  return `${safeKey}_${index}`;
}

function cellText(element) {
  return (element.innerText || element.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

function isVisible(element) {
  if (!element || element.closest("[hidden], [aria-hidden='true']")) return false;

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function nearestLabel(element) {
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const label = document.getElementById(labelledBy);
    if (label && isVisible(label)) return cellText(label);
  }

  const heading = findPreviousHeading(element);
  if (heading) return cellText(heading);

  const ariaLabel = element.getAttribute("aria-label");
  return ariaLabel?.trim() || "";
}

function findPreviousHeading(element) {
  let current = element;
  for (let i = 0; i < 8 && current; i += 1) {
    let sibling = current.previousElementSibling;
    while (sibling) {
      const heading = sibling.matches("h1, h2, h3, h4")
        ? sibling
        : sibling.querySelector("h1, h2, h3, h4");
      if (heading && isVisible(heading)) return heading;
      sibling = sibling.previousElementSibling;
    }
    current = current.parentElement;
  }
  return null;
}

function looksLikePartNumber(value) {
  return /\d/.test(value) && /^[A-Z0-9 ._-]{5,28}$/i.test(value);
}
