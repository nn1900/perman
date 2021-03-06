/**
 * @file the import command implementation.
 * @author: eric <eric.blueplus@gmail.com>
 * @copyright: (c) 2012-2016 reefoo co., ltd.
 */

'use strict';

var util = require('util');
var pathutil = require('path');
var moment = require('moment');
var factory = require('../factory');
var mkdirp = require('../utils/mkdirp');
var log = require('../utils/logger');
var backup = require('./backup');
var getTableMap = require('../utils/getTableMap');
var parse = require('../utils/parsePermissions');

/**
 * Function that populates the sql for categories.
 */
function populateCategoriesSql(category, provider, config, buffer) {
  if (!category.id) {
    const tableName = config.tables &&
      config.tables['permission_categories'] ||
      'permission_category';
    buffer.push(`INSERT INTO \`${tableName}\` VALUES `);
  } else {
    buffer.push(util.format(
      `  (%d, %s, %s, %d), `,
      category.id,
      provider.escape(category.name),
      category.parent && category.parent.id > 0 ? category.parent.id : 'NULL',
      category.order
    ));
  }
  for (var i = 0; i < category.categories.length; i++) {
    populateCategoriesSql(
      category.categories[i], provider, config, buffer
    );
  }
}

/**
 * Function that populates the sql for permissions.
 */
function populatePermissionsSql(category, provider, config, buffer) {
  if (!category.id) {
    const tableName = config.tables && config.tables['permissions'] || 'permission';
    buffer.push(`INSERT INTO \`${tableName}\` VALUES `);
  }
  for (let i = 0; i < category.permissions.length; i++) {
    const permission = category.permissions[i];
    buffer.push(util.format(
      `  (%d, %s, %s, %s, %d), `,
      permission.id,
      provider.escape(permission.name),
      provider.escape(permission.text),
      category.id > 0 ? category.id : 'NULL',
      permission.order
    ));
  }
  for (var i = 0; i < category.categories.length; i++) {
    populatePermissionsSql(
      category.categories[i], provider, config, buffer
    );
  }
}

function populatePermissionsNameMap(category, result) {
  for (let i = 0; i < category.permissions.length; i++) {
    const permission = category.permissions[i];
    result[permission.name] = permission;
  }
  for (var i = 0; i < category.categories.length; i++) {
    populatePermissionsNameMap(category.categories[i], result);
  }
}

function restoreRolePermissions(
  provider, config, existingRolePermissions, nameMap
) {
  const values = [];
  existingRolePermissions.forEach(x => {
    const parts = x.split('/');
    const roleId = Number(parts[0]);
    const name = parts[1];
    if (nameMap[name]) {
      values.push({roleId, permissionId: nameMap[name].id});
    }
  });
  return Promise.resolve(values).then(() => {
    if (!values.length) return values;
    const tableMap = getTableMap(config);
    const valueStatements = values
      .map(x => `  (${x.roleId}, ${x.permissionId})`)
      .join(', ');
    const sql = [
      `INSERT INTO ${provider.escapeId(tableMap['associations'])} VALUES `,
      valueStatements
    ].join('\n');
    return provider.query(sql).then(x => values);
  });
}

function trimTrailingComma(s) {
  return s.replace(/,\s*$/i, '');
}

function sqlFromBuffer(buffer) {
  if (buffer.length == 1) return '';
  buffer[buffer.length - 1] = trimTrailingComma(buffer[buffer.length - 1]);
  return buffer.join('\n') + ';\n';
}

function dumpExistingRolePermissionMap(provider, config) {
  const tableMap = getTableMap(config);
  const sql = util.format(
    'select role_id, name from %s a ' +
    'inner join %s b on a.permission_id = b.id',
    provider.escapeId(tableMap['associations']),
    provider.escapeId(tableMap['permissions'])
  );
  return provider.query(sql).then(result => {
    return result.map(x => `${x.role_id}/${x.name}`);
  });
}

function clearExistingStuffs(provider, config) {
  const tableMap = getTableMap(config);
  const sql = util.format(
    'delete from %s; \n' +
    'delete from %s; \n' +
    'delete from %s; \n',
    provider.escapeId(tableMap['associations']),
    provider.escapeId(tableMap['permissions']),
    provider.escapeId(tableMap['permission_categories'])
  );
  return provider.query(sql);
}

module.exports = function(config) {
  const path = config.permissions;
  const dialect = config.dialect;
  const provider = factory.getProvider(dialect);
  provider.init(config);

  return parse(path)
    .then(root => backup(config).then(backupPath => ({root, backupPath}))) // backup
    .then(result => { // do import
      var root = result.root;
      var backupPath = result.backupPath;
      var buffer = [], sql = [];

      // categories sql
      populateCategoriesSql(root, provider, config, buffer);
      sql.push(sqlFromBuffer(buffer));

      // permissions sql
      buffer = [];
      populatePermissionsSql(root, provider, config, buffer);
      sql.push(sqlFromBuffer(buffer));

      result.sql = sql.join('');
      return result;
    })
    .then(result => {
      var sql = result.sql;
      log.debug('Dump existing role associated permissions data... ');
      return dumpExistingRolePermissionMap(provider, config)
        .then(existingRolePermissions => {
        log.debug('%d role permissions dumpped. ', existingRolePermissions.length);
        result.existingRolePermissions = existingRolePermissions;
        return result;
      });
    })
    .then(result => {
      log.debug('Clearing existing role and permission related data... ');
      return clearExistingStuffs(provider, config).then(() => result);
    })
    .then(result => {
      log.debug('Importing new permissions definition... ');
      return provider.query(result.sql).then(() => result);
    })
    .then(result => {
      log.debug('Restoring existing role permissions... ');

      const nameMap = {};
      populatePermissionsNameMap(result.root, nameMap);

      return restoreRolePermissions(
        provider, config, result.existingRolePermissions, nameMap
      ).then(restored => {
        log.info('%s role permissions restored. ', restored.length);
        result.restored = restored;
        provider.dispose();
        return result;
      });
    })
    .catch(err => {
      provider.dispose();
      log.error('Error import permissions: %s', err.message);
    });
}
