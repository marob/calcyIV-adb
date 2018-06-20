import * as util from 'util';

import {exec, spawnSync} from 'child_process';

const exec$ = util.promisify(exec);
import * as Jimp from 'jimp';
import ScreenSize from '../dto/screenSize';
import logger from '../logger';

class ADB {
    public resume = () => undefined;
    private screenSizeCache: ScreenSize;
    private waitIfPosedPromise: Promise<void>;

    public async devices(): Promise<string[]> {
        const {stdout, stderr} = await exec$('adb devices');
        if (stderr) {
            throw new Error(stderr);
        }
        return stdout
            .replace('\r', '')
            .split('\n')
            .slice(1)
            .filter((line) => line.includes('device'))
            .map((line) => line.split('\t')[0])
            ;
    }

    public async screenshot(): Promise<Jimp> {
        const {status, error, stdout, stderr} = spawnSync('adb', ['exec-out', 'screencap', '-p']);
        if (status === 0) {
            const jimp = await Jimp.read(stdout);
            if (process.env.LOG_SCREENSHOT === 'true') {
                const screenshotPath = `log/${Date.now()}.png`;
                logger.debug(`Logging screenshot to ${screenshotPath}`);
                jimp.write(screenshotPath);
            }
            return jimp;
        } else {
            throw error;
        }
    }

    public async screenSize(): Promise<ScreenSize> {
        if (this.screenSizeCache) {
            return this.screenSizeCache;
        }

        const {stdout} = await this.shell('wm size');
        const sizes: [number, number] = stdout
            .trim()
            .split('\n')
            .map((line) => /([0-9]+)x([0-9]+)/
                .exec(line)
                .slice(1, 3)
                .map((x) => Number.parseInt(x)) as [number, number],
            )
            .reduce((smallest, current) => {
                return (!smallest || (smallest[0] > current[0] || smallest[1] > current[1]))
                    ? current
                    : smallest;
            }, null)
        ;
        this.screenSizeCache = new ScreenSize(sizes[0], sizes[1]);
        return this.screenSizeCache;
    }

    public async getFocusedApp(): Promise<string> {
        const {stdout} = await this.shell('dumpsys window windows | grep -E "mFocusedApp"');
        return stdout;
    }

    public pause() {
        if (!this.waitIfPosedPromise) {
            logger.debug('You quit PokemonGO. Interactions are paused...');
            this.waitIfPosedPromise = new Promise<void>((resolve) => {
                this.resume = () => {
                    logger.debug('Back to PokemonGO. Resuming interactions...');
                    resolve();
                    delete this.waitIfPosedPromise;
                    this.resume = () => undefined;
                };
            });
        }
    }

    public async tap([x, y]: [number, number]) {
        await this.waitIfPosedPromise;
        return await this.shell(`input tap ${x} ${y}`);
    }

    public async shell(command: string): Promise<{ stdout: string, stderr: string }> {
        const start = Date.now();
        const shellCommand = `adb shell "${command}"`;
        const result = await exec$(shellCommand);
        logger.silly(`ADB: (${Date.now() - start}) ${shellCommand}`);
        return result;
    }

    public async getApiLevel(): Promise<number> {
        const {stdout} = await this.shell('getprop ro.build.version.sdk');
        return Number.parseInt(stdout.trim());
    }

    // public async appIsRunning(appName: string): Promise<boolean> {
    //     const {stdout} = await this.shell(`pidof ${appName}`);
    //     return /[0-9]+/.test(stdout.trim());
    // }

    public async startApp(appName: string) {
        return await this.shell(`monkey -p ${appName} 1`);
    }

    public async paste() {
        return await this.keyevent(279);
    }

    public async back() {
        return await this.keyevent(4);
    }

    public async install(apkPath: string) {
        return await exec$(`adb install ${apkPath}`);
    }

    public async uninstall(packageName: string) {
        return await exec$(`adb uninstall ${packageName}`);
    }

    public async isInstalled(packageName: string): Promise<boolean> {
        const {stdout} = await this.shell(`cmd package list packages ${packageName}`);
        return stdout.includes(packageName);
    }

    private async keyevent(key: number) {
        return await this.shell(`input keyevent ${key}`);
    }
}

export default new ADB();
