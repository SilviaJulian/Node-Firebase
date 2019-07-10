// Firstly we'll need to import the fs library
let fs = require('fs');

exports.logInfo = require('tracer').console({
  transport: function (data) {
    // console.log(data.output);
    var stream = fs.createWriteStream('Logs/info.txt', {
      flags: "a",
      encoding: "ascii",
      mode: 0666
    }).write(data.rawoutput + "\n");
  }
});
exports.logError = require('tracer').console({
  transport: function (data) {
    // console.log(data.output);
    var stream = fs.createWriteStream('Logs/error.txt', {
      flags: "a",
      encoding: "ascii",
      mode: 0666
    }).write(data.rawoutput + "\n");
  }
});

