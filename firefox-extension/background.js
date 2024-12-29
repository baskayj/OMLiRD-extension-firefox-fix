// Use the polyfilled browser object
const browser = window.browser || chrome;

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "open-in-real-debrid",
    title: "Open magnet in Real-Debrid",
    contexts: ["link"],
  });
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-in-real-debrid") {
    if (info.linkUrl.startsWith("magnet:")) {
      browser.tabs.create({ url: "https://real-debrid.com/torrents", active: true }).then((newTab) => {
        const onUpdated = (tabId, changeInfo) => {
          if (tabId === newTab.id && changeInfo.status === "complete") {
            browser.tabs.onUpdated.removeListener(onUpdated);
            browser.tabs.executeScript(newTab.id, {
              code: `(${injectScript})("${info.linkUrl}");`,
            }).catch(console.error);
          }
        };
        browser.tabs.onUpdated.addListener(onUpdated);
      }).catch(console.error);
    } else {
      browser.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-48.png",
        title: "Invalid Link",
        message: "This isn't a magnet link!",
      });
    }
  }
});

function injectScript(magnetLink) {
  const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const interval = 100;
      const start = Date.now();

      const check = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - start > timeout) {
          reject(new Error("Element not found: " + selector));
        } else {
          setTimeout(check, interval);
        }
      };

      check();
    });
  };

  waitForElement('input[name="magnet"]').then((inputField) => {
    inputField.value = magnetLink;
    return waitForElement('input[type="submit"].button');
  }).then((submitButton) => {
    submitButton.click();
  }).catch((error) => {
    console.error("Error injecting magnet link:", error.message);
  });
}
