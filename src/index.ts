import adb from './service/adb';
import CalcyIV from './service/calcyIV';
import Pogo from './service/pogo';

import * as program from 'commander';
import HomeScreen from './dto/screen/homeScreen';
import NavigationScreen from './dto/screen/navigationScreen';
import PokemonDetailScreen from './dto/screen/pokemonDetailScreen';
import PokemonListScreen from './dto/screen/pokemonListScreen';
import Screen from './dto/screen/screen';
import logger from './logger';
import Clipper from './service/clipper';
import TimeUtils from './utils/timeUtils';

program
    .version('0.1.0')
    .option('-s, --serial [serial]', 'use device with given serial')
    .option('--log-screenshot', 'log screenshots (for debug purpose)')
    .parse(process.argv);

process.env.LOG_SCREENSHOT = program.logScreenshot;

async function ivCheck() {
    await selectDevice();

    const apiLevel = await adb.getApiLevel();
    const pasteCapability = apiLevel >= 24;
    if (!pasteCapability) {
        logger.error(`Your device uses an outdated version of Android.
         It will not be able to paste IVs in pokemon name!`);
    }

    await initClipper();

    await CalcyIV.startIfNotRunning();
    const calcyIVButton = await CalcyIV.findButton();

    restrictInteractionToPokemonGO();

    let currentScreen: Screen;
    do {
        currentScreen = await Pogo.getCurrentScreen();

        if (currentScreen instanceof HomeScreen) {
            await (currentScreen as HomeScreen).mainButton.click();
            await TimeUtils.wait(500);
        } else if (currentScreen instanceof NavigationScreen) {
            await (currentScreen as NavigationScreen).pokemonButton.click();
            await TimeUtils.wait(1000);
        } else if (currentScreen instanceof PokemonListScreen) {
            await (currentScreen as PokemonListScreen).firstPokemon.click();
            await TimeUtils.wait(500);
        } else if (!(currentScreen instanceof PokemonDetailScreen)) {
            logger.debug('Other screen');
            await currentScreen.back();
            await TimeUtils.wait(500);
        }
    } while (!(currentScreen instanceof PokemonDetailScreen));

    const pokemonDetailScreen = currentScreen;

    while (true) {
        await calcyIVButton.click();
        const outputStatus = await CalcyIV.outputStatus();
        if (outputStatus.isOk) {
            logger.debug(outputStatus.clipboard);

            const ivFromToRegex = '[0-9]+-([0-9]+)';
            const ivCombApproxRegex = '[\u{24FF}\u{2776}-\u{277F}\u{24EB}-\u{24EF}]+';
            const impreciseIvRegex = new RegExp(`${ivFromToRegex}|${ivCombApproxRegex}`, 'u');
            const impreciseIv = impreciseIvRegex.exec(outputStatus.clipboard);
            if (impreciseIv && (!impreciseIv[1] || Number.parseInt(impreciseIv[1]) > 90)) {
                logger.debug('TODO: should appraise!');
            }

            if (pokemonDetailScreen.renameButton.coordinates[1] >= outputStatus.coordinates[1]) {
                await TimeUtils.wait(150);
                await outputStatus.click();
                await TimeUtils.wait(300);
            } else {
                await outputStatus.click();
            }

            if (pasteCapability) {
                await pokemonDetailScreen.renameButton.click();
                await adb.paste();
                await Pogo.hideKeyboard();
                await Pogo.clickOkOnRenameDialog();
                await TimeUtils.wait(600);
            }

            await Pogo.nextPokemon();
            await TimeUtils.wait(100);
        }
    }
}

async function selectDevice() {
    const devices = await adb.devices();
    if (!devices.length) {
        logger.error('No connected device! Please connect your device.');
        process.exit(1);
    }
    if (devices.length > 1 && !program.serial) {
        logger.error(`There are several devices. Please provide the targeted device serial with "-s SERIAL" option.
Available device serials: \n  - ${devices.join('\n  - ')}`);
        process.exit(1);
    }
    process.env.ANDROID_SERIAL = program.serial ? program.serial : devices[0];
}

async function initClipper() {
    if (!await Clipper.isInstalled()) {
        await Clipper.install();
    }
    await Clipper.start();
}

function restrictInteractionToPokemonGO() {
    setInterval(async () => {
        const focusedApp = await adb.getFocusedApp();
        if (/com.nianticlabs.pokemongo/.test(focusedApp)) {
            adb.resume();
        } else {
            adb.pause();
        }
    }, 500);
}

ivCheck();
