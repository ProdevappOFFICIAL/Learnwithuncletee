interface Props {
  eyebrow: string;
  title: string;
  text?: string;
  align?: 'left' | 'center';
}

export const SectionHeading = ({ eyebrow, title, text, align = 'center' }: Props) => (
  <div className={`${align === 'center' ? 'mx-auto text-center items-center' : 'text-left items-start'} flex max-w-2xl flex-col gap-3`}>
    <span className="inline-flex w-fit items-center border-l-2 border-brand-500 pl-3 text-xs font-bold uppercase tracking-widest text-brand-700">
      {eyebrow}
    </span>
    <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">{title}</h2>
    {text && <p className="text-base leading-relaxed text-muted">{text}</p>}
  </div>
);
