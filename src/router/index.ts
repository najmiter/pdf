import { createRouter, createWebHistory } from 'vue-router';

const SITE_URL = 'https://pdfrizz.knoctal.com';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/HomePage.vue'),
    meta: {
      title: 'PdfRizz – PDF Tools: Merge, Split, Insert, and Edit PDFs Free Online',
      description:
        'Free online PDF tools to merge, split, compress, convert and edit PDFs. Drag-and-drop interface, no uploads — everything is processed locally in your browser.',
    },
  },
  {
    path: '/compress',
    name: 'Compress',
    component: () => import('@/pages/CompressPage.vue'),
    meta: {
      title: 'Compress PDF Online Free – Reduce PDF File Size | PdfRizz',
      description:
        'Shrink PDF file size for free with adjustable quality, metadata and annotation cleanup. 100% private — your files never leave your device.',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

router.afterEach((to) => {
  const title = (to.meta.title as string) ?? 'PdfRizz – Free Online PDF Tools';
  const description = (to.meta.description as string) ?? '';
  const url = `${SITE_URL}${to.path === '/' ? '/' : to.path}`;

  document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'twitter:title', title);
  setMeta('property', 'twitter:description', description);
  setMeta('property', 'twitter:url', url);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
});

export default router;
