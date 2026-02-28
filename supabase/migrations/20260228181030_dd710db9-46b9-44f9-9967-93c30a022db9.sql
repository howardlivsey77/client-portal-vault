
-- NIC bands: add admin management policy
CREATE POLICY "Admins can manage NIC bands"
  ON public.nic_bands FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- NHS pension bands: add admin management policy
CREATE POLICY "Admins can manage NHS pension bands"
  ON public.nhs_pension_bands FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Tax bands: add admin management policy
CREATE POLICY "Admins can manage tax bands"
  ON public.tax_bands FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
