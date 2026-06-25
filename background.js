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

function isPartslinkUrl(url) {
  try {
    return new URL(url).hostname.endsWith("partslink24.com");
  } catch {
    return false;
  }
}
