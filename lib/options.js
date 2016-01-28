/**
 * Gets the command and options from argv.
 */

var colors = require('colors/safe');

var yargs = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command('backup', 'backup permissions in the configured database')
  .command('import', 'import the permissions to the configured database')
  .command('export', 'export the permissions to file in given format')
  .command('change', 'generate change scripts of the permissions')
  .demand(1, colors.red('error: missing command to use, specify --help for available command and options'))
  .options({
    'c': {
      alias: 'config',
      describe: 'the configurations to use with perman'
    },
    'o': {
      alias: 'out',
      describe: 'output file path when used w/ export and change command'
    },
    'log-level': {
      describe: 'logging level: ' +
        colors.underline('verbose') +
        ' (default), ' +
        ['debug', 'info', 'warn', 'error'].map(
          level => colors.underline(level)
        ).join(', ')
    }
  })
  .help('help', 'show help information')
  .showHelpOnFail(false)
  .version(function() {
    return require('../package').version;
  })
  .epilog('Copyright 2015, MIT licensed. ');

// remove the boolean type annoations at the usage option lines.
// see https://github.com/bcoe/yargs/issues/319
yargs.getOptions().boolean.splice(-2);

var argv = yargs.argv;

module.exports = {
  command: argv._[0],
  config: argv.c,
  out: argv.o,
  force: !!argv.force,
  logLevel: argv['log-level'] || 'verbose',
  yargs
};
