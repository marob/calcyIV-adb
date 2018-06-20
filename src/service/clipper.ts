import adb from './adb';
import logger from '../logger';

const APK_PATH = 'resources/clipper.apk';
const PACKAGE_NAME = 'ca.zgrs.clipper';

class Clipper {
    public static async install() {
        logger.debug(`Installing ${APK_PATH} to device...`);
        const result = await adb.install(APK_PATH);
        logger.debug(`${APK_PATH} installed!`);
        return result;
    }

    public static async uninstall() {
        return await adb.uninstall(PACKAGE_NAME);
    }

    public static async isInstalled(): Promise<boolean> {
        return await adb.isInstalled(PACKAGE_NAME);
    }

    public static async start() {
        return await adb.shell(`am startservice ${PACKAGE_NAME}/.ClipboardService`);
    }

    public static async get(): Promise<string> {
        const {stdout} = await adb.shell('am broadcast -a clipper.get');
        return /data="(.*)"/.exec(stdout)[1];
    }

    public static async set(value: string) {
        const escapedValue = value.replace('&', '\\\&');
        return await adb.shell(`am broadcast -a clipper.set -e text '${escapedValue}'`);
    }

}

export default Clipper;
