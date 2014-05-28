'use strict';
var path = require('path');
var execFile = require('child_process').execFile;

module.exports = function (cb) {

  execFile('node', ['/usr/local/bin/grunt', '-h'], function (error, stdout) {
    if (error) return cb(error);
    
    var tasks = [];

    var output = stdout.split(/\n/);

    var startIndex = output.indexOf('\u001b[4mAvailable tasks\u001b[24m') + 1;

    for (var i = startIndex; output[i] !== ''; i++) {
      tasks.push(output[i].match(/\S*\b/)[0]);
    }

    cb(null, tasks);

  });

};
