import { createClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const DEFAULT_USER_ID = 'a0a819c0-1b36-4a20-9754-5153a504570c';
