// Update task filtering
const completedTasks = tasks.filter(task => task.completed);
const incompleteTasks = tasks.filter(task => !task.completed);

// Update task sorting by stage
const sortByStage = (a: Task, b: Task) => {
  const stageOrder = {
    "Refinement": 0,
    "Breakdown": 1,
    "Planning": 2,
    "Execution": 3,
    "Reflection": 4
  };
  return stageOrder[a.stage] - stageOrder[b.stage];
}; 