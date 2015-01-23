var _ = require('underscore');
var Spawn = require('node-spawn');

var userConfig = require(process.env.HOME + '/.partyplayConfig.js');
var defaultConfig = require(__dirname + '/partyplayConfigDefaults.js');
var config = _.defaults(userConfig, defaultConfig);

var socket = require('socket.io-client')(config.hostname + ':' + config.port);
var spawn = null;

socket.on('playback', function(data) {
    if(spawn)
        spawn.kill();
    if(!data)
        return;

    console.log('playback event');
    console.log(data);

    var seek = 0;
    if(data.position)
        seek = data.position / 1000;

    spawn = Spawn({
        cmd: 'ffplay',
        args: ['-ss', seek, '-nodisp',
            config.hostname + ':' + config.port + '/song/' + data.backendName + '/' + data.songID + '.' + data.format
        ],
        onStderr: function() {}
    });
    spawn.start();
    console.log(config.hostname + ':' + config.port + '/song/' + data.backendName + '/' + data.songID + '.' + data.format);
});

socket.on('connect', function() {
    console.log('connected');
});
