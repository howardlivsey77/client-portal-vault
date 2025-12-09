# Import Conventions

This document outlines the import conventions used throughout the codebase to maintain consistency and improve maintainability.

## General Principles

1. **Use barrel files** - Always import from barrel files (`index.ts`) rather than directly from individual files
2. **Use path aliases** - Use `@/` prefix for all imports from the `src` directory
3. **Group imports** - Keep imports organized: external packages first, then internal modules

## Import Patterns

### ✅ Correct Import Patterns

```typescript
// Types - import from @/types
import { Employee, Company, SicknessRecord } from "@/types";

// Hooks - import from @/hooks
import { useToast, useEmployees, useCompany } from "@/hooks";

// Services - import from @/services
import { employeeService, documentService } from "@/services";

// Utils - import from @/utils
import { formatDate, generatePDF, cn } from "@/utils";

// Providers - import from @/providers
import { useAuth, useCompany } from "@/providers";

// Contexts - import from @/contexts
import { useDragDrop, useSidebarContext } from "@/contexts";

// Components - import from feature barrel files
import { EmployeeTable, EmployeeForm } from "@/components/employees";
import { Button, Card, Dialog } from "@/components/ui";
import { Sidebar, Navbar } from "@/components/layout";

// Features - import from @/features
import { CompanyManagement, TimesheetSettings } from "@/features";

// Lib utilities
import { cn, supabase } from "@/lib";
```

### ❌ Avoid Direct File Imports

```typescript
// DON'T do this:
import { Employee } from "@/types/employee-types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { useDragDrop } from "@/contexts/DragDropContext";

// DO this instead:
import { Employee } from "@/types";
import { useToast } from "@/hooks";
import { useAuth } from "@/providers";
import { useDragDrop } from "@/contexts";
```

## Barrel File Locations

| Category | Barrel File | What it exports |
|----------|-------------|-----------------|
| Types | `src/types/index.ts` | All type definitions |
| Hooks | `src/hooks/index.ts` | All custom hooks |
| Services | `src/services/index.ts` | All service modules |
| Utils | `src/utils/index.ts` | All utility functions |
| Providers | `src/providers/index.ts` | Auth and Company providers |
| Contexts | `src/contexts/index.ts` | DragDrop and Sidebar contexts |
| Features | `src/features/index.ts` | Feature modules |
| Lib | `src/lib/index.ts` | Library utilities (cn, supabase) |

## Component Barrel Files

Each component directory should have its own barrel file:

- `src/components/employees/index.ts`
- `src/components/dashboard/index.ts`
- `src/components/payroll/index.ts`
- `src/components/auth/index.ts`
- `src/components/layout/index.ts`
- `src/components/admin/index.ts`
- `src/components/profile/index.ts`
- `src/components/invites/index.ts`
- `src/components/reports/index.ts`
- `src/components/notifications/index.ts`
- `src/components/compliance/index.ts`
- `src/components/companies/index.ts`

## UI Components

Shadcn UI components are imported directly from their files:

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
```

## Adding New Exports

When creating new files:

1. Create your new file in the appropriate directory
2. Add an export to the corresponding barrel file
3. Import from the barrel file in consuming code

### Example: Adding a new hook

```typescript
// 1. Create the hook file
// src/hooks/employees/useNewFeature.ts
export const useNewFeature = () => { ... };

// 2. Add to barrel file
// src/hooks/employees/index.ts
export { useNewFeature } from './useNewFeature';

// 3. Use in components
import { useNewFeature } from "@/hooks";
```

## Migration Status

| Area | Status | Notes |
|------|--------|-------|
| Types (`@/types`) | ✅ Complete | All type imports consolidated |
| Hooks (`@/hooks`) | ✅ Complete | All hook imports consolidated |
| Services (`@/services`) | ✅ Complete | All service imports consolidated |
| Utils (`@/utils`) | ✅ Complete | All util imports consolidated |
| Providers (`@/providers`) | 🔄 In Progress | ~50 files need migration |
| Contexts (`@/contexts`) | 🔄 In Progress | ~7 files need migration |
| Components | ✅ Complete | Barrel files created |
| Features | ✅ Complete | Barrel file created |

## Benefits

1. **Cleaner imports** - Single import statement for multiple exports
2. **Better refactoring** - Internal file structure can change without breaking imports
3. **Discoverability** - Easy to see all available exports in one place
4. **Consistency** - Standard patterns across the codebase
5. **Maintainability** - Easier to manage dependencies

## IDE Support

Modern IDEs will auto-import from barrel files. If your IDE imports directly from files:

1. Check your TypeScript/JavaScript import settings
2. Configure to prefer barrel file imports
3. Use the "Organize Imports" command to clean up
