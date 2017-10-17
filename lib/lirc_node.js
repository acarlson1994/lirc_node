exports.version = '0.1.0';

exports.IRSend = require('./irsend');
exports.irsend = new exports.IRSend();
exports.remotes = {};

exports.IRReceive = require('./irreceive');
var irreceive = new exports.IRReceive();
exports.addListener = irreceive.addListener.bind(irreceive);
exports.on = exports.addListener;
exports.removeListener = irreceive.removeListener.bind(irreceive);

// In some cases the default lirc socket does not work
// More info at http://wiki.openelec.tv/index.php?title=Guide_to_Lirc_IR_Blasting
exports.setSocket = function(socket) {
  exports.irsend.setSocket(socket);
}

exports.init = function(callback) {
  exports.irsend.list('', '', irsendCallback);

  function irsendCallback(error, stdout, stderr) {
    exports._populateRemotes(error, stdout, stderr)
      .then(() => { exports._populateCommands(); })
      .then(() => { if (callback) callback(); });
  }

  return true;
};

// Private
exports._populateRemotes = function(error, stdout, stderr) {
  return new Promise((resolve, reject) => {
    var remotes = stdout.split('\n');

    exports.remotes = {};

    remotes.forEach(function(element, index, array) {
      var remoteName = element;
      if (remoteName) exports.remotes[remoteName] = [];

      if (index === remotes.length - 1) resolve();
    });
  });
};

exports._populateCommands = function() {
  return new Promise((resolve, reject) => {
    for (var remote in exports.remotes) {
      (function(remote) {
        exports.irsend.list(remote, '', function(error, stdout, stderr) {
          exports._populateRemoteCommands(remote, error, stdout, stderr)
            .then(() => { resolve() })
        });
      })(remote);
    }
  });
};

exports._populateRemoteCommands = function(remote, error, stdout, stderr) {
  return new Promise((resolve, reject) => {
    var commands = stdout.split('\n');
    commands.forEach(function(element, index, array) {
      if (element)  {
        var commandName = element.split(' ')[1];
      } else {
        return;
      }

      exports.remotes[remote].push(commandName);

      if (index === commands.length - 1) resolve();
    });
  });
};
