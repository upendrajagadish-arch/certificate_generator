/* eslint-disable */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const https = require('https');
const fs = require('fs');
const path = require('path');

function getText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return getText(res.headers.location).then(resolve, reject);
        }
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function getBin(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return getBin(res.headers.location).then(resolve, reject);
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

async function main() {
  const outDir = path.join('public', 'images');
  fs.mkdirSync(outDir, { recursive: true });

  const sources = [
    'https://cdn.rcee.ac.in/static/www/img/seo.png',
    'https://admissions.rcee.ac.in/',
  ];

  // Keep official SEO/campus asset as primary hero
  try {
    const buf = await getBin(sources[0]);
    fs.writeFileSync(path.join(outDir, 'college-campus.jpg'), buf);
    console.log('campus from seo.png', buf.length);
  } catch (e) {
    console.log('seo fail', e.message);
  }

  try {
    const html = await getText(sources[1]);
    const imgs = [
      ...html.matchAll(/https?:\/\/[^"'\\\s>]+\.(?:jpg|jpeg|png|webp)/gi),
    ].map((m) => m[0]);
    console.log('admissions images', imgs.slice(0, 12));
    for (let i = 0; i < Math.min(imgs.length, 10); i++) {
      try {
        const b = await getBin(imgs[i]);
        if (b.length > 30000) {
          const file = path.join(outDir, `campus-extra-${i}.jpg`);
          fs.writeFileSync(file, b);
          console.log('wrote', file, b.length);
          // Prefer a larger photo as campus hero when available
          if (b.length > 80000) {
            fs.writeFileSync(path.join(outDir, 'college-campus.jpg'), b);
            console.log('updated college-campus.jpg from', imgs[i]);
          }
        }
      } catch (e) {
        console.log('skip', imgs[i], e.message);
      }
    }
  } catch (e) {
    console.log('admissions scrape fail', e.message);
  }
}

main();
