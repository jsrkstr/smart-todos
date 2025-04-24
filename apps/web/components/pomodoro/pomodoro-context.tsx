import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { createContext, useContext } from 'react';

type PomodoroContextType = ReturnType<typeof usePomodoroTimer>;

const PomodoroTimerContext = createContext<PomodoroContextType | null>(null);

export const PomodoroTimerProvider = ({ children }) => {
  const timer = usePomodoroTimer();

  return (
    <PomodoroTimerContext.Provider value={timer}>
      {children}
    </PomodoroTimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(PomodoroTimerContext);
  if (!context) throw new Error("usePomodoroTimer must be used within PomodoroTimerProvider");
  return context;
};
