import { getAllPosts, getFormattedDate, getPostSlug, renderOgImage } from '@/utils';
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';

export const getStaticPaths = (async () => {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    params: { slug: getPostSlug(post.id) },
    props: {
      title: post.data.title,
      description: post.data.description,
      tags: post.data.tags,
      date: getFormattedDate(post.data.publishDate, { month: 'long' }),
    },
  }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute = async ({ props }) => {
  const { title, description, tags, date } = props as Props;
  const png = await renderOgImage({ title, description, tags, date, isArticle: true });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
