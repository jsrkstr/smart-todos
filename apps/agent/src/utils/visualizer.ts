import { LangChainTracer } from 'langchain/callbacks';
import { StateAnnotation } from '../consts';

/**
 * Creates a visualizer for the langGraph workflow
 * This is useful for debugging and understanding the agent interactions
 */
export const createVisualizer = () => {
  // Only create the visualizer if in development mode
  if (process.env.NODE_ENV === 'development') {
    try {
      return new LangChainTracer();
    } catch (error) {
      console.warn('Failed to initialize visualizer:', error);
      return null;
    }
  }
  return null;
};

/**
 * Logs a state transition to the visualizer
 * @param visualizer The LangChain visualizer instance
 * @param state The current graph state
 * @param step The current step name
 */
export const visualizeState = (
  visualizer: LangChainTracer | null,
  state: typeof StateAnnotation.State,
  step: string
) => {
  if (!visualizer) return;

  try {
    visualizer.log({
      type: 'state',
      name: step,
      data: {
        ...state,
        // Simplify user object to prevent circular references
        user: state.user ? {
          id: state.user.id,
          name: state.user.name,
          email: state.user.email,
          psychProfile: state.user.psychProfile ? {
            productivityTime: state.user.psychProfile.productivityTime,
            communicationPref: state.user.psychProfile.communicationPref,
            taskApproach: state.user.psychProfile.taskApproach,
            difficultyPreference: state.user.psychProfile.difficultyPreference,
            coach: state.user.psychProfile.coach ? {
              name: state.user.psychProfile.coach.name,
              style: state.user.psychProfile.coach.style,
              coachingStyle: state.user.psychProfile.coach.coachingStyle,
            } : null
          } : null
        } : null
      }
    });
  } catch (error) {
    console.warn('Visualization error:', error);
  }
};
