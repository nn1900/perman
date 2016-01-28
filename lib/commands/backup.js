/**
 * @file the backup command implementation.
 * @author: eric <eric.blueplus@gmail.com>
 * @copyright: (c) 2012-2016 reefoo co., ltd.
 */

'use strict';

var pathutil = require('path');
var factory = require('../factory');
var mkdirp = require('../utils/mkdirp');
var moment = require('moment');
var log = require('../utils/logger');

module.exports = function(config) {
  const backupDir = config.backupDir || './backups';
  const dialect = config.dialect;
  const provider = factory.getProvider(dialect);
  provider.init(config);
  const timestamp = moment().format('YYYYMMDD_HHmmss_SSSS');
  const backupPath = pathutil.join(backupDir, 'permissions-' + timestamp + '.sql');
  const tablesConfig = Object.assign({}, {
    roles: 'role',
    permissions: 'permissions',
    permission_categories: 'permission_category',
    associations: 'role_permission'
  }, config.tables);
  const tables = Object.keys(tablesConfig).map(x => tablesConfig[x]);
  return mkdirp(backupDir).then(() =>
    provider.backupTables(config.database, tables, backupPath)
  ).then(() => {
    log.info(
      'Successfully backed up the roles and permissions related data to: %s',
      backupPath
    );
    provider.dispose();
    return backupPath;
  }).catch(err => {
    provider.dispose();
    log.error('Error backup roles and permissions related data: %s', err.message);
  });
}
