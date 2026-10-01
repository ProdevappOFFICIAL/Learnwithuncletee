export const SampleNotice = ({ children = 'Sample content only. Confirm school-specific facts with management before publishing.' }: { children?: string }) => (
  <p className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-800">{children}</p>
);
