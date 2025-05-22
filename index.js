// Hamburger menu toggle
const humburgerBtn = document.querySelector(".humburger-button");
const humburgerBtnClose = document.querySelector(".humburger-menu-close");
let dasboard = document.querySelector(".dashboard");
let container = document.querySelectorAll(".container");
let completedContainer = document.querySelector(".completed-task");

// Modal elements for delete confirmation
const modal = document.getElementById("deleteModal");
const modalCloseBtn = modal.querySelector(".modal-close");
const btnCancel = modal.querySelector(".btn-cancel");
const btnConfirm = modal.querySelector(".btn-confirm");

let addTaskBtn = document.querySelectorAll(".addTask");
let ul = document.querySelectorAll(".listed-task");
const homeUl = ul[0];
let userInput = document.querySelectorAll(".userInput");

console.log(container);

humburgerBtn.addEventListener("click", () => {
  dasboard.classList.toggle("active");
});

humburgerBtnClose.addEventListener("click", () => {
  dasboard.classList.remove("active");
});

// Save tasks to localStorage
function TaskToLocalStorage(index, tasks) {
  localStorage.setItem(`tasks-${index}`, JSON.stringify(tasks));
}

function checkIfListEmpty(ulElement) {
  if (ulElement.children.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.textContent = "Add task";
    emptyMessage.classList.add("empty-message");
    ulElement.appendChild(emptyMessage);
  } else {
    const emptyMessage = ulElement.querySelector(".empty-message");
    if (emptyMessage) emptyMessage.remove();
  }
}

// Create task element
function createTaskElement(taskObject, index, currentul) {
  let li = document.createElement("li");
  li.classList.add("listed-list-li");

  let checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  let DeleteBtn = document.createElement("button");
  DeleteBtn.textContent = "delete";

  let textnode = document.createTextNode(taskObject.text);

  let timerContainer = document.createElement("div");
  timerContainer.classList.add("styleClock");
  let timerInput = document.createElement("input");
  let timerclock = document.createElement("span");

  timerInput.type = "datetime-local"; // Fixed input type
  timerclock.textContent = "⏳ Timer not set";

  // Restore previous timer value if exists
  if (taskObject.timer) {
    timerInput.value = taskObject.timer;
  }

  let intervalId = null; // To track interval per task

  // Countdown update function
  function updateCountdown() {
    let targetTime = new Date(timerInput.value).getTime();
    if (isNaN(targetTime)) {
      timerclock.textContent = "⏳ Timer not set";
      timerclock.style.color = "";
      return;
    }
    let now = new Date().getTime();
    let distance = targetTime - now;

    if (distance <= 0) {
      clearInterval(intervalId);
      intervalId = null;
      timerclock.textContent = "⏰ Time's up!";
      timerclock.style.color = "red";
    } else {
      let days = Math.floor(distance / (1000 * 60 * 60 * 24));
      let hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      let seconds = Math.floor((distance % (1000 * 60)) / 1000);

      timerclock.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      timerclock.style.color = "";
    }
  }

  // If timer is already set on load, start interval
  if (timerInput.value) {
    updateCountdown();
    intervalId = setInterval(updateCountdown, 1000);
  }

  // Countdown logic on change
  timerInput.addEventListener("change", () => {
    // Clear previous interval if any
    if (intervalId) clearInterval(intervalId);

    if (!timerInput.value) {
      timerclock.textContent = "⏳ Timer not set";
      timerclock.style.color = "";
      // Remove timer from taskObject and update localStorage
      taskObject.timer = null;
      updateTaskInLocalStorage(index, taskObject);
      return;
    }

    // Save timer value to taskObject and localStorage
    taskObject.timer = timerInput.value;
    updateTaskInLocalStorage(index, taskObject);

    // Start new interval
    updateCountdown();
    intervalId = setInterval(updateCountdown, 1000);
  });

  timerContainer.appendChild(timerInput);
  timerContainer.appendChild(timerclock);
  li.appendChild(checkbox);
  li.appendChild(textnode);
  li.appendChild(DeleteBtn);
  li.appendChild(timerContainer);

  // Checkbox logic
  checkbox.addEventListener("change", () => {
    taskObject.completed = checkbox.checked;
    if (checkbox.checked) {
      showToast("Task completed!");
      completedContainer.append(li);
      li.style.textDecoration = "line-through";
      DeleteBtn.style.textDecoration = "line-through";
    } else {
      li.style.textDecoration = "none";
      DeleteBtn.style.textDecoration = "none";
    }
    updateTaskInLocalStorage(index, taskObject);
  });

  // Delete button logic with modal
  DeleteBtn.addEventListener("click", () => {
    modal.style.display = "block";

    btnCancel.onclick = () => {
      modal.style.display = "none";
    };

    modalCloseBtn.onclick = () => {
      modal.style.display = "none";
    };

    btnConfirm.onclick = () => {
      currentul.removeChild(li);

      // Update localStorage: remove task
      let tasks = JSON.parse(localStorage.getItem(`tasks-${index}`)) || [];
      tasks = tasks.filter((t) => t.text !== taskObject.text);
      TaskToLocalStorage(index, tasks);

      modal.style.display = "none"; // Hide modal
      checkIfListEmpty(currentul);

      // Clear interval if any
      if (intervalId) clearInterval(intervalId);
    };
  });

  return li;
}

