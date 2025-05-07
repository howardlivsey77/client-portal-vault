
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormSubmitButtonProps {
  loading: boolean;
}

export const FormSubmitButton = ({ loading }: FormSubmitButtonProps) => {
  return (
    <Button type="submit" disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        "Send Invitation"
      )}
    </Button>
  );
};
