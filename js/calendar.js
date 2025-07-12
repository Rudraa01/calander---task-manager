// Calendar module using FullCalendar
import { auth, db } from './firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let calendar;
let tasks = [];
let currentUser = null;

// Initialize calendar
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) return;
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        height: 'auto',
        navLinks: true,
        selectable: true,
        selectMirror: true,
        editable: true,
        dayMaxEvents: true,
        weekends: true,
        
        // Event sources
        events: [],
        
        // Date selection
        select: function(info) {
            // Open task modal with selected date
            const taskModal = document.getElementById('taskModal');
            const taskDueDate = document.getElementById('taskDueDate');
            
            if (taskModal && taskDueDate) {
                // Set default date and time
                const selectedDate = new Date(info.start);
                const defaultTime = new Date(selectedDate);
                defaultTime.setHours(9, 0, 0, 0); // Default to 9:00 AM
                
                taskDueDate.value = defaultTime.toISOString().slice(0, 16);
                showTaskModal();
            }
        },
        
        // Event click
        eventClick: function(info) {
            const task = tasks.find(t => t.id === info.event.id);
            if (task) {
                editTask(task);
            }
        },
        
        // Event drag and drop
        eventDrop: function(info) {
            const task = tasks.find(t => t.id === info.event.id);
            if (task) {
                const newDate = new Date(info.event.start);
                updateTaskDate(task.id, newDate);
            }
        },
        
        // Event resize
        eventResize: function(info) {
            const task = tasks.find(t => t.id === info.event.id);
            if (task) {
                const newEndDate = new Date(info.event.end);
                updateTaskEndDate(task.id, newEndDate);
            }
        },
        
        // Day cell rendering
        dayCellDidMount: function(info) {
            const date = info.date;
            const today = new Date();
            
            // Highlight today
            if (date.toDateString() === today.toDateString()) {
                info.el.classList.add('fc-day-today');
            }
            
            // Highlight weekends
            if (date.getDay() === 0 || date.getDay() === 6) {
                info.el.classList.add('fc-day-weekend');
            }
        },
        
        // Custom event rendering
        eventDidMount: function(info) {
            const task = tasks.find(t => t.id === info.event.id);
            if (task) {
                // Add priority class
                info.el.classList.add(`priority-${task.priority}`);
                
                // Add completion status
                if (task.completed) {
                    info.el.classList.add('completed');
                    info.el.style.opacity = '0.6';
                }
                
                // Add tooltip
                info.el.title = `${task.title}\n${task.description || ''}\nPriority: ${task.priority}`;
            }
        }
    });
    
    calendar.render();
    
    // Custom navigation buttons
    const prevBtn = document.getElementById('calendarPrevBtn');
    const nextBtn = document.getElementById('calendarNextBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            calendar.prev();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            calendar.next();
        });
    }
}

// Update task date
async function updateTaskDate(taskId, newDate) {
    try {
        const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
        await updateDoc(taskRef, {
            dueDate: newDate.toISOString(),
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating task date:', error);
        showError('Failed to update task date');
    }
}

// Update task end date
async function updateTaskEndDate(taskId, newEndDate) {
    try {
        const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
        await updateDoc(taskRef, {
            endDate: newEndDate.toISOString(),
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating task end date:', error);
        showError('Failed to update task end date');
    }
}

// Convert tasks to calendar events
function tasksToEvents(tasks) {
    return tasks.map(task => ({
        id: task.id,
        title: task.title,
        start: task.dueDate,
        end: task.endDate || task.dueDate,
        allDay: !task.dueDate.includes('T') || task.dueDate.includes('T00:00:00'),
        backgroundColor: getPriorityColor(task.priority),
        borderColor: getPriorityColor(task.priority),
        classNames: [
            `priority-${task.priority}`,
            task.completed ? 'completed' : '',
            `task-${task.tag || 'default'}`
        ].filter(Boolean),
        extendedProps: {
            description: task.description,
            priority: task.priority,
            tag: task.tag,
            completed: task.completed,
            repeating: task.repeating
        }
    }));
}

// Get priority color
function getPriorityColor(priority) {
    switch (priority) {
        case 'high':
            return '#dc2626';
        case 'medium':
            return '#f59e0b';
        case 'low':
            return '#10b981';
        default:
            return '#6b7280';
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
        
        // Update calendar events
        if (calendar) {
            const events = tasksToEvents(tasks);
            calendar.removeAllEvents();
            calendar.addEventSource(events);
        }
    });
}

// Go to specific date
function goToDate(date) {
    if (calendar) {
        calendar.gotoDate(date);
    }
}

// Change calendar view
function changeView(view) {
    if (calendar) {
        calendar.changeView(view);
    }
}

// Refresh calendar
function refreshCalendar() {
    if (calendar) {
        calendar.refetchEvents();
    }
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

// Show task modal (imported from tasks.js)
function showTaskModal() {
    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
        taskModal.classList.remove('hidden');
    }
}

// Edit task (imported from tasks.js)
function editTask(task) {
    // This will be implemented in tasks.js
    if (window.editTaskFromCalendar) {
        window.editTaskFromCalendar(task);
    }
}

// Initialize calendar on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
});

// Export functions for use in other modules
export { 
    initCalendar, 
    listenForTasks, 
    goToDate, 
    changeView, 
    refreshCalendar,
    tasksToEvents,
    getPriorityColor
};
