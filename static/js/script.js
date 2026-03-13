import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

// define how a touch event should look like
class CustomTouchObject {
    constructor(touchId, x, y, timestamp) {
        this.touchId = touchId;
        this.x = x;
        this.y = y;
        this.timestamp = timestamp;
    }
}

// define how an entry for data logging should look like
class CustomEntryObject {
    constructor(pid, condition, block, trial, targetGesture, detectedGesture, minTargetLength, detectedLength, error, trialStart, touchStart, touchEnd, animationStart, animationEnd, touchPath) {
        this.pid = pid,
        this.condition = condition,
        this.block = block;
        this.trial = trial;
        this.targetGesture = targetGesture;
        this.detectedGesture = detectedGesture;
        this.minTargetLength = minTargetLength;
        this.detectedLength = detectedLength;
        this.error = error;
        this.trialStart = trialStart;
        this.touchStart = touchStart;
        this.touchEnd = touchEnd;
        this.animationStart = animationStart;
        this.animationEnd = animationEnd;
        this.touchPath = touchPath;
    }
}


// data logging 
async function logTrial(entry) {
    const res = await fetch("/log", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(entry)
    });
    const data = await res.json();
    console.log("data saved: ", data);
}

function saveTrial() {
    const trialToSave = new CustomEntryObject(
        pid,
        condition,
        currentBlock,
        currentTrial,
        targetGesture,
        detectedGesture,
        minTargetLength,
        detectedLength,
        error,
        trialStart,
        touchStart,
        touchEnd,
        animationStart,
        animationEnd,
        touchPath
    );
    logTrial(trialToSave); 
}


////////////////////////////////////////////////////////////////////////////////////////


// elements used
var body = document.getElementById("app");
var card = document.getElementById("card");
var arrow = document.getElementById("arrow");
var statusHint = document.getElementById("status-hint");
var instructions = document.getElementById("instruction");


// states for UI
const INTRO = 0;
const TASK = 1;
const DONE = 2;
const STATES = [INTRO, TASK, DONE];


// TODO: change this (?)
const ANIMATION_TIME_SHORT = 0.6;
const ANIMATION_TIME_LONG = 1.6;

const MIN_SWIPE_DISTANCE_SHORT = 50;
const MAX_SWIPE_DISTANCE_SHORT = 100;
const MIN_SWIPE_DISTANCE_LONG = 200;
const MAX_SWIPE_DISTANCE_LONG = 500;

const BOTTOM_RIGHT = "br";
const BOTTOM_LEFT = "bl";
const TOP_LEFT = "tl";
const TOP_RIGHT = "tr";
const CONDITIONS = [BOTTOM_RIGHT, BOTTOM_LEFT, TOP_LEFT, TOP_RIGHT];

// TODO: change this
const NUM_TRIALS_TRAINING = 3 * CONDITIONS.length;
const NUM_TRIALS_PER_BLOCK = 10 * CONDITIONS.length;
const NUM_BLOCKS = 3 + 1;
const COOLDOWN_TIME = 5;

const ARROW_MAP = new Map();
ARROW_MAP.set(BOTTOM_RIGHT, [0, "translate(75vw, 75vw)"]);
ARROW_MAP.set(BOTTOM_LEFT, [90, "translate(-75vw, 75vw)"]);
ARROW_MAP.set(TOP_LEFT, [180, "translate(-75vw, -75vw)"]);
ARROW_MAP.set(TOP_RIGHT, [270, "translate(75vw, -75vw)"]);


// pattern: target gesture, [min gesture length, max gesture length, target effect type]
// TODO: change this for balancing
// for now:
// - swipe to bottom right: should be short, results in short effect (compatible)
// - swipe to bottom left: should be long, results in long effect (compatible)
// - swipe to bottom right: should be short, results in long effect (incompatible)
// - swipe to bottom right: should be long, results in short effect (incompatible)
const CONDITION_MAP = new Map();
CONDITION_MAP.set(BOTTOM_RIGHT, [MIN_SWIPE_DISTANCE_SHORT, MAX_SWIPE_DISTANCE_SHORT, ANIMATION_TIME_SHORT]);
CONDITION_MAP.set(BOTTOM_LEFT, [MIN_SWIPE_DISTANCE_LONG, MAX_SWIPE_DISTANCE_LONG, ANIMATION_TIME_LONG]);
CONDITION_MAP.set(TOP_LEFT, [MIN_SWIPE_DISTANCE_SHORT, MAX_SWIPE_DISTANCE_SHORT, ANIMATION_TIME_LONG]);
CONDITION_MAP.set(TOP_RIGHT, [MIN_SWIPE_DISTANCE_LONG, MAX_SWIPE_DISTANCE_LONG, ANIMATION_TIME_SHORT]);


