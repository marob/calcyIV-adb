import Button from '../button';
import Screen from './screen';

class HomeScreen extends Screen {
    constructor(
        public mainButton: Button,
    ) {
        super();
    }
}

export default HomeScreen;
