const DetoxConfigErrorBuilder = require('../errors/DetoxConfigErrorBuilder');

describe('selectConfiguration', () => {
  let selectConfiguration;
  /** @type {DetoxConfigErrorBuilder} */
  let errorBuilder;
  let configLocation, globalConfig, cliConfig;

  beforeEach(() => {
    configLocation = '/etc/detox/config.js';
    globalConfig = {};
    cliConfig = {};
    errorBuilder = new DetoxConfigErrorBuilder().setDetoxConfig(globalConfig);

    selectConfiguration = require('./selectConfiguration');
  });

  const select = () => selectConfiguration({
    configLocation,
    cliConfig,
    globalConfig,
    errorBuilder,
  });

  it('should throw if there are no .configurations in Detox config', () => {
    configLocation = '';
    delete globalConfig.configurations;
    expect(select).toThrowError(errorBuilder.noDeviceConfigurationsInside());
  });

  it('should throw if there is an empty .configurations object in Detox config and its location is unknown', () => {
    configLocation = '';
    globalConfig.configurations = {};
    expect(select).toThrowError(errorBuilder.noDeviceConfigurationsInside());
  });

  it('should return the name of a single configuration', () => {
    globalConfig.configurations = { single: {} };
    expect(select()).toBe('single');
  });

  it('should throw if a configuration with the specified name does not exist', () => {
    globalConfig.configurations = { single: {} };
    globalConfig.selectedConfiguration = 'double';

    expect(select).toThrow(); // generating a correct error expectation in errorBuilder

    jest.spyOn(errorBuilder, 'setConfigurationName');
    expect(select).toThrow(errorBuilder.noDeviceConfigurationWithGivenName());
    expect(errorBuilder.setConfigurationName).toHaveBeenCalledWith('double');
  });

  it('should throw if there is more than 1 configuration, and no one is specified', () => {
    configLocation = '';
    globalConfig.configurations = { config1: {}, config2: {} };
    expect(select).toThrow(errorBuilder.cantChooseDeviceConfiguration());
  });

  describe('priority', () => {
    beforeEach(() => {
      globalConfig.configurations = {
        cli: {},
        config: {},
      };
    });

    it('should be given to CLI --configuration (first)', () => {
      globalConfig.selectedConfiguration = 'config';
      cliConfig.configuration = 'cli';

      expect(select()).toBe('cli');
    });

    it('should be given to config file value (second)', () => {
      globalConfig.selectedConfiguration = 'config';

      expect(select()).toBe('config');
    });
  });
});
