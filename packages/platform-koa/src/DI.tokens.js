const { InjectionToken } = require('@mindjs/common/DI');

const KOA_CORS_CONFIG = new InjectionToken('KoaPlatformMindCORSConfig');
const KOA_HELMET_CONFIG = new InjectionToken('KoaPlatformMindHelmetConfig');
const KOA_SERVE_STATIC_CONFIG = new InjectionToken('KoaPlatformMindServeStaticConfig');
const KOA_BODY_PARSER_CONFIG = new InjectionToken('KoaPlatformMindBodyParserConfig');
const KOA_LOGGER_CONFIG = new InjectionToken('KoaPlatformMindLoggerConfig');
const KOA_COMPRESS_CONFIG = new InjectionToken('KoaPlatformMindCompressConfig');
const KOA_HEALTH_CONFIG = new InjectionToken('KoaPlatformMindHealthConfig');

module.exports = {
  KOA_CORS_CONFIG,
  KOA_HELMET_CONFIG,
  KOA_SERVE_STATIC_CONFIG,
  KOA_BODY_PARSER_CONFIG,
  KOA_LOGGER_CONFIG,
  KOA_COMPRESS_CONFIG,
  KOA_HEALTH_CONFIG,
};
