const STORAGE_KEY = 'priorityMatrixTasks';
const EXPIRY_HOURS = 24;

let tasks = {
    'urgent-important': [],
    'not-urgent-important': [],
    'urgent-not-important': [],
    'not-urgent-not-important': []
};

let draggedElement = null;
let taskIdCounter = 0;
let selectedPriority = null;
let pendingTaskText = null;
let timerIntervals = {};

const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskLists = document.querySelectorAll('.task-list');
const modal = document.getElementById('priorityModal');
const priorityOptions = document.querySelectorAll('.priority-option');
const cancelBtn = document.getElementById('cancelBtn');
const confirmBtn = document.getElementById('confirmBtn');
const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');
const noTimerCheckbox = document.getElementById('noTimerCheckbox');
const timeInputsContainer = document.getElementById('timeInputsContainer');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const quadrantNames = {
    'urgent-important': 'q1',
    'not-urgent-important': 'q2',
    'urgent-not-important': 'q3',
    'not-urgent-not-important': 'q4'
};

function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            const now = new Date().getTime();
            
            if (data.expiry && now < data.expiry) {
                tasks = data.tasks;
                taskIdCounter = data.counter || 0;
                
                for (let quadrant in tasks) {
                    tasks[quadrant] = tasks[quadrant].filter(task => {
                        return now < task.storageExpiry;
                    });
                }
                
                renderAllTasks();
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            console.error('Error loading tasks:', e);
        }
    }
}

function saveTasks() {
    const now = new Date().getTime();
    const expiry = now + (EXPIRY_HOURS * 60 * 60 * 1000);
    
    const data = {
        tasks: tasks,
        counter: taskIdCounter,
        expiry: expiry
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

function getTimerColor(remainingSeconds, totalSeconds) {
    const percentage = (remainingSeconds / totalSeconds) * 100;
    
    if (remainingSeconds <= 60) {
        return 'red';
    } else if (percentage <= 50) {
        return 'orange';
    } else {
        return 'green';
    }
}

function startTimer(taskId, totalSeconds) {
    const task = findTask(taskId);
    if (!task || task.completed) return;

    if (timerIntervals[taskId]) {
        clearInterval(timerIntervals[taskId]);
    }

    timerIntervals[taskId] = setInterval(() => {
        const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskEl) {
            clearInterval(timerIntervals[taskId]);
            delete timerIntervals[taskId];
            return;
        }

        if (task.paused || task.completed) {
            return;
        }

        const now = new Date().getTime();
        const elapsed = Math.floor((now - task.startTime - task.pausedDuration) / 1000);
        const remaining = Math.max(0, totalSeconds - elapsed);

        const timerEl = taskEl.querySelector('.task-timer');
        if (timerEl) {
            timerEl.textContent = formatTime(remaining);
            timerEl.className = `task-timer ${getTimerColor(remaining, totalSeconds)}`;
        }

        if (remaining === 0 && !task.completed) {
            clearInterval(timerIntervals[taskId]);
            delete timerIntervals[taskId];
        }

        saveTasks();
    }, 1000);
}

function findTask(taskId) {
    for (let quadrant in tasks) {
        const task = tasks[quadrant].find(t => t.id === taskId);
        if (task) return task;
    }
    return null;
}

function createTaskElement(task) {
    const taskEl = document.createElement('div');
    taskEl.className = `task ${task.completed ? 'completed' : ''}`;
    taskEl.draggable = !task.completed;
    taskEl.dataset.taskId = task.id;
    
    let timerHTML = '';
    if (task.hasTimer) {
        const now = new Date().getTime();
        const elapsed = Math.floor((now - task.startTime - task.pausedDuration) / 1000);
        const remaining = Math.max(0, task.duration - elapsed);
        const color = getTimerColor(remaining, task.duration);
        
        timerHTML = `
            <span class="task-timer ${color}">${formatTime(remaining)}</span>
            ${!task.completed ? `<button class="pause-btn ${task.paused ? 'paused' : ''}">${task.paused ? 'Resume' : 'Pause'}</button>` : ''}
        `;
    } else if (!task.completed) {
        timerHTML = `<button class="edit-timer-btn">Add Timer</button>`;
    }
    
    taskEl.innerHTML = `
        <div class="task-content">
            <div class="task-checkbox">
                <input type="checkbox" ${task.completed ? 'checked' : ''} />
            </div>
            <div class="task-info">
                <div class="task-text">${task.text}</div>
                <div class="task-controls">
                    ${timerHTML}
                    <button class="delete-btn">Delete</button>
                </div>
            </div>
        </div>
    `;

    taskEl.addEventListener('dragstart', handleDragStart);
    taskEl.addEventListener('dragend', handleDragEnd);
    
    const checkbox = taskEl.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
        task.completed = checkbox.checked;
        taskEl.classList.toggle('completed', task.completed);
        taskEl.draggable = !task.completed;
        
        if (task.completed && timerIntervals[task.id]) {
            clearInterval(timerIntervals[task.id]);
            delete timerIntervals[task.id];
        }
        
        saveTasks();
        updateDashboard();
        renderAllTasks();
    });

    const pauseBtn = taskEl.querySelector('.pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            task.paused = !task.paused;
            
            if (task.paused) {
                task.pauseStartTime = new Date().getTime();
            } else {
                const pauseDuration = new Date().getTime() - task.pauseStartTime;
                task.pausedDuration += pauseDuration;
                task.pauseStartTime = 0;
            }
            
            pauseBtn.textContent = task.paused ? 'Resume' : 'Pause';
            pauseBtn.classList.toggle('paused', task.paused);
            saveTasks();
        });
    }

    const editTimerBtn = taskEl.querySelector('.edit-timer-btn');
    if (editTimerBtn) {
        editTimerBtn.addEventListener('click', () => {
            const minutes = prompt('Enter minutes:', '5');
            const seconds = prompt('Enter seconds:', '0');
            
            if (minutes !== null && seconds !== null) {
                const totalSeconds = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
                
                if (totalSeconds > 0) {
                    task.hasTimer = true;
                    task.duration = totalSeconds;
                    task.startTime = new Date().getTime();
                    task.pausedDuration = 0;
                    task.pauseStartTime = 0;
                    task.paused = false;
                    
                    saveTasks();
                    renderAllTasks();
                }
            }
        });
    }
    
    taskEl.querySelector('.delete-btn').addEventListener('click', () => {
        deleteTask(task.id);
    });

    if (!task.completed && task.hasTimer) {
        startTimer(task.id, task.duration);
    }

    return taskEl;
}

