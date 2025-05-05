
import { formatDate } from "@/lib/formatters";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ChangeTypeIndicator } from "./ChangeTypeIndicator";
import { EmployeeChange } from "./types";
import { useState } from "react";

interface ChangesListProps {
  changes: EmployeeChange[];
}

export function ChangesList({ changes }: ChangesListProps) {
  const isMay5th = (date: string) => date === "2025-05-05";
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Field</TableHead>
          <TableHead>Old Value</TableHead>
          <TableHead>New Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {changes.length > 0 ? (
          changes.map((change) => (
            <TableRow 
              key={`${change.id}`}
              className={isMay5th(change.date) ? "bg-blue-50" : ""}
            >
              <TableCell className={`font-medium ${isMay5th(change.date) ? "font-bold" : ""}`}>
                {formatDate(change.date)}
              </TableCell>
              <TableCell>{change.employeeName}</TableCell>
              <TableCell>
                <ChangeTypeIndicator type={change.type} />
              </TableCell>
              <TableCell>{change.field || '-'}</TableCell>
              <TableCell>
                <span className="text-red-600">{change.oldValue || '-'}</span>
              </TableCell>
              <TableCell>
                <span className="text-green-600">{change.newValue || '-'}</span>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-4 text-monday-gray">
              No employee changes found in the selected date range
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
