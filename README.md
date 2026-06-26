# Partslink24 Visible Data Extractor

A Manifest V3 Chrome extension for extracting data that is already visible while you browse Partslink24 with your own subscription.

## Install locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `D:\Programs\Chrome Extensions\partslink-scrapper`.

## Use

1. Sign in to Partslink24 normally.
2. Navigate to a catalog/search/result page.
3. Click the extension icon to show or hide the floating **Partslink24 Extractor** panel.
4. Click **Extract**.
5. Review the extracted parts table.
6. Use **Select all** or row checkboxes to choose parts.
7. Click **Copy table** to copy selected rows for direct paste into Google Sheets or Excel.
8. Download CSV for selected rows only. CSV includes `partNumber`, `name`, and `designation`.
9. Download JSON for the full debug payload.

The in-page panel can be dragged by its title bar and resized from the lower-right corner. Use **Minimize** when you want it compact, or click the extension icon again to close it.

After editing the extension files, open `chrome://extensions` and click the reload button on this extension before testing again.

## Scope

This extension reads visible page content from your active Partslink24 tab. It does not automate login, bypass access controls, solve challenges, or fetch data outside what your browser session can already view.
