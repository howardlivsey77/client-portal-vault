-- Fix trailing spaces in department names for all employees
UPDATE employees 
SET department = TRIM(department)
WHERE department != TRIM(department);

-- Fix the "Manangement" typo
UPDATE employees 
SET department = 'Management'
WHERE department = 'Manangement';