import { Marquee } from '../components/Marquee'
import { useReducedMotion } from '../lib/useReducedMotion'

/** Deliberately fictional quotes: no real names, no real customers. */
const TESTIMONIALS = [
  { quote: 'Acordei em outra órbita', emoji: '🚀', author: 'Astronauta de home office' },
  { quote: 'Gelado como o lado escuro da Lua', emoji: '🧊', author: 'Tripulante nº 7' },
  { quote: 'Meu combustível oficial de segunda-feira', emoji: '⛽', author: 'Cadete imaginária' },
  { quote: 'Zero açúcar, gravidade zero', emoji: '✨', author: 'Cliente que não existe' },
  { quote: 'Tomei um gole e vi a Via Láctea', emoji: '🌌', author: 'Passageiro da classe econômica' },
  { quote: 'Mais suave que um pouso lunar', emoji: '🌙', author: 'Comandante inventada' },
  { quote: 'Cremoso de outro planeta', emoji: '👽', author: 'Visitante de Marte' },
  { quote: 'Doze horas de extração, doze segundos para acabar', emoji: '☕', author: 'Persona de teste' },
]

const ROWS = [TESTIMONIALS.slice(0, 4), TESTIMONIALS.slice(4)]

export function Testimonials() {
  const reducedMotion = useReducedMotion()

  return (
    <section
      id="relatos"
      data-theme="surface"
      aria-labelledby="relatos-title"
      className="relative py-24 md:py-36"
    >
      <div className="mb-12 px-5 md:mb-20 md:px-10">
        <p className="eyebrow mb-5 text-ink-muted">Relatos da tripulação</p>
        <h2 id="relatos-title" className="display text-5xl md:text-8xl">
          Quem provou, decolou
        </h2>
      </div>

      {reducedMotion ? (
        // No ticker: every quote is laid out in a plain grid instead.
        <ul className="grid gap-x-10 gap-y-10 px-5 md:grid-cols-2 md:px-10">
          {TESTIMONIALS.map((item) => (
            <li key={item.quote}>
              <figure>
                <blockquote className="display text-3xl leading-[1.05] md:text-5xl">
                  “{item.quote}” <span aria-hidden="true">{item.emoji}</span>
                </blockquote>
                <figcaption className="eyebrow mt-4 text-ink-muted">{item.author}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-6 md:gap-10">
          {ROWS.map((row, index) => (
            <Marquee
              key={index}
              direction={index % 2 === 0 ? 1 : -1}
              label={`Depoimentos fictícios, linha ${index + 1}`}
            >
              {row.map((item) => (
                <li key={item.quote} className="flex shrink-0 items-center gap-5 pr-10 md:gap-8 md:pr-16">
                  <figure className="flex items-baseline gap-4 md:gap-6">
                    <blockquote className="display text-5xl whitespace-nowrap md:text-8xl">
                      “{item.quote}”
                    </blockquote>
                    <figcaption className="eyebrow whitespace-nowrap text-ink-muted">
                      {item.author}
                    </figcaption>
                  </figure>
                  <span aria-hidden="true" className="text-4xl md:text-6xl">
                    {item.emoji}
                  </span>
                </li>
              ))}
            </Marquee>
          ))}
        </div>
      )}

      <p className="mt-12 px-5 text-sm text-ink-muted md:mt-16 md:px-10">
        Depoimentos 100% fictícios, de clientes imaginários.
      </p>
    </section>
  )
}
