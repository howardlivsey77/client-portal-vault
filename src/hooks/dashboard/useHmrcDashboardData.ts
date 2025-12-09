import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers";

export interface HmrcPeriodData {
  period: number;
  periodLabel: string;
  payments: number;
  credits: number;
  fpsStatus: 'pending' | 'success' | 'failed' | 'not_required' | null;
  epsStatus: 'pending' | 'success' | 'failed' | 'not_required' | null;
}

const MONTH_LABELS = [
  'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
  'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'
];

export function useHmrcDashboardData(taxYear: string) {
  const { currentCompany } = useCompany();

  const companyId = currentCompany?.id;

  return useQuery({
    queryKey: ['hmrc-dashboard', companyId, taxYear],
    queryFn: async (): Promise<HmrcPeriodData[]> => {
      if (!companyId) {
        return generateEmptyPeriods(taxYear);
      }

      // Fetch HMRC submissions for this company and tax year
      const { data: submissions, error } = await supabase
        .from('hmrc_submissions')
        .select('*')
        .eq('company_id', companyId)
        .eq('tax_year', taxYear);

      if (error) {
        console.error('Error fetching HMRC submissions:', error);
        throw error;
      }

      // Build period data
      const periodData: HmrcPeriodData[] = [];
      const startYear = parseInt(taxYear.split('/')[0]);

      for (let period = 1; period <= 12; period++) {
        const monthIndex = period - 1;
        const year = period <= 9 ? startYear : startYear + 1;
        const periodLabel = `${MONTH_LABELS[monthIndex]} ${year}`;

        // Find FPS and EPS submissions for this period
        const fpsSubmission = submissions?.find(
          s => s.tax_period === period && s.submission_type === 'FPS'
        );
        const epsSubmission = submissions?.find(
          s => s.tax_period === period && s.submission_type === 'EPS'
        );

        // Sum payments and credits from both submission types
        const payments = (fpsSubmission?.payments || 0) + (epsSubmission?.payments || 0);
        const credits = (fpsSubmission?.credits || 0) + (epsSubmission?.credits || 0);

        periodData.push({
          period,
          periodLabel,
          payments: payments / 100, // Convert from pence to pounds
          credits: credits / 100,
          fpsStatus: fpsSubmission?.status as HmrcPeriodData['fpsStatus'] || null,
          epsStatus: epsSubmission?.status as HmrcPeriodData['epsStatus'] || null,
        });
      }

      return periodData;
    },
    enabled: !!companyId,
  });
}

function generateEmptyPeriods(taxYear: string): HmrcPeriodData[] {
  const startYear = parseInt(taxYear.split('/')[0]);
  
  return Array.from({ length: 12 }, (_, i) => {
    const period = i + 1;
    const year = period <= 9 ? startYear : startYear + 1;
    return {
      period,
      periodLabel: `${MONTH_LABELS[i]} ${year}`,
      payments: 0,
      credits: 0,
      fpsStatus: null,
      epsStatus: null,
    };
  });
}
