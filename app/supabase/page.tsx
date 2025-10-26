import { createClient } from '@/lib/supabase/server';


export default async function Instruments() {
  const supabase = await createClient();
  const { data: memes } = await supabase.from("memes").select();
  return <pre>{JSON.stringify(memes)}</pre>
}