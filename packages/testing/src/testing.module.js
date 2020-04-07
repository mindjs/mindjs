const { Mind } = require('@mindjs/core');

const { Module } = require('@mindjs/common');
const { injectAsync, toArray } = require('@mindjs/common/utils');

let TestApplicationModule;
let testPlatform;
let testAppInstance;
let TestEnvConfig = {};
let TestModuleImports = [];
let TestModuleProviders = [];

class TestMind {

  /**
   *  Configures testing module for further usage in test cases.
   *  This method resets previous run state and sets up a new state but does not bootstrap provided module.
   *  To bootstrap an application(provided module) the `bootstrap` method of TestMind should be used.
   *  When `bootstrap` method is invoked moduleDI is created and server is started (provided all NET listeners are provided)
   *  When `inject` or `get` method is used, moduleDI is created only
   * @param {{
   *   module: Module,
   *   imports: Module|{ module: Module, imports: Module[], providers: Injectable|Provider[] }|RoutingModule[],
   *   providers: Injectable|Provider[],
   *   platform: MindPlatform
   *
   * }|Module} moduleDef
   * @param {{
   *   envVariables: {},
   * }} testingConfig
   */
  static async configureTestingModule(moduleDef = {}, testingConfig = {}) {
    const { module = {}, imports = [], providers = [], platform } = moduleDef;
    const { imports: moduleImports = [], providers: moduleProviders = [] } = module;
    const { envVariables } = testingConfig;
    // reset previous run state
    await TestMind.resetTestingModule();

    // configure new run state and do nothing until `inject` or `get` method is invoked
    testPlatform = platform;
    TestModuleImports = [...moduleImports];
    TestModuleProviders = [...moduleProviders];

    if (envVariables) {
      TestMind.setEnvVariables(envVariables);
    }

    if (imports.length) {
      TestMind.addImports(imports);
    }
    if (providers.length) {
      TestMind.addProviders(providers);
    }
  }

  /**
   * Creates module DI and starts a server with routing and all initializers invoked
   * @returns {Promise<*>}
   */
  static async bootstrap() {
    if (testAppInstance && testAppInstance.isAppMindInitiated) {
      return;
    }

    if (testAppInstance) {
      return testAppInstance.initAndStart();
    }

    TestApplicationModule = Module(class TestingModule {}, {
      imports: [...TestModuleImports],
      providers: [...TestModuleProviders],
    });

    if (testPlatform) {
      testAppInstance = await testPlatform.bootstrapModule(TestApplicationModule);  // eslint-disable-line
    } else {
      testAppInstance = new Mind(TestApplicationModule,);
      await testAppInstance.bootstrap();
    }
  }

  /**
   * Invokes
   * @returns {Promise<*|void>}
   */
  static async terminate() {
    if (!testAppInstance || !testAppInstance.isAppMindInitiated) {
      return;
    }

    return testAppInstance.terminateAppServer();
  }

  /**
   * Resets testing module configuration and clears environment variables from `process.env`
   * if such were previously provided
   */
  static async resetTestingModule() {
    await TestMind.terminate();

    TestModuleImports = [];
    TestModuleProviders = [];
    TestApplicationModule = undefined;
    testAppInstance = undefined;
    TestMind.resetEnvVariables();
  }

  /**
   * NOTE:
   *    as long as Node.js implicitly converts env value to string through process.env['variableName'] = variableValue
   *    in test cases the `parseEnv` utility should be used
   *    E.g:
   *
   *      const { TestMind } = require('@mindjs/testing');
   *      const { parseEnv } = require('@mindjs/testing/utils');
   *      const ConfigService = require('./config.service');
   *
   *      describe('AppConfigService', () => {
   *        let service;
   *        const IS_PROXY = false;
   *        const PORT = 777;
   *
   *       beforeEach(async () => {
   *         TestMind.configureTestingModule({
   *           providers: [ConfigService],
   *         }, {
   *           envVariables: {
   *             IS_PROXY,
   *             PORT,
   *           }
   *         });
   *
   *         service = await TestMind.get(ConfigService);
   *       });
   *
   *       it('should return correct `process.env` variable value', function () {
   *         expect(parseEnv(service.isProxy)).toBe(IS_PROXY);
   *         expect(parseEnv(service.port)).toBe(PORT);
   *       });
   *
   *     });
   * @param envConfig
   */
  static setEnvVariables(envConfig) {
    if (!envConfig) {
      return;
    }

    TestEnvConfig = { ...envConfig };
    for (const k in TestEnvConfig) {
      process.env[k] = TestEnvConfig[k];
    }
  }

  /**
   * Resets environment variables that were previously set though `testingOptions` in `TestMind.configureTestingModule`
   * or `TestMind.setEnvVariables` method
   */
  static resetEnvVariables() {
    for (const k in TestEnvConfig) {
      delete process.env[k];
    }
    TestEnvConfig = {};
  }

  /**
   * TODO: add implementation...
   * Overrides provided module with moduleDef
   * @param {Module|{ module: Module, providers: Injectable|Provider[] }|RoutingModule} module
   * @param {Module|{ module: Module, providers: Injectable|Provider[] }|RoutingModule} moduleDef
   */
  static overrideModule(module, moduleDef) { // eslint-disable-line
    console.warn('overrideModule has not been implemented yet...');
  }

  /**
   *
   * @param {Injectable|InjectionToken} token
   * @param {{
   *  useValue: *
   * }} overrideConfig
   */
  static overrideProvider(token, { useValue }) {
    const filteredTestProviders = TestModuleProviders.filter(p => [p, p.provide ].includes(token));

    TestModuleProviders = [
      ...filteredTestProviders,
      {
        provide: token,
        useValue,
      }
    ];
  }

  /**
   *
   * @param importValue
   */
  static addImport(importValue) {
    if (importValue) {
      TestModuleImports = [
        ...TestModuleImports,
        importValue,
      ];
    }
  }

  /**
   *
   * @param importValues
   */
  static addImports(importValues) {
    toArray(importValues).map(i => TestMind.addImport(i));
  }

  /**
   *
   * @param provider
   */
  static addProvider(provider) {
    if (provider) {
      TestModuleProviders = [
        ...TestModuleProviders,
        provider,
      ];
    }
  }

  /**
   *
   * @param providers
   */
  static addProviders(providers) {
    toArray(providers).map(p => TestMind.addProvider(p));
  }

  /**
   * This method initiates creating module DI if testing module/environment has not been bootstrapped and injects proper provider from it.
   * Otherwise it uses testAppInstance's rootInjector to inject desired provider by token.
   * @param {Injectable|InjectionToken} token
   * @returns {Promise<*>}
   */
  static async inject(token) {
    if (!testAppInstance || !testAppInstance.rootModuleDI) {
      TestApplicationModule = Module(class TestingModule {}, {
        imports: [...TestModuleImports],
        providers: [...TestModuleProviders],
      });

      if (testPlatform) {
        testAppInstance = await testPlatform.initApplicationModule(TestApplicationModule); // eslint-disable-line
      } else {
        testAppInstance = new Mind(TestApplicationModule);
        await testAppInstance.initRootModuleDI();
      }
    }

    return injectAsync(testAppInstance.rootModuleDI.rootInjector, token);
  }

  /**
   * Shorthand method for `inject`
   * @param {Injectable|InjectionToken}  token
   * @returns {Promise<*>}
   */
  static async get(token) {
    return TestMind.inject(token);
  }

}

module.exports = TestMind;
