interface Props {
  eyebrow: string;
  title: string;
  text?: string;
  align?: 'left' | 'center';
}

export const SectionHeading = ({ eyebrow, title, text, align = 'center' }: Props) => (
  <div className={`${align === 'center' ? 'mx-auto text-center items-center' : 'text-left items-start'} flex max-w-2xl flex-col gap-3`}>
    <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700">
      {eyebrow}
    </span>
    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
    {text && <p className="text-base leading-relaxed text-slate-600">{text}</p>}
  </div>
);
