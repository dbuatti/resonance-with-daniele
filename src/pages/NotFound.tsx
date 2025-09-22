import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 bg-card rounded-xl shadow-lg">
        <h1 className="text-5xl font-bold mb-4 font-lora text-primary">Oops!</h1>
        <p className="text-xl text-foreground mb-6">Looks like this page hit a wrong note.</p>
        <Link to="/" className="text-primary hover:text-primary/80 underline text-lg">
          Let's get you back to the choir!
        </Link>
      </div>
    </div>
  );
};

export default NotFound;