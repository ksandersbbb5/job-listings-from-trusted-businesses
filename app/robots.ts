// ---------- file: app/robots.ts ----------
import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
return {
rules: [{ userAgent: '*', allow: '/' }],
sitemap: 'https://YOUR-VERCEL-DOMAIN.vercel.app/sitemap.xml'
};
}
