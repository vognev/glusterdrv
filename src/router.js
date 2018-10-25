const router = require('router');
const bodyParser = require('body-parser');

module.exports = function (driver) {
    const routes = router();

    routes.use(bodyParser.json({
        type: () => { return true }
    }));

    routes.use((req, res, next) => {
        console.log(req.url, req.body);
        return next()
    });

    routes.post('/Plugin.Activate', (req, res) => {
        res.end(JSON.stringify({
            "Implements": ["VolumeDriver"]
        }))
    });

    routes.post('/VolumeDriver.Capabilities', (req, res) => {
        res.end(JSON.stringify({
            "Capabilities": {
                "Scope": "local"
            }
        }))
    });

    routes.post('/VolumeDriver.Get', (req, res) => {
        const body = req.body;
        const json = driver.getVolume(body.Name);

        if (json) {
            res.end(JSON.stringify({ Volume: json.Volume }))
        } else {
            res.writeHead(400);
            res.end(JSON.stringify({
                Err: `Mountpoint for volume ${body.Name} does not exist`
            }))
        }
    });

    routes.post('/VolumeDriver.Create', (req, res) => {
        const body = req.body;

        try {
            const mount = driver.createVolume(body.Name, body.Opts);
            res.end(JSON.stringify({
                Volume: {
                    Name: body.Name,
                    Mountpoint: mount,
                    Status: {}
                }
            }));
        } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({
                Err: e.toString()
            }))
        }
    });

    routes.post('/VolumeDriver.List', (req, res) => {
        try {
            const Volumes = driver.listVolumes();
            res.end(JSON.stringify({Volumes}))
        } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({Err: e.toString()}))
        }
    });

    routes.post('/VolumeDriver.Mount', (req, res) => {
        const body = req.body;

        try {
            const Mountpoint = driver.mountVolume(body.Name, body.ID);
            res.end(JSON.stringify({
                Mountpoint
            }))
        } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({
                Err: e.toString()
            }))
        }
    });

    routes.post('/VolumeDriver.Unmount', (req, res) => {
        const body = req.body;

        try {
            driver.unmountVolume(body.Name, body.ID);
            res.end(JSON.stringify({
                Err: ""
            }))
        } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({
                Err: e.toString()
            }))
        }
    });

    routes.post('/VolumeDriver.Remove', (req, res) => {
        const body = req.body;

        try {
            driver.removeVolume(body.Name);
            res.end(JSON.stringify({
                Err: ""
            }))
        } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({
                Err: e.toString()
            }))
        }
    });

    return routes;
};