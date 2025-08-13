import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image } from "lucide-react";
import { Control } from "react-hook-form";
import { CompanyFormValues } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers/CompanyProvider";
import { toast } from "@/hooks/use-toast";

interface LogoUploadSectionProps {
  control: Control<CompanyFormValues>;
}

export const LogoUploadSection = ({ control }: LogoUploadSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const { currentCompany } = useCompany();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentCompany) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or SVG image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create file path with company ID
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentCompany.id}/logo.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // Update company record
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', currentCompany.id);

      if (updateError) {
        throw updateError;
      }

      setCurrentLogoUrl(publicUrl);
      toast({
        title: "Logo uploaded successfully",
        description: "Your company logo has been updated.",
      });

    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentCompany) return;

    try {
      // Update company record to remove logo_url
      const { error } = await supabase
        .from('companies')
        .update({ logo_url: null })
        .eq('id', currentCompany.id);

      if (error) {
        throw error;
      }

      setCurrentLogoUrl(null);
      toast({
        title: "Logo removed",
        description: "Your company logo has been removed.",
      });

    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        title: "Remove failed",
        description: "There was an error removing your logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <h3 className="text-lg font-medium mb-4">Company Logo</h3>
      
      <div className="space-y-4">
        {/* Current Logo Preview */}
        {(currentLogoUrl || currentCompany?.logo_url) && (
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="w-16 h-16 border rounded-md flex items-center justify-center overflow-hidden bg-muted">
              <img 
                src={currentLogoUrl || currentCompany?.logo_url || ''} 
                alt="Company logo" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Current Logo</p>
              <p className="text-xs text-muted-foreground">
                Recommended size: 300x100px
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveLogo}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        )}

        {/* Upload Section */}
        <div className="space-y-2">
          <FormLabel>Upload Logo</FormLabel>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/svg+xml"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="logo-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('logo-upload')?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Choose Logo'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: JPG, PNG, SVG. Max size: 2MB. Recommended: 300x100px
          </p>
        </div>
      </div>
    </>
  );
};