import Button from '../dto/button';
import HomeScreen from '../dto/screen/homeScreen';
import NavigationScreen from '../dto/screen/navigationScreen';
import PokemonDetailScreen from '../dto/screen/pokemonDetailScreen';
import PokemonListScreen from '../dto/screen/pokemonListScreen';
import Screen from '../dto/screen/screen';
import UnknownScreen from '../dto/screen/unknownScreen';
import logger from '../logger';
import ColorUtils from '../utils/colorUtils';
import ImageUtils from '../utils/imageUtils';
import adb from './adb';

abstract class Pogo {
    public static async getCurrentScreen(): Promise<Screen> {
        const image = await adb.screenshot();
        return Pogo.getHomeScreen(image)
            || Pogo.getNavigationButtonsScreen(image)
            || Pogo.getPokemonListScreen(image)
            || Pogo.getPokemonDetailScreen(image)
            || new UnknownScreen();
    }

    public static async hideKeyboard() {
        const screenSize = await adb.screenSize();
        return await adb.tap([
            Math.round(.5 * screenSize.width),
            Math.round(.1 * screenSize.height)
        ]);
    }

    public static async clickOkOnRenameDialog() {
        const screenSize = await adb.screenSize();
        return await adb.tap([
            Math.round(.5 * screenSize.width),
            Math.round(.5135 * screenSize.height)
        ]);
    }

    public static async nextPokemon() {
        const screenSize = await adb.screenSize();
        return await adb.tap([
            Math.round(.90 * screenSize.width),
            Math.round(.15 * screenSize.height)
        ]);
    }

    private static getHomeScreen(image: Jimp.Jimp): HomeScreen {
        const {width, height} = image.bitmap;

        const grey = 0xb9b9b9ff;
        const white = 0xffffffff;
        const red = 0xff3945ff;
        const mainButtonColors = [white, grey, red];

        // const darkGreen = 0x1c8796ff;
        // const darkGreenButtonColors = [
        //     darkGreen,
        //     { h: { min: 160, max: 170 } },
        //     darkGreen
        // ];
        // const lightGreenButtonColors = [
        //     { l: { min: 54, max: 60 } },
        //     { l: { min: 92, max: 98 } },
        //     { l: { min: 49, max: 55 } },
        // ];

        const c = Math.round(width / 2);
        const heightMin = Math.round(.80 * height);
        let mainButtonL;
        for (let l = height - 1; l > heightMin; l--) {
            const pixelColor = image.getPixelColor(c, l);

            if (ColorUtils.matches(mainButtonColors[0], pixelColor)) {
                mainButtonColors.shift();
                if (ColorUtils.matches(grey, pixelColor)) {
                    mainButtonL = l;
                }
                if (mainButtonColors.length === 0) {
                    const homeScreen = new HomeScreen(new Button([c, mainButtonL]));
                    logger.debug(`Home screen: ${JSON.stringify(homeScreen)}`);
                    return homeScreen;
                }
            }

            // if (ColorUtils.matches(darkGreenButtonColors[0], pixelColor)) {
            //     darkGreenButtonColors.shift();
            //     if (darkGreenButtonColors.length === 0) {
            //         return new Button([c, l], 'DarkGreen');
            //     }
            // }

            // if (ColorUtils.matches(lightGreenButtonColors[0], pixelColor)) {
            //     lightGreenButtonColors.shift();
            //     if (lightGreenButtonColors.length === 0) {
            //         return new Button([c, l], 'LightGreen');
            //     }
            // }
        }

        return null;
    }

    private static getNavigationButtonsScreen(image: Jimp.Jimp): NavigationScreen {
        const {width, height} = image.bitmap;

        const buttonColor = {
            a: {min: -8, max: -3},
            b: {min: 3, max: 7},
            l: {min: 97, max: 100},
        };

        const center = Math.round(width / 2);
        const left = Math.round(.22 * width);
        const right = Math.round((1 - .22) * width);

        let backButton: Button;
        let pokemonButton: Button;
        let objectButton: Button;
        let boutiqueButton: Button;
        let pokedexButton: Button;

        const heightMin = Math.round(.30 * height);
        for (let l = height - 1; l > heightMin; l--) {
            if (!backButton) {
                if (ColorUtils.matches(buttonColor, image.getPixelColor(center, l))) {
                    backButton = new Button([center, l]);
                }
            } else if (!pokemonButton || !objectButton) {
                if (!pokemonButton) {
                    if (ColorUtils.matches(buttonColor, image.getPixelColor(left, l))) {
                        pokemonButton = new Button([left, l]);
                    }
                }
                if (!objectButton) {
                    if (ColorUtils.matches(buttonColor, image.getPixelColor(right, l))) {
                        objectButton = new Button([right, l]);
                    }
                }
            } else if (!boutiqueButton) {
                if (ColorUtils.matches(buttonColor, image.getPixelColor(center, l))) {
                    boutiqueButton = new Button([center, l]);
                    l -= Math.round(.12 * height);
                }
            } else if (!pokedexButton) {
                if (ColorUtils.matches(buttonColor, image.getPixelColor(center, l))) {
                    pokedexButton = new Button([center, l]);
                    break;
                }
            }
        }

        if (backButton != null &&
            pokemonButton != null &&
            objectButton != null &&
            boutiqueButton != null &&
            pokedexButton != null) {
            const navigationScreen = new NavigationScreen(
                backButton,
                pokemonButton,
                objectButton,
                boutiqueButton,
                pokedexButton,
            );
            logger.debug(`Navigation screen: ${JSON.stringify(navigationScreen)}`);
            return navigationScreen;
        }

        return null;
    }

    private static getPokemonListScreen(image: Jimp.Jimp): PokemonListScreen {
        const searchButtonCoords = ImageUtils.findContinuousPixelsOfColorOnLine(
            image,
            {l: {min: 37, max: 41}, a: {min: -17, max: -13}, b: {min: -21, max: -17}},
            6,
            [.82, .95, .10, .20],
        );
        const firstPokemonCoords = ImageUtils.findFirst(
            image,
            0x44696cff,
            [0.05, 0.35, .15, .30],
        );

        if (searchButtonCoords && firstPokemonCoords) {
            const pokemonListScreen = new PokemonListScreen(
                new Button(searchButtonCoords),
                new Button(firstPokemonCoords),
            );
            logger.debug(`Pokemon list screen: ${JSON.stringify(pokemonListScreen)}`);
            return pokemonListScreen;
        }

        return null;
    }

    private static getPokemonDetailScreen(image: Jimp.Jimp): PokemonDetailScreen {
        const renameButtonCoords = ImageUtils.findContinuousPixelsOfColorOnLine(
            image,
            0xd9d9d9ff,
            4,
            [.50, .90, .20, .50],
        );

        if (renameButtonCoords) {
            // Always click at the center of the screen in order not to depend on the pokemon name length
            const renameButton = new Button([Math.round(image.bitmap.width / 2), renameButtonCoords[1]]);
            const pokemonDetailScreen = new PokemonDetailScreen(renameButton);
            logger.debug(`Pokemon detail screen: ${JSON.stringify(pokemonDetailScreen)}`);
            return pokemonDetailScreen;
        }

        return null;
    }
}

export default Pogo;
