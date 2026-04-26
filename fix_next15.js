const fs = require('fs');
const path = require('path');

function replaceInFolder(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFolder(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix cookies
      if (content.includes('const cookieStore = cookies();')) {
         content = content.replace(/const cookieStore = cookies\(\);/g, 'const cookieStore = await cookies();');
         fs.writeFileSync(fullPath, content);
         console.log('Fixed cookies() in', fullPath);
      }
      
      // Fix Next.js 15 dynamic params
      // export async function GET(req: Request, { params }: { params: { id: string } })
      // becomes export async function GET(req: Request, props: { params: Promise<{ id: string }> })
      // and we need to add `const params = await props.params;` inside
      const paramRegex = /export async function (GET|POST|PATCH|PUT|DELETE)\(([^,]+), \{(?:\s*)params(?:\s*)\}: \{(?:\s*)params: \{([^}]+)\}(?:\s*)\}\)(?:\s*)\{/g;
      
      let match;
      let newContent = content;
      let hasChanges = false;
      while ((match = paramRegex.exec(content)) !== null) {
         hasChanges = true;
         const method = match[1];
         const reqName = match[2];
         const paramType = match[3];
         
         const replacement = `export async function ${method}(${reqName}, props: { params: Promise<{${paramType}}> }) {\n  const params = await props.params;`;
         
         newContent = newContent.replace(match[0], replacement);
      }

      if (hasChanges && newContent !== content) {
         fs.writeFileSync(fullPath, newContent);
         console.log('Fixed params in', fullPath);
      }
    }
  }
}

replaceInFolder('./app/api');
replaceInFolder('./app/bridge');