function renderAllTasks() {
    taskLists.forEach(list => {
        list.innerHTML = '';
    });

    for (let quadrant in tasks) {
        const list = document.getElementById(quadrant);
        tasks[quadrant].forEach(task => {
            list.appendChild(createTaskElement(task));
        });
    }
}

function openModal() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        alert('Please enter a task');
        return;
    }

    pendingTaskText = taskText;
    selectedPriority = null;
    confirmBtn.disabled = true;
    
    priorityOptions.forEach(opt => opt.classList.remove('selected'));
    
    modal.classList.add('active');
    minutesInput.focus();
}

function closeModal() {
    modal.classList.remove('active');
    pendingTaskText = null;
    selectedPriority = null;
    minutesInput.value = 5;
    secondsInput.value = 0;
    noTimerCheckbox.checked = false;
    timeInputsContainer.style.opacity = '1';
    timeInputsContainer.style.pointerEvents = 'auto';
}

function addTask() {
    if (!selectedPriority || !pendingTaskText) return;

    const noTimer = noTimerCheckbox.checked;
    let totalSeconds = 0;
    let hasTimer = true;

    if (noTimer) {
        hasTimer = false;
    } else {
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        totalSeconds = (minutes * 60) + seconds;

        if (totalSeconds === 0) {
            alert('Please set a time duration or check "No timer needed"');
            return;
        }
    }

    const taskId = `task-${taskIdCounter++}`;
    const now = new Date().getTime();
    const storageExpiry = now + (EXPIRY_HOURS * 60 * 60 * 1000);
    
    const task = {
        id: taskId,
        text: pendingTaskText,
        duration: totalSeconds,
        startTime: now,
        storageExpiry: storageExpiry,
        completed: false,
        paused: false,
        pausedDuration: 0,
        pauseStartTime: 0,
        hasTimer: hasTimer
    };
    
    tasks[selectedPriority].push(task);
    
    const taskElement = createTaskElement(task);
    document.getElementById(selectedPriority).appendChild(taskElement);
    
    saveTasks();
    updateDashboard();
    taskInput.value = '';
    closeModal();
    taskInput.focus();
}

