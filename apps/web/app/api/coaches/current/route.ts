import { NextRequest, NextResponse } from "next/server";
import { 
  getUserCurrentCoach,
  updateUserCoach
} from "@/lib/services/coach-service";

// In a real app, this would come from auth
const MOCK_USER_ID = "mock-user-id";

// GET /api/coaches/current - Get current coach
export async function GET(req: NextRequest) {
  try {
    // In a real app, this would verify the session 
    const userId = MOCK_USER_ID;
    
    const coach = await getUserCurrentCoach(userId);
    
    return NextResponse.json(coach || { notSelected: true });
  } catch (error) {
    console.error("Error getting current coach:", error);
    return NextResponse.json(
      { error: "Failed to get current coach" },
      { status: 500 }
    );
  }
}

// PUT /api/coaches/current - Update current coach
export async function PUT(req: NextRequest) {
  try {
    // In a real app, this would verify the session
    const userId = MOCK_USER_ID;
    
    const { coachId } = await req.json();
    
    if (!coachId) {
      return NextResponse.json(
        { error: "Coach ID is required" },
        { status: 400 }
      );
    }
    
    const updatedProfile = await updateUserCoach(userId, coachId);
    const coach = await getUserCurrentCoach(userId);
    
    return NextResponse.json(coach);
  } catch (error) {
    console.error("Error updating current coach:", error);
    return NextResponse.json(
      { error: "Failed to update current coach" },
      { status: 500 }
    );
  }
} 