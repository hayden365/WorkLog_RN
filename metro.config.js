const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// 새로운 아키텍처를 위한 설정
config.resolver.platforms = ["ios", "android", "native", "web"];
config.transformer.unstable_allowRequireContext = true;

// TurboModules 활성화
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
