const { InjectionToken } = require('@framework100500/common/DI');

const KOA_CORS_CONFIG = new InjectionToken('Framework100500KoaCORSConfig');
const KOA_HELMET_CONFIG = new InjectionToken('Framework100500KoaHelmetConfig');
const KOA_SERVE_STATIC_CONFIG = new InjectionToken('Framework100500KoaServeStaticConfig');
const KOA_BODY_PARSER_CONFIG = new InjectionToken('Framework100500KoaBodyParserConfigPathConfig');
const KOA_LOGGER_CONFIG = new InjectionToken('Framework100500KoaLoggerConfigPathConfig');
const KOA_COMPRESS_CONFIG = new InjectionToken('Framework100500KoaCompressConfigPathConfig');
const KOA_HEALTH_CONFIG = new InjectionToken('Framework100500KoaHealthConfigPathConfig');

module.exports = {
  KOA_CORS_CONFIG,
  KOA_HELMET_CONFIG,
  KOA_SERVE_STATIC_CONFIG,
  KOA_BODY_PARSER_CONFIG,
  KOA_LOGGER_CONFIG,
  KOA_COMPRESS_CONFIG,
  KOA_HEALTH_CONFIG,
};
