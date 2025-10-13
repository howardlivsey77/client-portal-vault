import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

interface AuthContainerProps {
  onSuccess: (userId: string) => Promise<void>;
}

export const AuthContainer = ({ onSuccess }: AuthContainerProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-16">
      <Card className="w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/3fca6e51-90f5-44c9-ae11-38b6db5ee9a0.png" 
              alt="Dootsons Logo" 
              className="h-28 md:h-32" 
            />
          </div>
          <CardTitle className="text-2xl">Payroll Management Portal</CardTitle>
        </CardHeader>
        
        <LoginForm onSuccess={onSuccess} />
      </Card>
    </div>
  );
};
