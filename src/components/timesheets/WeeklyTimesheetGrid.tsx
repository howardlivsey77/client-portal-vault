
import { format } from 'date-fns';
import { WeeklyTimesheetDay } from '@/hooks/useEmployeeTimesheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTimesheetContext } from './TimesheetContext';

interface WeeklyTimesheetGridProps {
  timesheet: WeeklyTimesheetDay[];
}

export const WeeklyTimesheetGrid = ({ timesheet }: WeeklyTimesheetGridProps) => {
  const { setActualTime } = useTimesheetContext();

  const handleActualTimeChange = (
    dayString: string,
    type: 'actualStart' | 'actualEnd',
    value: string
  ) => {
    const mappedType = type === 'actualStart' ? 'startTime' : 'endTime';
    setActualTime(dayString, mappedType, value || null);
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Day</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Scheduled Start</TableHead>
            <TableHead>Scheduled End</TableHead>
            <TableHead>Actual Start</TableHead>
            <TableHead>Actual End</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timesheet.map((day) => (
            <TableRow key={day.dayString}>
              <TableCell className="font-medium">{day.dayName}</TableCell>
              <TableCell>{format(day.date, 'dd/MM/yyyy')}</TableCell>
              <TableCell>
                <Badge 
                  variant={day.isWorking ? "default" : "outline"}
                  className={day.isWorking ? "bg-green-500 hover:bg-green-600" : "text-gray-500"}
                >
                  {day.isWorking ? 'Working' : 'Off'}
                </Badge>
              </TableCell>
              <TableCell>{day.scheduledStart || 'N/A'}</TableCell>
              <TableCell>{day.scheduledEnd || 'N/A'}</TableCell>
              <TableCell>
                {day.isWorking ? (
                  <Input
                    type="time"
                    defaultValue={day.actualStart || ''}
                    onChange={(e) => handleActualTimeChange(day.dayString, 'actualStart', e.target.value)}
                    className="w-32"
                  />
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell>
                {day.isWorking ? (
                  <Input
                    type="time"
                    defaultValue={day.actualEnd || ''}
                    onChange={(e) => handleActualTimeChange(day.dayString, 'actualEnd', e.target.value)}
                    className="w-32"
                  />
                ) : (
                  'N/A'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
