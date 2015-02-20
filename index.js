#!/usr/bin/env node

var _ = require('underscore');
var Spawn = require('node-spawn');
var fs = require('fs');

var config = require('nodeplayer-defaults')(console);

var tlsOpts = {
    key: fs.readFileSync(config.tlsKey),
    cert: fs.readFileSync(config.tlsCert),
    ca: fs.readFileSync(config.tlsCa),
    rejectUnauthorized: config.rejectUnauthorized
};

var socket = require('socket.io-client')((config.tls ? 'https://' : 'http://') + config.hostname + ':' + config.port, tlsOpts);
var spawn = null;

socket.on('playback', function(data) {
    if(spawn)
        spawn.kill();
    if(!data || !data.playbackStart)
        return;

    var seek = 0;
    if(data.position)
        seek = data.position / 1000;

    var args = ['-ss', seek, '-nodisp', '-nostats']; //'-v', 'debug',

    if(config.tls) {
        args.splice(args.length, 0,
            '-ss', seek, '-nodisp', '-nostats',
            '-cert_file', config.tlsCert,
            '-ca_file', config.tlsCa,
            '-key_file', config.tlsKey,
            '-tls_verify', (config.rejectUnauthorized ? 1 : 0)
        );
    }

    // url
    args.push(config.tls ? 'https://' : 'http://');
    if(config.plugins.indexOf('httpAuth') !== -1) {
        args[args.length - 1] += config.username + ':' + config.password + '@';
    }

    args[args.length - 1] += (config.hostname + ':' + config.port + '/song/' + data.backendName + '/' + data.songID + '.' + data.format);

    spawn = Spawn({
        cmd: 'ffplay',
        args: args,
        onStderr: function() {}
    });
    spawn.start();

    console.log('playing: ' + config.hostname + ':' + config.port + '/song/' + data.backendName + '/' + data.songID + '.' + data.format);
});

socket.on('connect', function() {
    console.log('connected');
});
