
import React from "react";
import { SicknessScheme } from "../../types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit } from "lucide-react";

interface SchemesListProps {
  schemes: SicknessScheme[];
  onEditScheme: (scheme: SicknessScheme) => void;
}

export const SchemesList = ({ schemes, onEditScheme }: SchemesListProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Scheme Name</TableHead>
            <TableHead>Number of Rules</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schemes.map((scheme) => (
            <TableRow key={scheme.id}>
              <TableCell className="font-medium">{scheme.name}</TableCell>
              <TableCell>{scheme.eligibilityRules?.length || 0}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => onEditScheme(scheme)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
