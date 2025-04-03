"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Clock, Play, Sparkles, Star, Wand2 } from "lucide-react"
import confetti from "canvas-confetti"

export default function IntroAnimation() {
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [typedText, setTypedText] = useState("")
  const fullText = "Design website homepage"

  // Step messages
  const stepMessages = [
    "", // Step 0 (start)
    "Hey there! I'm Steve, your personal success coach.", // Step 1
    "I'll guide you step by step to turn your goals into reality.", // Step 2
    "Let's start by adding your first to-do.", // Step 3 (Initial task)
    "Next, we'll add key details to make it clear and actionable.", // Step 4 (Task refinement)
    "Then, we'll break it down into smaller, manageable steps.", // Step 5 (Task breakdown)
    "We'll create the best schedule to fit your routine.", // Step 6 (Prioritization)
    "I'll remind you when it's time to take action.", // Step 7 (Task reminder)
    "Boost your focus with the Pomodoro timer.", // Step 8 (Task execution)
    "And of course, we'll celebrate every win—big or small!", // Step 9 (Task completion)
  ]

  // Animation timeline controller
  useEffect(() => {
    if (!isPlaying) return

    const timeline = [
      { step: 1, delay: 0 }, // Coach introduction
      { step: 2, delay: 3000 }, // Process introduction
      { step: 3, delay: 6000 }, // Initial task
      { step: 4, delay: 9000 }, // Task refinement
      { step: 5, delay: 12000 }, // Task breakdown
      { step: 6, delay: 15000 }, // Prioritization
      { step: 7, delay: 18000 }, // Task reminder
      { step: 8, delay: 21000 }, // Task execution
      { step: 9, delay: 24000 }, // Pomodoro timer
      { step: 10, delay: 27000 }, // Celebration
      { step: 0, delay: 30000 }, // Reset
    ]

    const timers = timeline.map(({ step, delay }) => setTimeout(() => setStep(step), delay))

    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [isPlaying, resetKey])

  // Trigger confetti when reaching celebration step
  useEffect(() => {
    if (step === 10) {
      const end = Date.now() + 1000
      const colors = ["#ff0000", "#00ff00", "#0000ff"]

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.6 },
          colors,
        })

        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.6 },
          colors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
    }
  }, [step])

  // Reset animation
  const resetAnimation = () => {
    setStep(0)
    setIsPlaying(true)
    setResetKey((prev) => prev + 1)
  }

  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // Typing effect for task creation
  useEffect(() => {
    if (step === 3) {
      setTypedText("")
      const interval = setInterval(() => {
        setTypedText((prev) => {
          if (prev.length < fullText.length) {
            return fullText.substring(0, prev.length + 1)
          } else {
            clearInterval(interval)
            return prev
          }
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [step])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4"
      onClick={() => {
        if (step === 0) {
          setStep(1)
        } else if (step < 10) {
          setStep(step + 1)
        } else {
          resetAnimation()
        }
      }}
    >
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6 relative">
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={togglePlayPause}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label={isPlaying ? "Pause animation" : "Play animation"}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={resetAnimation}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Reset animation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
          </button>
        </div>

        <h1 className="text-2xl font-bold text-center mb-8">Smart Todo App</h1>

        <div className="relative h-[400px] flex items-center justify-center">
          {/* Step message display */}
          {step > 0 && step <= stepMessages.length && step !== 2 && (
            <motion.div
              className="absolute top-0 left-0 right-0 text-center mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              key={`message-${step}`}
            >
              <p className="text-gray-700 font-medium">{stepMessages[step]}</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Coach Introduction */}
            {step === 1 && (
              <motion.div
                key="coach-intro"
                className="flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 12 }}
              >
                <motion.div
                  className="w-32 h-32 rounded-full bg-blue-100 border-4 border-blue-500 overflow-hidden shadow-lg"
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ type: "spring", damping: 8, delay: 0.2 }}
                >
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Simple avatar face */}
                    <circle cx="100" cy="85" r="40" fill="#FFD8B4" /> {/* Face */}
                    <circle cx="85" cy="75" r="5" fill="#333" /> {/* Left eye */}
                    <circle cx="115" cy="75" r="5" fill="#333" /> {/* Right eye */}
                    <path d="M85 100 Q100 110 115 100" stroke="#333" strokeWidth="3" fill="none" /> {/* Smile */}
                    <path d="M60 50 Q100 30 140 50" stroke="#333" strokeWidth="3" fill="#333" /> {/* Hair */}
                    <rect x="70" y="120" width="60" height="80" fill="#3B82F6" /> {/* Body/shirt */}
                  </svg>
                </motion.div>
                <motion.div
                  className="mt-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-xl font-bold text-blue-700">Steve</h2>
                  <p className="text-sm text-gray-600">Your Personal Success Coach</p>
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Process Introduction */}
            {step === 2 && (
              <motion.div
                key="process-intro"
                className="flex items-center max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-blue-500 overflow-hidden shadow-lg mr-4 flex-shrink-0">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Simple avatar face */}
                    <circle cx="100" cy="85" r="40" fill="#FFD8B4" /> {/* Face */}
                    <circle cx="85" cy="75" r="5" fill="#333" /> {/* Left eye */}
                    <circle cx="115" cy="75" r="5" fill="#333" /> {/* Right eye */}
                    <path d="M85 100 Q100 110 115 100" stroke="#333" strokeWidth="3" fill="none" /> {/* Smile */}
                    <path d="M60 50 Q100 30 140 50" stroke="#333" strokeWidth="3" fill="#333" /> {/* Hair */}
                    <rect x="70" y="120" width="60" height="80" fill="#3B82F6" /> {/* Body/shirt */}
                  </svg>
                </motion.div>
                <motion.div
                  className="bg-blue-100 p-4 rounded-lg rounded-tl-none shadow-md"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-blue-800">I'll guide you step by step to turn your goals into reality.</p>
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: Initial Task Display */}
            {step === 3 && (
              <motion.div
                key="initial-task"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="border-2 border-gray-300 rounded-lg p-4 w-full max-w-md"
              >
                <h2 className="font-semibold text-lg flex items-center">
                  {typedText}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8 }}
                    className="inline-block w-0.5 h-5 bg-black ml-0.5"
                  />
                </h2>
                <p className="text-gray-600 mt-1">Create a responsive design for the company website</p>
              </motion.div>
            )}

            {/* Step 4: Task Refinement */}
            {step === 4 && (
              <motion.div
                key="task-refinement"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full max-w-md"
              >
                <motion.div
                  className="border-2 border-red-400 rounded-lg p-4 w-full"
                  initial={{ borderColor: "#e5e7eb" }}
                  animate={{ borderColor: "#f87171" }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="font-semibold text-lg">Design website homepage</h2>
                  <p className="text-gray-600 mt-1">Create a responsive design for the company website</p>

                  <motion.div
                    className="flex flex-wrap gap-2 mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Design</span>
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Web</span>
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">High Priority</span>
                  </motion.div>
                </motion.div>

                {/* Time estimation circle */}
                <motion.div
                  className="absolute -top-2 -right-2 bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-bold shadow-md z-20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <Clock className="w-4 h-4 absolute opacity-30" />
                  90m
                </motion.div>

                {/* Magic wand animation */}
                <motion.div
                  className="absolute z-10"
                  initial={{ top: -30, left: -30, rotate: -45 }}
                  animate={[
                    { top: -30, left: -30, rotate: -45, transition: { duration: 0 } },
                    { top: 20, left: 20, rotate: 0, transition: { duration: 0.5 } },
                    { top: 20, left: 300, rotate: 0, transition: { duration: 1 } },
                    { top: -30, left: 350, rotate: 45, opacity: 0, transition: { duration: 0.5 } },
                  ]}
                >
                  <div className="bg-yellow-400 p-2 rounded-full shadow-lg">
                    <Wand2 className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 5: Task Breakdown */}
            {step === 5 && (
              <motion.div
                key="task-breakdown"
                className="w-full max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div className="grid grid-cols-2 gap-3">
                  {[
                    { task: "Research competitors", time: 25, priority: "high" },
                    { task: "Create wireframes", time: 30, priority: "medium" },
                    { task: "Design mockups", time: 20, priority: "medium" },
                    { task: "Implement responsive layout", time: 15, priority: "low" },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className={`border-l-4 rounded-lg p-3 relative ${
                        item.priority === "high"
                          ? "border-red-500"
                          : item.priority === "medium"
                            ? "border-yellow-500"
                            : "border-green-500"
                      }`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.15 }}
                    >
                      <p className="font-medium text-sm">{item.task}</p>
                      <motion.div
                        className="absolute -top-2 -right-2 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold shadow-md"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                      >
                        <Clock className="w-3 h-3 absolute opacity-30" />
                        {item.time}m
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Step 6: Prioritization */}
            {step === 6 && (
              <motion.div
                key="prioritization"
                className="w-full max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col space-y-3">
                  {[
                    { task: "Research competitors", time: 25, priority: "high" },
                    { task: "Create wireframes", time: 50, priority: "medium" },
                    { task: "Design mockups", time: 75, priority: "medium" },
                    { task: "Implement responsive layout", time: 100, priority: "low" },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className={`border-l-4 rounded-lg p-3 flex justify-between items-center shadow-sm ${
                        item.priority === "high"
                          ? "border-red-500 bg-red-50"
                          : item.priority === "medium"
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-green-500 bg-green-50"
                      }`}
                      initial={{ x: 200, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        delay: index * 0.15,
                        type: "spring",
                        stiffness: 100,
                        damping: 10,
                      }}
                    >
                      <div>
                        <p className="font-medium text-sm">{item.task}</p>
                        <div className="flex items-center mt-1">
                          <Clock className="w-3 h-3 text-gray-500 mr-1" />
                          <span className="text-xs text-gray-500">{item.time}m</span>
                        </div>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.priority === "high"
                            ? "bg-red-200 text-red-800"
                            : item.priority === "medium"
                              ? "bg-yellow-200 text-yellow-800"
                              : "bg-green-200 text-green-800"
                        }`}
                      >
                        {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 7: Task Reminder */}
            {step === 7 && (
              <motion.div
                key="task-reminder"
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="mx-auto w-64 bg-gray-800 rounded-xl overflow-hidden shadow-lg border-4 border-gray-700"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  {/* Phone status bar */}
                  <div className="bg-black text-white text-xs p-1 flex justify-between items-center">
                    <span>9:41 AM</span>
                    <div className="flex items-center space-x-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-8 5h8" />
                      </svg>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Notification */}
                  <motion.div
                    className="bg-white p-3 m-2 rounded-lg shadow-md"
                    initial={{ x: 300 }}
                    animate={{ x: 0 }}
                    transition={{ type: "spring", damping: 12, delay: 0.3 }}
                  >
                    <div className="flex items-start">
                      <div className="bg-yellow-100 p-2 rounded-full mr-3">
                        <Bell className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-sm">Smart Todo</h3>
                          <span className="text-xs text-gray-500">now</span>
                        </div>
                        <p className="text-xs mt-1">Time to research competitors! (25m)</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Home indicator */}
                  <div className="bg-gray-900 p-1 flex justify-center">
                    <div className="w-10 h-1 bg-gray-600 rounded-full"></div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 8: Task Execution */}
            {step === 8 && (
              <motion.div
                key="task-execution"
                className="w-full max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="border-l-4 border-red-500 rounded-lg p-4 bg-red-50 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Research competitors</h3>
                      <p className="text-sm text-gray-600 mt-1">Analyze top 5 competitor websites</p>
                    </div>
                    <motion.div
                      className="bg-green-500 rounded-full p-2 cursor-pointer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      initial={{ scale: 1 }}
                      animate={{
                        scale: [1, 1.2, 1],
                        transition: { repeat: 1, duration: 0.5, delay: 1 },
                      }}
                    >
                      <Play className="w-5 h-5 text-white" />
                    </motion.div>
                  </div>
                  <motion.div
                    className="absolute -top-3 -right-3 bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <Clock className="w-4 h-4 absolute opacity-30" />
                    25m
                  </motion.div>
                </div>

                {/* Mouse cursor animation */}
                <motion.div
                  className="absolute z-20 pointer-events-none"
                  initial={{ top: 200, right: 200, opacity: 0 }}
                  animate={[
                    { top: 200, right: 200, opacity: 1, transition: { duration: 0.3 } },
                    { top: 120, right: 80, transition: { duration: 0.7, delay: 0.3 } },
                    { top: 120, right: 80, scale: 0.9, transition: { duration: 0.1, delay: 1 } },
                    { top: 120, right: 80, scale: 1, transition: { duration: 0.1, delay: 1.1 } },
                  ]}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4L18 14H10L4 20V4Z" fill="white" stroke="black" strokeWidth="2" />
                  </svg>
                </motion.div>
              </motion.div>
            )}

            {/* Step 9: Pomodoro Timer */}
            {step === 9 && (
              <motion.div
                key="pomodoro-timer"
                className="w-full max-w-md flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="w-32 h-32 rounded-full border-4 border-red-500 flex items-center justify-center relative"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "conic-gradient(#ef4444 0%, transparent 0%)",
                      clipPath: "circle(50% at 50% 50%)",
                    }}
                    animate={{
                      background: [
                        "conic-gradient(#ef4444 0%, transparent 0%)",
                        "conic-gradient(#ef4444 25%, transparent 25%)",
                        "conic-gradient(#ef4444 50%, transparent 50%)",
                        "conic-gradient(#ef4444 75%, transparent 75%)",
                        "conic-gradient(#ef4444 100%, transparent 100%)",
                      ],
                    }}
                    transition={{ duration: 2, ease: "linear" }}
                  />
                  <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center z-10">
                    <motion.span
                      className="text-2xl font-bold"
                      animate={{
                        opacity: [1, 0.7, 1],
                      }}
                      transition={{ duration: 2, repeat: 0 }}
                    >
                      24:00
                    </motion.span>
                  </div>
                </motion.div>
                <motion.p
                  className="mt-4 font-medium text-gray-700"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Research competitors
                </motion.p>
              </motion.div>
            )}

            {/* Step 10: Celebration and Reward */}
            {step === 10 && (
              <motion.div
                key="celebration"
                className="w-full max-w-md flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="relative"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <div className="w-32 h-32 rounded-full bg-yellow-100 border-4 border-yellow-500 flex items-center justify-center">
                    <Star className="w-16 h-16 text-yellow-500" fill="#fbbf24" />
                  </div>
                  <motion.div
                    className="absolute -top-2 -right-2"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <div className="bg-blue-500 rounded-full p-2 shadow-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                </motion.div>
                <motion.div
                  className="mt-4 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="font-bold text-lg text-gray-800">Productivity Streak: 3 Days!</p>
                  <p className="text-sm text-gray-600 mt-1">You've earned 50 points</p>
                </motion.div>
              </motion.div>
            )}

            {/* Step 0: Reset/Initial State */}
            {step === 0 && (
              <motion.div
                key="start-animation"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-xl font-bold mb-4">Smart Todo App Demo</h2>
                <p className="text-gray-600 mb-6">Watch how our app helps you manage tasks efficiently</p>
                <motion.button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-medium shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep(1)}
                >
                  Start Demo
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        {step > 0 && (
          <div className="mt-8">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs font-medium">{Math.min(step, 10)}/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <motion.div
                className="bg-blue-500 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(Math.min(step, 10) / 10) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

