export type FlavorId = 'original' | 'baunilha' | 'caramelo' | 'mocha'

export type IngredientKind = 'bean' | 'vanilla' | 'caramel' | 'chocolate'

/** Colors the whole page takes while a flavor is active. All pairs are WCAG AA. */
export type PageTheme = {
  bg: string
  fg: string
  muted: string
  /** Large text, icons and button fills only (may be below 4.5:1 on `bg`). */
  accent: string
  /** Text placed on top of `accent`. */
  accentInk: string
}

export type Flavor = {
  id: FlavorId
  name: string
  description: string
  notes: readonly string[]
  primary: string
  secondary: string
  theme: PageTheme
  /** Colors used when painting the can label. */
  label: { top: string; bottom: string; ink: string; accent: string }
  ingredient: IngredientKind
}

export const FLAVORS: readonly Flavor[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'Cold brew puro, sem nada no caminho. Notas de cacau e castanhas, com final limpo.',
    notes: ['Cacau', 'Castanhas', 'Final limpo'],
    primary: '#2B1B12',
    secondary: '#C8873A',
    theme: { bg: '#2B1B12', fg: '#F3E6D3', muted: '#B09A84', accent: '#C8873A', accentInk: '#0E0A08' },
    label: { top: '#34211A', bottom: '#150C07', ink: '#F3E6D3', accent: '#C8873A' },
    ingredient: 'bean',
  },
  {
    id: 'baunilha',
    name: 'Baunilha',
    description: 'Um toque de baunilha natural que deixa cada gole mais macio e aveludado.',
    notes: ['Baunilha', 'Creme', 'Aveludado'],
    primary: '#E9D8B4',
    secondary: '#7A5C3A',
    theme: { bg: '#E9D8B4', fg: '#2B1B12', muted: '#5E4526', accent: '#7A5C3A', accentInk: '#FFF8EC' },
    label: { top: '#F0E2C2', bottom: '#D6BE8E', ink: '#2B1B12', accent: '#7A5C3A' },
    ingredient: 'vanilla',
  },
  {
    id: 'caramelo',
    name: 'Caramelo',
    description: 'Caramelo tostado na medida certa: doce no aroma, equilibrado no gole.',
    notes: ['Caramelo', 'Toffee', 'Tostado'],
    primary: '#B4672A',
    secondary: '#F3E6D3',
    theme: { bg: '#B4672A', fg: '#0E0A08', muted: '#0E0A08', accent: '#F3E6D3', accentInk: '#0E0A08' },
    label: { top: '#C47632', bottom: '#8A4817', ink: '#F3E6D3', accent: '#2B1B12' },
    ingredient: 'caramel',
  },
  {
    id: 'mocha',
    name: 'Mocha',
    description: 'Cold brew com cacau intenso. Uma sobremesa em órbita baixa.',
    notes: ['Cacau 70%', 'Avelã', 'Intenso'],
    primary: '#3A2320',
    secondary: '#D9A7A0',
    theme: { bg: '#3A2320', fg: '#F3E6D3', muted: '#B39A93', accent: '#D9A7A0', accentInk: '#3A2320' },
    label: { top: '#47292A', bottom: '#1F1110', ink: '#F3E6D3', accent: '#D9A7A0' },
    ingredient: 'chocolate',
  },
]
