// Global Variables
let tasks = [];
let editingTaskId = null;
let currentTaskIdCounter = 1;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    generateTaskId();
    renderTasks();
    updateDashboard();
    setupEventListeners();
});

// Update Date/Time
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('datetime').textContent = now.toLocaleDateString('en-US', options);
}

// Generate Task ID
function generateTaskId() {
    const year = new Date().getFullYear();
    const taskId = `KW-TASK-${year}-${String(currentTaskIdCounter).padStart(4, '0')}`;
    document.getElementById('taskId').value = taskId;
}

// Setup Event Listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('taskForm').addEventListener('submit', handleFormSubmit);
    
    // Clear button
    document.getElementById('clearBtn').addEventListener('click', clearForm);
    
    // Update button
    document.getElementById('updateBtn').addEventListener('click', handleUpdate);
    
    // Filters
    document.getElementById('searchInput').addEventListener('input', renderTasks);
    document.getElementById('categoryFilter').addEventListener('change', renderTasks);
    document.getElementById('statusFilter').addEventListener('change', renderTasks);
    document.getElementById('priorityFilter').addEventListener('change', renderTasks);
    
    // Actions
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllTasks);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('viewModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Handle Form Submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const task = {
        id: document.getElementById('taskId').value,
        clientName: document.getElementById('clientName').value,
        businessName: document.getElementById('businessName').value,
        assignedTo: document.getElementById('assignedTo').value,
        workerPhone: document.getElementById('workerPhone').value,
        category: document.getElementById('taskCategory').value,
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('priority').value,
        deadlineDate: document.getElementById('deadlineDate').value,
        deadlineTime: document.getElementById('deadlineTime').value,
        status: document.getElementById('status').value,
        workLink: document.getElementById('workLink').value,
        githubLink: document.getElementById('githubLink').value,
        driveLink: document.getElementById('driveLink').value,
        screenshotLink: document.getElementById('screenshotLink').value,
        notes: document.getElementById('notes').value,
        createdDate: new Date().toISOString()
    };
    
    tasks.push(task);
    saveTasks();
    renderTasks();
    updateDashboard();
    clearForm();
    showToast('Task added successfully!', 'success');
    
    // Update task ID counter
    currentTaskIdCounter++;
    generateTaskId();
}

// Handle Update
function handleUpdate() {
    const taskId = document.getElementById('taskId').value;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            clientName: document.getElementById('clientName').value,
            businessName: document.getElementById('businessName').value,
            assignedTo: document.getElementById('assignedTo').value,
            workerPhone: document.getElementById('workerPhone').value,
            category: document.getElementById('taskCategory').value,
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            priority: document.getElementById('priority').value,
            deadlineDate: document.getElementById('deadlineDate').value,
            deadlineTime: document.getElementById('deadlineTime').value,
            status: document.getElementById('status').value,
            workLink: document.getElementById('workLink').value,
            githubLink: document.getElementById('githubLink').value,
            driveLink: document.getElementById('driveLink').value,
            screenshotLink: document.getElementById('screenshotLink').value,
            notes: document.getElementById('notes').value
        };
        
        saveTasks();
        renderTasks();
        updateDashboard();
        clearForm();
        showToast('Task updated successfully!', 'success');
    }
}

// Clear Form
function clearForm() {
    document.getElementById('taskForm').reset();
    generateTaskId();
    editingTaskId = null;
    document.getElementById('updateBtn').style.display = 'none';
    document.querySelector('.btn-primary').style.display = 'block';
}

// Edit Task
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        document.getElementById('taskId').value = task.id;
        document.getElementById('clientName').value = task.clientName;
        document.getElementById('businessName').value = task.businessName;
        document.getElementById('assignedTo').value = task.assignedTo;
        document.getElementById('workerPhone').value = task.workerPhone;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('priority').value = task.priority;
        document.getElementById('deadlineDate').value = task.deadlineDate;
        document.getElementById('deadlineTime').value = task.deadlineTime;
        document.getElementById('status').value = task.status;
        document.getElementById('workLink').value = task.workLink || '';
        document.getElementById('githubLink').value = task.githubLink || '';
        document.getElementById('driveLink').value = task.driveLink || '';
        document.getElementById('screenshotLink').value = task.screenshotLink || '';
        document.getElementById('notes').value = task.notes || '';
        
        document.getElementById('updateBtn').style.display = 'block';
        document.querySelector('.btn-primary').style.display = 'none';
        document.getElementById('taskForm').scrollIntoView({ behavior: 'smooth' });
    }
}

