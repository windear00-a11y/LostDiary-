const fs = require('fs');

function fixFiles() {
  // Sync Route
  let syncRoute = fs.readFileSync('app/api/chapters/sync/route.ts', 'utf8');
  syncRoute = syncRoute.replace(/\(e\)/g, '(e: any)');
  syncRoute = syncRoute.replace(/\(m\)/g, '(m: any)');
  syncRoute = syncRoute.replace(/\(a, b\)/g, '(a: any, b: any)');
  syncRoute = syncRoute.replace(/\(v\)/g, '(v: any)');
  fs.writeFileSync('app/api/chapters/sync/route.ts', syncRoute);

  // Send Route
  let sendRoute = fs.readFileSync('app/api/chat/send/route.ts', 'utf8');
  sendRoute = sendRoute.replace('updatedIntelProfile', 'intelligenceProfile: updatedIntelProfile');
  sendRoute = sendRoute.replace(/aiResponseText \? coreService.autoSaveChapter\(user_id, aiResponseText\) : Promise\.resolve\(\)/g, "aiResponseText ? coreService.autoSaveChapter(user_id, aiResponseText as string) : Promise.resolve()");
  sendRoute = sendRoute.replace(/session_id,/g, 'session_id: session_id || undefined,');
  fs.writeFileSync('app/api/chat/send/route.ts', sendRoute);

  // Generate Title Route
  let titleRoute = fs.readFileSync('app/api/chat/sessions/generate-title/route.ts', 'utf8');
  titleRoute = titleRoute.replace(/\(m\)/g, '(m: any)');
  fs.writeFileSync('app/api/chat/sessions/generate-title/route.ts', titleRoute);

  // Profile Engagement Route
  let profileRoute = fs.readFileSync('app/api/profile/engagement/route.ts', 'utf8');
  profileRoute = profileRoute.replace(/\(p\)/g, '(p: any)');
  fs.writeFileSync('app/api/profile/engagement/route.ts', profileRoute);

  // Bridge Page
  let bridgePage = fs.readFileSync('app/bridge/[id]/page.tsx', 'utf8');
  bridgePage = bridgePage.replace(/\(prev\)/g, '(prev: any)');
  fs.writeFileSync('app/bridge/[id]/page.tsx', bridgePage);

  // BookRenderer & BookView
  let bookRen = fs.readFileSync('features/story/BookRenderer.tsx', 'utf8');
  bookRen = bookRen.replace(/\.name/g, '.title');
  bookRen = bookRen.replace(/\.narrative/g, '.content');
  bookRen = bookRen.replace(/\.title\?/g, '.title');
  bookRen = bookRen.replace(/\(p,/g, '(p: any,');
  bookRen = bookRen.replace(/\(paragraph,/g, '(paragraph: any,');
  bookRen = bookRen.replace(/pIdx\)/g, 'pIdx: any)');
  fs.writeFileSync('features/story/BookRenderer.tsx', bookRen);

  let bookView = fs.readFileSync('features/story/BookView.tsx', 'utf8');
  bookView = bookView.replace(/\.events/g, '?.events');
  bookView = bookView.replace(/parseInt\(([^,]+), 10\)/g, 'parseInt($1)');
  fs.writeFileSync('features/story/BookView.tsx', bookView);
  
  console.log("Replaced many any types");
}

fixFiles();
