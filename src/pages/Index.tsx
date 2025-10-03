import { RequestTable } from "@/components/RequestTable";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const handleRetryAll = () => {
    toast({
      title: "Retry all initiated",
      description: "Retrying all requests",
    });
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Request Management</h1>
            <p className="text-muted-foreground">View and manage all store requests</p>
          </div>
          <Button onClick={handleRetryAll} className="gap-2">
            <RotateCw className="h-4 w-4" />
            Retry All
          </Button>
        </div>
        <RequestTable />
      </div>
    </div>
  );
};

export default Index;
