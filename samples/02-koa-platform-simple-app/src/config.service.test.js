const { TestMind } = require('@mindjs/testing');
const { parseEnv } = require('@mindjs/testing/utils');
const { HttpClient, HttpModule } = require('@mindjs/http');
const { mindPlatformKoa } = require('@mindjs/platform-koa');

const ConfigService = require('./config.service');
const AppModule = require('./app.module');

describe('AppConfigService', () => {
  let service;
  let httpClient;

  const IS_PROXY = false;
  const PORT = 4300;
  const host = `http://127.0.0.1:${ PORT }`;

  beforeEach(async () => {
    await TestMind.configureTestingModule({
      module: AppModule,
      imports: [HttpModule.forRoot()],
      // providers: [],
      platform: mindPlatformKoa(),
    }, {
      envVariables: {
        IS_PROXY,
        PORT,
      },
    });

    service = await TestMind.get(ConfigService);
    httpClient = await TestMind.get(HttpClient);
  });

  it('should exist', () => {
    expect(service).toBeDefined();
  });

  it('should return default values', function () {
    TestMind.resetEnvVariables();
    expect(service.isProxy).toBe(true);
    expect(service.port).toBe(3000);
  });

  it('should return correct process.env variable value', function () {
    expect(parseEnv(service.isProxy)).toBe(IS_PROXY);
    expect(parseEnv(service.port)).toBe(PORT);
  });

  describe('app run', () => {
    beforeEach(async () => {
      await TestMind.bootstrap();
    });

    it('should run the app', async () => {
      const resp = await httpClient.get(`${ host }/ping`, { json: true });

      expect(resp).toBeDefined();
    });

    describe('`hello-world` API endpoint', () => {

      it('should handle GET request', async () => {
        const resp = await httpClient.get(`${ host }/api/hello-world`, { json: true });

        expect(resp).toBeDefined();
        expect(resp).toContain('hello');
      });

      it('should handle request query params', async () => {
        const resp = await httpClient.get(`${ host }/api/hello-world?name=me`, { json: true });

        expect(resp).toBeDefined();
        expect(resp).toContain('me');
      });
    });

  });

});
