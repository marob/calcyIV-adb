import Button from '../button';
import Screen from './screen';

class NavigationScreen extends Screen {
    constructor(public backButton: Button,
                public pokemonButton: Button,
                public objectButton: Button,
                public boutiqueButton: Button,
                public pokedexButton: Button) {
        super();
    }
}

export default NavigationScreen;
