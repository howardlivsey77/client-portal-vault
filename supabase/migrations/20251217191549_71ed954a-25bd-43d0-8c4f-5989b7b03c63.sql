-- Copy 2025/26 NIC bands to 2026/27 (same rates apply)
INSERT INTO nic_bands (name, threshold_from, threshold_to, rate, contribution_type, tax_year, ni_class, region, is_current, effective_from)
SELECT 
  name, 
  threshold_from, 
  threshold_to, 
  rate, 
  contribution_type, 
  '2026/27' as tax_year, 
  ni_class, 
  region, 
  true as is_current,
  '2026-04-06'::date as effective_from
FROM nic_bands 
WHERE tax_year = '2025/26'
ON CONFLICT DO NOTHING;