// Delete Task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        updateDashboard();
        showToast('Task deleted successfully!', 'success');
    }
}

// View Task
function viewTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="modal-detail">
                <span class="modal-detail-label">Task ID:</span>
                <span class="modal-detail-value">${task.id}</span>
            </div>
            <div class="modal-detail">
                <span class="modal-detail-label">Client Name:</span>
                <span class="modal-detail-value">${task.clientName}</span>
            </div>
            <div class="modal-detail">
                <span class="modal-detail-label">Business Name:</span>
                <span class="modal-detail-value">${task.businessName}</span>
            </div>
            <div class="modal-detail">
                <span class="modal-detail-label">Assigned To:</span>
                <span class="modal-detail-value">${task.assignedTo}</span>
            </div>
            <div class="modal-detail">
                <span class="modal-detail-label">Worker Phone:</span>
                <span class="modal-detail-value">${task.workerPhone}</span>
            </div>
            <div class="modal-detail">
                <span class="modal-detail-label">Category:</span>
                <span class="modal-detail-value">${task.category}</span>
            </div>
            <div class="modal-detail">
                <span class="modal-detail-label">Task Title:</span>
                <span class="modal-detail-value">${task.title}</span>
            </div>
            <div class="modal-detail">
                <span class="modal-detail-label">Description:</span>
                <span class="modal-detail-value">${task.description}</span>
            </div>
            <div class="modal-detail">
                <span class="modal-detail-label">Priority:</span>
                <span class="modal-detail-value">
                    <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                </span>
            </div>
            <div class="modal-detail">
                <span class="modal-detail-label">Deadline:</span>
                <span class="modal-detail-value">${task.deadlineDate} at ${task.deadlineTime}</span>
            </div>
            <div class="modal-detail">
                <span class="modal-detail-label">Status:</span>
                <span class="modal-detail-value">
                    <span class="status-badge status-${task.status.toLowerCase()}">${task.status}</span>
                </span>
            </div>
            ${task.workLink ? `
            <div class="modal-detail">
                <span class="modal-detail-label">Work Link:</span>
                <span class="modal-detail-value">
                    <a href="${task.workLink}" target="_blank" style="color: var(--koding-cyan); text-decoration: none;">${task.workLink}</a>
                </span>
            </div>
            ` : ''}
            ${task.githubLink ? `
            <div class="modal-detail">
                <span class="modal-detail-label">GitHub Link:</span>
                <span class="modal-detail-value">
                    <a href="${task.githubLink}" target="_blank" style="color: var(--koding-cyan); text-decoration: none;">${task.githubLink}</a>
                </span>
            </div>
            ` : ''}
            ${task.driveLink ? `
            <div class="modal-detail">
                <span class="modal-detail-label">Google Drive Link:</span>
                <span class="modal-detail-value">
                    <a href="${task.driveLink}" target="_blank" style="color: var(--koding-cyan); text-decoration: none;">${task.driveLink}</a>
                </span>
            </div>
            ` : ''}
            ${task.screenshotLink ? `
            <div class="modal-detail">
                <span class="modal-detail-label">Screenshot Link:</span>
                <span class="modal-detail-value">
                    <a href="${task.screenshotLink}" target="_blank" style="color: var(--koding-cyan); text-decoration: none;">${task.screenshotLink}</a>
                </span>
            </div>
            ` : ''}
            ${task.notes ? `
            <div class="modal-detail">
                <span class="modal-detail-label">Notes:</span>
                <span class="modal-detail-value">${task.notes}</span>
            </div>
            ` : ''}
            <div class="modal-detail">
                <span class="modal-detail-label">Created Date:</span>
                <span class="modal-detail-value">${new Date(task.createdDate).toLocaleDateString()}</span>
            </div>
        `;
        
        document.getElementById('viewModal').style.display = 'block';
    }
}

// Close Modal
function closeModal() {
    document.getElementById('viewModal').style.display = 'none';
}

// Mark as Working
function markAsWorking(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'Working';
        saveTasks();
        renderTasks();
        updateDashboard();
        showToast('Task marked as Working!', 'info');
    }
}

// Mark as Completed
function markAsCompleted(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'Completed';
        saveTasks();
        renderTasks();
        updateDashboard();
        showToast('Task marked as Completed!', 'success');
    }
}

// WhatsApp Worker
function whatsappWorker(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const message = `Hello ${task.assignedTo}, I'm following up on task "${task.title}" for ${task.businessName}. Please update the status.`;
        const whatsappUrl = `https://wa.me/${task.workerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }
}

// Render Tasks
function renderTasks() {
    const tbody = document.getElementById('taskTableBody');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    let filteredTasks = tasks.filter(task => {
        const matchesSearch = task.id.toLowerCase().includes(searchTerm) ||
                            task.clientName.toLowerCase().includes(searchTerm) ||
                            task.assignedTo.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || task.category === categoryFilter;
        const matchesStatus = !statusFilter || task.status === statusFilter;
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;
        
        return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
    });
    
    tbody.innerHTML = filteredTasks.map(task => `
        <tr>
            <td>${task.id}</td>
            <td>${task.clientName}</td>
            <td>${task.assignedTo}</td>
            <td>${task.category}</td>
            <td>
                <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
            </td>
            <td>${task.deadlineDate} ${task.deadlineTime}</td>
            <td>
                <span class="status-badge status-${task.status.toLowerCase()}">${task.status}</span>
            </td>
            <td>
                <button class="action-btn action-view" onclick="viewTask('${task.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn action-edit" onclick="editTask('${task.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn action-delete" onclick="deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="action-btn action-whatsapp" onclick="whatsappWorker('${task.id}')">
                    <i class="fab fa-whatsapp"></i>
                </button>
                ${task.status !== 'Working' ? 
                    `<button class="action-btn action-view" onclick="markAsWorking('${task.id}')">
                        <i class="fas fa-play"></i>
                    </button>` : ''}
                ${task.status !== 'Completed' ? 
                    `<button class="action-btn action-view" onclick="markAsCompleted('${task.id}')">
                        <i class="fas fa-check"></i>
                    </button>` : ''}
            </td>
        </tr>
    `).join('');
}

// Update Dashboard
function updateDashboard() {
    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('pendingTasks').textContent = tasks.filter(t => t.status === 'Pending').length;
    document.getElementById('workingTasks').textContent = tasks.filter(t => t.status === 'Working').length;
    document.getElementById('completedTasks').textContent = tasks.filter(t => t.status === 'Completed').length;
    document.getElementById('delayedTasks').textContent = tasks.filter(t => t.status === 'Delayed').length;
}

// Save Tasks to LocalStorage
function saveTasks() {
    localStorage.setItem('kodingwala-tasks', JSON.stringify(tasks));
    
    // Update task ID counter
    if (tasks.length > 0) {
        const lastTask = tasks[tasks.length - 1];
        const taskIdParts = lastTask.id.split('-');
        const lastNumber = parseInt(taskIdParts[3]);
        currentTaskIdCounter = lastNumber + 1;
    }
}

// Load Tasks from LocalStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('kodingwala-tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        
        // Update task ID counter
        if (tasks.length > 0) {
            const lastTask = tasks[tasks.length - 1];
            const taskIdParts = lastTask.id.split('-');
            const lastNumber = parseInt(taskIdParts[3]);
            currentTaskIdCounter = lastNumber + 1;
        }
    }
}

// Export to CSV
function exportToCSV() {
    if (tasks.length === 0) {
        showToast('No tasks to export!', 'warning');
        return;
    }
    
    const headers = [
        'Task ID', 'Client Name', 'Business Name', 'Assigned To', 'Worker Phone',
        'Category', 'Title', 'Description', 'Priority', 'Deadline Date', 'Deadline Time',
        'Status', 'Work Link', 'GitHub Link', 'Google Drive Link', 'Screenshot Link', 'Notes'
    ];
    
    const csvContent = [
        headers.join(','),
        ...tasks.map(task => [
            task.id,
            `"${task.clientName}"`,
            `"${task.businessName}"`,
            `"${task.assignedTo}"`,
            `"${task.workerPhone}"`,
            `"${task.category}"`,
            `"${task.title}"`,
            `"${task.description}"`,
            task.priority,
            task.deadlineDate,
            task.deadlineTime,
            task.status,
            `"${task.workLink || ''}"`,
            `"${task.githubLink || ''}"`,
            `"${task.driveLink || ''}"`,
            `"${task.screenshotLink || ''}"`,
            `"${task.notes || ''}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kodingwala-tasks-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Tasks exported successfully!', 'success');
}

// Clear All Tasks
function clearAllTasks() {
    if (confirm('Are you sure you want to delete all tasks? This action cannot be undone!')) {
        tasks = [];
        saveTasks();
        renderTasks();
        updateDashboard();
        showToast('All tasks cleared!', 'success');
    }
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${iconMap[type]} toast-icon"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Add toast slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);