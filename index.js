#! /usr/bin/env node

var fs = require('fs');
var pathutil = require('path');
var options = require('./lib/options');
var log = require('./lib/utils/logger');
var readFromFile = require('./lib/config').readFromFile;
var stat = require('./lib/utils/stat');
var colors = require('colors/safe');
var factory = require('./lib/factory');
var commands = {
  backup: require('./lib/commands/backup'),
  import: require('./lib/commands/import'),
  export: require('./lib/commands/export'),
  change: require('./lib/commands/change')
};

/**
 * the main entry point for the program.
 * @param {Object} config configuration information loaded
 *  from config file specified via --config or .permanrc.
 */
function main(config) {
  // check the required information of database config.
  if (!config.database) {
    log.error('Config error: missing name of database \'database\'. ');
    return;
  }

  var required = ['host', 'user', 'password', 'dialect'];
  for (var k = 0; k < required.length; k++) {
    if (!config[required[k]]) {
      log.error(
        'Config error: missing %s of database \'%s\'. ',
        colors.underline(required[k]),
        config.database
      );
      return;
    }
  }

  try {
    factory.getProvider(config.dialect);
  } catch (e) {
    log.error('Error: %s', e.message);
    return;
  }

  if (!config.permissions) {
    log.error('Config error: permission definitions are not specified. ');
    return;
  }

  if (/^backup$/i.test(options.command)) {
    commands.backup(config);
  } else if (/^import$/i.test(options.command)) {
    commands.import(config);
  } else if (/^export$/i.test(options.command)) {
    commands.export(config);
  } else if (/^change$/i.test(options.command)) {
    commands.change(config);
  }
}

if (!/^(backup|import|export|change)$/i.test(options.command)) {
  log.error('Error: unknown command \'%s\'', options.command);
  return;
}

// if the config option is not specified, try to load the
// .permanrc from the current working directory.
if (!options.config) {
  options.config = pathutil.join(process.cwd(), '.permanrc');

  // check if the .permanrc config file exists
  stat(options.config).then(() => {
    // yes, try to load config from it.
    readFromFile(options.config).then(result => {
      main(result);
    }).catch(e => {
      log.error(
        'Error load config from .permanrc: %s',
        e.message
      );
    });
  }).catch(e => {
    log.warn(
      'Error: configuration file is not specified. You can specify\n' +
      'the config file via --config option or .permanrc in the\n' +
      'directory where you call perman. Use --help for more information. '
    );
  });
} else {
  readFromFile(options.config).then(result => {
    main(result);
  }).catch(e => {
    log.error('Error load config file: %s', e.message);
  });
}