// Helper function to update a single task in localStorage
function updateTaskInLocalStorage(index, updatedTask) {
  let tasks = JSON.parse(localStorage.getItem(`tasks-${index}`)) || [];
  tasks = tasks.map((t) => (t.text === updatedTask.text ? updatedTask : t));
  TaskToLocalStorage(index, tasks);
}

// Task render logic
function renderTask() {
  addTaskBtn.forEach((button, index) => {
    button.addEventListener("click", () => {
      let currentul = ul[index];
      let userInputValue = userInput[index].value;

      if (userInputValue.trim() === "") {
        showToast("Please enter a task!");
        return;
      }

      let tasks = JSON.parse(localStorage.getItem(`tasks-${index}`)) || [];
      let taskObject = { text: userInputValue, completed: false, timer: null };
      tasks.push(taskObject);
      TaskToLocalStorage(index, tasks);

      let li = createTaskElement(taskObject, index, currentul);
      currentul.appendChild(li);

      checkIfListEmpty(currentul);

      // Clear input field after task added
      userInput[index].value = "";
    });
  });
}

const searchInput = document.getElementById("taskSearch");
const searchResults = document.getElementById("searchResults");

// Function to search tasks in localStorage and show results
function searchTasks(query) {
  searchResults.innerHTML = ""; // clear previous results
  if (query.trim() === "") return; // if empty, do nothing

  // Loop over all task lists in localStorage
  ul.forEach((_, index) => {
    let tasks = JSON.parse(localStorage.getItem(`tasks-${index}`)) || [];
    tasks.forEach((task) => {
      if (task.text.toLowerCase().includes(query.toLowerCase())) {
        // Create a list item for matched task
        let li = document.createElement("li");
        li.textContent = `List ${index + 1}: ${task.text}`;
        if (task.completed) {
          li.style.textDecoration = "line-through";
          li.style.color = "gray";
        }
        searchResults.appendChild(li);
      }
    });
  });
}

// Add input event listener for search input
searchInput.addEventListener("input", (e) => {
  searchTasks(e.target.value);
});

// Load tasks from localStorage and render them
function loadTasks() {
  ul.forEach((currentul, index) => {
    let tasks = JSON.parse(localStorage.getItem(`tasks-${index}`)) || [];
    tasks.forEach((task) => {
      let li = createTaskElement(task, index, currentul);
      let checkbox = li.querySelector("input[type='checkbox']");
      if (task.completed) {
        checkbox.checked = true;
        li.style.textDecoration = "line-through";
      }
      currentul.appendChild(li);

      // Duplicate task into home (index 0)
      if (index !== 0) {
        let homeLi = createTaskElement(task, index, homeUl);
        let homeCheckbox = homeLi.querySelector("input[type='checkbox']");
        if (task.completed) {
          homeCheckbox.checked = true;
          homeLi.style.textDecoration = "line-through";
        }
        homeUl.appendChild(homeLi);
      }
    });
    checkIfListEmpty(currentul);
  });

  checkIfListEmpty(homeUl);
}

function showToast(message) {
  let toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  // Show the toast
  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  // Hide after 3 seconds and remove from DOM
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3000);
}

// Close modal if clicking outside modal content
window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Load existing tasks
loadTasks();

// Render task buttons
renderTask();
