
import { Button } from "@/components/ui/button";

export const HasAccessRedirect = () => {
  return (
    <>
      <p className="text-green-800">You already have company access. Redirecting to dashboard...</p>
      <div className="mt-4 flex justify-center">
        <Button onClick={() => window.location.href = "/"}>
          Go to Dashboard
        </Button>
      </div>
    </>
  );
};
