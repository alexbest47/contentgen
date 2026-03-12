-- Drop FK and column from projects
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_mini_course_id_fkey;
ALTER TABLE public.projects DROP COLUMN IF EXISTS mini_course_id;

-- Drop mini_courses table (RLS policies are dropped automatically with the table)
DROP TABLE IF EXISTS public.mini_courses;