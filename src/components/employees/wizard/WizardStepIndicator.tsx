import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandColors } from "@/brand";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface WizardStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: Set<number>;
}

export const WizardStepIndicator = ({ steps, currentStep, completedSteps }: WizardStepIndicatorProps) => {
  const brandColors = useBrandColors();
  
  return (
    <div className="mb-8">
      {/* Mobile view - simplified */}
      <div className="sm:hidden text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
          {completedSteps.has(currentStep) && (
            <Check 
              className="w-4 h-4" 
              style={{ color: `hsl(${brandColors.success})` }}
            />
          )}
        </div>
        <h3 className="font-semibold text-lg">{steps[currentStep - 1]?.title}</h3>
        <p className="text-sm text-muted-foreground">{steps[currentStep - 1]?.description}</p>
      </div>

      {/* Desktop view - full stepper */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.number);
          const isCurrent = currentStep === step.number;
          
          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                    isCurrent && !isCompleted && "border-primary text-primary bg-primary/10",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                  )}
                  style={isCompleted ? { 
                    backgroundColor: `hsl(${brandColors.success})`,
                    borderColor: `hsl(${brandColors.success})`,
                    color: `hsl(${brandColors.successForeground})`
                  } : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden lg:block max-w-[120px]">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "flex-1 h-0.5 mx-4 mt-[-20px]",
                    !completedSteps.has(step.number) && "bg-muted-foreground/30"
                  )}
                  style={completedSteps.has(step.number) ? {
                    backgroundColor: `hsl(${brandColors.success})`
                  } : undefined}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
