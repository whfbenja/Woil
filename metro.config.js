const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Watch ONLY src and assets — everything else is ignored
config.watchFolders = [
  path.join(__dirname, 'src'),
  path.join(__dirname, 'assets'),
];

// Keep resolver block list to avoid scanning unnecessary files
config.resolver.blockList = [
  /.*\/\.claude\/.*/,
  /.*\/Prompts\/.*/,
  /.*\/\.git.*/,
  /.*\/node_modules\/.*/,
  /.*\/__tests__\/.*/,
  /.*\/__tests__\/.*/,
  /.*\.md$/,
  /WOIL_.*\.md$/,
  /jest\.config\.js$/,
  /metro\.config\.js$/,
  /package-lock\.json$/,
  /\.expo\/.*/,
  /.*\/\.git_backup\/.*/,
  /.*\/\.expo\/.*/,
  /.*\/assets\/.*/,
];

// Reduce workers to save resources
config.maxWorkers = 1;

module.exports = config;