interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  background?: 'light' | 'gold'
}

const backgroundClasses: Record<NonNullable<PageHeaderProps['background']>, string> = {
  light: 'bg-gradient-to-br from-white via-champagne to-white',
  gold: 'bg-gradient-to-br from-champagne via-white to-champagne',
}

const PageHeader = ({ title, description, eyebrow, background = 'light' }: PageHeaderProps) => {
  return (
    <section className={`border-b border-neutral-200/70 py-20 ${backgroundClasses[background]}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6">
        {eyebrow ? <span className="text-sm uppercase tracking-[0.35em] text-gold-500">{eyebrow}</span> : null}
        <h1 className="text-4xl font-semibold text-charcoal sm:text-5xl">{title}</h1>
        {description ? <p className="max-w-2xl text-lg leading-8 text-neutral-600">{description}</p> : null}
      </div>
    </section>
  )
}

export default PageHeader


