import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { WizardStepIndicator } from "./WizardStepIndicator";
import { PersonalDetailsStep } from "./steps/PersonalDetailsStep";
import { EmploymentInfoStep } from "./steps/EmploymentInfoStep";
import { PayStep } from "./steps/PayStep";
import { EmployeeYtdStep } from "./steps/EmployeeYtdStep";
import { HmrcStep } from "./steps/HmrcStep";
import { PensionStep } from "./steps/PensionStep";
import { useNewEmployeeWizard, WIZARD_STEPS } from "@/hooks/employees/useNewEmployeeWizard";
import { useDepartments } from "@/hooks";
import { ChevronLeft, ChevronRight, Loader2, UserPlus } from "lucide-react";
import { useEffect } from "react";

interface NewEmployeeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const NewEmployeeWizard = ({ open, onOpenChange, onSuccess }: NewEmployeeWizardProps) => {
  const {
    form,
    currentStep,
    totalSteps,
    steps,
    isSubmitting,
    completedSteps,
    nextStep,
    prevStep,
    submitForm,
    resetWizard,
  } = useNewEmployeeWizard();

  // Fetch departments at wizard level to avoid timing issues when step 2 mounts
  const { departments, loading: departmentsLoading, fetchDepartments } = useDepartments();

  // Refetch departments when dialog opens if they're empty
  useEffect(() => {
    if (open && departments.length === 0 && !departmentsLoading) {
      fetchDepartments();
    }
  }, [open]);

  // Reset wizard when dialog closes
  useEffect(() => {
    if (!open) {
      resetWizard();
    }
  }, [open, resetWizard]);

  const handleNext = async () => {
    await nextStep();
  };

  const handleSubmit = async () => {
    const success = await submitForm(() => {
      onOpenChange(false);
      onSuccess?.();
    });
    return success;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PersonalDetailsStep form={form} />;
      case 2:
        return <EmploymentInfoStep form={form} departments={departments} departmentsLoading={departmentsLoading} />;
      case 3:
        return <PayStep form={form} />;
      case 4:
        return <EmployeeYtdStep form={form} />;
      case 5:
        return <HmrcStep form={form} />;
      case 6:
        return <PensionStep form={form} />;
      default:
        return null;
    }
  };

  const currentStepInfo = steps[currentStep - 1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="h-5 w-5" />
            Add New Employee
          </DialogTitle>
          <DialogDescription>
            Complete the steps below to add a new employee to your organization.
          </DialogDescription>
        </DialogHeader>

        <WizardStepIndicator steps={WIZARD_STEPS} currentStep={currentStep} completedSteps={completedSteps} />

        {/* Step Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{currentStepInfo.title}</h3>
          <p className="text-sm text-muted-foreground">{currentStepInfo.description}</p>
        </div>

        {/* Form Content */}
        <Form {...form}>
          <form className="space-y-4 min-h-[420px]">
            {renderStepContent()}
          </form>
        </Form>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            {currentStep < totalSteps ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Employee
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
