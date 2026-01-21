import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Calendar, Loader2 } from "lucide-react";
import { useCompanyHolidays } from "../hooks/useCompanyHolidays";
import { getUpcomingUkBankHolidays } from "@/utils/ukBankHolidays";
import type { CompanyHoliday } from "../types/companyHoliday";

const HolidaysSettingsTab = () => {
  const { holidays, settings, loading, saveSettings, addHoliday, deleteHoliday } = useCompanyHolidays();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState<Omit<CompanyHoliday, "id" | "company_id">>({
    name: "",
    date: "",
    rate_override: 3,
    all_day: true,
    is_recurring: false,
  });

  const upcomingBankHolidays = getUpcomingUkBankHolidays(8);

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) return;
    
    await addHoliday(newHoliday);
    setNewHoliday({
      name: "",
      date: "",
      rate_override: 3,
      all_day: true,
      is_recurring: false,
    });
    setDialogOpen(false);
  };

  const getRateBadgeColor = (rate: number) => {
    switch (rate) {
      case 2: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case 3: return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case 4: return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* UK Bank Holidays Settings */}
      <Card>
        <CardHeader>
          <CardTitle>UK Bank Holidays</CardTitle>
          <CardDescription>
            Automatically apply overtime rates to UK public holidays
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use-bank-holidays">Apply UK Bank Holidays</Label>
              <p className="text-sm text-muted-foreground">
                Automatically treat all UK bank holidays as enhanced rate days
              </p>
            </div>
            <Switch
              id="use-bank-holidays"
              checked={settings?.use_uk_bank_holidays ?? true}
              onCheckedChange={(checked) => saveSettings({ use_uk_bank_holidays: checked })}
            />
          </div>

          {settings?.use_uk_bank_holidays && (
            <div className="space-y-2">
              <Label>Bank Holiday Rate</Label>
              <Select
                value={String(settings?.bank_holiday_rate ?? 3)}
                onValueChange={(value) => saveSettings({ bank_holiday_rate: parseInt(value) })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Rate 2</SelectItem>
                  <SelectItem value="3">Rate 3</SelectItem>
                  <SelectItem value="4">Rate 4</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                The overtime rate applied to all UK bank holidays
              </p>
            </div>
          )}

          {settings?.use_uk_bank_holidays && (
            <div className="space-y-2">
              <Label>Upcoming Bank Holidays</Label>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Holiday</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingBankHolidays.map((holiday) => (
                      <TableRow key={holiday.date}>
                        <TableCell className="font-medium">
                          {format(parseISO(holiday.date), "EEE, dd MMM yyyy")}
                        </TableCell>
                        <TableCell>{holiday.name}</TableCell>
                        <TableCell>
                          <Badge className={getRateBadgeColor(settings?.bank_holiday_rate ?? 3)}>
                            Rate {settings?.bank_holiday_rate ?? 3}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Company Holidays */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Custom Company Holidays</CardTitle>
            <CardDescription>
              Add specific dates with custom overtime rates
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Holiday</DialogTitle>
                <DialogDescription>
                  Add a specific date with a custom overtime rate
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="holiday-name">Holiday Name</Label>
                  <Input
                    id="holiday-name"
                    placeholder="e.g., Company Training Day"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holiday-date">Date</Label>
                  <Input
                    id="holiday-date"
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Overtime Rate</Label>
                  <Select
                    value={String(newHoliday.rate_override)}
                    onValueChange={(value) => setNewHoliday(prev => ({ ...prev, rate_override: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Rate 2</SelectItem>
                      <SelectItem value="3">Rate 3</SelectItem>
                      <SelectItem value="4">Rate 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={newHoliday.is_recurring}
                    onCheckedChange={(checked) => 
                      setNewHoliday(prev => ({ ...prev, is_recurring: checked === true }))
                    }
                  />
                  <Label htmlFor="recurring" className="text-sm font-normal">
                    Recurring annually (same date each year)
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddHoliday} disabled={!newHoliday.name || !newHoliday.date}>
                  Add Holiday
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {holidays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No custom holidays configured</p>
              <p className="text-sm">Add company-specific holidays that should use enhanced overtime rates</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Recurring</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">
                        {format(parseISO(holiday.date), "EEE, dd MMM yyyy")}
                      </TableCell>
                      <TableCell>{holiday.name}</TableCell>
                      <TableCell>
                        <Badge className={getRateBadgeColor(holiday.rate_override)}>
                          Rate {holiday.rate_override}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {holiday.is_recurring ? (
                          <Badge variant="outline">Yearly</Badge>
                        ) : (
                          <span className="text-muted-foreground">One-time</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => holiday.id && deleteHoliday(holiday.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HolidaysSettingsTab;
