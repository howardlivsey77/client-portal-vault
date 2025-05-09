
import React, { useState } from 'react';
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, FileText, Download, Calculator } from "lucide-react";
import { PayrollCalculator } from "@/components/payroll/PayrollCalculator";

const PayrollProcessing = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");

  return (
    <PageContainer title="Payroll Processing">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Payroll Processing</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calculator">UK Payroll Calculator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
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
              
              {/* Calculator Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    Payroll Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate UK monthly payroll
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Calculate UK tax, National Insurance, student loans and more for employee payroll.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("calculator")}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Open Calculator
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
          </TabsContent>
          
          <TabsContent value="calculator">
            <PayrollCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default PayrollProcessing;
