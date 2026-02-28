/**
 * Employer PAYE configuration
 * Reads from Deno environment variables.
 */

import { EmployerConfig } from './types.ts';

function requireEnv(key: string): string {
  const val = Deno.env.get(key);
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export function loadEmployerConfig(companyTaxOfficeNumber?: string, companyTaxOfficeReference?: string, companyAccountsOfficeRef?: string): EmployerConfig {
  return {
    taxOfficeNumber:    companyTaxOfficeNumber || requireEnv('HMRC_TAX_OFFICE_NUMBER'),
    taxOfficeReference: companyTaxOfficeReference || requireEnv('HMRC_TAX_OFFICE_REFERENCE'),
    accountsOfficeRef:  companyAccountsOfficeRef || requireEnv('HMRC_ACCOUNTS_OFFICE_REF'),
    gatewayUserId:      requireEnv('HMRC_GATEWAY_USER_ID'),
    gatewayPassword:    requireEnv('HMRC_GATEWAY_PASSWORD'),
    vendorId:           requireEnv('HMRC_VENDOR_ID'),
    productName:        requireEnv('HMRC_PRODUCT_NAME'),
    productVersion:     requireEnv('HMRC_PRODUCT_VERSION'),
    liveMode:           Deno.env.get('HMRC_LIVE_MODE') === 'true',
  };
}

/**
 * Returns the FPS XML namespace for a given tax year string (e.g. '25-26')
 */
export function getFpsNamespace(yearString: string): string {
  const baseNs = 'http://www.govtalk.gov.uk/taxation/PAYE/RTI/FullPaymentSubmission/';
  const version = getNamespaceVersion(yearString);
  return `${baseNs}${yearString}/${version}`;
}

function getNamespaceVersion(yearString: string): string {
  const versions: Record<string, string> = {
    '18-19': '1',
    '19-20': '1',
    '20-21': '1',
    '21-22': '1',
    '22-23': '1',
    '23-24': '2',
    '24-25': '1',
    '25-26': '1',
    '26-27': '1',
  };
  const v = versions[yearString];
  if (!v) {
    console.warn(`[RTI] Unknown tax year namespace version for '${yearString}', defaulting to '1'`);
    return '1';
  }
  return v;
}

/**
 * Converts a tax year in '2025/26' format to the HMRC year string '25-26'
 */
export function taxYearToYearString(taxYear: string): string {
  const match = taxYear.match(/(\d{4})\/(\d{2})/);
  if (!match) throw new Error(`Invalid tax year format: ${taxYear}`);
  const startYY = match[1].slice(2);
  const endYY   = match[2];
  return `${startYY}-${endYY}`;
}

/**
 * Returns the PeriodEnd date for a given tax year (5 April of the end year)
 */
export function getPeriodEnd(taxYear: string): string {
  const match = taxYear.match(/\d{4}\/(\d{2})/);
  if (!match) throw new Error(`Invalid tax year format: ${taxYear}`);
  const endYear = 2000 + parseInt(match[1], 10);
  return `${endYear}-04-05`;
}
