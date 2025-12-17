import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";
import { useBrand } from "@/brand/BrandProvider";

interface AuthContainerProps {
  onSuccess: (userId: string) => Promise<void>;
}

export const AuthContainer = ({ onSuccess }: AuthContainerProps) => {
  const brand = useBrand();
  
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-16">
      <Card className="w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={brand.logoUrl} 
              alt={`${brand.name} Logo`} 
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
