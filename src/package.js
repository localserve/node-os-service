"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_common_log_lib_1 = require("@f0c1s/node-common-log-lib");
var node_common_log_tag_1 = require("@f0c1s/node-common-log-tag");
var node_common_log_lib_2 = __importDefault(require("@f0c1s/node-common-log-lib"));
var node_sha_lib_1 = require("@f0c1s/node-sha-lib");
var path_1 = require("path");
var fs_1 = require("fs");
var bgred = require('@f0c1s/color-bgred');
var server = require('express')();
var bodyParser = require('body-parser');
var helmet = require('helmet');
var requestID = require('@m1yh3m/requestid.middleware')().requestid;
var compression = require('compression');
server.use(compression());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(helmet());
server.use(requestID);
var os = require('os');
var configFilename = path_1.join(__dirname, '../config.json');
var config = JSON.parse(fs_1.readFileSync(configFilename).toString());
node_common_log_lib_2.default(node_common_log_tag_1.TAGS.READ('FILE'), configFilename);
/* All routes go through these */
var N_A = 'Not allowed!';
var path = '/os';
var allowedPath = [path];
server.all('*', requestID);
server.all('*', function (req, res, next) {
    var _path = req.path;
    node_common_log_lib_2.default(node_common_log_tag_1.TAGS.REQUEST, _path + " at " + Date.now());
    if (!allowedPath.some(function (i) { return i.endsWith(_path); })) {
        node_common_log_lib_2.default(node_common_log_tag_1.TAGS.INFO, N_A, node_common_log_lib_1.TypesEnum.WARN);
        res.status(404).send(N_A);
    }
    else {
        next();
    }
});
var fns = [
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
var props = ['EOL', 'constants'];
server.get(path, function (req, res) {
    var params = Object.keys(req.query);
    if (params.length !== 0) {
        res.status(404).send(N_A);
        return;
    }
    var data = fns.map(function (fn) {
        var _a;
        return (_a = {}, _a[fn] = (os[fn])(), _a);
    }).reduce(function (a, c) { return (__assign(__assign({}, a), c)); }, {});
    props.forEach(function (prop) { return data[prop] = os[prop]; });
    var ts = Date.now();
    var hash = node_sha_lib_1.sha256(JSON.stringify(data));
    res.send(JSON.stringify({ hash: hash, os: data, ts: ts }));
});
/* SERVER IS READY */
var port = config.ports.services.os;
node_common_log_lib_2.default(node_common_log_tag_1.TAGS.INFO, "Serving os service at port " + port + " path " + bgred(path) + ".");
server.listen(port);
function handleExit(signal) {
    console.log("Received " + signal + ". Exiting with 0.");
    process.exit(0);
}
// SIGNINT doesn't work with WebStorm's ctrl+c; may be terminal raw mode is enabled.
// in raw mode, processing happens character by character; terminal never sees ctrl+c.
process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
//# sourceMappingURL=package.js.map