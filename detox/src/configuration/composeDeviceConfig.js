const _ = require('lodash');

/**
 * @param {DetoxConfigErrorBuilder} opts.errorBuilder
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {*} opts.cliConfig
 * @returns {Detox.DetoxDeviceConfig}
 */
function composeDeviceConfig(opts) {
  const { localConfig, cliConfig } = opts;

  const deviceConfig = localConfig.type
    ? composeDeviceConfigFromPlain(opts)
    : composeDeviceConfigFromAliased(opts);

  if (cliConfig.deviceName) {
    deviceConfig.device = cliConfig.deviceName;
  }

  return deviceConfig;
}

/**
 * @param {DetoxConfigErrorBuilder} opts.errorBuilder
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxPlainConfiguration} opts.localConfig
 * @returns {Detox.DetoxDeviceConfig}
 */
function composeDeviceConfigFromPlain(opts) {
  const { errorBuilder, localConfig } = opts;

  const type = localConfig.type;
  const device = localConfig.device || localConfig.name;

  const deviceConfig = type in EXPECTED_DEVICE_MATCHER_PROPS
    ? { type, device }
    : { ...localConfig };

  validateDeviceConfig({ deviceConfig, errorBuilder });

  return deviceConfig;
}

/**
 * @param {DetoxConfigErrorBuilder} opts.errorBuilder
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxAliasedConfiguration} opts.localConfig
 * @returns {Detox.DetoxDeviceConfig}
 */
function composeDeviceConfigFromAliased(opts) {
  const { errorBuilder, globalConfig, localConfig } = opts;

  /** @type {Detox.DetoxDeviceConfig} */
  let deviceConfig;

  const isAliased = typeof localConfig.device === 'string';

  if (isAliased) {
    if (_.isEmpty(globalConfig.devices)) {
      throw errorBuilder.thereAreNoDeviceConfigs(localConfig.device);
    } else {
      deviceConfig = globalConfig.devices[localConfig.device];
    }

    if (!deviceConfig) {
      throw errorBuilder.cantResolveDeviceAlias(localConfig.device);
    }
  } else {
    if (!localConfig.device) {
      throw errorBuilder.deviceConfigIsUndefined();
    }

    deviceConfig = localConfig.device;
  }

  validateDeviceConfig({
    deviceConfig,
    errorBuilder,
    deviceAlias: isAliased ? localConfig.device : undefined
  });

  return { ...deviceConfig };
}

/**
 * @param {DetoxConfigErrorBuilder} errorBuilder
 * @param {Detox.DetoxDeviceConfig} deviceConfig
 * @param {String | undefined} deviceAlias
 */
function validateDeviceConfig({ deviceConfig, errorBuilder, deviceAlias }) {
  if (!deviceConfig.type) {
    throw errorBuilder.missingDeviceType(deviceAlias);
  }

  if (_.isString(deviceConfig.device)) {
    return;
  }

  const expectedProperties = EXPECTED_DEVICE_MATCHER_PROPS[deviceConfig.type];
  if (!expectedProperties) {
    return;
  }

  if (_.isEmpty(deviceConfig.device)) {
    throw errorBuilder.missingDeviceProperty(deviceAlias, expectedProperties);
  }

  if (!expectedProperties.some(prop => deviceConfig.device.hasOwnProperty(prop))) {
    throw errorBuilder.missingDeviceMatcherProperties(deviceAlias, expectedProperties);
  }
}

const EXPECTED_DEVICE_MATCHER_PROPS = {
  'ios.none': null,
  'ios.simulator': ['type', 'name', 'id'],
  'android.attached': ['adbName'],
  'android.emulator': ['avdName'],
  'android.genycloud': ['recipeUUID', 'recipeName'],
};

module.exports = composeDeviceConfig;
