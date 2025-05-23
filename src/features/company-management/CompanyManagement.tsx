
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Building } from "lucide-react";
import { CompanyHeader } from "./components/CompanyHeader";
import { CompanyList } from "./components/CompanyList";
import { CompanyForm } from "./components/CompanyForm";
import { DeleteCompanyDialog } from "./components/DeleteCompanyDialog";
import { useCompanyManagement } from "./hooks/useCompanyManagement";
import { Company } from "@/types/company";

const CompanyManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { 
    companies,
    loading,
    fetchCompanies,
    handleDeleteCompany
  } = useCompanyManagement();

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.trading_as?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenForm = (company?: Company) => {
    if (company) {
      setCurrentCompany(company);
    } else {
      setCurrentCompany(null);
    }
    setIsFormOpen(true);
  };

  const confirmDelete = (company: Company) => {
    setCurrentCompany(company);
    setIsDeleteDialogOpen(true);
  };

  return (
    <PageContainer>
      <div className="flex flex-col space-y-6">
        <CompanyHeader onAddCompany={() => handleOpenForm()} />

        <CompanyList 
          companies={filteredCompanies} 
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onEdit={handleOpenForm}
          onDelete={confirmDelete}
        />
      </div>

      {/* Company Form Dialog */}
      <CompanyForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        company={currentCompany}
        onSuccess={fetchCompanies}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCompanyDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        company={currentCompany}
        onDelete={() => {
          if (currentCompany) {
            handleDeleteCompany(currentCompany.id);
            setIsDeleteDialogOpen(false);
          }
        }}
      />
    </PageContainer>
  );
};

export default CompanyManagement;
