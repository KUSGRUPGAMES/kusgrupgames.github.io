const fs=require('fs'), path=require('path');
const { chromium } = require('playwright-core');
const taban = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
const chrome = path.join(taban, fs.readdirSync(taban).find(d=>/^chromium-\d+$/.test(d)), 'chrome-linux','chrome');
const dir = path.resolve(process.argv[2]), out = process.argv[3], cols = Number(process.argv[4]||4), w = Number(process.argv[5]||250);
(async()=>{
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort();
  const html = `<!doctype html><meta charset=utf-8><style>
  body{margin:0;background:#222;font:12px system-ui;color:#eee;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:10px;padding:10px}
  figure{margin:0}img{width:${w}px;display:block;border:1px solid #666}
  figcaption{padding:3px 0}</style>` +
  files.map(f=>`<figure><img src="./${f}"><figcaption>${f.replace('.png','')}</figcaption></figure>`).join('');
  const sayfa = path.join(dir,'_sheet.html');
  fs.writeFileSync(sayfa, html);
  const b = await chromium.launch({executablePath:chrome,args:['--no-sandbox','--disable-gpu']});
  const p = await b.newPage({viewport:{width:cols*(w+10)+20,height:900}});
  await p.goto('file://'+sayfa,{waitUntil:'load'});
  await p.waitForTimeout(2000);
  await p.screenshot({path:out,fullPage:true});
  await b.close(); fs.unlinkSync(sayfa);
  console.log(out, files.length+' kare');
})();
