const fs = require('fs');

const path1 = 'app/api/chapters/sync/route.ts';
let c1 = fs.readFileSync(path1, 'utf8');
c1 = c1.replace(/\(e\)/g, '(e: any)');
c1 = c1.replace(/\(m\)/g, '(m: any)');
c1 = c1.replace(/\(a, b\)/g, '(a: any, b: any)');
c1 = c1.replace(/\(v\)/g, '(v: any)');
c1 = c1.replace(/pipeline\.generateBookCoverData\(chapters\)/g, 'pipeline.generateBookCoverData(chapters as any)');
fs.writeFileSync(path1, c1);
console.log('Fixed sync route');

const path2 = 'app/api/chat/sessions/generate-title/route.ts';
let c2 = fs.readFileSync(path2, 'utf8');
c2 = c2.replace(/\(m\)/g, '(m: any)');
fs.writeFileSync(path2, c2);

const path3 = 'app/api/profile/engagement/route.ts';
let c3 = fs.readFileSync(path3, 'utf8');
c3 = c3.replace(/\(p\)/g, '(p: any)');
fs.writeFileSync(path3, c3);

const path4 = 'app/bridge/[id]/page.tsx';
let c4 = fs.readFileSync(path4, 'utf8');
c4 = c4.replace(/\(prev\)/g, '(prev: any)');
fs.writeFileSync(path4, c4);
