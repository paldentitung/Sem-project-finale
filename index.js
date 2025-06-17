// DOM Elements
const humburgerBtn = document.querySelector(".humburger-button");
const humburgerBtnClose = document.querySelector(".humburger-menu-close");
const dashboard = document.querySelector(".dashboard");
const containers = document.querySelectorAll(".container");
const completedContainer = document.querySelector(".completed-task");
const modal = document.getElementById("deleteModal");
const modalCloseBtn = modal.querySelector(".modal-close");
const btnCancel = modal.querySelector(".btn-cancel");
const btnConfirm = modal.querySelector(".btn-confirm");
const addTaskBtns = document.querySelectorAll(".addTask");
const taskLists = document.querySelectorAll(".listed-task");
const homeTaskList = taskLists[0];
const userInputs = document.querySelectorAll(".userInput");
const searchInput = document.getElementById("taskSearch");
const searchResults = document.getElementById("searchResults");

// State variables
let taskToDelete = null;
let currentListIndex = null;

// Initialize the app
function init() {
    setupEventListeners();
    loadTasks();
    checkAllListsEmpty();
}

// Set up event listeners
function setupEventListeners() {
    // Hamburger menu toggle
    humburgerBtn.addEventListener("click", toggleDashboard);
    humburgerBtnClose.addEventListener("click", toggleDashboard);
    
    // Add task buttons
    addTaskBtns.forEach((button, index) => {
        button.addEventListener("click", () => addTask(index));
        userInputs[index].addEventListener("keypress", (e) => {
            if (e.key === "Enter") addTask(index);
        });
    });
    
    // Modal buttons
    btnCancel.addEventListener("click", closeModal);
    modalCloseBtn.addEventListener("click", closeModal);
    btnConfirm.addEventListener("click", confirmDelete);
    window.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });
    
    // Search functionality
    searchInput.addEventListener("input", handleSearch);
}

// Toggle dashboard visibility
function toggleDashboard() {
    dashboard.classList.toggle("active");
}

// Add a new task
function addTask(index) {
    const input = userInputs[index];
    const taskText = input.value.trim();
    
    if (!taskText) {
        showToast("Please enter a task!");
        return;
    }
    
    const tasks = getTasksFromStorage(index);
    const taskObject = { 
        text: taskText, 
        completed: false, 
        timer: null 
    };
    
    tasks.push(taskObject);
    saveTasksToStorage(index, tasks);
    
    const li = createTaskElement(taskObject, index, taskLists[index]);
    taskLists[index].appendChild(li);
    
    checkIfListEmpty(taskLists[index]);
    input.value = "";
    
    // Also add to home if not home
    if (index !== 0) {
        const homeTasks = getTasksFromStorage(0);
        homeTasks.push(taskObject);
        saveTasksToStorage(0, homeTasks);
        
        const homeLi = createTaskElement(taskObject, 0, homeTaskList);
        homeTaskList.appendChild(homeLi);
        checkIfListEmpty(homeTaskList);
    }
}

// Create task element
function createTaskElement(taskObject, index, currentList) {
    const li = document.createElement("li");
    li.classList.add("listed-list-li");
    
    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = taskObject.completed;
    
    // Task text
    const textNode = document.createTextNode(taskObject.text);
    
    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    
    // Timer elements
    const timerContainer = document.createElement("div");
    timerContainer.classList.add("styleClock");
    
    const timerInput = document.createElement("input");
    timerInput.type = "datetime-local";
    
    const timerClock = document.createElement("span");
    timerClock.textContent = "⏳ Timer not set";
    
    // Set timer if exists
    if (taskObject.timer) {
        timerInput.value = taskObject.timer;
        updateTimerDisplay(timerClock, timerInput.value);
    }
    
    // Timer change handler
    timerInput.addEventListener("change", () => {
        taskObject.timer = timerInput.value;
        updateTaskInStorage(index, taskObject);
        
        if (timerInput.value) {
            updateTimerDisplay(timerClock, timerInput.value);
        } else {
            timerClock.textContent = "⏳ Timer not set";
            timerClock.style.color = "";
        }
    });
    
    // Checkbox handler
    checkbox.addEventListener("change", () => {
        taskObject.completed = checkbox.checked;
        updateTaskInStorage(index, taskObject);
        
        if (checkbox.checked) {
            showToast("Task completed!");
            completedContainer.appendChild(li);
            li.style.textDecoration = "line-through";
        } else {
            currentList.appendChild(li);
            li.style.textDecoration = "none";
        }
    });
    
    // Delete button handler
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        taskToDelete = { li, taskObject, index, currentList };
        openModal();
    });
    
    // Assemble elements
    timerContainer.appendChild(timerInput);
    timerContainer.appendChild(timerClock);
    
    li.appendChild(checkbox);
    li.appendChild(textNode);
    li.appendChild(deleteBtn);
    li.appendChild(timerContainer);
    
    // Style if completed
    if (taskObject.completed) {
        li.style.textDecoration = "line-through";
        completedContainer.appendChild(li);
    }
    
    return li;
}

