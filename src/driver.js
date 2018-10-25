const fs = require('fs');
const path = require('path');
const lockfile = require('lockfile');

class CommandRunner
{
    constructor(sudoFlag = false) {
        this.sudo = sudoFlag;
    }

    run(command) {
        return require('child_process').execSync(`${this.sudo ? 'sudo' : ''} ${command}`)
    }
}

class RemoteSpec
{
    constructor(remote) {
        const remoteRe = /^(.+):([^\/]+)(\/.+)$/i;
        const match = remote.match(remoteRe);

        if (!match)
            throw `Invalid remote specification: ${remote}`;

        this.servers = match[1].split(',');
        this.volume  = match[2];
        this.subdir  = match[3];
    }

    toMountCommand(path)
    {
        let cmd = [`glusterfs -l /dev/null`];

        for(let i = 0; i < this.servers.length; i++)
            cmd.push(`-s ${this.servers[i]}`);

        cmd.push(`--volfile-id=${this.volume}`);

        if (this.subdir)
            cmd.push(`--subdir-mount=${this.subdir}`);

        cmd.push(path);

        return cmd.join(' ');
    }

    toHelperCommand(helper)
    {
        return `${helper} ${this.servers.join(',')} ${this.volume} ${this.subdir}`
    }
}

module.exports = function (options) {
    const runner = new CommandRunner(options.sudo);

    return {
        getVolume(Name) {
            const mount = path.join(options.baseDir, Name);
            const lock  = mount + '.lock';
            const conf  = mount + '.json';

            lockfile.lockSync(lock);
            setImmediate(() => {
                lockfile.unlockSync(lock);
            });

            if (!fs.existsSync(conf)) {
                return null;
            }

            const json = fs.readFileSync(conf);
            return JSON.parse(json);
        },

        createVolume(Name, Options) {
            const mount = path.join(options.baseDir, Name);
            const lock  = mount + '.lock';
            const conf  = mount + '.json';

            const remote = new RemoteSpec(Options.remote);

            if (remote.subdir)
                runner.run(remote.toHelperCommand(options.helper));

            lockfile.lockSync(lock);
            setImmediate(() => {
                lockfile.unlockSync(lock);
            });

            if (!fs.existsSync(mount))
                fs.mkdirSync(mount);

            fs.writeFileSync(conf, JSON.stringify({
                Volume: {
                    Name: Name,
                    Mountpoint: mount
                },
                Remote: Options.remote
            }));

            return mount;
        },

        removeVolume(Name) {
            const mount = path.join(options.baseDir, Name);
            const lock  = mount + '.lock';
            const conf  = mount + '.json';

            if (!fs.existsSync(mount)) {
                throw `Volume ${Name} does not exist`
            }

            lockfile.lockSync(lock);
            setImmediate(() => {
                lockfile.unlockSync(lock);
            });

            fs.rmdirSync(mount);
            fs.unlinkSync(conf)
        },

        listVolumes() {
            return fs.readdirSync(options.baseDir)
                .filter(name => {
                    return name.endsWith('.json')
                })
                .map(name => {
                    const json = JSON.parse(
                        fs.readFileSync(path.join(options.baseDir, name))
                    );

                    return json.Volume;
                });
        },

        mountVolume(Name, ID)
        {
            const mount = path.join(options.baseDir, Name, ID);
            const lock  = mount + '.lock';

            const volume = this.getVolume(Name);
            const remote = new RemoteSpec(volume.Remote);

            if (fs.existsSync(mount)) {
                throw `Mountpoint ${mount} already exists`;
            }

            lockfile.lockSync(lock);
            setImmediate(() => {
                lockfile.unlockSync(lock);
            });

            fs.mkdirSync(mount);

            try {
                runner.run(remote.toMountCommand(mount));
            } catch (e) {
                fs.rmdirSync(mount);
                throw e;
            }

            return mount;
        },

        unmountVolume(Name, ID)
        {
            const mount = path.join(options.baseDir, Name, ID);
            const lock  = mount + '.lock';

            if (!fs.existsSync(mount)) {
                throw `Mountpoint ${mount} does not exists`;
            }

            lockfile.lockSync(lock);
            setImmediate(() => {
                lockfile.unlockSync(lock);
            });

            runner.run(`umount ${mount}`);

            fs.rmdirSync(mount);
        }
    }
};