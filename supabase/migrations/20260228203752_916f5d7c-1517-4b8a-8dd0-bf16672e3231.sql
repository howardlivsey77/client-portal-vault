
-- Delete stale 2023/24 data
DELETE FROM payroll_constants WHERE tax_year = '2023/24';

-- Seed missing NI thresholds for 2025/26
INSERT INTO payroll_constants (category, key, value_numeric, description, tax_year, region, effective_from, is_current)
VALUES
  ('NI_THRESHOLDS', 'LEL', 542, 'Lower Earnings Limit (monthly)', '2025/26', 'UK', '2025-04-06', true),
  ('NI_THRESHOLDS', 'PT', 1048, 'Primary Threshold (monthly)', '2025/26', 'UK', '2025-04-06', true),
  ('NI_THRESHOLDS', 'UEL', 4189, 'Upper Earnings Limit (monthly)', '2025/26', 'UK', '2025-04-06', true),
  ('NI_THRESHOLDS', 'UST', 4189, 'Upper Secondary Threshold (monthly)', '2025/26', 'UK', '2025-04-06', true),
  ('NI_THRESHOLDS', 'AUST', 4189, 'Apprentice Upper Secondary Threshold (monthly)', '2025/26', 'UK', '2025-04-06', true);

-- Seed student loan constants for 2025/26
INSERT INTO payroll_constants (category, key, value_numeric, description, tax_year, region, effective_from, is_current)
VALUES
  ('STUDENT_LOAN', 'PLAN_1_THRESHOLD', 2172.08, 'Plan 1 monthly threshold', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PLAN_1_RATE', 0.09, 'Plan 1 repayment rate', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PLAN_2_THRESHOLD', 2372.50, 'Plan 2 monthly threshold', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PLAN_2_RATE', 0.09, 'Plan 2 repayment rate', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PLAN_4_THRESHOLD', 2728.75, 'Plan 4 monthly threshold', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PLAN_4_RATE', 0.09, 'Plan 4 repayment rate', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PGL_THRESHOLD', 1750.00, 'Postgraduate Loan monthly threshold', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PGL_RATE', 0.06, 'Postgraduate Loan repayment rate', '2025/26', 'UK', '2025-04-06', true);

-- Seed missing NIC bands for B, J, V, Z (Employee)
INSERT INTO nic_bands (tax_year, ni_class, contribution_type, name, threshold_from, threshold_to, rate, region, effective_from, is_current)
VALUES
  ('2025/26', 'B', 'Employee', 'Lower Earnings Limit (LEL)', 0, 54200, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'B', 'Employee', 'LEL to Primary Threshold (PT)', 54200, 104800, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'B', 'Employee', 'Primary Threshold to Upper Earnings Limit (UEL)', 104800, 418900, 0.0185, 'UK', '2025-04-06', true),
  ('2025/26', 'B', 'Employee', 'Above Upper Earnings Limit (UEL)', 418900, NULL, 0.02, 'UK', '2025-04-06', true),
  ('2025/26', 'C', 'Employee', 'Lower Earnings Limit (LEL)', 0, 54200, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'C', 'Employee', 'LEL to Primary Threshold (PT)', 54200, 104800, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'C', 'Employee', 'Primary Threshold to Upper Earnings Limit (UEL)', 104800, 418900, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'C', 'Employee', 'Above Upper Earnings Limit (UEL)', 418900, NULL, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'H', 'Employee', 'Lower Earnings Limit (LEL)', 0, 54200, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'H', 'Employee', 'LEL to Primary Threshold (PT)', 54200, 104800, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'H', 'Employee', 'Primary Threshold to Upper Earnings Limit (UEL)', 104800, 418900, 0.08, 'UK', '2025-04-06', true),
  ('2025/26', 'H', 'Employee', 'Above Upper Earnings Limit (UEL)', 418900, NULL, 0.02, 'UK', '2025-04-06', true),
  ('2025/26', 'J', 'Employee', 'Lower Earnings Limit (LEL)', 0, 54200, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'J', 'Employee', 'LEL to Primary Threshold (PT)', 54200, 104800, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'J', 'Employee', 'Primary Threshold to Upper Earnings Limit (UEL)', 104800, 418900, 0.02, 'UK', '2025-04-06', true),
  ('2025/26', 'J', 'Employee', 'Above Upper Earnings Limit (UEL)', 418900, NULL, 0.02, 'UK', '2025-04-06', true),
  ('2025/26', 'M', 'Employee', 'Lower Earnings Limit (LEL)', 0, 54200, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'M', 'Employee', 'LEL to Primary Threshold (PT)', 54200, 104800, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'M', 'Employee', 'Primary Threshold to Upper Earnings Limit (UEL)', 104800, 418900, 0.0585, 'UK', '2025-04-06', true),
  ('2025/26', 'M', 'Employee', 'Above Upper Earnings Limit (UEL)', 418900, NULL, 0.02, 'UK', '2025-04-06', true),
  ('2025/26', 'V', 'Employee', 'Lower Earnings Limit (LEL)', 0, 54200, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'V', 'Employee', 'LEL to Primary Threshold (PT)', 54200, 104800, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'V', 'Employee', 'Primary Threshold to Upper Earnings Limit (UEL)', 104800, 418900, 0.08, 'UK', '2025-04-06', true),
  ('2025/26', 'V', 'Employee', 'Above Upper Earnings Limit (UEL)', 418900, NULL, 0.02, 'UK', '2025-04-06', true),
  ('2025/26', 'Z', 'Employee', 'Lower Earnings Limit (LEL)', 0, 54200, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'Z', 'Employee', 'LEL to Primary Threshold (PT)', 54200, 104800, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'Z', 'Employee', 'Primary Threshold to Upper Earnings Limit (UEL)', 104800, 418900, 0.02, 'UK', '2025-04-06', true),
  ('2025/26', 'Z', 'Employee', 'Above Upper Earnings Limit (UEL)', 418900, NULL, 0.02, 'UK', '2025-04-06', true);

-- Employer bands for B, C, H, J, M, V, Z
INSERT INTO nic_bands (tax_year, ni_class, contribution_type, name, threshold_from, threshold_to, rate, region, effective_from, is_current)
VALUES
  ('2025/26', 'B', 'Employer', 'Secondary Threshold (ST)', 0, 41700, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'B', 'Employer', 'Above Secondary Threshold (ST)', 41700, NULL, 0.15, 'UK', '2025-04-06', true),
  ('2025/26', 'C', 'Employer', 'Secondary Threshold (ST)', 0, 41700, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'C', 'Employer', 'Above Secondary Threshold (ST)', 41700, NULL, 0.138, 'UK', '2025-04-06', true),
  ('2025/26', 'H', 'Employer', 'Below Upper Secondary Threshold (UST)', 0, 418900, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'H', 'Employer', 'Above Upper Secondary Threshold (UST)', 418900, NULL, 0.15, 'UK', '2025-04-06', true),
  ('2025/26', 'J', 'Employer', 'Secondary Threshold (ST)', 0, 41700, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'J', 'Employer', 'Above Secondary Threshold (ST)', 41700, NULL, 0.15, 'UK', '2025-04-06', true),
  ('2025/26', 'M', 'Employer', 'Secondary Threshold (ST)', 0, 41700, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'M', 'Employer', 'Above Secondary Threshold (ST)', 41700, NULL, 0.138, 'UK', '2025-04-06', true),
  ('2025/26', 'V', 'Employer', 'Below Upper Secondary Threshold (UST)', 0, 418900, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'V', 'Employer', 'Above Upper Secondary Threshold (UST)', 418900, NULL, 0.15, 'UK', '2025-04-06', true),
  ('2025/26', 'Z', 'Employer', 'Below Apprentice Upper Secondary Threshold (AUST)', 0, 418900, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'Z', 'Employer', 'Above Apprentice Upper Secondary Threshold (AUST)', 418900, NULL, 0.15, 'UK', '2025-04-06', true);
