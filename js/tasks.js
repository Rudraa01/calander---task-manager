// Task management module
import { auth, db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let tasks = [];
let currentUser = null;
let currentEditingTask = null;

// Task modal elements
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.getElementById('closeModal');
const cancelTask = document.getElementById('cancelTask');

// Task form elements
const taskTitle = document.getElementById('taskTitle');
const taskDescription = document.getElementById('taskDescription');
const taskDueDate = document.getElementById('taskDueDate');
const taskPriority = document.getElementById('taskPriority');
const taskTag = document.getElementById('taskTag');
const taskRepeating = document.getElementById('taskRepeating');
const taskCompleted = document.getElementById('taskCompleted');

// Initialize task management
function initTaskManagement() {
    // Add task button
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', showTaskModal);
    }
    
    // Modal close handlers
    if (closeModal) {
        closeModal.addEventListener('click', hideTaskModal);
    }
    
    if (cancelTask) {
        cancelTask.addEventListener('click', hideTaskModal);
    }
    
    // Click outside modal to close
    if (taskModal) {
        taskModal.addEventListener('click', (e) => {
            if (e.target === taskModal) {
                hideTaskModal();
            }
        });
    }
    
    // Form submission
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
    }
    
    // Initialize filters
    initFilters();
}

// Show task modal
function showTaskModal(task = null) {
    if (!taskModal) return;
    
    currentEditingTask = task;
    
    if (task) {
        // Edit mode
        modalTitle.textContent = 'Edit Task';
        populateTaskForm(task);
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Task';
        resetTaskForm();
    }
    
    taskModal.classList.remove('hidden');
    taskModal.classList.add('modal-enter');
    
    // Focus on title input
    setTimeout(() => {
        taskTitle?.focus();
    }, 100);
}

// Hide task modal
function hideTaskModal() {
    if (!taskModal) return;
    
    taskModal.classList.add('hidden');
    taskModal.classList.remove('modal-enter');
    currentEditingTask = null;
    resetTaskForm();
}

// Populate task form for editing
function populateTaskForm(task) {
    if (taskTitle) taskTitle.value = task.title || '';
    if (taskDescription) taskDescription.value = task.description || '';
    if (taskDueDate) {
        const date = new Date(task.dueDate);
        taskDueDate.value = date.toISOString().slice(0, 16);
    }
    if (taskPriority) taskPriority.value = task.priority || 'medium';
    if (taskTag) taskTag.value = task.tag || '';
    if (taskRepeating) taskRepeating.checked = task.repeating || false;
    if (taskCompleted) taskCompleted.checked = task.completed || false;
}

// Reset task form
function resetTaskForm() {
    if (taskForm) {
        taskForm.reset();
        taskPriority.value = 'medium';
        taskCompleted.checked = false;
        taskRepeating.checked = false;
    }
}

// Handle task form submission
async function handleTaskSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showError('Please log in to manage tasks');
        return;
    }
    
    const title = taskTitle?.value.trim();
    const description = taskDescription?.value.trim();
    const dueDate = taskDueDate?.value;
    const priority = taskPriority?.value;
    const tag = taskTag?.value.trim();
    const repeating = taskRepeating?.checked;
    const completed = taskCompleted?.checked;
    
    if (!title) {
        showError('Please enter a task title');
        return;
    }
    
    const taskData = {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        tag,
        repeating,
        completed,
        updatedAt: serverTimestamp()
    };
    
    try {
        if (currentEditingTask) {
            // Update existing task
            await updateTask(currentEditingTask.id, taskData);
            showSuccess('Task updated successfully');
        } else {
            // Create new task
            taskData.createdAt = serverTimestamp();
            await createTask(taskData);
            showSuccess('Task created successfully');
        }
        
        hideTaskModal();
    } catch (error) {
        console.error('Error saving task:', error);
        showError('Failed to save task');
    }
}

// Create new task
async function createTask(taskData) {
    const tasksRef = collection(db, 'users', currentUser.uid, 'tasks');
    const docRef = await addDoc(tasksRef, taskData);
    return docRef.id;
}

// Update existing task
async function updateTask(taskId, taskData) {
    const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
    await updateDoc(taskRef, taskData);
}

// Delete task
async function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
            await deleteDoc(taskRef);
            showSuccess('Task deleted successfully');
        } catch (error) {
            console.error('Error deleting task:', error);
            showError('Failed to delete task');
        }
    }
}

// Toggle task completion
async function toggleTaskCompletion(taskId, completed) {
    try {
        const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
        await updateDoc(taskRef, {
            completed: !completed,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating task:', error);
        showError('Failed to update task');
    }
}

// Listen for task updates
function listenForTasks(user) {
    if (!user) return;
    
    currentUser = user;
    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        tasks = [];
        snapshot.forEach((doc) => {
            tasks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderTasks();
        updateTaskCount();
        updateTagFilters();
    });
}

// Render tasks in the task list
function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    const filteredTasks = filterTasks(tasks);
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p>No tasks found</p>
                <p class="text-sm mt-1">Create your first task to get started!</p>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = filteredTasks.map(task => createTaskHTML(task)).join('');
    
    // Add event listeners to task items
    filteredTasks.forEach(task => {
        const taskElement = document.getElementById(`task-${task.id}`);
        if (taskElement) {
            // Checkbox toggle
            const checkbox = taskElement.querySelector('.task-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    toggleTaskCompletion(task.id, task.completed);
                });
            }
            
            // Edit button
            const editBtn = taskElement.querySelector('.task-edit');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    showTaskModal(task);
                });
            }
            
            // Delete button
            const deleteBtn = taskElement.querySelector('.task-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    deleteTask(task.id);
                });
            }
            
            // Click on task to edit
            taskElement.addEventListener('click', (e) => {
                if (!e.target.classList.contains('task-checkbox') && 
                    !e.target.closest('.task-actions')) {
                    showTaskModal(task);
                }
            });
        }
    });
}

