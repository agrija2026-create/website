type Props = {
  takeaways: string[];
  readingMinutes: number;
};

export function ArticleTakeaways({ takeaways, readingMinutes }: Props) {
  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-stone-500">
        読了の目安：<span className="font-medium text-stone-700">{readingMinutes}分</span>
      </p>
      {takeaways.length > 0 && (
        <section
          aria-labelledby="takeaways-heading"
          className="rounded-xl border border-orange-200/80 bg-orange-50/60 p-4 md:p-5"
        >
          <h2 id="takeaways-heading" className="text-sm font-bold text-stone-900">
            この記事でわかること
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-800">
            {takeaways.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
