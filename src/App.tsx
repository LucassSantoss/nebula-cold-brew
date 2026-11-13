import { lazy, Suspense, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { startSmoothScroll } from './lib/gsap'
import { setState } from './lib/store'
import { startPageTheme } from './lib/theme'
import { useReducedMotion } from './lib/useReducedMotion'
import { FinalCta } from './sections/FinalCta'
import { Flavors } from './sections/Flavors'
import { Footer } from './sections/Footer'
import { Hero } from './sections/Hero'
import { Ice } from './sections/Ice'
import { Process } from './sections/Process'
import { Stats } from './sections/Stats'
import { Testimonials } from './sections/Testimonials'

// Three.js is by far the heaviest dependency, so it loads in its own chunk.
const Scene = lazy(() => import('./components/three/Scene'))

export default function App() {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    return startSmoothScroll()
  }, [reducedMotion])

  useEffect(() => startPageTheme(), [])

  // Until the preloader exists, intro animations start as soon as fonts are in.
  useEffect(() => {
    document.fonts.ready.then(() => setState({ introDone: true }))
  }, [])

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
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </>
  )
}
