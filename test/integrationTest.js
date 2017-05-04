'use strict';

var assert = require('assert');
var Client = require('../lib/owfs').Client;
var spawn = require('child_process').spawn;

function startTestServer(port, devices, callback) {
    if (Array.isArray(devices)) {
        devices = devices.join(',');
    }

    var server = spawn('owserver', [
        '--foreground',
        '--Celsius',
        '--port=127.0.0.1:'+port,
        '--error_print=2',
        '--error_level=2',
        '--tester='+devices
    ]);

    var timeout = setTimeout(function () {
        server.kill('SIGTERM');
        throw new Error('Timeout while starting owserver');
    }, 1000);

    server.stderr.on('data', function(data) {
        var str = data.toString();
        if (str.match(/Setting up tester Bus Master/)) {
            clearTimeout(timeout);
            if (callback) {
                callback();
            }
        }
    });
  
    server.on('error', function (err) {
        throw new Error('owserver error: '+err);
    });
    
    return server;
}


describe('Integration Test', function () {
    var server;
    var port = 43041;
    before(function (done) {
        server = startTestServer(port, 'DS18B20', done);
    });
    
    after(function () {
        server.kill('SIGTERM');
    });

    it('should read a temperature from a DS18B20 device', function (done) {
        var client = new Client('127.0.0.1', port); 
        client.read('/28.000028D70000/temperature', function(err, result) {
            assert.equal(err, undefined);
            assert.equal(result, '4');
            done();
        });
    });

});
