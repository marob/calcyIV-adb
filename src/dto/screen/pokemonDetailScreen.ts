import Button from '../button';
import Screen from './screen';

class PokemonDetailScreen extends Screen {
    constructor(
        public renameButton: Button,
    ) {
        super();
    }
}

export default PokemonDetailScreen;
