// Initialize variables for tracking
let lastMouseMoveTime = Date.now();
let lastMouseX = 0;
let lastMouseY = 0;
let lastOptionChangeTime = Date.now();
let optionChangeCount = 0;
let lastActivityTime = Date.now();

// State durations tracking (in milliseconds)
let restlessDuration = 0;
let confusedDuration = 0;
let boredDuration = 0;

// Timestamps for state tracking
let restlessStartTime = null;
let confusedStartTime = null;
let boredStartTime = null;

// Flags to avoid repetitive alerts
let isRestless = false;
let isConfused = false;
let isBored = false;

// Quiz variables
let quizStarted = false;
let quizEnded = false;
let quizStartTime = null; // Fixed start time for the quiz

// Restlessness detection variables - simplified to just rapid movement
const restlessTime = 3000; // 3 seconds

// Rapid movement detection
let rapidMovementStart = null; // When rapid movement started
let lastRapidMovementTime = 0; // Track when we last detected rapid movement
const rapidMovementCooldown = 1000; // 1 second cooldown for rapid movement

// Reset times on page load
window.addEventListener("load", () => {
    lastMouseMoveTime = Date.now();
    lastOptionChangeTime = Date.now();
    lastActivityTime = Date.now();
    
    // Start the quiz when the page loads
    startQuiz();
});

// Element references
const restlessIndicator = document.querySelector("#restless-indicator span");
const confusedIndicator = document.querySelector("#confused-indicator span");
const boredIndicator = document.querySelector("#bored-indicator span");

// Counter for mousemove events to detect rapid movement
let mouseMoveCounter = 0;
let lastMovementCheck = Date.now();

// Detect Restlessness (ONLY Rapid Cursor Movement)
window.addEventListener("mousemove", (event) => {
    if (quizEnded) return;
    
    lastActivityTime = Date.now();
    const now = Date.now();
    
    // Increment move counter - used to detect rapid movements
    mouseMoveCounter++;
    
    // DETECT RAPID CURSOR MOVEMENT
    // Check mousemove frequency every 500ms
    if (now - lastMovementCheck >= 500) {
        // If we're getting more than 25 mousemove events per 500ms, consider it rapid movement
        // Increased threshold from 10 to 25 to reduce false positives
        if (mouseMoveCounter > 25) {
            lastRapidMovementTime = now;
            
            if (rapidMovementStart === null) {
                rapidMovementStart = now;
            } 
            // If rapid movement has continued for restlessTime (3 seconds)
            else if (now - rapidMovementStart >= restlessTime && !isRestless) {
                setRestlessState(true);
            }
        } else {
            // Movement not rapid enough
            // Only reset the timer if we've passed the cooldown period
            if (now - lastRapidMovementTime > rapidMovementCooldown) {
                rapidMovementStart = null;
            }
        }
        
        // Reset counter and update check time
        mouseMoveCounter = 0;
        lastMovementCheck = now;
    }
    
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
});

// Function to set restless state
function setRestlessState(state) {
    // If state is changing, update tracking
    if (state !== isRestless) {
        if (state) {
            // Starting restless state
            restlessStartTime = Date.now();
        } else if (restlessStartTime !== null) {
            // Ending restless state, add to duration
            restlessDuration += (Date.now() - restlessStartTime);
            restlessStartTime = null;
        }
    }
    
    isRestless = state;
    if (state) {
        restlessIndicator.textContent = "Detected";
        restlessIndicator.parentElement.classList.add("active-state");
        
        // Automatically reset after 5 seconds to avoid persistent detection
        setTimeout(() => {
            if (isRestless) {
                setRestlessState(false);
                // Don't reset rapid movement timer right away
                // This allows for smoother transitions between states
                setTimeout(() => {
                    rapidMovementStart = null;
                }, rapidMovementCooldown);
            }
        }, 5000);
    } else {
        restlessIndicator.textContent = "Not detected";
        restlessIndicator.parentElement.classList.remove("active-state");
        // Add cooldown before resetting to prevent flickering
        setTimeout(() => {
            rapidMovementStart = null;
        }, rapidMovementCooldown);
    }
}

// Detect Confusion (Frequent MCQ Switching)
const confusionThreshold = 3000; // 3 seconds
const confusionCount = 3; // Number of changes within threshold to trigger confusion

function setupRadioListeners() {
    document.querySelectorAll("input[type='radio']").forEach(option => {
        option.addEventListener("change", () => {
            if (quizEnded) return;
            
            lastActivityTime = Date.now();
            
            // Calculate time since last option change
            const now = Date.now();
            
            if (now - lastOptionChangeTime < confusionThreshold) {
                optionChangeCount++;
            } else {
                optionChangeCount = 1;
            }
            
            lastOptionChangeTime = now;

            if (optionChangeCount >= confusionCount && !isConfused) {
                setConfusedState(true);
                
                // Reset confusion after 5 seconds if no more changes
                setTimeout(() => {
                    if (Date.now() - lastOptionChangeTime > confusionThreshold) {
                        setConfusedState(false);
                    }
                }, 5000);
            }
        });
    });
}

// Setup radio listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', setupRadioListeners);

