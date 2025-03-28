import { NextRequest, NextResponse } from "next/server";
import { 
  getAllCoaches, 
  getUserCoaches, 
  createCustomCoach, 
  updateUserCoach,
  getUserCurrentCoach 
} from "@/lib/services/coach-service";

// In a real app, this would come from auth
const MOCK_USER_ID = "mock-user-id";

// GET /api/coaches
export async function GET(req: NextRequest) {
  try {
    // In a real app, this would verify the session
    const userId = MOCK_USER_ID;
    const coaches = await getUserCoaches(userId);
    
    return NextResponse.json(coaches);
  } catch (error) {
    console.error("Error getting coaches:", error);
    return NextResponse.json(
      { error: "Failed to get coaches" },
      { status: 500 }
    );
  }
}

// POST /api/coaches - Create a custom coach
export async function POST(req: NextRequest) {
  try {
    // In a real app, this would verify the session
    const userId = MOCK_USER_ID;
    const data = await req.json();

    // Add the user ID to the coach data
    data.createdBy = userId;
    
    const coach = await createCustomCoach(data);
    
    return NextResponse.json(coach, { status: 201 });
  } catch (error) {
    console.error("Error creating coach:", error);
    return NextResponse.json(
      { error: "Failed to create coach" },
      { status: 500 }
    );
  }
} 