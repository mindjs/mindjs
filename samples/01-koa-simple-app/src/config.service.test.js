const { Test100500 } = require('@framework100500/testing');
const { parseEnv } = require('@framework100500/testing/utils');

const ConfigService = require('./config.service');

describe('AppConfigService', () => {
  let service;
  const IS_PROXY = false;
  const PORT = 777;

  beforeEach(async () => {
    await Test100500.configureTestingModule({
      providers: [ConfigService],
    }, {
      envVariables: {
        IS_PROXY,
        PORT,
      }
    });

    service = await Test100500.get(ConfigService);
  });

  it('should return default values', function () {
    Test100500.resetEnvVariables();
    expect(service.isProxy).toBe(true);
    expect(service.port).toBe(3000);
  });

  it('should return correct process.env variable value', function () {
    expect(parseEnv(service.isProxy)).toBe(IS_PROXY);
    expect(parseEnv(service.port)).toBe(PORT);
  });

});
