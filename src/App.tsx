import { useEffect, useState, Suspense } from 'react'

// The names of the pokemon to fetch from the external API
const POKEMON_NAMES = [
  'bulbasaur',
  'squirtle',
  'pidgey',
  'rattata',
  'pikachu',
  'jigglypuff',
]

// Relevant TS type for the raw pokemon data from the external API
type RawPokemon = {
  id: number
  name: string
  abilities: Array<{
    is_hidden: boolean
    ability: {
      name: string // ex: 'overgrow'
    }
  }>
  sprites: {
    other: {
      'official-artwork': {
        front_default: string // imageUrl
      }
    }
  }
  stats: Array<{
    base_stat: number
    stat: {
      name: string // ex: 'hp'
    }
  }>
}

// documentation available at: https://pokeapi.co
const fetchPokemonByName = (name: string) =>
  fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then((response) => {
    if (!response.ok) {
      throw new Error(`Network error occurred when fetching pokemon '${name}'`)
    }

    return response.json() as Promise<RawPokemon>
  })

// TS type for the transformed pokemon data
type Pokemon = {
  id: number
  name: string
  hp: number
  // string array of ability names where `is_hidden` is `false`
  visibleAbilityNames: Array<string>
  imageUrl: string
}

// TS type for the transformed and "caught" pokemon data that will be stored
// in state
type CaughtPokemon = Pokemon & {
  caught: true
}

const getHp = (stats: Array<{
  base_stat: number
  stat: {
    name: string // ex: 'hp'
  }
}>): number => {
  const stat = stats.find((stat) => stat.stat.name === 'hp')
  if(stat) {
    return stat.base_stat
  }
  return 0
}

const getVisibleAbilities = (abilities: Array<{
  is_hidden: boolean
  ability: {
    name: string // ex: 'overgrow'
  }
}>): Array<string> => {
  const visibles = abilities.filter((ability) => ability.is_hidden === true)
  const result = visibles.map((visible) => visible.ability.name) 
  return result
 } 

// use this function to transform the data from RawPokemon -> Pokemon
const pokemonFromRawPokemon = (rawPokemon: RawPokemon) => {
  const image = rawPokemon.sprites.other['official-artwork'].front_default ?? ""

  const pokemon: Pokemon = {
    id: rawPokemon.id,
    name: rawPokemon.name,
    hp: getHp(rawPokemon.stats),
    visibleAbilityNames: getVisibleAbilities(rawPokemon.abilities),
    imageUrl: image
  }

  return pokemon
}

// use this function to "catch" the transformed `Pokemon` by adding the `caught`
// property
const caughtPokemonFromPokemon = (transformedPokemon: Pokemon): CaughtPokemon => {
  const caughtPokemon: CaughtPokemon = {
    ...transformedPokemon,
    caught: true
  }
  return caughtPokemon
}

const Pokemon = ({ pokemon }: { pokemon: CaughtPokemon }): JSX.Element => (
  <div style={{ background: 'white', margin: '10px', padding: '10px', borderRadius: '5px', position: "relative", display: 'flex', flexWrap: 'wrap', justifyContent: "space-around"}}>
    <div style={{ background: '#232D49', color: 'white', width: "fit-content", padding: '2px 4px', position: 'absolute', top: '0', right: '0', borderTopRightRadius: '5px' }}>{pokemon.hp}</div>
    <div>
      <img src={pokemon.imageUrl} width={"100px"} alt={pokemon.name} />
    </div>
    <div>
      <h2 style={{ color: '232D49', fontSize: '16px', fontWeight: 'bold', marginBottom: '1px' }}>{pokemon.name}</h2>
      <p style={{ color: '232D49', fontSize: '12px', marginBottom: '7px' }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      {pokemon.visibleAbilityNames.map((ability) => (
        <div style={{ background: '#232D49', color: 'white', width: "fit-content", padding: '2px 4px', borderRadius: '3px', fontSize: '9px', fontWeight: "bold" }}>{ability}</div>
      ))}
    </div>
  </div>
)

const PokemonList = ({ pokemons }: { pokemons: Array<CaughtPokemon> }) => (
  <>
   {pokemons.map((pokemon) => (
      <Pokemon key={pokemon.id} {...{pokemon}} />     
    ))}
  </>
)
  

export const App = () => {
  const [pokemon, setPokemon] = useState<Array<CaughtPokemon>>([])

  useEffect(() => {
    const promises = POKEMON_NAMES.map(fetchPokemonByName)

    Promise
      .all(promises)
      .then((response) => 
        response.map(pokemonFromRawPokemon))
      .then((newPokemons) => 
        newPokemons.map(caughtPokemonFromPokemon)
      )
      .then((caughtPokemons) => {
        setPokemon((currentPokemons) => [
          ...currentPokemons,
          ...caughtPokemons
        ])
      })
  }, [])

  // blurb / filler content
  // Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  return <div>
    <h1 style={{ color: '232D49', fontSize: '16px', fontWeight: 'bold', padding: '3px' }}>Pokemon ({pokemon.length})</h1>
    <Suspense fallback={<p>...Loading</p>}>
      <PokemonList pokemons={pokemon} />
    </Suspense>
    </div>
}

export default App
