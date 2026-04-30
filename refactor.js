const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file === 'route.ts') {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const routes = walk(path.join(__dirname, 'app', 'api'));
for (const route of routes) {
  let content = fs.readFileSync(route, 'utf8');
  
  if (content.includes('createServerClient') && content.includes('cookies') && content.includes('supabase.auth.getUser()')) {
    
    // Add new import if needed
    if (!content.includes('getAuthenticatedUserOrError')) {
      // Find the last import
      const lastImportIndex = content.lastIndexOf('import ');
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + "import { getAuthenticatedUserOrError } from '@/lib/supabase-server';\n" + content.slice(endOfLastImport + 1);
    }

    // Now replace the common block. It might vary slightly, so we use regex or block replacement.
    // Replace imports
    content = content.replace(/import { createServerClient.*?from '@supabase\/ssr';\n/g, '');
    content = content.replace(/import { cookies } from 'next\/headers';\n/g, '');

    // Replace the block
    const blockRegex1 = /const cookieStore = await cookies\(\);\s*const supabase = createServerClient\([\s\S]*?\{ cookies: \{ get[\s\S]*?\} \}\s*\);\s*const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);\s*if \(\!user\) return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);/g;
    
    const blockRegex2 = /const cookieStore = await cookies\(\);\s*const supabase = createServerClient\([\s\S]*?\{ cookies: \{ get[\s\S]*?\} \}\s*\);\s*const \{ data: \{ user \}, error: authError \} = await supabase\.auth\.getUser\(\);\s*if \(\!user \|\| authError\) return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);/g;

    const replaceText = `const { user, supabase, response } = await getAuthenticatedUserOrError();\n  if (response) return response;`;

    content = content.replace(blockRegex1, replaceText);
    content = content.replace(blockRegex2, replaceText);

    // Some variants might have slightly different spaces
    const blockRegex3 = /const cookieStore = await cookies\(\);\s*const supabase = createServerClient\([\s\S]*?get[\s\S]*?return cookieStore[\s\S]*?\}\s*\);\s*const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);\s*if \(\!user\) return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);/g;

    content = content.replace(blockRegex3, replaceText);

    const blockRegex4 = /const cookieStore = await cookies\(\);\s*const supabase = createServerClient\([\s\S]*?get[\s\S]*?return cookieStore[\s\S]*?\}\s*\);\s*const \{ data: \{ user \}, error \} = await supabase\.auth\.getUser\(\);\s*if \(\!user \|\| error\) return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);/g;
    content = content.replace(blockRegex4, replaceText);

    fs.writeFileSync(route, content);
  }
}
