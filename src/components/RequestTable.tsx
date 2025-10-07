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
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { supabase } from "@/integrations/supabase/client";

interface RequestData {
  request_id: string;
  store_name: string;
  date: string;
  error_notes: string;
  status: string; // This field must exist in the fetched data
}

type RequestStatus = "Pending" | "Failed" | "Retrying" | "Retry Successful";

// Helper function to determine UI status from request data
const getStatusFromRequest = (
  request: Partial<RequestData>,
  currentStatus?: RequestStatus,
): RequestStatus => {
  let calculatedStatus: RequestStatus = "Pending";
  if (request.status === "error") {
    calculatedStatus = "Failed";
  } else if (request.status === "success" || request.status === "Exporting") {
    calculatedStatus = "Retry Successful";
  }

  // Do not override "Retrying" status with an ambiguous real-time update
  if (currentStatus === "Retrying" && calculatedStatus === "Pending") {
    return "Retrying";
  }

  // "Pending" is only for initial load. For real-time updates, ambiguous statuses default to "Failed".
  if (currentStatus && calculatedStatus === "Pending") {
    return "Failed";
  }

  return calculatedStatus;
};

export type RequestTableRef = {
  handleRetryAll: () => void;
};

export const RequestTable = forwardRef<RequestTableRef>((_, ref) => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetryingAll, setIsRetryingAll] = useState(false);
  const [requestStatuses, setRequestStatuses] = useState<{
    [key: string]: RequestStatus;
  }>({});

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "https://n8n.n-compass.online/webhook/requests-api-error",
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      setRequests(data);

      const initialStatuses = data.reduce(
        (acc: { [key: string]: RequestStatus }, request: RequestData) => {
          acc[request.request_id] = getStatusFromRequest(request);
          return acc;
        },
        {},
      );
      setRequestStatuses(initialStatuses);
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
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const channel = supabase.channel("requests-realtime-updates");

    channel
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "requests" },
        (payload) => {
          const updatedRequest = payload.new as RequestData;

          // We use the functional update form to get the latest state without stale closures
          setRequestStatuses((currentStatuses) => {
            const isTracked = currentStatuses.hasOwnProperty(
              updatedRequest.request_id,
            );
            const newUiStatus = getStatusFromRequest(
              updatedRequest,
              currentStatuses[updatedRequest.request_id],
            );

            // If a request is already being tracked, just update its status.
            if (isTracked) {
              console.log(
                `🔔 Request ${updatedRequest.request_id} status changed → ${newUiStatus}`,
              );
              return {
                ...currentStatuses,
                [updatedRequest.request_id]: newUiStatus,
              };
            }

            // If it's not tracked, check if it's a new failure we should start tracking.
            if (!isTracked && newUiStatus === "Failed") {
              console.log(
                `✨ Newly failed request, adding to table → ${updatedRequest.request_id}`,
              );
              // Ensure the request has a date before adding it
              const requestToAdd = {
                ...updatedRequest,
                date:
                  updatedRequest.date ||
                  new Date().toLocaleString().split(",")[0],
              };
              // Add the request to the table display
              setRequests((currentRequests) => [
                requestToAdd,
                ...currentRequests,
              ]);
              // And add its status to the status map
              return {
                ...currentStatuses,
                [updatedRequest.request_id]: newUiStatus,
              };
            }

            // Otherwise, it's an update for a request we don't care about, so do nothing.
            return currentStatuses;
          });
        },
      )
      .subscribe((status) => {
        console.log("📡 Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRetryAll = async () => {
    setIsRetryingAll(true);

    // Immediately update UI to show "Retrying" for all requests
    const retryingStatuses = requests.reduce(
      (acc: { [key: string]: RequestStatus }, request) => {
        acc[request.request_id] = "Retrying";
        return acc;
      },
      {},
    );
    setRequestStatuses(retryingStatuses);

    try {
      const response = await fetch(
        "https://n8n.n-compass.online/webhook/retry-all-request",
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Retry All Initiated",
        description: "All requests queued. Watching for live status updates.",
      });
      // We no longer call fetchRequests(). The real-time listener will handle updates.
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred.";
      console.error("Failed to retry all requests:", e);
      toast({
        title: "Retry All Failed",
        description: `Failed to retry all requests. Reason: ${errorMessage}`,
        variant: "destructive",
      });
      // On failure, revert back to the original state
      await fetchRequests();
    } finally {
      setIsRetryingAll(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleRetryAll,
  }));

  const handleRetry = async (requestId: string, storeName: string) => {
    setRequestStatuses((prev) => ({ ...prev, [requestId]: "Retrying" }));

    try {
      const response = await fetch(
        "https://n8n.n-compass.online/webhook/retry-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ request_id: requestId }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.response === "success") {
        toast({
          title: "Retry Successful",
          description: `Request for ${storeName} has been successfully retried.`,
        });
        setRequestStatuses((prev) => ({
          ...prev,
          [requestId]: "Retry Successful",
        }));
      } else {
        throw new Error(
          `API returned an unexpected response: ${JSON.stringify(result)}`,
        );
      }
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred.";
      console.error("Failed to retry request:", e);
      toast({
        title: "Retry Failed",
        description: `Failed to retry request for ${storeName}. Reason: ${errorMessage}`,
        variant: "destructive",
      });
      setRequestStatuses((prev) => ({ ...prev, [requestId]: "Failed" }));
    }
  };

  const toPascalCase = (str: string) => {
    if (!str) return "";
    return str
      .split(/[\s_-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusColor = (status: RequestStatus | undefined) => {
    switch (status) {
      case "Retry Successful":
        return "text-green-500";
      case "Retrying":
        return "text-yellow-500";
      case "Pending":
        return "text-blue-500";
      case "Failed":
        return "text-red-500";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="w-full rounded-lg border border-border bg-card shadow-lg backdrop-blur-sm animate-fade-in">
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
            <TableHead className="font-semibold text-foreground">
              Status
            </TableHead>
            <TableHead className="text-left font-semibold text-foreground">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Loading failed requests...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-destructive">
                Error loading data: {error}
              </TableCell>
            </TableRow>
          ) : requests.length > 0 ? (
            requests.map((request) => {
              const status = requestStatuses[request.request_id];
              const isRetrying = status === "Retrying";
              const isSuccessful = status === "Retry Successful";

              return (
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
                    {toPascalCase(request.error_notes)}
                  </TableCell>
                  <TableCell
                    className={`font-medium ${getStatusColor(status)}`}
                  >
                    {status}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleRetry(request.request_id, request.store_name)
                      }
                      disabled={isRetrying || isSuccessful}
                      className="gap-2 float-left"
                    >
                      {isRetrying ? (
                        <RotateCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCw className="h-4 w-4" />
                      )}
                      {isRetrying ? "Retrying..." : "Retry"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
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
});
