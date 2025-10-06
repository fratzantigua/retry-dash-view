import { useRef } from "react";
import { RequestTable, type RequestTableRef } from "@/components/RequestTable";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

const Index = () => {
  const requestTableRef = useRef<RequestTableRef>(null);

  const handleRetryAll = () => {
    requestTableRef.current?.handleRetryAll();
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Flyer Request Failure Management
            </h1>
            <p className="text-muted-foreground">
              View and manage all flyer requests that have failed.
            </p>
          </div>
          <Button onClick={handleRetryAll} className="gap-2 float-left">
            <RotateCw className="h-4 w-4" />
            Retry All
          </Button>
        </div>
        <RequestTable ref={requestTableRef} />
      </div>
    </div>
  );
};

export default Index;
