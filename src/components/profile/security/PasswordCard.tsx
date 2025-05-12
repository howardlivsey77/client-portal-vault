
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const PasswordCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Update your password to maintain account security
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          For security reasons, you'll need to use the password reset feature to change your password.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Reset Password</Button>
      </CardFooter>
    </Card>
  );
};
