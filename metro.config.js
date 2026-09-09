const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Termux: reduz workers para economizar recursos locais;
// NAO bloqueia node_modules (quebraria a resolucao de modulos no EAS).
config.maxWorkers = 1;

module.exports = config;
