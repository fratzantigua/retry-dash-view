import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RotateCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RequestData {
  id: string;
  date: string;
  requestId: string;
  storeName: string;
}

const sampleData: RequestData[] = [
  {
    id: "1",
    date: "2025-10-01",
    requestId: "REQ-001-2025",
    storeName: "Downtown Electronics",
  },
  {
    id: "2",
    date: "2025-10-02",
    requestId: "REQ-002-2025",
    storeName: "Urban Fashion Hub",
  },
  {
    id: "3",
    date: "2025-10-02",
    requestId: "REQ-003-2025",
    storeName: "Green Market Groceries",
  },
  {
    id: "4",
    date: "2025-10-03",
    requestId: "REQ-004-2025",
    storeName: "Tech Solutions Pro",
  },
  {
    id: "5",
    date: "2025-10-03",
    requestId: "REQ-005-2025",
    storeName: "Artisan Coffee & Books",
  },
];

export const RequestTable = () => {
  const handleRetry = (requestId: string, storeName: string) => {
    toast({
      title: "Retry initiated",
      description: `Retrying request ${requestId} for ${storeName}`,
    });
  };

  return (
    <div className="w-full rounded-lg border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="font-semibold text-foreground">Date</TableHead>
            <TableHead className="font-semibold text-foreground">Request ID</TableHead>
            <TableHead className="font-semibold text-foreground">Store Name</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleData.map((request) => (
            <TableRow 
              key={request.id}
              className="border-border hover:bg-muted/50 transition-colors"
            >
              <TableCell className="font-medium text-foreground">
                {request.date}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {request.requestId}
              </TableCell>
              <TableCell className="text-foreground">
                {request.storeName}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRetry(request.requestId, request.storeName)}
                  className="gap-2"
                >
                  <RotateCw className="h-4 w-4" />
                  Retry
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
