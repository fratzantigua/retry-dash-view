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
import { useEffect, useState } from "react";

interface RequestData {
  request_id: string;
  store_name: string;
  date: string;
}

export const RequestTable = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://n8n.n-compass.online/webhook-test/requests-api-error",
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRequests(data);
        setError(null);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unexpected error occurred.");
        }
        console.error("Failed to fetch requests:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleRetry = (requestId: string, storeName: string) => {
    toast({
      title: "Retry initiated",
      description: `Retrying request ${requestId} for ${storeName}`,
    });
  };

  return (
    <div className="w-full rounded-lg border border-border bg-card shadow-lg backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="font-semibold text-foreground">
              Date
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Request ID
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Store Name
            </TableHead>
            <TableHead className="text-right font-semibold text-foreground">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                Loading failed requests...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-destructive">
                Error loading data: {error}
              </TableCell>
            </TableRow>
          ) : requests.length > 0 ? (
            requests.map((request) => (
              <TableRow
                key={request.request_id}
                className="border-border hover:bg-muted/50 transition-colors"
              >
                <TableCell className="font-medium text-foreground">
                  {request.date}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {request.request_id}
                </TableCell>
                <TableCell className="text-foreground">
                  {request.store_name}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleRetry(request.request_id, request.store_name)
                    }
                    className="gap-2"
                  >
                    <RotateCw className="h-4 w-4" />
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No failed requests found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
