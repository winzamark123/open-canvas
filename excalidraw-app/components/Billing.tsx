import * as React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "./ui/card";
import { cn } from "../lib/utils";

// Mock invoice data - replace with Stripe integration later
interface Invoice {
  id: string;
  date: string;
  description: string;
  status: "Paid" | "Pending" | "Failed";
  amount: number;
  currency: string;
  invoiceUrl?: string;
}

const mockInvoices: Invoice[] = [
  {
    id: "1",
    date: "Sep 09, 2025",
    description: "Cursor Usage for August 2025",
    status: "Paid",
    amount: 0.0,
    currency: "USD",
    invoiceUrl: "#",
  },
  {
    id: "2",
    date: "Sep 09, 2025",
    description: "Cursor Usage for July 2025",
    status: "Paid",
    amount: 0.0,
    currency: "USD",
    invoiceUrl: "#",
  },
];

interface BillingProps {
  invoices?: Invoice[];
  onManageSubscription?: () => void;
}

export const Billing: React.FC<BillingProps> = ({
  invoices = mockInvoices,
  onManageSubscription,
}) => {
  const handleManageSubscription = () => {
    // TODO: Implement subscription management with Stripe
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
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardAction>
          <Button onClick={handleManageSubscription} variant="outline">
            Manage Subscription
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 px-4 text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="pb-3 px-4 text-sm font-medium text-muted-foreground">
                  Description
                </th>
                <th className="pb-3 px-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="pb-3 px-4 text-sm font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="pb-3 px-4 text-sm font-medium text-muted-foreground">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="py-4 px-4 text-sm text-foreground">
                    {invoice.date}
                  </td>
                  <td className="py-4 px-4 text-sm text-foreground">
                    {invoice.description}
                  </td>
                  <td
                    className={cn(
                      "py-4 px-4 text-sm font-medium",
                      getStatusColor(invoice.status),
                    )}
                  >
                    {invoice.status}
                  </td>
                  <td className="py-4 px-4 text-sm text-foreground">
                    {invoice.amount.toFixed(2)} {invoice.currency}
                  </td>
                  <td className="py-4 px-4 text-sm">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoices.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No invoices found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
