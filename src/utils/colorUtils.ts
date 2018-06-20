import * as convert from 'color-convert';
import * as conversions from 'color-convert/conversions';

interface IminMax {
    min: number;
    max: number;
}

export type ExpectedColor = number | {
    l?: IminMax,
    a?: IminMax,
    b?: IminMax,
    h?: IminMax,
    s?: IminMax,
    v?: IminMax,
};

class ColorUtils {
    public static matches(expected: ExpectedColor, hexColorNumber: number) {
        const hexColor: conversions.HEX = hexColorNumber.toString(16);
        if (typeof expected === 'object') {
            if (expected.h || expected.s || expected.v) {
                const [h, s, v] = convert.hex.hsv(hexColor);
                return (
                    !expected.h || (
                        h >= expected.h.min
                        && h <= expected.h.max
                    )
                ) && (
                    !expected.s || (
                        s >= expected.s.min
                        && s <= expected.s.max
                    )
                ) && (
                    !expected.v || (
                        v >= expected.v.min
                        && v <= expected.v.max
                    )
                )
                    ;
            }
            if (expected.l || expected.a || expected.b) {
                const [l, a, b] = convert.hex.lab(hexColor);
                return (
                    !expected.l || (
                        l >= expected.l.min
                        && l <= expected.l.max
                    )
                ) && (
                    !expected.a || (
                        a >= expected.a.min
                        && a <= expected.a.max
                    )
                ) && (
                    !expected.b || (
                        b >= expected.b.min
                        && b <= expected.b.max
                    )
                )
                    ;
            }
        } else {
            return expected === hexColorNumber;
        }
    }
}

export default ColorUtils;
