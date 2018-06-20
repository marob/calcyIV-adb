class TimeUtils {
    public static async wait(ms): Promise<any> {
        return new Promise((r, j) => setTimeout(r, ms));
    }
}

export default TimeUtils;
