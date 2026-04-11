import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
  const { data, error } = await supabase.from('life_events').select('*').limit(1);
  if (error) console.error(error);
  else console.log(data && data.length > 0 ? Object.keys(data[0]) : 'No data');
}
check();
