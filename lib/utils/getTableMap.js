/**
 * @file Get table map from config.
 * @author: eric <eric.blueplus@gmail.com>
 * @copyright: (c) 2012-2016 reefoo co., ltd.
 */
'use strict';

/**
 * Get table map from config
 * @param {Object} config configurations.
 */
module.exports = function(config) {
  return Object.assign({}, {
    roles: 'role',
    permissions: 'permissions',
    permission_categories: 'permission_category',
    associations: 'role_permission'
  }, config.tables);
}
