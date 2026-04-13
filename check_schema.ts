import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '', 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function check() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is missing");
    return;
  }
  
  console.log("Checking chat_messages columns...");
  const { data: msgData, error: msgError } = await supabase.from('chat_messages').select('*').limit(1);
  if (msgError) console.error("chat_messages error:", msgError);
  else console.log("chat_messages columns:", msgData && msgData.length > 0 ? Object.keys(msgData[0]) : 'No data (table might be empty)');

  console.log("Checking chat_sessions columns...");
  const { data: sessData, error: sessError } = await supabase.from('chat_sessions').select('*').limit(1);
  if (sessError) console.error("chat_sessions error:", sessError);
  else console.log("chat_sessions columns:", sessData && sessData.length > 0 ? Object.keys(sessData[0]) : 'No data (table might be empty)');
}
check();
