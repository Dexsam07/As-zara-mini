const store = require('./lightweight_store');

async function setCommandReactState(enabled) {
  await store.saveSetting('global', 'commandReact', Boolean(enabled));
  return Boolean(enabled);
}

async function getCommandReactState() {
  return Boolean(await store.getSetting('global', 'commandReact'));
}

module.exports = { setCommandReactState, getCommandReactState };
