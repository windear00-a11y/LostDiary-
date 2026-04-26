const fs = require('fs');

function fixChatRoute() {
  let content = fs.readFileSync('app/api/chat/send/route.ts', 'utf8');
  content = content.replace(/profile\.personality_summary/g, 'profile.personality_summary || undefined');
  content = content.replace(/updatedIntelProfile/g, 'updatedIntelProfile');
  content = content.replace(/pipelineOutput\.narrativeUpdate\./g, 'pipelineOutput.narrativeUpdate!.');
  content = content.replace(/m =>/g, '(m: any) =>');
  content = content.replace(/c =>/g, '(c: any) =>');
  fs.writeFileSync('app/api/chat/send/route.ts', content);
}
fixChatRoute();
