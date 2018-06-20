class DumpSysWindow {
    public id: string;
    public top: number;
    public right: number;
    public bottom: number;
    public left: number;
    public displayed: boolean;

    constructor(id: string) {
        this.id = id;
    }

    get height(): number {
        return this.bottom - this.top;
    }
    get width(): number {
        return this.right - this.left;
    }
    get center(): [number, number] {
        return [
            Math.round((this.left + this.right) / 2),
            Math.round((this.top + this.bottom) / 2),
        ];
    }
}

export default DumpSysWindow;
