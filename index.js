#!/usr/bin/env node

var _ = require('underscore');
var Spawn = require('node-spawn');
var fs = require('fs');

var userConfig = require(process.env.HOME + '/.nodeplayer-config.js');
var defaultConfig = require('nodeplayer-defaults');
var config = _.defaults(userConfig, defaultConfig);

var tlsOpts = {
    key: fs.readFileSync(config.tlsKey),
    cert: fs.readFileSync(config.tlsCert),
    ca: fs.readFileSync(config.tlsCa),
    rejectUnauthorized: config.rejectUnauthorized
};

var socket = require('socket.io-client')(config.hostname + ':' + config.port, tlsOpts);
var spawn = null;

socket.on('playback', function(data) {
    if(spawn)
        spawn.kill();
    if(!data)
        return;

    var seek = 0;
    if(data.position)
        seek = data.position / 1000;

    var args = [];
    if(config.tls) {
        args = ['-ss', seek, '-nodisp', '-nostats',
            '-cert_file', config.tlsCert,
            '-ca_file', config.tlsCa,
            '-key_file', config.tlsKey,
            '-tls_verify', (config.rejectUnauthorized ? 1 : 0),
            config.hostname + ':' + config.port + '/song/' + data.backendName + '/' + data.songID + '.' + data.format
        ]
    } else {
        args = ['-ss', seek, '-nodisp', '-nostats',
            //'-v', 'debug',
            config.hostname + ':' + config.port + '/song/' + data.backendName + '/' + data.songID + '.' + data.format
        ]
    }

    spawn = Spawn({
        cmd: 'ffplay',
        args: args
        //onStderr: function() {}
    });
    spawn.start();
    console.log('playing: ' + config.hostname + ':' + config.port + '/song/' + data.backendName + '/' + data.songID + '.' + data.format);
});

socket.on('connect', function() {
    console.log('connected');
});
