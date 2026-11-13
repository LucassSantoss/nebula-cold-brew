import { useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { startSmoothScroll } from './lib/gsap'
import { useReducedMotion } from './lib/useReducedMotion'
import { FinalCta } from './sections/FinalCta'
import { Flavors } from './sections/Flavors'
import { Footer } from './sections/Footer'
import { Hero } from './sections/Hero'
import { Ice } from './sections/Ice'
import { Process } from './sections/Process'
import { Stats } from './sections/Stats'
import { Testimonials } from './sections/Testimonials'

export default function App() {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    return startSmoothScroll()
  }, [reducedMotion])

  return (
    <>
      <a
        href="#conteudo"
        className="fixed top-3 left-3 z-[60] -translate-y-20 rounded-full bg-cream px-5 py-2.5 text-sm font-bold text-bg focus-visible:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="conteudo">
        <Hero />
        <Process />
        <Flavors />
        <Ice />
        <Stats />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
