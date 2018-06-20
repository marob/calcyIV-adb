import Button from '../dto/button';
import DumpSysWindow from '../dto/dumpSysWindow';
import OutputStatus from '../dto/outputStatus';
import logger from '../logger';
import adb from './adb';
import Clipper from './clipper';

class CalcyIV {
    public static async startIfNotRunning() {
        let started = false;
        let startInProgress = false;
        let manualStartTimeout = null;
        do {
            try {
                await this.findButton();
                started = true;
                clearTimeout(manualStartTimeout);
                logger.debug('CalcyIV started!');
            } catch {
                if (!startInProgress) {
                    startInProgress = true;
                    logger.debug('CalcyIV is not running: starting CalcyIV...');
                    manualStartTimeout = setTimeout(() => {
                        logger.debug('Please, click on the "start" and "switch to game" buttons ' +
                            'if you haven\'t enabled auto-start');
                    }, 5000);
                    await adb.startApp(this.APP_NAME);
                }
            }
        } while (!started);
    }

    public static async findButton(): Promise<Button> {
        const windows = (await this.calcyIVWindows())
            // There are several CalcyIV windows:
            // - the CalcyIV button is "square"
            // - it is bigger than the red dot when scanning
                .filter((w) => w.width === w.height && w.width > 30)
        ;

        if (windows.length === 1) {
            const window = windows[0];
            return new Button(window.center);
        } else {
            throw new Error(`Couldn't find CalcyIV button: ${windows}`);
        }
    }

    // static async isRedDotDisplayed() {
    //     return (await this.calcyIVWindows())
    //         .filter(w => w.displayed)
    //         .filter(w => w.width === w.height && w.width <= 30)
    //         .length === 1
    //         ;
    // }

    public static async outputStatus(): Promise<OutputStatus> {
        const start = Date.now();
        const screenWidth = (await adb.screenSize()).width;
        const scanTimeout = 1500;
        while (Date.now() - start < scanTimeout) {
            const windowsPromise = this.calcyIVWindows();
            const clipboardPromise = Clipper.get();

            const windows = await windowsPromise;
            const displayedWindows = windows.filter((w) => w.displayed);

            const hasRedDot = displayedWindows.filter((w) => w.width === w.height && w.width <= 30).length === 1;
            const hasCalcyIvButton = displayedWindows.filter((w) => w.width === w.height && w.width > 30).length === 1;
            const notTooWideOverlays = displayedWindows.filter(
                (w) => w.width !== w.height && w.width / screenWidth < 0.8
            );
            const hasIvOverlay = notTooWideOverlays.length === 1;

            if (displayedWindows.length === 3
                && hasRedDot
                && hasCalcyIvButton
                && hasIvOverlay
            ) {
                const clipboard = await clipboardPromise;
                if (clipboard.length > 0) {
                    Clipper.set('');
                    const ivOverlay = notTooWideOverlays[0];
                    return new OutputStatus(true, clipboard, ivOverlay.center);
                }
            }
            if (displayedWindows.length > 3) {
                return new OutputStatus(false);
            }
        }
        logger.debug('Timeout');
        return new OutputStatus(false);
    }

    // static async outputStatus(): Promise<OutputStatus> {
    //     const start = Date.now();
    //     while (!await this.isRedDotDisplayed() && Date.now() - start < 2000) {
    //     }
    //     await TimeUtils.wait(100);
    //     // Color (grey-blue) of the CalcyIV overlay border
    //     const overlayBorderColor = 0x44696cff;
    //     // Color (grey) of the CalcyIV error overlay
    //     const errorOverlayColor = 0x848484ff;
    //     const image = await adb.screenshot();

    //     // Threshold over which the number of matching pixels in one line is considered as the CalcyIV overlay bottom border
    //     const nbMatchingPixelsThreshold = 0.50 * image.bitmap.width;

    //     const y = await ImageUtils.findLineWithEnoughPixelsOfColor(image, overlayBorderColor, nbMatchingPixelsThreshold);
    //     if (y != null) {
    //         // FIXME: return y as well?
    //         return new OutputStatus([Math.round(image.bitmap.width) / 2, y], true, image);
    //     }

    //     if (await ImageUtils.findLineWithEnoughPixelsOfColor(image, errorOverlayColor, nbMatchingPixelsThreshold) != null) {
    //         return new OutputStatus(null, false, image);
    //     }
    //     return new OutputStatus(null, false, image);
    // }

    private static APP_NAME = 'tesmath.calcy';

    private static async calcyIVWindows(): Promise<DumpSysWindow[]> {
        const exprToMatch = ['Window #', 'mHasSurface', 'mFrame='];
        const {stdout} = await adb.shell([
            'dumpsys window windows',
            ` | grep -E '${exprToMatch.join('|')}'`,
            ` | grep '${this.APP_NAME}}' -A2`,
        ].join(''));

        return stdout
            .trim()
            .split('\n')
            .reduce((acc, line, i) => {
                if (i % exprToMatch.length === 0) {
                    const match = /\{([^ ]+)/.exec(line);
                    if (match) {
                        const windowId = match[1];
                        acc.push(new DumpSysWindow(windowId));
                    } else {
                        logger.error('Couldn\'t find window id:', line);
                    }
                }
                const o = acc[Math.floor(i / exprToMatch.length)];
                if (i % exprToMatch.length === 1) {
                    const match = /mHasSurface=(true|false)/.exec(line);
                    o.displayed = JSON.parse(match[1]);
                }
                if (i % exprToMatch.length === 2) {
                    const match = /mFrame=\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/.exec(line);
                    o.left = Number.parseInt(match[1]);
                    o.top = Number.parseInt(match[2]);
                    o.right = Number.parseInt(match[3]);
                    o.bottom = Number.parseInt(match[4]);
                }
                return acc;
            }, [])
            ;
    }

}

export default CalcyIV;
