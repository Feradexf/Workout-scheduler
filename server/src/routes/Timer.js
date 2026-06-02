// client/src/components/Timer.js
import { useState, useEffect, useRef } from 'react';

export default function WorkoutTimer({ routine, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const intervalRef = useRef(null);

  const exercises = routine?.exercises || [];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  };

  const startCountdown = (onTickComplete) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (onTickComplete) onTickComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setIsActive(true);
    setIsPaused(false);
  };

  const startExercise = (index) => {
    if (index >= exercises.length) {
      // Workout complete
      if (onComplete) onComplete();
      reset();
      return;
    }
    
    const exercise = exercises[index];
    setCurrentExercise(exercise.name);
    setTimeLeft(exercise.workSec);
    setIsResting(false);
    setExerciseIndex(index);
    
    startCountdown(() => {
      const restSec = exercise.restSec;
      if (restSec > 0) {
        setCurrentExercise('Rest');
        setTimeLeft(restSec);
        setIsResting(true);
        startCountdown(() => startExercise(index + 1));
      } else {
        startExercise(index + 1);
      }
    });
  };

  const startWorkout = () => {
    if (exercises.length === 0) {
      alert('This routine has no exercises!');
      return;
    }
    setExerciseIndex(0);
    startExercise(0);
  };

  const pause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPaused(true);
    setIsActive(false);
  };

  const resume = () => {
    if (timeLeft > 0) {
      startCountdown(() => {
        if (isResting) {
          startExercise(exerciseIndex + 1);
        } else {
          const nextIdx = exerciseIndex + 1;
          if (nextIdx < exercises.length) {
            startExercise(nextIdx);
          } else {
            if (onComplete) onComplete();
            reset();
          }
        }
      });
    }
  };

  const reset = () => {
    stopTimer();
    setTimeLeft(0);
    setCurrentExercise(null);
    setIsResting(false);
    setExerciseIndex(0);
    setIsActive(false);
    setIsPaused(false);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!routine) {
    return (
      <div className="panel">
        <h2>Workout Timer</h2>
        <p>Select a routine to start</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Workout Timer</h2>
      
      <div className="timer-display">
        {timeLeft > 0 ? formatTime(timeLeft) : '00:00'}
      </div>
      
      <div className="current-exercise">
        {currentExercise || 'Ready to start'}
      </div>
      
      <div className="button-group">
        {!isActive && timeLeft === 0 && (
          <button onClick={startWorkout} className="success">
            Start Workout
          </button>
        )}
        
        {isActive && !isPaused && (
          <button onClick={pause}>Pause</button>
        )}
        
        {isPaused && (
          <button onClick={resume}>Resume</button>
        )}
        
        {(isActive || isPaused) && (
          <button onClick={reset} className="danger">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}