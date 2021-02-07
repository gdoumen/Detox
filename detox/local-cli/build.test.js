jest.mock('child_process');
jest.mock('../src/utils/logger');
jest.mock('../src/configuration');

const tempfile = require('tempfile');
const DetoxConfigErrorBuilder = require('../src/errors/DetoxConfigErrorBuilder');

describe('build', () => {
  let log, execSync, composeDetoxConfig, detoxConfig;

  beforeEach(() => {
    detoxConfig = {
      appsConfig: {},
      artifactsConfig: {},
      behaviorConfig: {},
      deviceConfig: {},
      sessionConfig: {},
      errorBuilder: new DetoxConfigErrorBuilder(),
    };

    log = require('../src/utils/logger');
    execSync = require('child_process').execSync;
    composeDetoxConfig = require('../src/configuration').composeDetoxConfig;
    composeDetoxConfig.mockReturnValue(Promise.resolve(detoxConfig));
  });

  it('passes argv to composeConfig', async () => {
    await callCli('./build', 'build -C /etc/.detoxrc.js -c myconf').catch(() => {});

    expect(composeDetoxConfig).toHaveBeenCalledWith({
      argv: expect.objectContaining({
        'config-path': '/etc/.detoxrc.js',
        'configuration': 'myconf',
      }),
    });
  });

  it('runs the build script from the composed device config', async () => {
    detoxConfig.appsConfig[''] = { build: 'yet another command' };

    await callCli('./build', 'build');
    expect(execSync).toHaveBeenCalledWith('yet another command', expect.anything());
  });

  it('fails with an error if a build script has not been found', async () => {
    detoxConfig.appsConfig[''] = {};
    await expect(callCli('./build', 'build')).rejects.toThrowError(/Could not find a build script/);
  });

  it('should ignore missing build command with -s, --silent flag', async () => {
    detoxConfig.appsConfig[''] = {};
    await expect(callCli('./build', 'build -s')).resolves.not.toThrowError();
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('should print a warning upon user build script failure', async () => {
    detoxConfig.appsConfig[''] = { build: 'a command' };
    execSync.mockImplementation(() => { throw new Error('Build failure'); });
    await expect(callCli('./build', 'build')).rejects.toThrowError(/Build failure/);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('You are responsible'));
  });

  it('should print a warning if app is not found at binary path', async () => {
    detoxConfig.appsConfig[''] = { binaryPath: tempfile() };
    await expect(callCli('./build', 'build -s')).resolves.not.toThrowError();
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('could not find your app at the given binary path'));
  });
});
