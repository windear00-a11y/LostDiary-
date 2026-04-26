const fs = require('fs');
let s = fs.readFileSync('app/api/chapters/sync/route.ts', 'utf8');
s = s.replace(/e =>/g, '(e: any) =>');
s = s.replace(/m =>/g, '(m: any) =>');
s = s.replace(/\(a, b\) =>/g, '(a: any, b: any) =>');
s = s.replace(/v =>/g, '(v: any) =>');
fs.writeFileSync('app/api/chapters/sync/route.ts', s);
console.log('Fixed sync route regex');
