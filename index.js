#!/usr/bin/env node

var _ = require('underscore');
var Spawn = require('node-spawn');
var fs = require('fs');

var config = require('nodeplayer-config').getConfig();
var expressConfig = require('nodeplayer-config').getConfig('plugin-express');
var httpAuthConfig = require('nodeplayer-config').getConfig('plugin-httpauth');

var tlsOpts = {
    key: fs.readFileSync(expressConfig.key),
    cert: fs.readFileSync(expressConfig.cert),
    ca: fs.readFileSync(expressConfig.ca),
    rejectUnauthorized: expressConfig.rejectUnauthorized
};

var socket = require('socket.io-client')((expressConfig.tls ? 'https://' : 'http://') + config.hostname + ':' + expressConfig.port, tlsOpts);
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
    if(config.plugins.indexOf('httpauth') !== -1) {
        args[args.length - 1] += httpAuthConfig.username + ':' + httpAuthConfig.password + '@';
    }

    args[args.length - 1] += (config.hostname + ':' + expressConfig.port + '/song/' + data.backendName + '/' + data.songID + '.' + data.format);

    spawn = Spawn({
        cmd: 'ffplay',
        args: args,
        onStderr: function() {}
    });
    spawn.start();

    console.log('playing: ' + args[args.length - 1]);
});

socket.on('connect', function() {
    console.log('connected');
});
