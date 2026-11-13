export const STEPS = [
  {
    id: 'bean',
    title: 'Grão',
    description: 'Arábica de altitude, torra média, selecionado lote a lote.',
  },
  {
    id: 'grind',
    title: 'Moagem',
    description: 'Moído grosso minutos antes da extração, para preservar cada aroma.',
  },
  {
    id: 'brew',
    title: 'Extração 12h',
    description: 'Doze horas em água fria. Sem calor, sem pressa, sem amargor.',
  },
  {
    id: 'can',
    title: 'Envase',
    description: 'Direto para a lata, selada a frio para chegar intacta até você.',
  },
] as const

export type StepId = (typeof STEPS)[number]['id']
