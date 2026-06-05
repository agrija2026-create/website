import { ArticleCard } from "@/components/ArticleCard";
import NotFoundField from "@/components/NotFoundField";
import { getAllArticles, toArticleCardData } from "@/lib/articles";
import { CATEGORY_SLUGS, getCategoryName } from "@/lib/categories";

const RECOMMENDED_COUNT = 3;

export default async function NotFound() {
  const articles = await getAllArticles();
  const recommended = articles.slice(0, RECOMMENDED_COUNT).map(toArticleCardData);

  // ArticleCard は lib/articles（fs 依存）を介するため、サーバーで要素化してクライアントへ渡す
  const cards = recommended.map((article) => (
    <ArticleCard key={article.slug} article={article} />
  ));
  const categories = CATEGORY_SLUGS.map((slug) => ({
    slug,
    name: getCategoryName(slug),
  }));

  return <NotFoundField cards={cards} categories={categories} />;
}