// Create HTML for a single task
function createTaskHTML(task) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && !task.completed;
    const dueDateStr = dueDate ? formatDate(dueDate) : '';
    
    return `
        <div id="task-${task.id}" class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'border-red-300' : ''} cursor-pointer">
            <div class="flex items-start space-x-3">
                <input type="checkbox" class="task-checkbox custom-checkbox mt-1" ${task.completed ? 'checked' : ''}>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-1">
                        <h4 class="task-title font-medium text-gray-900 dark:text-white text-sm">${task.title}</h4>
                        <div class="task-priority-indicator ${getPriorityClass(task.priority)}"></div>
                    </div>
                    ${task.description ? `<p class="text-xs text-gray-600 dark:text-gray-400 mb-2">${task.description}</p>` : ''}
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            ${task.tag ? `<span class="task-tag ${getTagClass(task.tag)}">${task.tag}</span>` : ''}
                            ${task.repeating ? `<span class="text-xs text-blue-600 dark:text-blue-400">🔄</span>` : ''}
                        </div>
                        ${dueDateStr ? `<span class="text-xs ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}">${dueDateStr}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions flex items-center space-x-1">
                    <button class="task-edit p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button class="task-delete p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Get priority CSS class
function getPriorityClass(priority) {
    switch (priority) {
        case 'high':
            return 'task-priority-high';
        case 'medium':
            return 'task-priority-medium';
        case 'low':
            return 'task-priority-low';
        default:
            return 'task-priority-low';
    }
}

// Get tag CSS class
function getTagClass(tag) {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('work')) return 'task-tag-work';
    if (tagLower.includes('personal')) return 'task-tag-personal';
    if (tagLower.includes('health')) return 'task-tag-health';
    return 'task-tag-default';
}

// Format date for display
function formatDate(date) {
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    
    return date.toLocaleDateString();
}

// Filter tasks based on current filters
function filterTasks(tasks) {
    const statusFilters = getActiveStatusFilters();
    const priorityFilters = getActivePriorityFilters();
    const tagFilters = getActiveTagFilters();
    
    return tasks.filter(task => {
        // Status filter
        if (statusFilters.length > 0 && !statusFilters.includes(task.completed ? 'completed' : 'pending')) {
            return false;
        }
        
        // Priority filter
        if (priorityFilters.length > 0 && !priorityFilters.includes(task.priority)) {
            return false;
        }
        
        // Tag filter
        if (tagFilters.length > 0 && !tagFilters.includes(task.tag)) {
            return false;
        }
        
        return true;
    });
}

// Get active status filters
function getActiveStatusFilters() {
    const filters = [];
    if (document.getElementById('filterCompleted')?.checked) filters.push('completed');
    if (document.getElementById('filterPending')?.checked) filters.push('pending');
    if (document.getElementById('filterAll')?.checked) return []; // Show all
    return filters;
}

// Get active priority filters
function getActivePriorityFilters() {
    const filters = [];
    if (document.getElementById('filterHigh')?.checked) filters.push('high');
    if (document.getElementById('filterMedium')?.checked) filters.push('medium');
    if (document.getElementById('filterLow')?.checked) filters.push('low');
    return filters;
}

// Get active tag filters
function getActiveTagFilters() {
    const tagFilters = document.querySelectorAll('#tagFilters input[type="checkbox"]:checked');
    return Array.from(tagFilters).map(filter => filter.value);
}

// Initialize filters
function initFilters() {
    const filterInputs = document.querySelectorAll('#sidebar input[type="checkbox"]');
    filterInputs.forEach(input => {
        input.addEventListener('change', () => {
            renderTasks();
        });
    });
}

// Update task count
function updateTaskCount() {
    const taskCount = document.getElementById('taskCount');
    if (taskCount) {
        const filteredTasks = filterTasks(tasks);
        const completedCount = filteredTasks.filter(task => task.completed).length;
        taskCount.textContent = `${filteredTasks.length} tasks (${completedCount} completed)`;
    }
}

// Update tag filters
function updateTagFilters() {
    const tagFilters = document.getElementById('tagFilters');
    if (!tagFilters) return;
    
    const uniqueTags = [...new Set(tasks.map(task => task.tag).filter(Boolean))];
    
    tagFilters.innerHTML = uniqueTags.map(tag => `
        <label class="flex items-center">
            <input type="checkbox" value="${tag}" class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700">
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">${tag}</span>
        </label>
    `).join('');
    
    // Re-attach event listeners
    const newFilterInputs = tagFilters.querySelectorAll('input[type="checkbox"]');
    newFilterInputs.forEach(input => {
        input.addEventListener('change', () => {
            renderTasks();
        });
    });
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Export function for calendar integration
window.editTaskFromCalendar = showTaskModal;

// Initialize task management on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initTaskManagement();
});

// Export functions for use in other modules
export { 
    initTaskManagement, 
    showTaskModal, 
    hideTaskModal, 
    listenForTasks, 
    createTask, 
    updateTask, 
    deleteTask, 
    toggleTaskCompletion,
    renderTasks,
    filterTasks
};
