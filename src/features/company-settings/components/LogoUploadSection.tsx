import { useState } from "react";
import { FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2 } from "lucide-react";
import { Control } from "react-hook-form";
import { CompanyFormValues } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers";
import { toast } from "@/hooks";
import { processLogoImage, formatFileSize } from "@/utils/imageProcessor";

interface LogoUploadSectionProps {
  control: Control<CompanyFormValues>;
}

export const LogoUploadSection = ({ control }: LogoUploadSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [processingInfo, setProcessingInfo] = useState<string | null>(null);
  const { currentCompany } = useCompany();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentCompany) return;

    // Accept more formats - we'll convert them
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml',
      'image/webp', 'image/bmp', 'image/gif'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a JPG, PNG, SVG, WebP, BMP, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    // Allow larger files since we'll compress them
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingInfo("Processing image...");

    try {
      // Process the image (resize, convert, compress)
      const processed = await processLogoImage(file);
      
      // Show optimization info
      if (processed.originalSize !== processed.processedSize) {
        setProcessingInfo(
          `Optimized: ${formatFileSize(processed.originalSize)} → ${formatFileSize(processed.processedSize)}`
        );
      } else {
        setProcessingInfo(null);
      }

      setIsProcessing(false);
      setIsUploading(true);

      // Create file path with company ID
      const fileExt = processed.fileName.split('.').pop();
      const fileName = `${currentCompany.id}/logo.${fileExt}`;

      // Upload processed image to storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, processed.blob, {
          upsert: true,
          contentType: processed.blob.type
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL with cache-busting
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Update company record
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: urlWithCacheBust })
        .eq('id', currentCompany.id);

      if (updateError) {
        throw updateError;
      }

      setCurrentLogoUrl(urlWithCacheBust);
      toast({
        title: "Logo uploaded successfully",
        description: processed.originalSize !== processed.processedSize
          ? `Image optimized from ${formatFileSize(processed.originalSize)} to ${formatFileSize(processed.processedSize)}`
          : "Your company logo has been updated.",
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
      setIsProcessing(false);
      // Reset the input
      event.target.value = '';
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
      setProcessingInfo(null);
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

  const isLoading = isProcessing || isUploading;

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
              disabled={isLoading}
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
              accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp,image/bmp,image/gif"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
              id="logo-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('logo-upload')?.click()}
              disabled={isLoading}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Logo
                </>
              )}
            </Button>
            {processingInfo && (
              <span className="text-xs text-muted-foreground">{processingInfo}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: JPG, PNG, SVG, WebP, BMP, GIF. Max size: 10MB. Images will be automatically optimized.
          </p>
        </div>
      </div>
    </>
  );
};