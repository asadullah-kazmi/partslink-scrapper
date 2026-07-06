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
8. Paste a Google Sheet link, confirm the tab name, then click **Export to Sheet** to append selected rows to columns F-G.
9. Download CSV for selected rows only. CSV includes `position`, `partNumber`, and `name`.
10. Download JSON for the full debug payload.

The in-page panel can be dragged by its title bar and resized from the lower-right corner. Use **Minimize** when you want it compact, or click the extension icon again to close it.

After editing the extension files, open `chrome://extensions` and click the reload button on this extension before testing again.

## Google Sheets export setup

The extension uses the Google Sheets API, so Chrome needs a Google OAuth client ID before **Export to Sheet** can work.

1. Open Google Cloud Console and create or select a project.
2. Enable **Google Sheets API** for the project.
3. Configure the OAuth consent screen.
4. Create an OAuth client with application type **Chrome Extension**.
5. Use this extension's Chrome extension ID for that client. For local testing, load the extension in `chrome://extensions` first, then copy its ID.
6. Replace `REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` in `manifest.json` with your client ID.
7. Reload the extension in `chrome://extensions`.

When you export for the first time, Chrome will ask you to authorize Google Sheets access. The extension appends selected rows to the selected tab in columns F-G using these fields: `partNumber` and `name`. The `position` column remains visible in the extension UI but is not exported to Google Sheets.

## Scope

This extension reads visible page content from your active Partslink24 tab. It does not automate login, bypass access controls, solve challenges, or fetch data outside what your browser session can already view.