// Function to set confused state
function setConfusedState(state) {
    // If state is changing, update tracking
    if (state !== isConfused) {
        if (state) {
            // Starting confused state
            confusedStartTime = Date.now();
        } else if (confusedStartTime !== null) {
            // Ending confused state, add to duration
            confusedDuration += (Date.now() - confusedStartTime);
            confusedStartTime = null;
        }
    }
    
    isConfused = state;
    if (state) {
        confusedIndicator.textContent = "Detected";
        confusedIndicator.parentElement.classList.add("active-state");
    } else {
        isConfused = false;
        optionChangeCount = 0;
        confusedIndicator.textContent = "Not detected";
        confusedIndicator.parentElement.classList.remove("active-state");
    }
}

// Detect Boredom (No Activity)
const boredThreshold = 10000; // 10 seconds of inactivity

function checkInactivity() {
    if (quizEnded) return;
    
    const now = Date.now();
    if (now - lastActivityTime > boredThreshold && !isBored) {
        setBoredState(true);
    } else if (now - lastActivityTime <= boredThreshold && isBored) {
        setBoredState(false);
    }
}

// Function to set bored state
function setBoredState(state) {
    // If state is changing, update tracking
    if (state !== isBored) {
        if (state) {
            // Starting bored state
            boredStartTime = Date.now();
        } else if (boredStartTime !== null) {
            // Ending bored state, add to duration
            boredDuration += (Date.now() - boredStartTime);
            boredStartTime = null;
        }
    }
    
    isBored = state;
    if (state) {
        boredIndicator.textContent = "Detected";
        boredIndicator.parentElement.classList.add("active-state");
    } else {
        boredIndicator.textContent = "Not detected";
        boredIndicator.parentElement.classList.remove("active-state");
    }
}

// Check for inactivity every second
setInterval(checkInactivity, 1000);

// Update activity time for key events
["keydown", "click"].forEach(eventType => {
    window.addEventListener(eventType, () => {
        lastActivityTime = Date.now();
    });
});

// Start the quiz and timer
function startQuiz() {
    quizStarted = true;
    quizEnded = false;
    
    // Set a fixed start time for the quiz
    quizStartTime = Date.now();
    
    // Reset state durations
    restlessDuration = 0;
    confusedDuration = 0;
    boredDuration = 0;
    
    // Quiz timer (5 minutes = 300000ms)
    setTimeout(endQuiz, 300000);
    
    // Start timer UI update
    updateTimerDisplay();
}

// Format time as mm:ss
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update timer display
function updateTimerDisplay() {
    if (!quizStarted || quizEnded) return;
    
    // Use fixed quizStartTime instead of lastActivityTime for timer calculations
    const elapsed = Date.now() - quizStartTime;
    const remaining = Math.max(0, 300000 - elapsed);
    
    const timerElement = document.getElementById('quiz-timer');
    if (timerElement) {
        timerElement.textContent = formatTime(remaining);
        
        // Warn when less than 1 minute remains
        if (remaining < 60000) {
            timerElement.classList.add('timer-warning');
        }
    }
    
    if (remaining > 0) {
        requestAnimationFrame(updateTimerDisplay);
    } else {
        endQuiz('Time is up!');
    }
}

// End the quiz and calculate results
function endQuiz(message = 'Quiz Submitted!') {
    if (quizEnded) return;
    quizEnded = true;
    
    // Stop timer updates
    const timerElement = document.getElementById('quiz-timer');
    if (timerElement) {
        timerElement.textContent = "00:00";
        timerElement.classList.remove('timer-warning');
    }
    
    // Finalize state durations by adding current active states
    if (isRestless && restlessStartTime !== null) {
        restlessDuration += (Date.now() - restlessStartTime);
    }
    if (isConfused && confusedStartTime !== null) {
        confusedDuration += (Date.now() - confusedStartTime);
    }
    if (isBored && boredStartTime !== null) {
        boredDuration += (Date.now() - boredStartTime);
    }
    
    // Calculate score
    const score = calculateScore();
    const totalQuestions = 5;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    // Store quiz results in localStorage to be accessed by results page
    const quizResults = {
        message: message,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        restlessDuration: formatTime(restlessDuration),
        confusedDuration: formatTime(confusedDuration),
        boredDuration: formatTime(boredDuration)
    };
    
    // Save results to localStorage
    localStorage.setItem('quizResults', JSON.stringify(quizResults));
    
    // Redirect to results page
    window.location.href = '/results.html';
}

// Calculate quiz score
function calculateScore() {
    let score = 0;
    const answers = {
        q1: "C", // Heisenberg Uncertainty Principle
        q2: "A", // Niels Bohr 
        q3: "B", // Wave-particle duality
        q4: "D", // 1905
        q5: "B"  // Blackbody radiation
    };
    
    Object.keys(answers).forEach(question => {
        const selectedOption = document.querySelector(`input[name="${question}"]:checked`);
        if (selectedOption && selectedOption.value === answers[question]) {
            score++;
        }
    });
    
    return score;
}

// Event handler for the submit button
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            // Explicitly call endQuiz with the submission message
            endQuiz('Quiz Submitted!');
        });
    }
}); 