// Timer functions
function updateTimerDisplay(clockElement, targetTimeString) {
    const targetTime = new Date(targetTimeString).getTime();
    const now = new Date().getTime();
    const distance = targetTime - now;
    
    if (distance <= 0) {
        clockElement.textContent = "⏰ Time's up!";
        clockElement.style.color = "red";
        return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    clockElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    clockElement.style.color = "";
}

// Modal functions
function openModal() {
    modal.classList.add("active");
}

function closeModal() {
    modal.classList.remove("active");
}

function confirmDelete() {
    if (!taskToDelete) return;
    
    const { li, taskObject, index, currentList } = taskToDelete;
    currentList.removeChild(li);
    
    // Remove from storage
    const tasks = getTasksFromStorage(index);
    const updatedTasks = tasks.filter(t => t.text !== taskObject.text);
    saveTasksToStorage(index, updatedTasks);
    
    // Also remove from home if not home
    if (index !== 0) {
        const homeTasks = getTasksFromStorage(0);
        const updatedHomeTasks = homeTasks.filter(t => t.text !== taskObject.text);
        saveTasksToStorage(0, updatedHomeTasks);
        
        // Remove from home UI
        const homeItems = homeTaskList.querySelectorAll("li");
        homeItems.forEach(item => {
            if (item.textContent.includes(taskObject.text)) {
                homeTaskList.removeChild(item);
            }
        });
    }
    
    closeModal();
    checkIfListEmpty(currentList);
    checkIfListEmpty(homeTaskList);
    taskToDelete = null;
}

// Storage functions
function getTasksFromStorage(index) {
    return JSON.parse(localStorage.getItem(`tasks-${index}`)) || [];
}

function saveTasksToStorage(index, tasks) {
    localStorage.setItem(`tasks-${index}`, JSON.stringify(tasks));
}

function updateTaskInStorage(index, updatedTask) {
    const tasks = getTasksFromStorage(index);
    const updatedTasks = tasks.map(t => t.text === updatedTask.text ? updatedTask : t);
    saveTasksToStorage(index, updatedTasks);
}

// Load tasks from storage
function loadTasks() {
    taskLists.forEach((list, index) => {
        const tasks = getTasksFromStorage(index);
        tasks.forEach(task => {
            const li = createTaskElement(task, index, list);
            list.appendChild(li);
        });
        checkIfListEmpty(list);
    });
}

// Search functionality
function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    searchResults.innerHTML = "";
    
    if (!query) {
        searchResults.classList.remove("has-results");
        return;
    }
    
    let hasResults = false;
    
    taskLists.forEach((_, index) => {
        const tasks = getTasksFromStorage(index);
        tasks.forEach(task => {
            if (task.text.toLowerCase().includes(query)) {
                hasResults = true;
                const li = document.createElement("li");
                li.textContent = `List ${index + 1}: ${task.text}`;
                if (task.completed) {
                    li.style.textDecoration = "line-through";
                    li.style.color = "gray";
                }
                searchResults.appendChild(li);
            }
        });
    });
    
    if (hasResults) {
        searchResults.classList.add("has-results");
    } else {
        searchResults.classList.remove("has-results");
    }
}

// Empty list checks
function checkIfListEmpty(listElement) {
    if (listElement.children.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.textContent = "No tasks yet. Add one!";
        emptyMessage.classList.add("empty-message");
        listElement.appendChild(emptyMessage);
    } else {
        const emptyMessage = listElement.querySelector(".empty-message");
        if (emptyMessage) emptyMessage.remove();
    }
}

function checkAllListsEmpty() {
    taskLists.forEach(list => checkIfListEmpty(list));
    checkIfListEmpty(completedContainer);
}

// Toast notification
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Initialize the app
init();