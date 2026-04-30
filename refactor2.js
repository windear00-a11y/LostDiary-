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
  let originalContent = content;
  
  if (content.includes('createServerClient') && content.includes('cookies')) {
    
    // Add imports if needed
    if (!content.includes('getAuthenticatedUserOrError')) {
      const lastImportIndex = content.lastIndexOf('import ');
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + "import { getAuthenticatedUserOrError, getAdminSupabaseClient } from '@/lib/supabase-server';\n" + content.slice(endOfLastImport + 1);
    }

    // Now replace the common block for admin + auth supabase double clients
    content = content.replace(/import { createServerClient } from "@supabase\/ssr";\n/g, '');
    content = content.replace(/import { cookies } from "next\/headers";\n/g, '');
    content = content.replace(/import { createServerClient } from '@supabase\/ssr';\n/g, '');
    content = content.replace(/import { cookies } from 'next\/headers';\n/g, '');

    const blockRegexDouble = /const cookieStore = await cookies\(\);\s*const adminSupabase = createServerClient\([\s\S]*?process\.env\.SUPABASE_SERVICE_ROLE_KEY![\s\S]*?\}\s*\);\s*const authSupabase = createServerClient\([\s\S]*?process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY![\s\S]*?\}\s*\);\s*const \{\s*data: \{ user \},\s*\} = await authSupabase\.auth\.getUser\(\);\s*if \(\!user\)\s*return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\);/g;
    
    // some use error: authError
    const blockRegexDouble2 = /const cookieStore = await cookies\(\);\s*const adminSupabase = createServerClient\([\s\S]*?process\.env\.SUPABASE_SERVICE_ROLE_KEY![\s\S]*?\}\s*\);\s*const authSupabase = createServerClient\([\s\S]*?process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY![\s\S]*?\}\s*\);\s*const \{\s*data: \{ user \},\s*error: authError\s*\} = await authSupabase\.auth\.getUser\(\);\s*if \(\!user \|\| authError\)\s*return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\);/g;

    const replaceTextDouble = `const { user, supabase: authSupabase, response } = await getAuthenticatedUserOrError();\n    if (response) return response;\n    const adminSupabase = await getAdminSupabaseClient();`;

    content = content.replace(blockRegexDouble, replaceTextDouble);
    content = content.replace(blockRegexDouble2, replaceTextDouble);

    // also try for single admin clients without auth
    const adminOnly = /const cookieStore = await cookies\(\);\s*const supabase = createServerClient\([\s\S]*?process\.env\.SUPABASE_SERVICE_ROLE_KEY![\s\S]*?\}\s*\);/g;
    content = content.replace(adminOnly, `const supabase = await getAdminSupabaseClient();`);

    // just the standard client again because formatting changes by prettier
    const blockRegexSingle = /const cookieStore = await cookies\(\);\s*const supabase = createServerClient\([\s\S]*?process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY![\s\S]*?\}\s*\);\s*const \{\s*data: \{ user \},\s*\} = await supabase\.auth\.getUser\(\);\s*if \(\!user\)\s*return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\);/g;
    content = content.replace(blockRegexSingle, `const { user, supabase, response } = await getAuthenticatedUserOrError();\n    if (response) return response;`);

    const blockRegexSingle2 = /const cookieStore = await cookies\(\);\s*const supabase = createServerClient\([\s\S]*?process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY![\s\S]*?\}\s*\);\s*const \{\s*data: \{ user \},\s*error: authError\s*\} = await supabase\.auth\.getUser\(\);\s*if \(\!user \|\| authError\)\s*return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\);/g;
    content = content.replace(blockRegexSingle2, `const { user, supabase, response } = await getAuthenticatedUserOrError();\n    if (response) return response;`);

    const blockRegexSingle3 = /const cookieStore = await cookies\(\);\s*const supabase = createServerClient\([\s\S]*?process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY![\s\S]*?\}\s*\);\s*const \{\s*data: \{ user \},\s*error\s*\} = await supabase\.auth\.getUser\(\);\s*if \(\!user \|\| error\)\s*return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\);/g;
    content = content.replace(blockRegexSingle3, `const { user, supabase, response } = await getAuthenticatedUserOrError();\n    if (response) return response;`);


    fs.writeFileSync(route, content);
  }
}
