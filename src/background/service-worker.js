import { MESSAGE_TYPES, STORAGE_KEYS } from '../shared/constants.js';

chrome.runtime.onInstalled.addListener((details) => {
  // Only seed defaults on first install — never wipe on update/reload
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      [STORAGE_KEYS.pretext]: '',
      [STORAGE_KEYS.enabled]: false,
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.getState) {
    chrome.storage.sync
      .get([STORAGE_KEYS.pretext, STORAGE_KEYS.enabled])
      .then(sendResponse);
    return true;
  }
});
