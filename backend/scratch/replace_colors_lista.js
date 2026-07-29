const fs = require('fs');
const path = 'c:\\OperaIQ\\frontend\\src\\app\\dashboard\\portfolio\\lista\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Backgrounds
content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-background');
content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-muted/50');
content = content.replace(/bg-white\/5/g, 'bg-muted');
content = content.replace(/bg-white\/10/g, 'bg-border');
content = content.replace(/bg-black\/20/g, 'bg-background');
content = content.replace(/bg-\[\#161b22\]/g, 'bg-background');
content = content.replace(/bg-\[\#0f141f\]/g, 'bg-background'); // Modal bg

// Borders
content = content.replace(/border-white\/5/g, 'border-border/60');
content = content.replace(/border-white\/10/g, 'border-border');
content = content.replace(/border-white\/20/g, 'border-border/80');

// Text Colors
content = content.replace(/text-white/g, 'text-foreground');
content = content.replace(/text-slate-200/g, 'text-foreground');
content = content.replace(/text-slate-300/g, 'text-muted-foreground');
content = content.replace(/text-slate-400/g, 'text-muted-foreground');
content = content.replace(/text-slate-500/g, 'text-muted-foreground');
content = content.replace(/text-slate-600/g, 'text-muted-foreground');

// Fix specific hover states
content = content.replace(/hover:text-white/g, 'hover:text-foreground');

// Fix accent text in some cases if needed (I see no specific issues in the script)

fs.writeFileSync(path, content);
console.log('Colors replaced successfully in lista page!');
