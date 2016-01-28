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
var writeFile = require('../utils/writeFile');
var options = require('../options');
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

function populateRestoreRolePermissionsSql(
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
  if (!values.length) return '';
  const tableMap = getTableMap(config);
  const valueStatements = values
    .map(x => `  (${x.roleId}, ${x.permissionId})`)
    .join(', ');
  const sql = [
    `INSERT INTO ${provider.escapeId(tableMap['associations'])} VALUES `,
    valueStatements
  ].join('\n');
  return sql;
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

function populateClearExistingStuffsSql(provider, config) {
  const tableMap = getTableMap(config);
  const sql = util.format(
    'delete from %s; \n' +
    'delete from %s; \n' +
    'delete from %s; \n',
    provider.escapeId(tableMap['associations']),
    provider.escapeId(tableMap['permissions']),
    provider.escapeId(tableMap['permission_categories'])
  );
  return sql;
}

module.exports = function(config) {
  const path = config.permissions;
  const dialect = config.dialect;
  const provider = factory.getProvider(dialect);
  provider.init(config);
  const changes = [];

  return parse(path)
    .then(root => {
      const result = {root};
      return dumpExistingRolePermissionMap(provider, config)
        .then(existingRolePermissions => {
        log.debug('%d role permissions dumpped. ', existingRolePermissions.length);
        result.existingRolePermissions = existingRolePermissions;
        return result;
      });
    })
    .then(result => {
      const root = result.root;
      let buffer = [], sql = [];

      sql.push('-- Clear existing role and permissions related data\n');
      sql.push(populateClearExistingStuffsSql(provider, config));

      // categories sql
      sql.push('-- Insert new permission categories\n');
      populateCategoriesSql(root, provider, config, buffer);
      sql.push(sqlFromBuffer(buffer));

      // permissions sql
      buffer = [];
      sql.push('-- Insert new permissions\n');
      populatePermissionsSql(root, provider, config, buffer);
      sql.push(sqlFromBuffer(buffer));

      // restore
      sql.push('-- Restoring existing role permissions \n');
      const nameMap = {};
      populatePermissionsNameMap(result.root, nameMap);
      sql.push(populateRestoreRolePermissionsSql(
        provider, config, result.existingRolePermissions, nameMap
      ));
      result.sql = sql.join('');

      provider.dispose();
      if (options.out) {
        return writeFile(options.out, result.sql);
      } else {
        console.log(result.sql);
        return result;
      }
    })
    .catch(err => {
      provider.dispose();
      log.error('Error export change scripts: %s', err.message);
    });
}
