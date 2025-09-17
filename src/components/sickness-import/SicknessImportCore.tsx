import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Users, CheckCircle, AlertCircle, Clock, X, Search, Filter, UserCheck, UserX, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/hooks/useEmployees";
import { useSicknessSchemes } from "@/features/company-settings/hooks/useSicknessSchemes";
import { parseDate, formatDateForDB } from "@/utils/dateParser";
import * as XLSX from 'xlsx';
import Fuse from 'fuse.js';
import { SicknessImportCoreProps, ProcessedSicknessRecord } from './types';

export const SicknessImportCore = ({ mode = 'standalone', onComplete, onCancel }: SicknessImportCoreProps) => {
  // File handling states
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'complete'>('upload');
  
  // Data states
  const [sicknessRecords, setSicknessRecords] = useState<ProcessedSicknessRecord[]>([]);
  const [skipAllUnmatched, setSkipAllUnmatched] = useState(false);
  const [schemeSkipAllUnmatched, setSchemeSkipAllUnmatched] = useState(false);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'needs_attention' | 'skipped'>('all');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { employees } = useEmployees();
  const { schemes } = useSicknessSchemes();

  // Enhanced fuzzy search setup for employees (surname priority)
  const employeeFuse = new Fuse(employees, {
    keys: [
      { name: 'last_name', weight: 0.7 },
      { name: 'first_name', weight: 0.3 },
      { name: 'payroll_id', weight: 0.5 }
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2
  });

  // Fuzzy search for schemes
  const schemeFuse = new Fuse(schemes, {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true
  });

  // Enhanced name parsing and matching
  const parseEmployeeName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      // Assume last part is surname, everything else is first/middle names
      const surname = parts[parts.length - 1];
      const firstName = parts.slice(0, -1).join(' ');
      return { firstName, surname };
    }
    return { firstName: fullName, surname: '' };
  };

  const findEmployeeMatches = (employeeName: string) => {
    const { firstName, surname } = parseEmployeeName(employeeName);
    
    // Search with surname first for better matching
    const searchQuery = surname ? `${surname} ${firstName}` : firstName;
    const results = employeeFuse.search(searchQuery);
    
    // Also try with payroll ID if the name looks like an ID
    const payrollResults = /^\d+$/.test(employeeName.trim()) 
      ? employeeFuse.search(employeeName.trim()) 
      : [];
    
    // Try more flexible searches if no good matches found
    let flexibleResults: any[] = [];
    if (results.length === 0 || (results[0].score && results[0].score > 0.6)) {
      // Try first name only
      flexibleResults = employeeFuse.search(firstName);
      
      // Try surname only if we have one
      if (surname) {
        const surnameResults = employeeFuse.search(surname);
        flexibleResults = [...flexibleResults, ...surnameResults];
      }
    }
    
    // Combine and deduplicate results
    const allResults = [...results, ...payrollResults, ...flexibleResults];
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.item.id === result.item.id)
    );
    
    const processedResults = uniqueResults
      .sort((a, b) => (a.score || 0) - (b.score || 0))
      .slice(0, 5)
      .map(result => ({
        id: result.item.id,
        name: `${result.item.last_name}, ${result.item.first_name}`,
        confidence: Math.round((1 - (result.score || 0)) * 100),
        payrollId: result.item.payroll_id,
        score: result.score || 0
      }));

    return processedResults;
  };

  const findSchemeMatch = (schemeName: string, employeeId?: string) => {
    // First try to match from import file if scheme is provided
    if (schemeName?.trim()) {
      const results = schemeFuse.search(schemeName);
      if (results.length > 0 && results[0].score! < 0.6) {
        return results[0].item.name;
      }
    }
    
    // Fall back to employee's existing assigned scheme
    if (employeeId) {
      const employee = employees.find(e => e.id === employeeId);
      if (employee?.sickness_scheme_id) {
        const assignedScheme = schemes.find(s => s.id === employee.sickness_scheme_id);
        return assignedScheme?.name || null;
      }
    }
    
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setCurrentStep('upload');
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setImportProgress(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
      const rows = jsonData.slice(1);

      setImportProgress(25);

      // Find column indices
      const employeeNameIndex = headers.findIndex(h => 
        h.includes('name') || h.includes('employee')
      );
      const sicknessDaysIndex = headers.findIndex(h => 
        h.includes('days') || h.includes('sick')
      );
      const schemeIndex = headers.findIndex(h => 
        h.includes('scheme') || h.includes('allocation')
      );
      const startDateIndex = headers.findIndex(h => 
        h.includes('start') && h.includes('date')
      );
      const endDateIndex = headers.findIndex(h => 
        h.includes('end') && h.includes('date')
      );
      const reasonIndex = headers.findIndex(h => 
        h.includes('reason') || h.includes('description')
      );
      const certifiedIndex = headers.findIndex(h => 
        h.includes('certified') || h.includes('certificate')
      );
      const notesIndex = headers.findIndex(h => 
        h.includes('notes') || h.includes('comment')
      );

      if (employeeNameIndex === -1) {
        throw new Error('Could not find employee name column');
      }
      if (sicknessDaysIndex === -1) {
        throw new Error('Could not find sickness days column');
      }

      setImportProgress(50);

      // Process each row with enhanced matching
      const processedRecords: ProcessedSicknessRecord[] = rows
        .filter(row => {
          const nameCell = row[employeeNameIndex];
          const daysCell = row[sicknessDaysIndex];
          const hasName = nameCell !== undefined && nameCell !== null && String(nameCell).trim() !== '';
          const daysNum = Number(daysCell);
          const hasValidDays = !isNaN(daysNum) && daysNum > 0;
          return hasName && hasValidDays;
        })
        .map((row, index) => {
          const employeeName = String(row[employeeNameIndex]).trim();
          const sicknessDays = Number(row[sicknessDaysIndex]) || 0;
          const schemeAllocation = schemeIndex >= 0 ? String(row[schemeIndex] || '').trim() : '';
          const startDate = startDateIndex >= 0 ? String(row[startDateIndex] || '').trim() : '';
          const endDate = endDateIndex >= 0 ? String(row[endDateIndex] || '').trim() : '';
          const reason = reasonIndex >= 0 ? String(row[reasonIndex] || '').trim() : '';
          const isCertified = certifiedIndex >= 0 ? Boolean(row[certifiedIndex]) : false;
          const notes = notesIndex >= 0 ? String(row[notesIndex] || '').trim() : '';

          // Find employee matches
          const employeeMatches = findEmployeeMatches(employeeName);
          const bestEmployeeMatch = employeeMatches.length > 0 ? employeeMatches[0] : null;

          // Find scheme match - try import data first, then fall back to employee's assigned scheme
          const matchedSchemeName = findSchemeMatch(schemeAllocation, bestEmployeeMatch?.id);

          // Determine status - more flexible criteria
          let status: 'ready' | 'needs_attention' | 'skipped' = 'ready';
          let statusReason = '';
          
          if (!bestEmployeeMatch) {
            status = 'needs_attention';
            statusReason = 'No employee match found';
          } else if (bestEmployeeMatch.confidence < 50) {
            status = 'needs_attention';
            statusReason = `Low confidence employee match (${bestEmployeeMatch.confidence}%)`;
          } else if (schemeAllocation && !matchedSchemeName && schemeAllocation.toLowerCase() !== 'none' && schemeAllocation.toLowerCase() !== 'n/a') {
            status = 'needs_attention';
            statusReason = `Scheme "${schemeAllocation}" not found`;
          }

          return {
            id: `record-${index}`,
            employeeName,
            sicknessDays,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            reason: reason || undefined,
            isCertified,
            notes: notes || undefined,
            schemeAllocation: schemeAllocation || undefined,
            matchedEmployeeId: bestEmployeeMatch?.id || null,
            matchedSchemeName,
            status,
            statusReason,
            confidence: bestEmployeeMatch?.confidence,
            suggestions: employeeMatches
          };
        });

      setImportProgress(75);
      setSicknessRecords(processedRecords);
      setImportProgress(100);
      setCurrentStep('review');

      toast({
        title: "File processed successfully",
        description: `Processed ${processedRecords.length} sickness records`
      });

    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk actions
  const handleToggleSkipAllUnmatched = () => {
    const newSkipState = !skipAllUnmatched;
    setSkipAllUnmatched(newSkipState);
    
    setSicknessRecords(records => 
      records.map(record => ({
        ...record,
        status: (newSkipState && !record.matchedEmployeeId) ? 'skipped' : 
                (!newSkipState && record.status === 'skipped' && !record.matchedEmployeeId) ? 'needs_attention' :
                record.status
      }))
    );
  };

  const handleSchemeToggleSkipAllUnmatched = () => {
    const newSkipState = !schemeSkipAllUnmatched;
    setSchemeSkipAllUnmatched(newSkipState);
    
    setSicknessRecords(records => 
      records.map(record => ({
        ...record,
        matchedSchemeName: (newSkipState && record.schemeAllocation && !record.matchedSchemeName) ? "__skip__" :
                          (!newSkipState && record.matchedSchemeName === "__skip__") ? null :
                          record.matchedSchemeName
      }))
    );
  };

  // Manual mapping functions
  const handleManualEmployeeMapping = (recordId: string, employeeId: string | null) => {
    setSicknessRecords(records =>
      records.map(record => {
        if (record.id === recordId) {
          const updatedRecord = {
            ...record,
            matchedEmployeeId: employeeId,
            status: employeeId ? 'ready' as const : 'needs_attention' as const
          };
          return updatedRecord;
        }
        return record;
      })
    );
  };

  const handleManualSchemeMapping = (recordId: string, schemeName: string | null) => {
    setSicknessRecords(records =>
      records.map(record => 
        record.id === recordId 
          ? { ...record, matchedSchemeName: schemeName }
          : record
      )
    );
  };

  // Import functionality
  const handleImport = async () => {
    const readyRecords = sicknessRecords.filter(record => 
      record.status === 'ready' && record.matchedEmployeeId
    );

    if (readyRecords.length === 0) {
      toast({
        title: "No records to import",
        description: "Please ensure at least one record has a matched employee",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);

    try {
      let processed = 0;
      const total = readyRecords.length;

      for (const record of readyRecords) {
        // Update employee's sickness scheme if provided and not skipped
        if (record.matchedSchemeName && record.matchedSchemeName !== "__skip__") {
          const scheme = schemes.find(s => s.name === record.matchedSchemeName);
          if (scheme) {
            await supabase
              .from('employees')
              .update({ sickness_scheme_id: scheme.id })
              .eq('id', record.matchedEmployeeId);
          }
        }

        // Get employee data for company_id
        const { data: employeeData } = await supabase
          .from('employees')
          .select('company_id')
          .eq('id', record.matchedEmployeeId)
          .single();

        // Parse and validate dates
        const startDateParsed = parseDate(record.startDate);
        const endDateParsed = record.endDate ? parseDate(record.endDate) : { date: null, isValid: true, originalValue: null };

        // Skip record if start date is invalid
        if (!startDateParsed.isValid || !startDateParsed.date) {
          console.error(`Skipping record for employee ${record.matchedEmployeeId}: Invalid start date`);
          continue;
        }

        // Skip record if end date is provided but invalid
        if (record.endDate && !endDateParsed.isValid) {
          console.error(`Skipping record for employee ${record.matchedEmployeeId}: Invalid end date`);
          continue;
        }

        // Create actual sickness record
        const sicknessRecord = {
          employee_id: record.matchedEmployeeId!,
          company_id: employeeData?.company_id,
          start_date: formatDateForDB(startDateParsed.date),
          end_date: endDateParsed.date ? formatDateForDB(endDateParsed.date) : null,
          total_days: record.sicknessDays,
          is_certified: record.isCertified || false,
          certification_required_from_day: 8,
          reason: record.reason || null,
          notes: record.notes || null
        };

        const { error: sicknessError } = await supabase
          .from('employee_sickness_records')
          .insert(sicknessRecord);

        if (sicknessError) {
          throw new Error(`Failed to create sickness record: ${sicknessError.message}`);
        }

        processed++;
        setImportProgress((processed / total) * 100);
      }

      setCurrentStep('complete');
      toast({
        title: "Import completed successfully",
        description: `Created ${processed} sickness records and updated employee schemes`
      });

      // Call completion callback for embedded mode
      if (mode === 'embedded' && onComplete) {
        onComplete(processed);
      }

    } catch (error) {
      console.error('Error importing records:', error);
      toast({
        title: "Error during import",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSicknessRecords([]);
    setCurrentStep('upload');
    setImportProgress(0);
    setSkipAllUnmatched(false);
    setSchemeSkipAllUnmatched(false);
    setSearchTerm('');
    setFilterStatus('all');
  };

  // Filter records for display
  const filteredRecords = sicknessRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.reason && record.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Statistics
  const stats = {
    total: sicknessRecords.length,
    ready: sicknessRecords.filter(r => r.status === 'ready').length,
    needsAttention: sicknessRecords.filter(r => r.status === 'needs_attention').length,
    skipped: sicknessRecords.filter(r => r.status === 'skipped').length
  };

  return (
    <div className="space-y-6">
      {/* Upload Step */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Sickness Records
            </CardTitle>
            <CardDescription>
              Upload an Excel or CSV file containing employee sickness records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFileSelect(selectedFile);
                  }}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mb-2"
                >
                  Select File
                </Button>
                <p className="text-sm text-muted-foreground">
                  Accepts .xlsx, .xls, or .csv files
                </p>
              </div>
            </div>

            {file && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <Badge variant="secondary">{Math.round(file.size / 1024)}KB</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required columns:</strong> Employee Name, Sickness Days<br />
                <strong>Optional columns:</strong> Scheme Allocation, Start Date, End Date, Reason, Certified, Notes
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={processFile} 
                disabled={!file || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Process File
                  </>
                )}
              </Button>
              {mode === 'embedded' && onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={importProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Processing... {Math.round(importProgress)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Step */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">{stats.ready}</p>
                    <p className="text-xs text-muted-foreground">Ready to Import</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-2xl font-bold text-warning">{stats.needsAttention}</p>
                    <p className="text-xs text-muted-foreground">Needs Attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold text-muted-foreground">{stats.skipped}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="ready">Ready to Import</SelectItem>
                <SelectItem value="needs_attention">Needs Attention</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-unmatched"
                  checked={skipAllUnmatched}
                  onCheckedChange={handleToggleSkipAllUnmatched}
                />
                <label htmlFor="skip-unmatched" className="text-sm">
                  Skip all unmatched employees
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-schemes"
                  checked={schemeSkipAllUnmatched}
                  onCheckedChange={handleSchemeToggleSkipAllUnmatched}
                />
                <label htmlFor="skip-schemes" className="text-sm">
                  Skip all unmatched schemes
                </label>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Matched Employee</TableHead>
                    <TableHead>Scheme</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.employeeName}</p>
                          {record.reason && (
                            <p className="text-xs text-muted-foreground">{record.reason}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {record.sicknessDays} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={record.matchedEmployeeId || "none"}
                          onValueChange={(value) => 
                            handleManualEmployeeMapping(record.id, value === "none" ? null : value)
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No match</SelectItem>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.last_name}, {emp.first_name}
                                {emp.payroll_id && ` (${emp.payroll_id})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {record.confidence && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Confidence: {record.confidence}%
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={record.matchedSchemeName || "none"}
                          onValueChange={(value) => 
                            handleManualSchemeMapping(record.id, value === "none" ? null : value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select scheme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No scheme</SelectItem>
                            {schemes.map((scheme) => (
                              <SelectItem key={scheme.id} value={scheme.name}>
                                {scheme.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === 'ready' ? 'default' :
                            record.status === 'needs_attention' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {record.status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {record.status === 'needs_attention' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {record.status === 'skipped' && <UserX className="h-3 w-3 mr-1" />}
                          {record.status.replace('_', ' ')}
                        </Badge>
                        {record.statusReason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {record.statusReason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSicknessRecords(records =>
                              records.map(r => 
                                r.id === record.id 
                                  ? { ...r, status: r.status === 'skipped' ? 'needs_attention' : 'skipped' }
                                  : r
                              )
                            );
                          }}
                        >
                          {record.status === 'skipped' ? 'Include' : 'Skip'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={handleImport}
              disabled={isProcessing || stats.ready === 0}
            >
              {isProcessing ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import {stats.ready} Records
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Start Over
            </Button>
            {mode === 'embedded' && onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Importing records... {Math.round(importProgress)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Complete Step */}
      {currentStep === 'complete' && (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-success" />
            <div>
              <h3 className="text-lg font-semibold">Import Completed Successfully</h3>
              <p className="text-muted-foreground">
                Sickness records have been imported and employee schemes updated
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleReset}>
                Import More Records
              </Button>
              {mode === 'embedded' && onComplete && (
                <Button variant="outline" onClick={() => onComplete(stats.ready)}>
                  Continue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};