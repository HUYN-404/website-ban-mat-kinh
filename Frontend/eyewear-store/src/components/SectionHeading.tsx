interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
}

const alignmentMap: Record<NonNullable<SectionHeadingProps['align']>, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
}

const SectionHeading = ({ eyebrow, title, description, align = 'left' }: SectionHeadingProps) => {
  return (
    <div className={`flex flex-col gap-3 ${alignmentMap[align]}`}>
      {eyebrow ? (
        <span className="text-sm uppercase tracking-[0.3em] text-gold-500">{eyebrow}</span>
      ) : null}
      <h2 className="text-3xl font-semibold leading-tight text-charcoal sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="max-w-2xl text-base text-neutral-600 sm:text-lg">{description}</p> : null}
    </div>
  )
}

export default SectionHeading