// let state = INTRO;
let trials = [];
let startX = 0;
let startY = 0;
let isLocked = false;
let animationActive = false;
let activePointer = null;


// stuff to log
// let pid = localStorage.getItem("userId");
// if (!pid) {
//     pid = crypto.randomUUID();
//     localStorage.setItem("pid", pid);
// }
const pid = getUserId();
const condition = "-"; // TODO
let currentBlock = 0;
let currentTrial = 0;
let targetGesture = "";
let detectedGesture = "";
let minTargetLength = 0;
let detectedLength = 0;
let error = false;
let trialStart = 0;
let touchStart = 0;
let touchEnd = 0;
let animationStart = 0;
let animationEnd = 0;
let touchPath = [];
let touchesPerTrial = 0;


function getUserId() {
    const userId = (() => {
        const key = 'userId';
        try {
            const existing = localStorage.getItem(key);
            if (existing) return existing;
        } catch (e) {} 

        const id = uuidv4();

        try {
            localStorage.setItem(key, id);
        } catch (e) {} 

        return id;
    })();

    console.log(`User ID: ${userId}`);
    document.body.dataset.userId = userId;
    return userId;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function initateTrials() {
    let trainingTrials = [];
    for (let i = 0; i < NUM_TRIALS_TRAINING / CONDITIONS.length; i++) {
        trainingTrials.push(...CONDITIONS);
    }
    shuffle(trainingTrials);
    trainingTrials.unshift(CONDITIONS[Math.floor(Math.random() * (3 - 0 + 1) + 0)]);
    trials.push(trainingTrials);

    for (let b = 0; b < NUM_BLOCKS; b++) {
        let currentBlockTrials = [];
        for (let i = 0; i < NUM_TRIALS_PER_BLOCK / CONDITIONS.length; i++) {
            currentBlockTrials.push(...CONDITIONS);
        }
        shuffle(currentBlockTrials);
        currentBlockTrials.unshift(CONDITIONS[Math.floor(Math.random() * (3 - 0 + 1) + 0)]);
        trials.push(currentBlockTrials);
    }

    console.log(trials);
}

function resetCard() {
    arrow.style.visibility = false;
    console.log(trials[currentBlock]);
    console.log(trials[currentBlock][currentTrial]);
    arrow.src = CONDITION_MAP.get(trials[currentBlock][currentTrial])[0] === MIN_SWIPE_DISTANCE_LONG ? arrow.dataset.long : arrow.dataset.short;
    arrow.style.transform = `rotate(${ARROW_MAP.get(trials[currentBlock][currentTrial])[0]}deg)`;
    card.style.transition = "none";
    card.style.transform = "translateX(0)";
    arrow.style.visibility = true;
}

function cleanupTrialData() {
    targetGesture = "";
    detectedGesture = "";
    minTargetLength = 0;
    detectedLength = 0;
    error = false;
    trialStart = 0;
    touchStart = 0;
    touchEnd = 0;
    animationStart = 0;
    animationEnd = 0;
    touchPath = [];
    touchesPerTrial = 0;
}

function startTrial() {
    animationActive = false;
    isLocked = false;
    cleanupTrialData();
    resetCard();
    requestAnimationFrame(() => {
        let now = performance.now();
        console.log("Trial Start:", now.toFixed(2));
        // logEvent(pid, currentBlock, currentTrial, "trial-start", now);
        trialStart = now;
    });
}

function goToNextTrial() {
    currentTrial++;
    if (currentTrial >= trials[currentBlock].length) {
        statusHint.innerText = currentBlock === 0 ? "Training completed!" : `Block ${currentBlock} of ${NUM_BLOCKS-1} done!`
        switchToNextBlock();
    } else {
        startTrial();
    }
}

async function switchToNextBlock() {
    currentBlock++;
    currentTrial = 0;

    if (currentBlock >= NUM_BLOCKS) {
        instructions.innerText = "Thank you!";
    } else {
        instructions.innerText = `${COOLDOWN_TIME} seconds to continue...`;
        await countdown(COOLDOWN_TIME);
        statusHint.innerText = ""
        instructions.innerText = "";
        startTrial();
    }
}

function countdown(seconds) {
    return new Promise(resolve => {
        const timer = setInterval(() => {
            seconds--;
            instructions.innerText = seconds + " seconds to continue...";
            if (seconds <= 0) {
                clearInterval(timer);
                resolve();
            }
        }, 1000);
    });
}

function getSwipeType(startX, endX, startY, endY) {
    if (endX < startX && endY > startY) return BOTTOM_LEFT;
    if (endX > startX && endY > startY) return BOTTOM_RIGHT;
    if (endX < startX && endY < startY) return TOP_LEFT;
    if (endX > startX && endY < startY) return TOP_RIGHT;
}

function getVectorLen(startX, endX, startY, endY) {
    var xDist = startX - endX;
    var yDist = startY - endY;
    return Math.sqrt(xDist * xDist + yDist * yDist);
}

body.addEventListener("pointerdown", (e) => {
    if (isLocked) return;

    let now = performance.now();
    console.log("Touch Start:", now.toFixed(2));
    // logEvent(pid, currentBlock, currentTrial, "touch-start", now);
    touchStart = now;

    activePointer = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
});


body.addEventListener("pointermove", (e) => {
    if (e.pointerId !== activePointer) return;
    let now = performance.now();
    let touch = new CustomTouchObject(
        touchesPerTrial,
        e.clientX,
        e.clientY,
        now
    );
    touchPath.push(touch);
});


body.addEventListener("pointerup", (e) => {
    if (isLocked) return;
    if (e.pointerId !== activePointer) return;

    let now = performance.now();
    console.log("Touch End:", now.toFixed(2));
    // logEvent(pid, currentBlock, currentTrial, "touch-end", now);
    touchEnd = now;

    activePointer = null;
    targetGesture = trials[currentBlock][currentTrial];
    let detectedGestureTmp = getSwipeType(startX, e.clientX, startY, e.clientY);
    minTargetLength = CONDITION_MAP.get(targetGesture)[0];
    let detectedLengthTmp = getVectorLen(startX, e.clientX, startY, e.clientY);

    if (targetGesture === detectedGestureTmp && detectedLengthTmp > CONDITION_MAP.get(targetGesture)[0] && detectedLengthTmp < CONDITION_MAP.get(targetGesture)[1]) {
        isLocked = true;
        animationActive = true;

        let now = performance.now();
        console.log("Animation Start:", now.toFixed(2));
        // logEvent(pid, currentBlock, currentTrial, "animation-start", now);
        animationStart = now;

        card.style.transform = ARROW_MAP.get(targetGesture)[1];
        card.style.transition = `transform ${CONDITION_MAP.get(targetGesture)[2]}s ease`;

        if (!error) {
            detectedGesture = detectedGestureTmp;
            detectedLength = detectedLengthTmp;
        }
    } else {
        let now = performance.now();
        console.log("Wrong Gesture:", now.toFixed(2));
        // logEvent(pid, currentBlock, currentTrial, "wrong-gesture", now);
        error = true;
        touchesPerTrial++;
    }
});

card.addEventListener("transitionend", (e) => {
    if (!animationActive) return;
    if (e.propertyName !== "transform") return;

    let now = performance.now();
    console.log("Animation End:", now.toFixed(2));
    // logEvent(pid, currentBlock, currentTrial, "animation-end", now);
    animationEnd = now;

    animationActive = false;
    saveTrial();
    goToNextTrial();
});


initateTrials();

let now = performance.now();
console.log("Experiment Start:", now.toFixed(2));

startTrial();
