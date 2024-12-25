chrome.runtime.onInstalled.addListener(() => {
  // Create the context menu item for links
  chrome.contextMenus.create({
    id: "open-in-real-debrid",
    title: "Open magnet in Real-Debrid",
    contexts: ["link"],  // This will apply to links only
  });
});

// Context menu handling for links
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-in-real-debrid") {
    // Check if the clicked link is a magnet link
    if (info.linkUrl.startsWith("magnet:")) {
      // Open the Real-Debrid page
      chrome.tabs.create({ url: "https://real-debrid.com/torrents", active: true }, (newTab) => {
        // Wait for the tab to load completely
        chrome.tabs.onUpdated.addListener(function onUpdated(tabId, changeInfo) {
          if (tabId === newTab.id && changeInfo.status === 'complete') {
            // Once page is loaded, remove the listener to avoid multiple triggers
            chrome.tabs.onUpdated.removeListener(onUpdated);

            // Now inject the magnet link into the Real-Debrid form
            chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              func: injectScript,
              args: [info.linkUrl]  // Pass the magnet link
            });
          }
        });
      });
    } else {
      // Show a notification saying "This isn't a magnet link!"
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-48.png",  // You can replace this with any icon
        title: "Invalid Link",
        message: "This isn't a magnet link!",
        priority: 2
      });
    }
  }
});

// Function to inject the magnet link into the Real-Debrid form
function injectScript(magnetLink) {
  const inputField = document.querySelector('input[name="magnet"]');
  const submitButton = document.querySelector('input[type="submit"].button');

  if (inputField && submitButton) {
    inputField.value = magnetLink;  // Set the magnet link value in the input field
    submitButton.click();  // Click the submit button to submit the form
  } else {
    console.error("Form elements not found on the Real-Debrid page.");
  }
}
