
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "@/providers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Settings, LogOut, User, Building, Plus } from "lucide-react";
import CompanySelector from "./CompanySelector";

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("");

  useEffect(() => {
    // Extract the current page from location
    const path = location.pathname;
    if (path === "/") {
      setCurrentPage("Dashboard");
    } else if (path.startsWith("/employees")) {
      setCurrentPage("Employees");
    } else {
      // Capitalize the first letter and remove hyphens
      const page = path.split("/")[1];
      setCurrentPage(
        page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, " ")
      );
    }
  }, [location]);

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <img
                  className="h-10 w-auto"
                  src="/lovable-uploads/3fca6e51-90f5-44c9-ae11-38b6db5ee9a0.png"
                  alt="Dootsons"
                />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === "Dashboard"
                    ? "border-teal-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/employees"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === "Employees"
                    ? "border-teal-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Employees
              </Link>
              <Link
                to="/payroll-processing"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === "Payroll-processing"
                    ? "border-teal-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Payroll
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Add Company Quick Button */}
            {user && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                onClick={() => navigate("/settings/companies")}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Company
              </Button>
            )}
            
            {/* Company Selector - Only show when logged in */}
            {user && <CompanySelector className="mr-2" />}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{user.email}</span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings/company/general">Company Settings</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Admin</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to="/settings/companies">
                          <Building className="mr-2 h-4 w-4" />
                          Company Management
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/invites">Invitations</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-500">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline">
                <Link to="/auth">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
