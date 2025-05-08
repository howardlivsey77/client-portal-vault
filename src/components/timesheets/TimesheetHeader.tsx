
import { ArrowLeft, ArrowLeftCircle, ArrowRightCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addWeeks, subWeeks } from "date-fns";
import { Employee } from "@/hooks/useEmployees";
import { useTimesheetContext } from "./TimesheetContext";

interface TimesheetHeaderProps {
  employee: Employee | null;
  prevEmployeeId: string | null;
  nextEmployeeId: string | null;
  navigateToEmployeeTimesheet: (id: string | null) => void;
}

export const TimesheetHeader = ({
  employee,
  prevEmployeeId,
  nextEmployeeId,
  navigateToEmployeeTimesheet,
}: TimesheetHeaderProps) => {
  const { currentWeekStartDate, setCurrentWeekStartDate } = useTimesheetContext();

  const weekEndDate = addWeeks(currentWeekStartDate, 1);
  weekEndDate.setDate(weekEndDate.getDate() - 1); // Last day of the week

  const handlePrevWeek = () => {
    setCurrentWeekStartDate(subWeeks(currentWeekStartDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStartDate(addWeeks(currentWeekStartDate, 1));
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="mr-2"
            disabled={!prevEmployeeId} 
            onClick={() => navigateToEmployeeTimesheet(prevEmployeeId)}
            title="Previous Employee"
          >
            <ArrowLeftCircle className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-bold">
            {employee ? `${employee.first_name} ${employee.last_name}` : "Select Employee"}
          </h2>
          
          <Button variant="outline" size="icon" className="ml-2"
            disabled={!nextEmployeeId} 
            onClick={() => navigateToEmployeeTimesheet(nextEmployeeId)}
            title="Next Employee"
          >
            <ArrowRightCircle className="h-4 w-4" />
          </Button>
        </div>
      
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={handlePrevWeek} className="mr-1">
            <ArrowLeftCircle className="h-4 w-4 mr-1" />
            Prev Week
          </Button>
          
          <div className="flex items-center mx-2">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="font-medium">
              {format(currentWeekStartDate, 'dd/MM/yyyy')} - {format(weekEndDate, 'dd/MM/yyyy')}
            </span>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleNextWeek} className="ml-1">
            Next Week
            <ArrowRightCircle className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
