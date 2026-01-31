-- Migration: Add first_name to profiles
-- Description: Adds first_name column to profiles table and updates auth trigger to populate it
-- Date: 2026-01-16

-- 1. Add first_name column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(50) NOT NULL DEFAULT 'Rodzic';

-- 2. Update the handle_new_user function to include first_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    input_first_name TEXT;
BEGIN
    -- Extract first_name from metadata, default to 'Rodzic' if missing or empty
    input_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'Rodzic');
    
    -- Ensure it's not empty string if somehow passed as such
    IF input_first_name = '' THEN
        input_first_name := 'Rodzic';
    END IF;

    INSERT INTO public.profiles (id, email, first_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        input_first_name
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$;
