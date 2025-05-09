
import React from 'react';
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, FileText, Download } from "lucide-react";

const PayrollProcessing = () => {
  return (
    <PageContainer title="Payroll Processing">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Payroll Processing</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Payroll Run Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Run Payroll
              </CardTitle>
              <CardDescription>
                Process payroll for the current pay period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate payroll based on approved timesheets, approved leaves, and any additional payments.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Receipt className="mr-2 h-4 w-4" />
                Start Payroll Run
              </Button>
            </CardFooter>
          </Card>
          
          {/* Reports Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Payroll Reports
              </CardTitle>
              <CardDescription>
                Generate and download payroll reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access payslips, tax summaries, and other payroll-related reports.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </CardFooter>
          </Card>
          
          {/* History Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-purple-600" />
                Payroll History
              </CardTitle>
              <CardDescription>
                Review past payroll transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access historical payroll data, transactions, and adjustments.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                View History
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default PayrollProcessing;
