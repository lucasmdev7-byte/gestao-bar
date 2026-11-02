import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://begbmmgwqyqmopngxsey.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QXPYZLCzBV7EycxCRwWNdg_4w-N45S-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