function deleteTask(taskId) {
    if (timerIntervals[taskId]) {
        clearInterval(timerIntervals[taskId]);
        delete timerIntervals[taskId];
    }

    for (let quadrant in tasks) {
        tasks[quadrant] = tasks[quadrant].filter(t => t.id !== taskId);
    }
    
    const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskEl) taskEl.remove();
    
    saveTasks();
    updateDashboard();
}

function updateDashboard() {
    let totalTasksCount = 0;
    let completedTasksCount = 0;
    let totalTimeSeconds = 0;

    const quadrantStats = {
        'urgent-important': { tasks: 0, completed: 0, time: 0 },
        'not-urgent-important': { tasks: 0, completed: 0, time: 0 },
        'urgent-not-important': { tasks: 0, completed: 0, time: 0 },
        'not-urgent-not-important': { tasks: 0, completed: 0, time: 0 }
    };

    for (let quadrant in tasks) {
        tasks[quadrant].forEach(task => {
            totalTasksCount++;
            if (task.hasTimer) {
                totalTimeSeconds += task.duration;
                quadrantStats[quadrant].time += task.duration;
            }
            quadrantStats[quadrant].tasks++;
            
            if (task.completed) {
                completedTasksCount++;
                quadrantStats[quadrant].completed++;
            }
        });
    }

    document.getElementById('totalTasks').textContent = totalTasksCount;
    document.getElementById('completedTasks').textContent = completedTasksCount;
    document.getElementById('totalTime').textContent = formatDuration(totalTimeSeconds);

    for (let quadrant in quadrantStats) {
        const qName = quadrantNames[quadrant];
        document.getElementById(`${qName}Tasks`).textContent = quadrantStats[quadrant].tasks;
        document.getElementById(`${qName}Completed`).textContent = quadrantStats[quadrant].completed;
        document.getElementById(`${qName}Time`).textContent = formatDuration(quadrantStats[quadrant].time);
    }
}

function handleDragStart(e) {
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    if (e.target.classList.contains('task-list')) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.target.classList.contains('task-list')) {
        e.target.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    let dropZone = e.target;
    
    if (!dropZone.classList.contains('task-list')) {
        dropZone = dropZone.closest('.task-list');
    }
    
    if (dropZone && draggedElement) {
        dropZone.classList.remove('drag-over');
        
        const taskId = draggedElement.dataset.taskId;
        const newQuadrant = dropZone.id;
        
        let taskData = null;
        for (let quadrant in tasks) {
            const index = tasks[quadrant].findIndex(t => t.id === taskId);
            if (index !== -1) {
                taskData = tasks[quadrant].splice(index, 1)[0];
                break;
            }
        }
        
        if (taskData) {
            tasks[newQuadrant].push(taskData);
            dropZone.appendChild(draggedElement);
            saveTasks();
            updateDashboard();
        }
    }
}

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        tabContents.forEach(content => content.classList.remove('active'));
        
        if (tabName === 'tasks') {
            document.getElementById('tasksTab').classList.add('active');
        } else if (tabName === 'dashboard') {
            document.getElementById('dashboardTab').classList.add('active');
            updateDashboard();
        }
    });
});

addTaskBtn.addEventListener('click', openModal);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        openModal();
    }
});

priorityOptions.forEach(option => {
    option.addEventListener('click', () => {
        priorityOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedPriority = option.dataset.priority;
        confirmBtn.disabled = false;
    });
});

cancelBtn.addEventListener('click', closeModal);
confirmBtn.addEventListener('click', addTask);

noTimerCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        timeInputsContainer.style.opacity = '0.5';
        timeInputsContainer.style.pointerEvents = 'none';
    } else {
        timeInputsContainer.style.opacity = '1';
        timeInputsContainer.style.pointerEvents = 'auto';
    }
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

taskLists.forEach(list => {
    list.addEventListener('dragover', handleDragOver);
    list.addEventListener('dragenter', handleDragEnter);
    list.addEventListener('dragleave', handleDragLeave);
    list.addEventListener('drop', handleDrop);
});

loadTasks();
updateDashboard();
taskInput.focus();
