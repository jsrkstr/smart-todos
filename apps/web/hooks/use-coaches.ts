import { Coach } from "@prisma/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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
      setCoaches(prevCoaches => [...prevCoaches, newCoach]);
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

  useEffect(() => {
    fetchCoaches();
  }, []);

  return {
    coaches,
    loading,
    error,
    fetchCoaches,
    createCustomCoach,
  };
} 