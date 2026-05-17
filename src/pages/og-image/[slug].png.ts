import { getAllPosts, renderOgImage } from '@/utils';
import type { APIRoute, GetStaticPaths } from 'astro';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    params: { slug: post.id.replace(/\.(md|mdx)$/, '') },
    props: {
      title: post.data.title,
      description: post.data.description,
      tags: post.data.tags.slice(0, 2),
      date: post.data.publishDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage({
    title: props.title as string,
    description: props.description as string,
    tags: props.tags as string[],
    date: props.date as string,
    isArticle: true,
  });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
