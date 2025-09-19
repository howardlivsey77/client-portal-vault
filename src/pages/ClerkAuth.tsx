import { SignIn, SignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ClerkAuth = () => {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-16">
        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/3fca6e51-90f5-44c9-ae11-38b6db5ee9a0.png" 
            alt="Dootsons Logo" 
            className="h-28 md:h-32" 
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-lg border border-border",
                }
              }}
              routing="path"
              path="/auth"
              redirectUrl="/"
            />
          </TabsContent>
          
          <TabsContent value="signup" className="mt-6">
            <SignUp 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-lg border border-border",
                }
              }}
              routing="path"
              path="/auth"
              redirectUrl="/"
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default ClerkAuth;