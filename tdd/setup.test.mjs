import assert from 'node:assert/strict';
import test from 'node:test';

import { parseMarketplaceList, parsePluginList, setupAxon } from '../src/setup.mjs';

const marketplaceList = `MARKETPLACE             ROOT
openai-bundled          C:\\Users\\Kevin\\.codex\\.tmp\\bundled-marketplaces\\openai-bundled
axon                    C:\\Users\\Kevin\\.codex\\.tmp\\marketplaces\\axon
`;

const currentPluginList = `Marketplace \`axon\`
C:\\Users\\Kevin\\.codex\\.tmp\\marketplaces\\axon\\.agents\\plugins\\marketplace.json

PLUGIN      STATUS              VERSION  PATH
axon@axon   installed, enabled  0.1.3    C:\\Users\\Kevin\\.codex\\plugins\\cache\\axon\\axon\\0.1.3
`;

test('parseMarketplaceList finds configured Axon marketplace', () => {
  assert.deepEqual(parseMarketplaceList(marketplaceList, 'axon'), {
    name: 'axon',
    root: 'C:\\Users\\Kevin\\.codex\\.tmp\\marketplaces\\axon',
  });
});

test('parsePluginList reads installed plugin status and version', () => {
  assert.deepEqual(parsePluginList(currentPluginList), {
    selector: 'axon@axon',
    status: 'installed, enabled',
    version: '0.1.3',
    path: 'C:\\Users\\Kevin\\.codex\\plugins\\cache\\axon\\axon\\0.1.3',
    installed: true,
  });
});

test('setupAxon exits current when installed version matches', () => {
  const calls = [];
  const result = setupAxon({
    expectedVersion: '0.1.3',
    execCodex: (args) => {
      calls.push(args);
      if (args.join(' ') === 'plugin marketplace list') return { status: 0, stdout: marketplaceList, stderr: '' };
      if (args.join(' ') === 'plugin list') return { status: 0, stdout: currentPluginList, stderr: '' };
      throw new Error(`unexpected call: ${args.join(' ')}`);
    },
  });

  assert.equal(result.status, 'current');
  assert.deepEqual(calls, [
    ['plugin', 'marketplace', 'list'],
    ['plugin', 'list'],
  ]);
});

test('setupAxon installs missing marketplace and plugin', () => {
  const calls = [];
  let pluginInstalled = false;
  const result = setupAxon({
    expectedVersion: '0.1.3',
    execCodex: (args) => {
      calls.push(args);
      const command = args.join(' ');
      if (command === 'plugin marketplace list') return { status: 0, stdout: 'MARKETPLACE ROOT\n', stderr: '' };
      if (command === 'plugin marketplace add Strandingsism/axon') return { status: 0, stdout: '', stderr: '' };
      if (command === 'plugin list') {
        return {
          status: 0,
          stdout: pluginInstalled ? currentPluginList : 'PLUGIN STATUS VERSION PATH\naxon@axon  not installed\n',
          stderr: '',
        };
      }
      if (command === 'plugin add axon@axon') {
        pluginInstalled = true;
        return { status: 0, stdout: '', stderr: '' };
      }
      throw new Error(`unexpected call: ${command}`);
    },
  });

  assert.equal(result.status, 'installed');
  assert.deepEqual(calls, [
    ['plugin', 'marketplace', 'list'],
    ['plugin', 'marketplace', 'add', 'Strandingsism/axon'],
    ['plugin', 'list'],
    ['plugin', 'add', 'axon@axon'],
    ['plugin', 'list'],
  ]);
});

test('setupAxon refreshes existing marketplace before installing missing plugin', () => {
  const calls = [];
  let pluginInstalled = false;
  const result = setupAxon({
    expectedVersion: '0.1.3',
    execCodex: (args) => {
      calls.push(args);
      const command = args.join(' ');
      if (command === 'plugin marketplace list') return { status: 0, stdout: marketplaceList, stderr: '' };
      if (command === 'plugin marketplace upgrade axon') return { status: 0, stdout: '', stderr: '' };
      if (command === 'plugin list') {
        return {
          status: 0,
          stdout: pluginInstalled ? currentPluginList : 'PLUGIN STATUS VERSION PATH\naxon@axon  not installed\n',
          stderr: '',
        };
      }
      if (command === 'plugin add axon@axon') {
        pluginInstalled = true;
        return { status: 0, stdout: '', stderr: '' };
      }
      throw new Error(`unexpected call: ${command}`);
    },
  });

  assert.equal(result.status, 'installed');
  assert.deepEqual(calls, [
    ['plugin', 'marketplace', 'list'],
    ['plugin', 'list'],
    ['plugin', 'marketplace', 'upgrade', 'axon'],
    ['plugin', 'add', 'axon@axon'],
    ['plugin', 'list'],
  ]);
});

test('setupAxon upgrades stale plugin', () => {
  const calls = [];
  let upgraded = false;
  const stalePluginList = currentPluginList.replaceAll('0.1.3', '0.1.2');
  const result = setupAxon({
    expectedVersion: '0.1.3',
    execCodex: (args) => {
      calls.push(args);
      const command = args.join(' ');
      if (command === 'plugin marketplace list') return { status: 0, stdout: marketplaceList, stderr: '' };
      if (command === 'plugin list') return { status: 0, stdout: upgraded ? currentPluginList : stalePluginList, stderr: '' };
      if (command === 'plugin marketplace upgrade axon') return { status: 0, stdout: '', stderr: '' };
      if (command === 'plugin remove axon@axon') return { status: 0, stdout: '', stderr: '' };
      if (command === 'plugin add axon@axon') {
        upgraded = true;
        return { status: 0, stdout: '', stderr: '' };
      }
      throw new Error(`unexpected call: ${command}`);
    },
  });

  assert.equal(result.status, 'upgraded');
  assert.deepEqual(calls, [
    ['plugin', 'marketplace', 'list'],
    ['plugin', 'list'],
    ['plugin', 'marketplace', 'upgrade', 'axon'],
    ['plugin', 'remove', 'axon@axon'],
    ['plugin', 'add', 'axon@axon'],
    ['plugin', 'list'],
  ]);
});
