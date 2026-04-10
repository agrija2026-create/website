type Props = {
  defaultValue?: string;
  className?: string;
  inputClassName?: string;
};

export function ArticleSearchForm({
  defaultValue = "",
  className = "",
  inputClassName = "",
}: Props) {
  return (
    <form action="/search" method="get" className={`flex items-center gap-2 ${className}`.trim()}>
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="記事を検索"
        aria-label="記事を検索"
        className={`min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200 ${inputClassName}`.trim()}
      />
      <button
        type="submit"
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
      >
        検索
      </button>
    </form>
  );
}
