// Copies offline libraries + fonts into www/ so the app works without internet.
const fs=require('fs'),path=require('path');
const nm=p=>path.join(__dirname,'..','node_modules',p),www=p=>path.join(__dirname,'..','www',p);
fs.mkdirSync(www('lib'),{recursive:true});fs.mkdirSync(www('fonts'),{recursive:true});
fs.copyFileSync(nm('html2canvas/dist/html2canvas.min.js'),www('lib/html2canvas.min.js'));
fs.copyFileSync(nm('jspdf/dist/jspdf.umd.min.js'),www('lib/jspdf.umd.min.js'));
let css='';
for(const [pkg,fam,ws] of [['sora','Sora',[400,600,700,800]],['jetbrains-mono','JetBrains Mono',[500,700]]])
  for(const w of ws){const f=`${pkg}-latin-${w}-normal.woff2`;
    fs.copyFileSync(nm(`@fontsource/${pkg}/files/${f}`),www('fonts/'+f));
    css+=`@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:swap;src:url(fonts/${f}) format('woff2')}\n`}
fs.writeFileSync(www('fonts.css'),css);
console.log('prep done');
