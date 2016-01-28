/**
 * @file General logger functions w/ coloring support.
 * @author: eric <eric.blueplus@gmail.com>
 * @copyright: (c) 2012-2016 reefoo co., ltd.
 */

'use strict'; 

var util = require('util');
var colors = require('colors/safe');
var logLevel = require('../options').logLevel;

const LOG_LEVELS = {
  verbose: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
}

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'grey',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'cyan',
  error: 'red'
});

Object.assign(module.exports, {
  /**
   * log verbose message.
   */
  verbose: function() {
    LOG_LEVELS[logLevel] <= LOG_LEVELS['verbose'] && console.error(
      colors.verbose(util.format.apply(util, arguments))
    );
  },

  /**
   * log debugging message.
   */
  debug: function() {
    LOG_LEVELS[logLevel] <= LOG_LEVELS['debug'] && console.error(
      colors.debug(util.format.apply(util, arguments))
    );
  },

  /**
   * log informal message.
   */
  info: function() {
    LOG_LEVELS[logLevel] <= LOG_LEVELS['info'] && console.error(
      colors.info(util.format.apply(util, arguments))
    );
  },

  /**
   * log warning message.
   */
  warn: function() {
    LOG_LEVELS[logLevel] <= LOG_LEVELS['warn'] && console.error(
      colors.warn(util.format.apply(util, arguments))
    );
  },

  /**
   * log error message.
   */
  error: function() {
    LOG_LEVELS[logLevel] <= LOG_LEVELS['warn'] && console.error(
      colors.error(util.format.apply(util, arguments))
    );
  }
});
