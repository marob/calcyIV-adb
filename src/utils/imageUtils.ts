import * as Jimp from 'jimp';
import {default as ColorUtils, ExpectedColor} from './colorUtils';

class ImageUtils {
    // /**
    //  * It assumes the searched (horizontal) line has a pixel of the searched color at the center.
    //  * It starts the search from the bottom of the screen.
    //  * @param image
    //  * @param colorToMatch
    //  * @param nbMatchingPixelsThreshold
    //  */
    // static findLineWithEnoughPixelsOfColor(
    //     image: Jimp,
    //     colorToMatch: number,
    //     nbMatchingPixelsThreshold: number
    // ): number {
    //     const { width, height } = image.bitmap;

    //     const centerX = Math.round(width / 2);
    //     for (let y = height - 1; y >= 0; y--) {
    //         // Only check the pixel at the center of the current line
    //         if (image.getPixelColor(centerX, y) === colorToMatch) {
    //             let nbMatchingPixels = 0
    //             // Check other pixels of the line by alternating on each side of the center
    //             for (let i = 0; i < width; i++) {
    //                 // Example for centerX=10: x values are (11, 9, 12, 8, 13, ...)
    //                 const x = (i % 2 == 1) ? centerX + Math.round((i + 1) / 2) : centerX - Math.round(i / 2);
    //                 const pixel = image.getPixelColor(x, y);
    //                 nbMatchingPixels += (pixel === colorToMatch) ? 1 : 0;
    //                 if (nbMatchingPixels > nbMatchingPixelsThreshold) {
    //                     return y;
    //                 }
    //             }
    //         }
    //     }
    //     return null;
    // }

    public static findContinuousPixelsOfColorOnLine(
        image: Jimp,
        colorToMatch: ExpectedColor,
        nbMatchingPixelsThreshold: number,
        bounds: [number, number, number, number] = [0, 1, 0, 1],
    ): [number, number] {
        const {width, height} = image.bitmap;

        const minX = Math.round(bounds[0] * width);
        const maxX = Math.round(bounds[1] * width);
        const minY = Math.round(bounds[2] * height);
        const maxY = Math.round(bounds[3] * height);
        for (let y = minY; y < maxY; y++) {
            let nbMatchingPixels = 0;

            for (let x = minX; x < maxX; x++) {
                const pixel = image.getPixelColor(x, y);
                nbMatchingPixels += ColorUtils.matches(colorToMatch, pixel) ? 1 : 0;
                if (nbMatchingPixels > nbMatchingPixelsThreshold) {
                    return [x, y];
                }
            }
        }
        return null;
    }

    public static findFirst(
        image: Jimp,
        colorToMatch: ExpectedColor,
        bounds: [number, number, number, number] = [0, 1, 0, 1],
    ): [number, number] {
        const {width, height} = image.bitmap;

        const minX = Math.round(bounds[0] * width);
        const maxX = Math.round(bounds[1] * width);
        const minY = Math.round(bounds[2] * height);
        const maxY = Math.round(bounds[3] * height);
        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                const pixel = image.getPixelColor(x, y);
                if (ColorUtils.matches(colorToMatch, pixel)) {
                    return [x, y];
                }
            }
        }
        return null;
    }
}

export default ImageUtils;
