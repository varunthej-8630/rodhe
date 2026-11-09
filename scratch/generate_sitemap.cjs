const fs = require('fs');
const { PRODUCTS } = require('../src/data/products.js');

const staticRoutes = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: '?page=shop', changefreq: 'daily', priority: '0.9' },
  { path: '?page=collections', changefreq: 'weekly', priority: '0.8' },
  { path: '?page=story', changefreq: 'monthly', priority: '0.7' },
  { path: '?page=contact', changefreq: 'monthly', priority: '0.7' },
  { path: '?page=shipping-delivery', changefreq: 'monthly', priority: '0.5' },
  { path: '?page=returns-exchanges', changefreq: 'monthly', priority: '0.5' },
  { path: '?page=privacy-policy', changefreq: 'monthly', priority: '0.4' },
  { path: '?page=terms-of-service', changefreq: 'monthly', priority: '0.4' }
];

const crafts = ['all', 'tie-dye', 'handblock', 'chanderi', 'mulmul'];
const craftRoutes = crafts.map(c => ({
  path: '?page=shop&amp;craft=' + c,
  changefreq: 'weekly',
  priority: '0.8'
}));

const productRoutes = PRODUCTS.map(p => ({
  path: '?product=' + p.id,
  changefreq: 'weekly',
  priority: '0.85'
}));

const allRoutes = [...staticRoutes, ...craftRoutes, ...productRoutes];
const canonicalBase = 'https://www.rodhe.in';

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  allRoutes.map(r => {
    const locUrl = r.path ? `${canonicalBase}/${r.path}` : `${canonicalBase}/`;
    return '  <url>\n' +
      '    <loc>' + locUrl + '</loc>\n' +
      '    <changefreq>' + r.changefreq + '</changefreq>\n' +
      '    <priority>' + r.priority + '</priority>\n' +
      '  </url>';
  }).join('\n') +
  '\n</urlset>\n';

fs.writeFileSync('./public/sitemap.xml', xml, 'utf8');
console.log('Successfully generated public/sitemap.xml with ' + allRoutes.length + ' indexed URLs.');

