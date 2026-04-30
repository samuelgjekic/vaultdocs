import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listSpaces } from "@/api/spaces";

const Index = () => {
  const { data, isLoading } = useQuery({ queryKey: ["spaces"], queryFn: listSpaces });

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const first = data?.[0];
  if (!first) return <Navigate to="/setup" replace />;
  return <Navigate to={`/${first.org_slug}/${first.slug}`} replace />;
};

export default Index;
