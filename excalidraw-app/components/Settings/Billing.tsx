import * as React from "react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { SettingsContent } from "./SettingsContent";
import { cn } from "../../lib/utils";

export interface Invoice {
  id: string;
  date: string;
  description: string;
  status: "Paid" | "Pending" | "Failed";
  amount: number;
  currency: string;
  invoiceUrl?: string;
}

interface BillingProps {
  invoices?: Invoice[];
  loading?: boolean;
  error?: string | null;
  onManageSubscription?: () => void;
}

export const Billing: React.FC<BillingProps> = ({
  invoices = [],
  loading = false,
  error = null,
  onManageSubscription,
}) => {
  const handleManageSubscription = () => {
    onManageSubscription?.();
  };

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "Paid":
        return "text-green-600 dark:text-green-400";
      case "Pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "Failed":
        return "text-red-600 dark:text-red-400";
      default:
        return "";
    }
  };

  return (
    <SettingsContent
      title="Invoices"
      loading={loading}
      error={error}
      action={
        <Button
          onClick={handleManageSubscription}
          variant="outline"
          disabled={loading}
          className="cursor-pointer"
        >
          Manage Subscription
        </Button>
      }
    >
      {!loading && !error && invoices.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No invoices found.</p>
        </div>
      ) : !loading && !error ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.date}</TableCell>
                <TableCell>{invoice.description}</TableCell>
                <TableCell
                  className={cn("font-medium", getStatusColor(invoice.status))}
                >
                  {invoice.status}
                </TableCell>
                <TableCell>
                  {invoice.amount.toFixed(2)} {invoice.currency}
                </TableCell>
                <TableCell>
                  {invoice.invoiceUrl && (
                    <a
                      href={invoice.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      View
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </SettingsContent>
  );
};
