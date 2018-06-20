import Button from '../button';
import Screen from './screen';

class PokemonListScreen extends Screen {
    constructor(
        public searchButton: Button,
        public firstPokemon: Button,
    ) {
        super();
    }
}

export default PokemonListScreen;
