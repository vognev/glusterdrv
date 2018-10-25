const routerFactory = require('./src/router');
const driverFactory = require('./src/driver');
const SOCKET = '/run/docker/plugins/glusterdrv.sock';

const cleanup = () => {
    try {
        require('fs').unlinkSync(SOCKET);
    } catch (ENOENT) {

    }
};

process.on('SIGINT', () => {
    cleanup(); process.exit();
});

process.on('SIGTERM', () => {
    cleanup(); process.exit();
});

const driver = driverFactory({
    baseDir: '/var/lib/docker/glusterdrv',
    helper: 'python helper.py',
    sudo: process.getuid() > 0
});

const router = routerFactory(driver);

require('http')
    .createServer((req, res) => {
        router(req, res, () => {
            res.end();
        })
    })
    .listen(SOCKET);
