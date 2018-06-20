import adb from '../../service/adb';

export default abstract class Screen {
    public back() {
        return adb.back();
    }
}
