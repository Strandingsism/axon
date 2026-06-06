import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const DEFAULT_MARKETPLACE_NAME = 'axon';
const DEFAULT_MARKETPLACE_SOURCE = 'Strandingsism/axon';
const DEFAULT_PLUGIN_NAME = 'axon';

function defaultExecCodex(args) {
  const result = spawnSync('codex', args, {
    encoding: 'utf8',
    ...(process.platform === 'win32' ? { windowsHide: true } : {}),
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error,
  };
}

function localPackageVersion() {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  return pkg.version;
}

function commandFailed(result) {
  return result.status !== 0 || result.error;
}

function failure(action, result, steps) {
  return {
    status: 'failed',
    action,
    steps,
    exitCode: result?.status ?? 1,
    error: result?.error?.message || result?.stderr || result?.stdout || 'Unknown setup failure',
  };
}

export function parseMarketplaceList(output, marketplaceName = DEFAULT_MARKETPLACE_NAME) {
  const lines = String(output || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const line = lines.find((entry) => entry.split(/\s+/)[0] === marketplaceName);
  if (!line) return null;
  const [name, ...root] = line.split(/\s+/);
  return { name, root: root.join(' ') };
}

export function parsePluginList(output, options = {}) {
  const pluginName = options.pluginName || DEFAULT_PLUGIN_NAME;
  const marketplaceName = options.marketplaceName || DEFAULT_MARKETPLACE_NAME;
  const selector = `${pluginName}@${marketplaceName}`;
  const lines = String(output || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const line = lines.find((entry) => entry.startsWith(selector));
  if (!line) return null;

  const columns = line.split(/\s{2,}/);
  return {
    selector: columns[0],
    status: columns[1] || '',
    version: columns[2] || '',
    path: columns.slice(3).join('  '),
    installed: /installed/.test(columns[1] || '') && !/not installed/.test(columns[1] || ''),
  };
}

export function setupAxon(options = {}) {
  const execCodex = options.execCodex || defaultExecCodex;
  const marketplaceName = options.marketplaceName || DEFAULT_MARKETPLACE_NAME;
  const marketplaceSource = options.marketplaceSource || DEFAULT_MARKETPLACE_SOURCE;
  const pluginName = options.pluginName || DEFAULT_PLUGIN_NAME;
  const expectedVersion = options.expectedVersion || localPackageVersion();
  const selector = `${pluginName}@${marketplaceName}`;
  const steps = [];

  const marketplaceList = execCodex(['plugin', 'marketplace', 'list']);
  if (commandFailed(marketplaceList)) return failure('list-marketplaces', marketplaceList, steps);

  const marketplace = parseMarketplaceList(marketplaceList.stdout, marketplaceName);
  if (!marketplace) {
    const addMarketplace = execCodex(['plugin', 'marketplace', 'add', marketplaceSource]);
    if (commandFailed(addMarketplace)) return failure('add-marketplace', addMarketplace, steps);
    steps.push(`Added marketplace ${marketplaceName} from ${marketplaceSource}`);
  } else {
    steps.push(`Found marketplace ${marketplaceName}`);
  }

  const beforeList = execCodex(['plugin', 'list']);
  if (commandFailed(beforeList)) return failure('list-plugins', beforeList, steps);
  const before = parsePluginList(beforeList.stdout, { pluginName, marketplaceName });

  if (!before?.installed) {
    if (marketplace) {
      const upgradeMarketplace = execCodex(['plugin', 'marketplace', 'upgrade', marketplaceName]);
      if (commandFailed(upgradeMarketplace)) return failure('upgrade-marketplace', upgradeMarketplace, steps);
      steps.push(`Upgraded marketplace ${marketplaceName}`);
    }

    const addPlugin = execCodex(['plugin', 'add', selector]);
    if (commandFailed(addPlugin)) return failure('install-plugin', addPlugin, steps);
    steps.push(`Installed plugin ${selector}`);
    return verifySetup(execCodex, { pluginName, marketplaceName, expectedVersion, steps, finalStatus: 'installed' });
  }

  if (before.version === expectedVersion) {
    steps.push(`Plugin ${selector} is already current (${expectedVersion})`);
    return {
      status: 'current',
      selector,
      expectedVersion,
      installedVersion: before.version,
      steps,
      exitCode: 0,
    };
  }

  const upgradeMarketplace = execCodex(['plugin', 'marketplace', 'upgrade', marketplaceName]);
  if (commandFailed(upgradeMarketplace)) return failure('upgrade-marketplace', upgradeMarketplace, steps);
  steps.push(`Upgraded marketplace ${marketplaceName}`);

  const removePlugin = execCodex(['plugin', 'remove', selector]);
  if (commandFailed(removePlugin)) return failure('remove-stale-plugin', removePlugin, steps);
  steps.push(`Removed stale plugin ${selector}`);

  const addPlugin = execCodex(['plugin', 'add', selector]);
  if (commandFailed(addPlugin)) return failure('upgrade-plugin', addPlugin, steps);
  steps.push(`Upgraded plugin ${selector}`);
  return verifySetup(execCodex, { pluginName, marketplaceName, expectedVersion, steps, finalStatus: 'upgraded' });
}

function verifySetup(execCodex, options) {
  const verifyList = execCodex(['plugin', 'list']);
  if (commandFailed(verifyList)) return failure('verify-plugin', verifyList, options.steps);

  const plugin = parsePluginList(verifyList.stdout, options);
  const selector = `${options.pluginName}@${options.marketplaceName}`;
  if (!plugin?.installed) {
    return {
      status: 'failed',
      action: 'verify-plugin',
      selector,
      expectedVersion: options.expectedVersion,
      installedVersion: null,
      steps: options.steps,
      exitCode: 1,
      error: `Plugin ${selector} is still not installed`,
    };
  }

  if (plugin.version !== options.expectedVersion) {
    return {
      status: 'failed',
      action: 'verify-version',
      selector,
      expectedVersion: options.expectedVersion,
      installedVersion: plugin.version,
      steps: options.steps,
      exitCode: 1,
      error: `Plugin ${selector} is ${plugin.version}, expected ${options.expectedVersion}`,
    };
  }

  return {
    status: options.finalStatus,
    selector,
    expectedVersion: options.expectedVersion,
    installedVersion: plugin.version,
    steps: options.steps,
    exitCode: 0,
  };
}
