/* reduced-motion + no-JS: every piece of content must still be visible */
const p=require('puppeteer-core');
(async()=>{
const b=await p.launch({executablePath:'/usr/bin/google-chrome',headless:'shell',
 args:['--no-sandbox','--hide-scrollbars','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});

for (const mode of ['reduced','nojs']) {
  const pg=await b.newPage();
  await pg.setViewport({width:1440,height:900});
  if (mode==='reduced') await pg.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  if (mode==='nojs') await pg.setJavaScriptEnabled(false);
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://127.0.0.1:8731/index.html',{waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,2500));
  const r = await pg.evaluate(()=>{
    const hidden=[];
    document.querySelectorAll('h1,h2,h3,.says p,.list li,.roles li,.specs div,.chips li,.btn,figure img').forEach(el=>{
      const cs=getComputedStyle(el), bb=el.getBoundingClientRect();
      if (cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)<0.05||bb.height<1)
        hidden.push((el.tagName+'.'+(el.className||'')).slice(0,40));
    });
    const pre=document.querySelector('.pre');
    return {hidden:hidden.slice(0,10), hiddenCount:hidden.length,
            preDisplay:getComputedStyle(pre).display,
            pageHeight:document.documentElement.scrollHeight,
            masked:[...document.querySelectorAll('.line__i')].filter(e=>{
              const t=getComputedStyle(e).transform; return t&&t!=='none'&&!t.includes('matrix(1, 0, 0, 1, 0, 0)');
            }).length};
  });
  console.log(mode.padEnd(8), JSON.stringify(r), errs.length?('ERR '+errs[0]):'');
  await pg.screenshot({path:`capture/qa/${mode}.jpg`,type:'jpeg',quality:80});
  await pg.close();
}
await b.close()})();
