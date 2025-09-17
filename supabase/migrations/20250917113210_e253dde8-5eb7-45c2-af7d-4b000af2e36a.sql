-- Add exclusion constraint to prevent overlapping sickness records for the same employee
-- This constraint ensures that no two sickness records for the same employee can have overlapping date ranges

-- First, we need to enable the btree_gist extension if not already enabled
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add an exclusion constraint to prevent overlapping sickness records
-- The constraint uses daterange to check for overlaps between start_date and end_date (or start_date if end_date is null)
ALTER TABLE employee_sickness_records 
ADD CONSTRAINT no_overlapping_sickness_periods 
EXCLUDE USING gist (
  employee_id WITH =, 
  daterange(
    start_date::date, 
    COALESCE(end_date::date, start_date::date) + interval '1 day',
    '[)'
  ) WITH &&
);

-- Add a comment to explain the constraint
COMMENT ON CONSTRAINT no_overlapping_sickness_periods ON employee_sickness_records 
IS 'Prevents overlapping sickness records for the same employee';