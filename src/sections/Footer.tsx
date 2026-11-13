import { Logo } from '../components/Logo'
import { SITE } from '../lib/site'

export function Footer() {
  return (
    <footer data-theme="base" className="relative px-5 py-16 md:px-10">
      <Logo className="text-4xl" />
      <p className="mt-6 text-sm text-ink-muted">
        Projeto fictício para portfólio — não é um produto real.
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        Feito por{' '}
        <a href={SITE.githubUrl} target="_blank" rel="noreferrer" className="link-underline text-ink">
          {SITE.author}
        </a>
      </p>
    </footer>
  )
}
