const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

fs.copyFileSync(
  path.join(root, 'assets', 'images', 'icon.png'),
  path.join(dist, 'apple-touch-icon.png')
);

const file = path.join(dist, 'index.html');
let html = fs.readFileSync(file, 'utf8');

const tags =
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n' +
  '<meta name="apple-mobile-web-app-capable" content="yes">\n' +
  '<meta name="apple-mobile-web-app-title" content="Devam Takip">\n' +
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n';

if (!html.includes('apple-touch-icon')) {
  html = html.replace('</head>', tags + '</head>');
}
fs.writeFileSync(file, html);
console.log('apple-touch-icon eklendi');