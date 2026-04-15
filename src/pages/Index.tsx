import { useNavigate } from "react-router-dom";
import { Plane, Search, Shield, Luggage, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center bg-gradient-to-b from-sky-100 via-sky-50 to-background py-24 px-4">
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 rounded-full bg-primary text-primary-foreground shadow-lg">
              <Plane className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight mb-4">
            <span className="text-primary">Sky</span>Track
          </h1>
          <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Smart Flight Passenger Luggage Tracking System for Indian Airlines. Track your baggage in real-time from check-in to arrival.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 font-heading gap-2"
              onClick={() => navigate("/track")}
            >
              <Search className="h-4 w-4" />
              Track Baggage
            </Button>
            <Button
              size="lg"
              className="h-12 px-8 font-heading gap-2 bg-primary hover:bg-primary/90"
              onClick={() => navigate("/staff-login")}
            >
              <Shield className="h-4 w-4" />
              Staff Login
            </Button>
          </div>
        </div>
      </section>

      {/* Future Features Section */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold font-heading text-center mb-10">Future Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center border-sky-100">
              <CardContent className="p-8">
                <div className="flex justify-center mb-4">
                  <Luggage className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">Baggage Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time tracking of your checked baggage from check-in counter to arrival carousel.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-sky-100">
              <CardContent className="p-8">
                <div className="flex justify-center mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">Location Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Get SMS and app notifications at every checkpoint in your baggage journey.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-sky-100">
              <CardContent className="p-8">
                <div className="flex justify-center mb-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">Secure & Reliable</h3>
                <p className="text-sm text-muted-foreground">
                  Built for Indian airports with secure PNR verification and data protection.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 SkyTrack — Smart Luggage Tracking for Indian Airlines
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          A prototype demonstration for college project.
        </p>
      </footer>
    </div>
  );
};

export default Index;
