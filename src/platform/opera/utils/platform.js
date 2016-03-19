require('../manifest.json')
require.context('_locales', true, /.*\.json/)
require.context('assets', false, /icon_.*\.png/)

export function createContextMenu () {
  return window.chrome.contextMenus.create.apply(window.chrome.contextMenus, arguments)
}

export function createTab () {
  return window.chrome.tabs.create.apply(window.chrome.tabs, arguments)
}

export function getExtensionManifest () {
  return window.chrome.runtime.getManifest()
}

export function getExtensionUrl () {
  return window.chrome.extension.getURL.apply(window.chrome.extension, arguments)
}

export function getI18nMessage () {
  return window.chrome.i18n.getMessage.apply(window.chrome.i18n, arguments)
}

function getStorage () {
  return window.chrome.storage.sync || window.chrome.storage.local
}

export function getItems (defaults, callback) {
  const storage = getStorage()
  storage.get(defaults, callback)
}

export function setItems (items, callback) {
  const storage = getStorage()
  storage.set(items, callback)
}
