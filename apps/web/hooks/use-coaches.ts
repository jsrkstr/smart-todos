import { useState, useEffect } from "react";
import { toast } from "sonner";

// Define Coach interface matching our implementation
interface Coach {
  id: string;
  name: string;
  title?: string | null;
  image?: string | null;
  description?: string | null;
  style?: string | null;
  type: string;
  matchScore?: number | null;
  sampleQuotes: string[];
  principles: string[];
  createdAt: Date;
  updatedAt: Date;
  directness?: number | null;
  encouragementLevel?: number | null;
  coachingStyle?: string | null;
  isActive: boolean;
  createdBy?: string | null;
}

type CustomCoachParams = {
  name: string;
  title?: string;
  description?: string;
  style?: string;
  directness?: number;
  encouragementLevel?: number;
  coachingStyle?: string;
  principles?: string[];
};

export function useCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoaches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/coaches");
      if (!response.ok) {
        throw new Error("Failed to fetch coaches");
      }
      const data = await response.json();
      setCoaches(data);
    } catch (err) {
      console.error("Error fetching coaches:", err);
      setError("Failed to load coaches");
      toast.error("Failed to load coaches");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentCoach = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/coaches/current");
      if (!response.ok) {
        throw new Error("Failed to fetch current coach");
      }
      const data = await response.json();
      if (data && !data.notSelected) {
        setCurrentCoach(data);
      } else {
        setCurrentCoach(null);
      }
    } catch (err) {
      console.error("Error fetching current coach:", err);
      setError("Failed to load current coach");
      toast.error("Failed to load current coach");
    } finally {
      setLoading(false);
    }
  };

  const createCustomCoach = async (coachData: CustomCoachParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/coaches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(coachData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create custom coach");
      }
      
      const newCoach = await response.json();
      setCoaches([...coaches, newCoach]);
      toast.success("Custom coach created successfully");
      return newCoach;
    } catch (err) {
      console.error("Error creating custom coach:", err);
      setError("Failed to create custom coach");
      toast.error("Failed to create custom coach");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const selectCoach = async (coachId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/coaches/current", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coachId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to select coach");
      }
      
      const updatedCoach = await response.json();
      setCurrentCoach(updatedCoach);
      toast.success("Coach selected successfully");
      return updatedCoach;
    } catch (err) {
      console.error("Error selecting coach:", err);
      setError("Failed to select coach");
      toast.error("Failed to select coach");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load coaches and current coach on mount
  useEffect(() => {
    fetchCoaches();
    fetchCurrentCoach();
  }, []);

  return {
    coaches,
    currentCoach,
    loading,
    error,
    fetchCoaches,
    fetchCurrentCoach,
    createCustomCoach,
    selectCoach,
  };
} 