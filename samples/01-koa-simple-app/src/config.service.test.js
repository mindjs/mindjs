const { Test100500 } = require('@framework100500/testing');
const { parseEnv } = require('@framework100500/testing/utils');
const { HttpClient } = require('@framework100500/http');

const ConfigService = require('./config.service');
const AppModule = require('./app.module');

describe('AppConfigService', () => {
  let service;
  let httpClient;
  const IS_PROXY = false;
  const PORT = 777;

  beforeEach(async () => {
    await Test100500.configureTestingModule(AppModule, {
      envVariables: {
        IS_PROXY,
        PORT,
      }
    });

    service = await Test100500.get(ConfigService);
    httpClient = await Test100500.get(HttpClient);
  });

  it('should exist', () => {
    expect(service).toBeDefined();
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

  describe('app run', () => {
    beforeEach(async () => {
      await Test100500.bootstrap();
    });

    it('should run the app', async () => {
      const resp = await httpClient.get('http://127.0.0.1:777/ping', { json: true });

      expect(resp).toBeDefined();
    });

    describe('`hello-world` API endpoint', () => {

      it('should handle GET request', async () => {
        const resp = await httpClient.get('http://127.0.0.1:777/api/hello-world', { json: true });

        expect(resp).toBeDefined();
        expect(resp).toContain('hello');
      });

      it('should handle request query params', async () => {
        const resp = await httpClient.get('http://127.0.0.1:777/api/hello-world?name=me', { json: true });

        expect(resp).toBeDefined();
        expect(resp).toContain('me');
      });
    });

  });

});
