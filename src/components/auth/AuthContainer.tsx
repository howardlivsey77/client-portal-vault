import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

interface AuthContainerProps {
  onSuccess: (userId: string) => Promise<void>;
}

export const AuthContainer = ({ onSuccess }: AuthContainerProps) => {
  return (
    <Card className="w-full max-w-md shadow-lg animate-fade-in">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-semibold">Login</CardTitle>
      </CardHeader>
      
      <LoginForm onSuccess={onSuccess} />
    </Card>
  );
};
