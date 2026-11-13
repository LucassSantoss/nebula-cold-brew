import { canAnchorRef } from '../lib/canAnchors'

const canAnchor = canAnchorRef('hero')

const SPECS = ['269 ml', '0g açúcar', '100% arábica']

export function Hero() {
  return (
    <section
      id="top"
      data-3d
      aria-labelledby="top-title"
      className="relative flex min-h-svh flex-col overflow-clip px-5 pt-24 pb-8 md:px-10 md:pt-28 md:pb-10"
    >
      {/*
        Mobile: three centered lines above the can.
        Desktop: two rows split around the can, which sits in the column gap.
      */}
      <h1
        id="top-title"
        aria-label="Café gelado de outra galáxia"
        className="display flex flex-wrap justify-center gap-x-[0.22em] text-[15.5vw] leading-[1.18] md:absolute md:inset-x-10 md:top-1/2 md:grid md:-translate-y-[54%] md:grid-cols-2 md:gap-x-[calc(64svh*0.4115+7vw)] md:text-[clamp(4rem,8.8vw,11rem)]"
      >
        <span aria-hidden="true" className="md:text-right">
          Café
        </span>
        <span aria-hidden="true">Gelado</span>
        <span aria-hidden="true" className="w-full text-center md:w-auto md:text-right">
          De outra
        </span>
        <span aria-hidden="true">Galáxia</span>
      </h1>

      <div className="flex flex-1 items-center justify-center py-4 md:absolute md:inset-0 md:py-0">
        <div ref={canAnchor} className="aspect-[200/486] h-[36svh] md:h-[64svh]" />
      </div>

      <div className="relative mt-auto flex items-end justify-between gap-8">
        <div className="max-w-sm">
          <p className="text-ink-muted">
            Cold brew extraído a frio por 12 horas e enlatado no ponto exato. Encorpado, cremoso e
            sem açúcar adicionado.
          </p>
          <a
            href="#sabores"
            className="mt-5 inline-block rounded-full bg-pop px-7 py-3.5 text-sm font-bold text-pop-ink md:mt-6"
          >
            Explorar sabores
          </a>
        </div>

        <ul className="eyebrow hidden flex-col items-end gap-3 text-ink-muted md:flex">
          {SPECS.map((spec) => (
            <li key={spec}>{spec}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
