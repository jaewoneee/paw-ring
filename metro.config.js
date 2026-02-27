const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// theo-kit local package resolution
const theoKitRoot = path.resolve(__dirname, "../theo-kit");

config.watchFolders = [theoKitRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(theoKitRoot, "node_modules"),
];

config.resolver.extraNodeModules = {
  "theo-kit-native": path.resolve(theoKitRoot, "packages/ui-native"),
  "theo-kit-core": path.resolve(theoKitRoot, "packages/ui-core"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
