import adb from '../service/adb';

abstract class Clickable {
    constructor(public coordinates: [number, number]) {
    }

    public async click() {
        if (this.coordinates) {
            return await adb.tap(this.coordinates);
        }
    }
}

export default Clickable;
