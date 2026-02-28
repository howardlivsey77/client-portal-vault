/**
 * FPS XML Generator (Deno-compatible)
 *
 * Builds the complete GovTalkMessage / FullPaymentSubmission XML document.
 * Uses string-based XML construction instead of xmlbuilder2 (not Deno-compatible).
 */

import { EmployerConfig, FpsEmployee } from './types.ts';
import { getFpsNamespace, getPeriodEnd, taxYearToYearString } from './config.ts';
import { computeIRmark, insertIRmark } from './irmark.ts';

const IRMARK_PLACEHOLDER = '';

interface BuildXmlOptions {
  config: EmployerConfig;
  employees: FpsEmployee[];
  taxYear: string;
  taxPeriod: number;
  finalSubmission?: boolean;
  schemeCeased?: boolean;
  dateSchemeCeased?: string;
  finalSubmissionForYear?: boolean;
}

/**
 * Generates the complete FPS XML string including a valid IRmark.
 */
export async function generateFpsXml(opts: BuildXmlOptions): Promise<string> {
  const yearString = taxYearToYearString(opts.taxYear);
  const namespace  = getFpsNamespace(yearString);
  const periodEnd  = getPeriodEnd(opts.taxYear);

  const xmlWithPlaceholder = buildXmlStructure({ ...opts, yearString, namespace, periodEnd });
  const irmark = await computeIRmark(xmlWithPlaceholder);
  return insertIRmark(xmlWithPlaceholder, irmark);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function el(tag: string, content: string, attrs?: Record<string, string>): string {
  const attrStr = attrs
    ? ' ' + Object.entries(attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(' ')
    : '';
  return `<${tag}${attrStr}>${esc(content)}</${tag}>`;
}

// ── XML construction ──────────────────────────────────────────────────────────

function buildXmlStructure(opts: BuildXmlOptions & {
  yearString: string;
  namespace: string;
  periodEnd: string;
}): string {
  const { config, employees, yearString, namespace, periodEnd } = opts;

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<GovTalkMessage xmlns="http://www.govtalk.gov.uk/CM/envelope">');
  lines.push(el('EnvelopeVersion', '2.0'));

  // Header
  lines.push('<Header>');
  lines.push('<MessageDetails>');
  lines.push(el('Class', 'HMRC-PAYE-RTI-FPS'));
  lines.push(el('Qualifier', 'request'));
  lines.push(el('Function', 'submit'));
  lines.push('<CorrelationID></CorrelationID>');
  lines.push(el('Transformation', 'XML'));
  lines.push('</MessageDetails>');
  lines.push('<SenderDetails>');
  lines.push('<IDAuthentication>');
  lines.push(el('SenderID', config.gatewayUserId));
  lines.push('<Authentication>');
  lines.push(el('Method', 'clear'));
  lines.push(el('Role', 'principal'));
  lines.push(el('Value', config.gatewayPassword));
  lines.push('</Authentication>');
  lines.push('</IDAuthentication>');
  lines.push('</SenderDetails>');
  lines.push('</Header>');

  // GovTalkDetails
  lines.push('<GovTalkDetails>');
  lines.push('<Keys>');
  lines.push(`<Key Type="TaxOfficeNumber">${esc(config.taxOfficeNumber)}</Key>`);
  lines.push(`<Key Type="TaxOfficeReference">${esc(config.taxOfficeReference)}</Key>`);
  lines.push('</Keys>');
  lines.push('<ChannelRouting>');
  lines.push('<Channel>');
  lines.push(el('URI', config.vendorId));
  lines.push(el('Product', config.productName));
  lines.push(el('Version', config.productVersion));
  lines.push('</Channel>');
  lines.push('</ChannelRouting>');
  lines.push('</GovTalkDetails>');

  // Body
  lines.push('<Body>');
  lines.push(`<IRenvelope xmlns="${esc(namespace)}">`);

  // IRheader
  lines.push('<IRheader>');
  lines.push('<Keys>');
  lines.push(`<Key Type="TaxOfficeNumber">${esc(config.taxOfficeNumber)}</Key>`);
  lines.push(`<Key Type="TaxOfficeReference">${esc(config.taxOfficeReference)}</Key>`);
  lines.push('</Keys>');
  lines.push(el('PeriodEnd', periodEnd));
  lines.push(el('DefaultCurrency', 'GBP'));
  lines.push(`<IRmark Type="generic">${IRMARK_PLACEHOLDER}</IRmark>`);
  lines.push(el('Sender', 'Employer'));
  lines.push('</IRheader>');

  // FullPaymentSubmission
  lines.push('<FullPaymentSubmission>');

  // EmpRefs
  lines.push('<EmpRefs>');
  lines.push(el('OfficeNo', config.taxOfficeNumber));
  lines.push(el('PayeRef', config.taxOfficeReference));
  lines.push(el('AORef', config.accountsOfficeRef));
  lines.push('</EmpRefs>');

  // RelatedTaxYear
  lines.push(el('RelatedTaxYear', yearString));

  // Employee elements
  for (const emp of employees) {
    lines.push(buildEmployeeXml(emp));
  }

  // Optional: FinalSubmission block
  if (opts.finalSubmission) {
    lines.push('<FinalSubmission>');
    if (opts.schemeCeased) {
      lines.push(el('BecauseSchemeCeased', 'yes'));
      if (opts.dateSchemeCeased) {
        lines.push(el('DateSchemeCeased', opts.dateSchemeCeased));
      }
    }
    if (opts.finalSubmissionForYear) {
      lines.push(el('ForYear', 'yes'));
    }
    lines.push('</FinalSubmission>');
  }

  lines.push('</FullPaymentSubmission>');
  lines.push('</IRenvelope>');
  lines.push('</Body>');
  lines.push('</GovTalkMessage>');

  return lines.join('\n');
}

// ── Employee element builder ──────────────────────────────────────────────────

function buildEmployeeXml(emp: FpsEmployee): string {
  const lines: string[] = [];
  lines.push('<Employee>');

  // EmployeeDetails
  lines.push('<EmployeeDetails>');
  if (emp.nino) {
    lines.push(el('NINO', emp.nino));
  }
  lines.push('<Name>');
  lines.push(el('Fore', emp.firstName));
  lines.push(el('Sur', emp.lastName));
  lines.push('</Name>');

  if (emp.addressLines.length > 0 || emp.postcode) {
    lines.push('<Address>');
    for (const line of emp.addressLines) {
      lines.push(el('Line', line));
    }
    if (emp.postcode) {
      lines.push(el('UKPostcode', emp.postcode.toUpperCase()));
    }
    lines.push('</Address>');
  }

  if (emp.dateOfBirth) {
    lines.push(el('BirthDate', emp.dateOfBirth));
  }
  if (emp.gender) {
    lines.push(el('Gender', emp.gender));
  }
  lines.push('</EmployeeDetails>');

  // Employment
  lines.push('<Employment>');

  // Starter block
  if (emp.isStarter && emp.startDate) {
    lines.push('<Starter>');
    lines.push(el('StartDate', emp.startDate));
    if (emp.startDeclaration) {
      lines.push(el('StartDec', emp.startDeclaration));
    }
    lines.push('</Starter>');
  }

  if (emp.payrollId) {
    lines.push(el('PayId', emp.payrollId));
  }

  // FiguresToDate
  lines.push('<FiguresToDate>');
  lines.push(el('TaxablePay', emp.taxablePayYtd));
  lines.push(el('TotalTax', emp.totalTaxYtd));
  if (emp.studentLoansYtd) {
    lines.push(el('StudentLoansTD', emp.studentLoansYtd));
  }
  if (emp.empeePenContribnsYtd) {
    lines.push(el('EmpeePenContribnsPaidYTD', emp.empeePenContribnsYtd));
  }
  lines.push('</FiguresToDate>');

  // Payment
  lines.push('<Payment>');
  lines.push(el('PayFreq', emp.payFrequency));
  lines.push(el('PmtDate', emp.paymentDate));
  lines.push(el('MonthNo', String(emp.taxPeriod)));
  lines.push(el('PeriodsCovered', '1'));
  lines.push(el('HoursWorked', emp.hoursWorkedBand));

  // TaxCode with optional attributes
  const taxCodeAttrs: Record<string, string> = {};
  if (emp.isMonth1Basis) {
    taxCodeAttrs['BasisNonCumulative'] = 'yes';
  }
  if (emp.isScottishTaxpayer) {
    taxCodeAttrs['TaxRegime'] = 'S';
  }
  const tcAttrStr = Object.entries(taxCodeAttrs).map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
  const tcOpen = tcAttrStr ? `<TaxCode ${tcAttrStr}>` : '<TaxCode>';
  lines.push(`${tcOpen}${esc(emp.taxCode)}</TaxCode>`);

  lines.push(el('TaxablePay', emp.taxablePay));
  lines.push(el('TaxDeductedOrRefunded', emp.taxDeductedOrRefunded));
  lines.push(el('PayAfterStatDedns', emp.payAfterStatDedns));

  if (emp.empeePenContribnsPaid) {
    lines.push(el('EmpeePenContribnsPaid', emp.empeePenContribnsPaid));
  }
  if (emp.studentLoanRecovered && emp.studentLoanPlan) {
    const planAttr = String(emp.studentLoanPlan).padStart(2, '0');
    lines.push(`<StudentLoanRecovered PlanType="${planAttr}">${esc(emp.studentLoanRecovered)}</StudentLoanRecovered>`);
  }
  if (emp.postgradLoanRecovered) {
    lines.push(el('PostgradLoanRecovered', emp.postgradLoanRecovered));
  }

  if (emp.smpYtd) lines.push(el('SMPYTD', emp.smpYtd));
  if (emp.sppYtd) lines.push(el('SPPYTD', emp.sppYtd));
  if (emp.sapYtd) lines.push(el('SAPYTD', emp.sapYtd));
  if (emp.shppYtd) lines.push(el('ShPPYTD', emp.shppYtd));

  lines.push('</Payment>');

  // NIlettersAndValues
  if (emp.nicLetter && emp.nicLetter !== 'X') {
    const d = emp.niData;
    lines.push('<NIlettersAndValues>');
    lines.push(el('NIletter', d.letter));
    lines.push(el('GrossEarningsForNICsInPd', d.grossEarningsForNICsInPd));
    lines.push(el('GrossEarningsForNICsYTD', d.grossEarningsForNICsYtd));
    lines.push(el('AtLELYTD', d.atLelYtd));
    lines.push(el('LELtoPTYTD', d.lelToPtYtd));
    lines.push(el('PTtoUELYTD', d.ptToUelYtd));
    lines.push(el('TotalEmpNICInPd', d.totalEmpNICInPd));
    lines.push(el('TotalEmpNICYTD', d.totalEmpNICYtd));
    lines.push(el('EmpeeContribnsInPd', d.empeeContribnsInPd));
    lines.push(el('EmpeeContribnsYTD', d.empeeContribnsYtd));
    lines.push('</NIlettersAndValues>');
  }

  lines.push('</Employment>');
  lines.push('</Employee>');

  return lines.join('\n');
}
