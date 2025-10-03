import { RequestTable } from "@/components/RequestTable";

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Request Management</h1>
          <p className="text-muted-foreground">View and manage all store requests</p>
        </div>
        <RequestTable />
      </div>
    </div>
  );
};

export default Index;
