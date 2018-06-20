import Clickable from './clickable';

class OutputStatus extends Clickable {
    constructor(
        public isOk: boolean,
        public clipboard?: string,
        coordinates?: [number, number],
    ) {
        super(coordinates);
    }
}

export default OutputStatus;
