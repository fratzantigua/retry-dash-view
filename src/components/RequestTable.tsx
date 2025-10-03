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
  error_notes: string;
}

export const RequestTable = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://n8n.n-compass.online/webhook/requests-api-error",
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

  const handleRetry = async (requestId: string) => {
    setRetryingIds((prev) => new Set(prev).add(requestId));
    toast({
      title: "Retrying Request...",
      description: `Attempting to retry request ${requestId}.`,
    });

    try {
      const response = await fetch(
        "https://n8n.n-compass.online/webhook-test/retry-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requestId }),
        },
      );

      if (!response.ok) {
        throw new Error(`API returned with status: ${response.status}`);
      }

      setRetryingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      setSuccessIds((prev) => new Set(prev).add(requestId));

      toast({
        title: "Retry Successful",
        description: `Request ${requestId} has been successfully retried.`,
      });
    } catch (e) {
      setRetryingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred.";
      toast({
        title: "Retry Failed",
        description: `Failed to retry request ${requestId}. Reason: ${errorMessage}`,
        variant: "destructive",
      });
      console.error("Failed to retry request:", e);
    }
  };

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(/[\s_]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
            <TableHead className="font-semibold text-foreground">
              Error
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
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Loading failed requests...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-destructive">
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
                <TableCell className="text-red-500">
                  {toTitleCase(request.error_notes)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetry(request.request_id)}
                    disabled={retryingIds.has(request.request_id) || successIds.has(request.request_id)}
                    className="gap-2"
                  >
                    {successIds.has(request.request_id) ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold">Success</span>
                    ) : (
                      <>
                        <RotateCw className={`h-4 w-4 ${retryingIds.has(request.request_id) ? 'animate-spin' : ''}`} />
                        {retryingIds.has(request.request_id) ? 'Retrying...' : 'Retry'}
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
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
