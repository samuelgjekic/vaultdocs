import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
    <p className="text-7xl font-bold text-primary mb-2">404</p>
    <h1 className="text-xl font-semibold mb-1">Page not found</h1>
    <p className="text-sm text-muted-foreground mb-6">The page you’re looking for doesn’t exist or was moved.</p>
    <Button asChild><Link to="/">Go home</Link></Button>
  </div>
);

export default NotFound;
