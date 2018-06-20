import adb from '../../service/adb';
import Screen from './screen';

export default class UnknownScreen extends Screen {
    public back() {
        return adb.back();
    }
}
