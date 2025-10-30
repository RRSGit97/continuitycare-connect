import { Button } from "@/components/ui/button";
import { Activity, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-6 animate-pulse">
            <Activity className="h-16 w-16 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
            ContinuityLink
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
            Post-operative tele-care platform for international patients treated in India
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Care Coordination</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">Global</div>
              <div className="text-sm text-muted-foreground">Patient Network</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">Secure</div>
              <div className="text-sm text-muted-foreground">Health Records</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">Expert</div>
              <div className="text-sm text-muted-foreground">Specialists</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
