
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, UserCog } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSecurityTab } from "@/components/profile/ProfileSecurityTab";
import { ProfileGeneralTab } from "@/components/profile/ProfileGeneralTab";

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  if (loading) {
    return (
      <PageContainer title="Profile">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Profile">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <UserCog className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-semibold">Profile Settings</h1>
        </div>

        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">
              <div className="flex items-center">
                <ShieldCheck className="h-4 w-4 mr-1" />
                Security
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <ProfileGeneralTab />
          </TabsContent>
          
          <TabsContent value="security">
            <ProfileSecurityTab />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default Profile;
