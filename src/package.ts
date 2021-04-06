import {Express} from "express";

import {TypesEnum} from '@f0c1s/node-common-log-lib';
import {TAGS} from '@f0c1s/node-common-log-tag';
import log from '@f0c1s/node-common-log-lib';
import {sha256} from '@f0c1s/node-sha-lib';
import {join} from "path";
import {readFileSync} from "fs";

const bgred = require('@f0c1s/color-bgred');

const server: Express = require('express')();
const bodyParser = require('body-parser');
const helmet = require('helmet');
const requestID = require('@m1yh3m/requestid.middleware')().requestid;
const compression = require('compression');
server.use(compression());
server.use(bodyParser.urlencoded({extended: false}));
server.use(helmet());
server.use(requestID);

const os = require('os');

import CONFIG from '../config';

const configFilename = join(__dirname, '../config.json');
const config: CONFIG = JSON.parse(readFileSync(configFilename).toString());
log(TAGS.READ('FILE'), configFilename);

/* All routes go through these */
const N_A = 'Not allowed!';
const path = '/os';
const allowedPath = [path];
server.all('*', requestID);
server.all('*', (req: { path: any }, res: any, next: () => void) => {
    const _path = req.path;
    log(TAGS.REQUEST, `${_path} at ${Date.now()}`);
    if (!allowedPath.some(i => i.endsWith(_path))) {
        log(TAGS.INFO, N_A, TypesEnum.WARN);
        res.status(404).send(N_A);
    } else {
        next();
    }
});

const fns = [
    'arch',
    'cpus', 'endianness',
    'freemem',
    'getPriority',
    'homedir',
    'hostname',
    'loadavg',
    'networkInterfaces',
    'platform',
    'release',
    'tmpdir',
    'totalmem',
    'type',
    'uptime',
    'userInfo',
    'version'
];

const props = ['EOL', 'constants'];

server.get(path, (req, res) => {
    const params = Object.keys(req.query);
    if (params.length !== 0) {
        res.status(404).send(N_A);
        return;
    }
    const data = fns.map((fn: string) => ({[fn]: (os[fn])()})).reduce((a: any, c: any) => ({...a, ...c}), {});
    props.forEach((prop: string) => data[prop] = os[prop]);

    const ts = Date.now();
    const hash = sha256(JSON.stringify(data));
    res.send(JSON.stringify({hash, os: data, ts}));
});
/* SERVER IS READY */
const port = config.ports.services.os;
log(TAGS.INFO, `Serving os service at port ${port} path ${bgred(path)}.`);
server.listen(port);

function handleExit(signal: string | symbol) {
    console.log(`Received ${signal as string}. Exiting with 0.`);
    process.exit(0);
}

// SIGNINT doesn't work with WebStorm's ctrl+c; may be terminal raw mode is enabled.
// in raw mode, processing happens character by character; terminal never sees ctrl+c.
process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);