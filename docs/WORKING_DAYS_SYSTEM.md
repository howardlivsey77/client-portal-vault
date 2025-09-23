# Working Days Calculation System Documentation

## Overview

This document describes the comprehensive working days calculation system implemented to ensure data integrity and prevent calculation errors in sickness records.

## Architecture

### 1. Core Calculation Logic

**File:** `src/components/employees/details/sickness/utils/workingDaysCalculations.ts`

- `countWorkingDaysBetween()`: Calculates working days between two dates based on employee work pattern
- `calculateWorkingDaysForRecord()`: Handles single-day or ongoing absences

**Key Features:**
- Respects individual employee work patterns
- Handles weekend exclusions
- Supports part-time and irregular schedules
- Validates date ranges (start ≤ end)

### 2. Database Layer Protection

**Database Functions:**
- `calculate_working_days()`: PostgreSQL function that mirrors frontend calculation
- `validate_sickness_working_days()`: Trigger function for real-time validation
- `run_sickness_integrity_check()`: Daily integrity audit function

**Automatic Safeguards:**
- **Audit Logging**: All discrepancies are logged to `sickness_audit_log` table
- **Auto-correction**: Significant differences (>1 day) are automatically corrected
- **Tolerance**: Small rounding differences (≤0.1 day) are allowed

### 3. Import Process Enhancement

**File:** `src/components/sickness-import/SicknessImportCore.tsx`

**Improvements:**
- Real-time working days calculation during import
- Validation preview showing imported vs calculated days
- Automatic correction of obvious errors
- User confirmation for discrepancies

### 4. Real-time Monitoring

**File:** `src/services/sickness/integrityMonitor.ts`

**Monitoring Features:**
- Live integrity checks
- Audit log analysis
- Data quality metrics
- Dashboard notifications

## Error Prevention Strategy

### Level 1: Frontend Validation
- Real-time calculation as user enters dates
- Visual feedback for discrepancies
- Work pattern-aware calculations

### Level 2: Import Validation  
- Pre-import preview with validation
- Side-by-side comparison (imported vs calculated)
- Batch correction capabilities

### Level 3: Database Triggers
- Automatic validation on INSERT/UPDATE
- Audit trail for all discrepancies
- Auto-correction for significant errors

### Level 4: Continuous Monitoring
- Daily integrity checks
- Real-time dashboard alerts
- Historical trend analysis

## Test Coverage

### Unit Tests
**File:** `tests/unit/sickness/workingDaysCalculations.comprehensive.test.ts`

- Real September 2025 date scenarios
- Regression tests for Klaudia/Karen scenarios
- Edge case validation
- Cross-validation tests

### Integration Tests
**File:** `tests/integration/sickness/workingDaysIntegration.test.ts`

- Complete workflow testing
- Frontend-backend consistency
- Database trigger simulation
- Import-to-entitlement pipeline

## Historical Issues Resolved

### Issue 1: September 22, 2025 Day Confusion
**Problem:** System incorrectly identifying day of week
**Solution:** Comprehensive date validation tests with real-world dates
**Prevention:** Automated day-of-week validation in test suite

### Issue 2: Klaudia Adamiec - UI vs Database Mismatch
**Problem:** Database stored 2 days, UI showed 1 day
**Solution:** Unified calculation service, database triggers
**Prevention:** Real-time validation, audit logging

### Issue 3: Karen Cross - Date Parsing Error  
**Problem:** Import dates shifted (21-25 vs 22-26 September)
**Solution:** Enhanced import preview, date validation
**Prevention:** Import validation preview, user confirmation

## Monitoring Dashboard

**File:** `src/components/sickness-import/SicknessAuditDashboard.tsx`

**Features:**
- Real-time discrepancy count
- Recent audit activity
- Data quality percentage
- Detailed issue breakdown

## API Reference

### Core Functions

```typescript
// Calculate working days between dates
countWorkingDaysBetween(
  startDate: string,
  endDate: string, 
  workPattern: WorkDay[]
): number

// Calculate for single record (handles ongoing)
calculateWorkingDaysForRecord(
  startDate: string,
  endDate: string | null,
  workPattern: WorkDay[]
): number
```

### Monitoring Service

```typescript
// Run integrity check
SicknessIntegrityMonitor.runIntegrityCheck(): Promise<IntegrityCheckResult[]>

// Get audit logs
SicknessIntegrityMonitor.getAuditLogs(limit?: number): Promise<AuditLog[]>

// Get data quality metrics
SicknessIntegrityMonitor.getDataQualityMetrics(): Promise<QualityMetrics>
```

### Database Functions

```sql
-- Calculate working days (PostgreSQL)
SELECT calculate_working_days('2025-09-22', '2025-09-26', 'employee-uuid');

-- Run integrity check
SELECT * FROM run_sickness_integrity_check();
```

## Troubleshooting Guide

### Common Issues

1. **Working Days Mismatch**
   - Check employee work pattern is correct
   - Verify date format (YYYY-MM-DD expected)
   - Review audit logs for automatic corrections

2. **Import Discrepancies**
   - Use import preview to validate before processing
   - Check CSV date format consistency
   - Verify employee work patterns are set up

3. **Database Integrity Issues**
   - Run `run_sickness_integrity_check()` function
   - Review `sickness_audit_log` table
   - Check for missing work patterns

### Debugging Steps

1. **Check Calculations:**
   ```typescript
   console.log(countWorkingDaysBetween(startDate, endDate, workPattern))
   ```

2. **Verify Work Pattern:**
   ```sql
   SELECT * FROM work_patterns WHERE employee_id = 'uuid';
   ```

3. **Review Audit Logs:**
   ```sql
   SELECT * FROM sickness_audit_log WHERE employee_id = 'uuid' ORDER BY created_at DESC;
   ```

## Maintenance

### Daily Tasks
- Review integrity check results
- Monitor audit dashboard for new issues
- Verify data quality metrics

### Weekly Tasks  
- Analyze audit trends
- Review resolved issues
- Update work patterns as needed

### Monthly Tasks
- Comprehensive data quality review
- Test coverage analysis
- Performance optimization review

## Code Review Checklist

When making changes to date/working days calculations:

- [ ] Does it handle all work pattern types?
- [ ] Are edge cases tested (weekends, single days, ongoing)?
- [ ] Is the calculation consistent between frontend/backend?
- [ ] Are discrepancies logged for audit?
- [ ] Does it maintain backward compatibility?
- [ ] Are error scenarios gracefully handled?
- [ ] Is the change covered by tests?

## Future Enhancements

1. **Machine Learning Detection**
   - Pattern recognition for systematic errors
   - Predictive data quality scoring

2. **Advanced Reporting**
   - Trend analysis dashboards
   - Automated quality reports

3. **Real-time Alerts**
   - Email notifications for critical issues
   - Slack integration for team alerts

4. **Mobile Optimization**
   - Working days calculator mobile app
   - Offline calculation capabilities