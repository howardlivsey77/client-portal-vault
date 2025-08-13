
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Upload, FileText, Users, CheckCircle, AlertCircle, Clock, X, Search, Filter, UserCheck, UserX, Download, ArrowLeft, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/hooks/useEmployees";
import { useSicknessSchemes } from "@/features/company-settings/hooks/useSicknessSchemes";
import { PageContainer } from "@/components/layout/PageContainer";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import Fuse from 'fuse.js';

// Types for sickness import
interface SicknessRecord {
  employeeName: string;
  sicknessDays: number;
  startDate?: string;
  endDate?: string;
  reason?: string;
  schemeAllocation?: string;
  isCertified?: boolean;
  notes?: string;
}

interface ProcessedSicknessRecord extends SicknessRecord {
  id: string;
  matchedEmployeeId: string | null;
  matchedSchemeName: string | null;
  status: 'ready' | 'needs_attention' | 'skipped';
  confidence?: number;
  suggestions?: Array<{
    id: string;
    name: string;
    confidence: number;
    payrollId?: string;
  }>;
}

const SicknessImport = () => {
  // File handling states
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'complete'>('upload');
  
  const navigate = useNavigate();
  
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
    
    // Combine and deduplicate results
    const allResults = [...results, ...payrollResults];
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.item.id === result.item.id)
    );
    
    return uniqueResults
      .sort((a, b) => (a.score || 0) - (b.score || 0))
      .slice(0, 5)
      .map(result => ({
        id: result.item.id,
        name: `${result.item.last_name}, ${result.item.first_name}`,
        confidence: Math.round((1 - (result.score || 0)) * 100),
        payrollId: result.item.payroll_id
      }));
  };

  const findSchemeMatch = (schemeName: string) => {
    if (!schemeName) return null;
    
    const results = schemeFuse.search(schemeName);
    if (results.length > 0 && results[0].score! < 0.4) {
      return results[0].item.name;
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
        .filter(row => row[employeeNameIndex] && row[sicknessDaysIndex])
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

          // Find scheme match
          const matchedSchemeName = findSchemeMatch(schemeAllocation);

          // Determine status
          let status: 'ready' | 'needs_attention' | 'skipped' = 'ready';
          if (!bestEmployeeMatch || (schemeAllocation && !matchedSchemeName)) {
            status = 'needs_attention';
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

        // Create actual sickness record
        const sicknessRecord = {
          employee_id: record.matchedEmployeeId!,
          company_id: employeeData?.company_id || null,
          start_date: record.startDate ? new Date(record.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          end_date: record.endDate ? new Date(record.endDate).toISOString().split('T')[0] : null,
          total_days: record.sicknessDays,
          is_certified: record.isCertified || false,
          certification_required_from_day: 8, // Default value
          reason: record.reason || null,
          notes: record.notes || null
        };

        await supabase
          .from('employee_sickness_records')
          .insert(sicknessRecord);

        processed++;
        setImportProgress((processed / total) * 100);
      }

      setCurrentStep('complete');
      toast({
        title: "Import completed successfully",
        description: `Created ${processed} sickness records and updated employee schemes`
      });

    } catch (error) {
      console.error('Error importing records:', error);
      toast({
        title: "Error during import",
        description: "Some records may not have been imported correctly",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter records based on search and status
  const filteredRecords = sicknessRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: sicknessRecords.length,
    ready: sicknessRecords.filter(r => r.status === 'ready').length,
    needsAttention: sicknessRecords.filter(r => r.status === 'needs_attention').length,
    skipped: sicknessRecords.filter(r => r.status === 'skipped').length
  };

  // Filter employees to only include those with valid IDs (not empty strings)
  const validEmployees = employees.filter(emp => emp.id && emp.id.trim() !== '');

  return (
    <PageContainer title="Import Sickness Records">
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/employees">Employees</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Sickness Import</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/employees')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Button>
        </div>

        {/* Description */}
        <div>
          <p className="text-muted-foreground">Upload and process employee sickness data with scheme allocation</p>
        </div>

      {/* Step Indicator */}
      <div className="flex items-center space-x-4">
        <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            1
          </div>
          <span>Upload File</span>
        </div>
        <div className="w-8 border-t border-muted" />
        <div className={`flex items-center space-x-2 ${currentStep === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            2
          </div>
          <span>Review & Map</span>
        </div>
        <div className="w-8 border-t border-muted" />
        <div className={`flex items-center space-x-2 ${currentStep === 'complete' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === 'complete' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            3
          </div>
          <span>Complete</span>
        </div>
      </div>

      {/* Upload Section */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Sickness Records File
            </CardTitle>
            <CardDescription>
              Upload an Excel file containing employee sickness records and scheme allocations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Choose Excel file</p>
                <p className="text-sm text-muted-foreground">
                  File should contain columns for employee name, sickness days, and optionally scheme allocation
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-4"
                disabled={isProcessing}
              >
                Select File
              </Button>
            </div>

            {file && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{file.name}</span>
                    <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                  </div>
                  <Button
                    onClick={() => setFile(null)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing file...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}

            {file && !isProcessing && (
              <Button onClick={processFile} className="w-full">
                Process File
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Section */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center p-4">
                <Users className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-4">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.ready}</p>
                  <p className="text-sm text-muted-foreground">Ready to Import</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-4">
                <AlertCircle className="h-8 w-8 text-amber-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.needsAttention}</p>
                  <p className="text-sm text-muted-foreground">Needs Attention</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-4">
                <Clock className="h-8 w-8 text-gray-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.skipped}</p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Records</SelectItem>
                      <SelectItem value="ready">Ready to Import</SelectItem>
                      <SelectItem value="needs_attention">Needs Attention</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skip-unmatched-employees"
                      checked={skipAllUnmatched}
                      onCheckedChange={handleToggleSkipAllUnmatched}
                    />
                    <label htmlFor="skip-unmatched-employees" className="text-sm font-medium cursor-pointer">
                      Skip all unmatched employees
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skip-unmatched-schemes"
                      checked={schemeSkipAllUnmatched}
                      onCheckedChange={handleSchemeToggleSkipAllUnmatched}
                    />
                    <label htmlFor="skip-unmatched-schemes" className="text-sm font-medium cursor-pointer">
                      Skip all unmatched schemes
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sickness Records Review</CardTitle>
              <CardDescription>
                Review and manually map employees and schemes as needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Matched Employee</TableHead>
                    <TableHead>Sickness Days</TableHead>
                    <TableHead>Scheme Allocation</TableHead>
                    <TableHead>Matched Scheme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge 
                          variant={
                            record.status === 'ready' ? 'default' :
                            record.status === 'needs_attention' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {record.status === 'ready' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ready
                            </>
                          ) : record.status === 'needs_attention' ? (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Needs Attention
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Skipped
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="font-medium">
                        {record.employeeName}
                        {record.confidence && (
                          <div className="text-xs text-muted-foreground">
                            Match: {record.confidence}%
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Select
                          value={record.matchedEmployeeId || "no-match"}
                          onValueChange={(value) => 
                            handleManualEmployeeMapping(record.id, value === "no-match" ? null : value)
                          }
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-match">No match found</SelectItem>
                            {record.suggestions?.map((suggestion) => (
                              <SelectItem key={suggestion.id} value={suggestion.id}>
                                <div className="flex flex-col">
                                  <span>{suggestion.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {suggestion.confidence}% match
                                    {suggestion.payrollId && ` • ID: ${suggestion.payrollId}`}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                            {validEmployees
                              .filter(emp => !record.suggestions?.some(s => s.id === emp.id))
                              .slice(0, 10)
                              .map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {employee.last_name}, {employee.first_name}
                                  {employee.payroll_id && (
                                    <span className="text-xs text-muted-foreground"> • ID: {employee.payroll_id}</span>
                                  )}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>{record.sicknessDays}</TableCell>
                      
                      <TableCell>
                        {record.schemeAllocation || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      
                      <TableCell>
                        {record.schemeAllocation ? (
                          <Select
                            value={record.matchedSchemeName || "no-match"}
                            onValueChange={(value) => 
                              handleManualSchemeMapping(record.id, value === "no-match" ? null : value)
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-match">No match found</SelectItem>
                              {schemes.map((scheme) => (
                                <SelectItem key={scheme.id} value={scheme.name}>
                                  {scheme.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Import Actions */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('upload')}
              disabled={isProcessing}
            >
              Back to Upload
            </Button>
            <div className="space-x-2">
              <Button 
                variant="outline"
                onClick={() => {
                  // Export unmatched records
                  const unmatchedRecords = sicknessRecords.filter(r => r.status === 'needs_attention');
                  console.log('Unmatched records:', unmatchedRecords);
                  toast({
                    title: "Export functionality",
                    description: "Export feature would download unmatched records for review"
                  });
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Unmatched
              </Button>
              <Button 
                onClick={handleImport}
                disabled={isProcessing || stats.ready === 0}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Import {stats.ready} Records
              </Button>
            </div>
          </div>

          {isProcessing && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing records...</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Complete Section */}
      {currentStep === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Import Complete
            </CardTitle>
            <CardDescription>
              Sickness records have been successfully imported and employee schemes updated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Import completed successfully. Employee sickness schemes have been updated based on the imported data.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center">
              <Button 
                onClick={() => {
                  setCurrentStep('upload');
                  setSicknessRecords([]);
                  setFile(null);
                  setImportProgress(0);
                }}
              >
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </PageContainer>
  );
};

export default SicknessImport;
