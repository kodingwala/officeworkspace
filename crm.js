// Global variables
let leads = [];
let currentEditId = null;
let filteredLeads = [];
let statusChart = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromLocalStorage();
    updateDashboard();
    renderLeadsTable();
    renderFollowups();
    updateCurrentDate();
    setDefaultFollowupDateTime();
    
    // Event listeners
    if (document.getElementById('menuToggle')) {
        document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
    }
    
    if (document.getElementById('leadForm')) {
        document.getElementById('leadForm').addEventListener('submit', handleFormSubmit);
    }
    
    if (document.getElementById('globalSearch')) {
        document.getElementById('globalSearch').addEventListener('input', handleGlobalSearch);
    }
    
    if (document.getElementById('leadsSearch')) {
        document.getElementById('leadsSearch').addEventListener('input', filterLeads);
    }
    
    if (document.getElementById('categoryFilter')) {
        document.getElementById('categoryFilter').addEventListener('change', filterLeads);
    }
    
    if (document.getElementById('statusFilter')) {
        document.getElementById('statusFilter').addEventListener('change', filterLeads);
    }
    
    if (document.getElementById('servicesFilter')) {
        document.getElementById('servicesFilter').addEventListener('change', filterLeads);
    }
    
    if (document.getElementById('budgetSelect')) {
        document.getElementById('budgetSelect').addEventListener('change', handleBudgetChange);
    }
    
    if (document.getElementById('csvFileInput')) {
        document.getElementById('csvFileInput').addEventListener('change', handleFileSelect);
    }
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Close modal on outside click
    if (document.getElementById('viewLeadModal')) {
        document.getElementById('viewLeadModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    
    // Auto update date every minute
    setInterval(updateCurrentDate, 60000);
});

// LocalStorage functions
function saveDataToLocalStorage() {
    localStorage.setItem('kodingwala_leads', JSON.stringify(leads));
}

function loadDataFromLocalStorage() {
    const savedLeads = localStorage.getItem('kodingwala_leads');
    if (savedLeads) {
        leads = JSON.parse(savedLeads);
    }
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const page = e.currentTarget.getAttribute('data-page');
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Show corresponding page
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
    
    // Update data for specific pages
    if (page === 'dashboard') {
        updateDashboard();
    } else if (page === 'all-leads') {
        renderLeadsTable();
    } else if (page === 'follow-ups') {
        renderFollowups();
    } else if (page === 'categories') {
        updateCategoriesPage();
    } else if (page === 'services') {
        updateServicesPage();
    } else if (page === 'export-import') {
        updateExportImportPage();
    } else if (page === 'settings') {
        updateSettingsPage();
    }
}

// Sidebar toggle
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Update current date
function updateCurrentDate() {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = date.toLocaleDateString('en-IN', options);
}

// Set default follow-up date and time
function setDefaultFollowupDateTime() {
    const date = new Date();
    const today = date.toISOString().split('T')[0];
    const time = date.toTimeString().split(' ')[0].substring(0, 5);
    
    // Only set if not editing an existing lead
    if (!currentEditId) {
        const dateInput = document.querySelector('input[name="followupDate"]');
        const timeInput = document.querySelector('input[name="followupTime"]');
        if (dateInput) dateInput.value = today;
        if (timeInput) timeInput.value = time;
    }
}

// Form handling
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const lead = {
        id: currentEditId || Date.now(),
        businessName: formData.get('businessName'),
        contactPerson: formData.get('contactPerson'),
        phoneNumber: formData.get('phoneNumber'),
        whatsappNumber: formData.get('whatsappNumber') || formData.get('phoneNumber'),
        email: formData.get('email'),
        category: formData.get('category'),
        location: formData.get('location'),
        googleMapsLink: formData.get('googleMapsLink'),
        websiteAvailable: formData.get('websiteAvailable'),
        services: formData.getAll('services'),
        budget: formData.get('budget'),
        leadStatus: formData.get('leadStatus'),
        followupDate: formData.get('followupDate'),
        followupTime: formData.get('followupTime'),
        notes: formData.get('notes'),
        createdAt: currentEditId ? leads.find(l => l.id === currentEditId).createdAt : new Date().toISOString()
    };
    
    // Check for duplicates
    if (!currentEditId) {
        if (leads.some(l => l.phoneNumber === lead.phoneNumber)) {
            showToast('This client already exists!', 'error');
            return;
        }
        
        const similarBusiness = leads.find(l => 
            l.businessName.toLowerCase() === lead.businessName.toLowerCase()
        );
        if (similarBusiness) {
            showToast('Similar business already added', 'warning');
        }
    }
    
    if (currentEditId) {
        const index = leads.findIndex(l => l.id === currentEditId);
        leads[index] = lead;
        showToast('Lead updated successfully!', 'success');
        currentEditId = null;
        updateFormButtons();
    } else {
        leads.push(lead);
        showToast('Lead added successfully!', 'success');
    }
    
    saveDataToLocalStorage();
    refreshAllData();
    clearForm();
    showAddLeadPage();
}

// Update form buttons based on edit mode
function updateFormButtons() {
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (currentEditId) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Lead';
        submitBtn.style.display = 'inline-flex';
        cancelBtn.style.display = 'inline-flex';
    } else {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Lead';
        cancelBtn.style.display = 'none';
    }
}

// Clear form
function clearForm() {
    if (document.getElementById('leadForm')) {
        document.getElementById('leadForm').reset();
        currentEditId = null;
        setDefaultFollowupDateTime();
        updateFormButtons();
        
        // Hide custom budget input
        const customBudgetInput = document.getElementById('customBudgetInput');
        if (customBudgetInput) {
            customBudgetInput.style.display = 'none';
            customBudgetInput.value = '';
        }
    }
}

// Cancel edit
function cancelEdit() {
    clearForm();
    showAddLeadPage();
}

// Show add lead page
function showAddLeadPage() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[data-page="add-lead"]').classList.add('active');
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById('add-lead-page').classList.add('active');
    setDefaultFollowupDateTime();
    updateFormButtons();
}

// Dashboard functions
function updateDashboard() {
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.leadStatus === 'New Lead').length;
    const interestedLeads = leads.filter(l => l.leadStatus === 'Interested').length;
    const convertedClients = leads.filter(l => l.leadStatus === 'Converted Client').length;
    const followupsToday = getFollowupsToday();
    
    if (document.getElementById('totalLeads')) {
        document.getElementById('totalLeads').textContent = totalLeads;
    }
    if (document.getElementById('newLeads')) {
        document.getElementById('newLeads').textContent = newLeads;
    }
    if (document.getElementById('interestedLeads')) {
        document.getElementById('interestedLeads').textContent = interestedLeads;
    }
    if (document.getElementById('followupsToday')) {
        document.getElementById('followupsToday').textContent = followupsToday.length;
    }
    if (document.getElementById('convertedClients')) {
        document.getElementById('convertedClients').textContent = convertedClients;
    }
    
    // Update status chart
    updateStatusChart();
    
    // Update recent leads
    const recentLeads = leads.slice(-5).reverse();
    const recentLeadsContainer = document.getElementById('recentLeads');
    if (recentLeadsContainer) {
        recentLeadsContainer.innerHTML = recentLeads.length > 0 ? recentLeads.map(lead => `
            <div class="lead-item">
                <div class="lead-info">
                    <h4>${lead.businessName}</h4>
                    <p>${lead.contactPerson} - ${lead.phoneNumber}</p>
                </div>
                <span class="lead-status status-${getStatusClass(lead.leadStatus)}">${lead.leadStatus}</span>
            </div>
        `).join('') : '<p class="text-center text-gray-500">No recent leads</p>';
    }
}

// Get status class for CSS
function getStatusClass(status) {
    const statusMap = {
        'New Lead': 'new',
        'Not Called': 'not-called',
        'Called': 'called',
        'Interested': 'interested',
        'Not Interested': 'not-interested',
        'Call Later': 'call-later',
        'Meeting Fixed': 'meeting-fixed',
        'Converted Client': 'converted'
    };
    return statusMap[status] || '';
}

// Update status chart
function updateStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    const statusCounts = {
        'New Lead': leads.filter(l => l.leadStatus === 'New Lead').length,
        'Not Called': leads.filter(l => l.leadStatus === 'Not Called').length,
        'Called': leads.filter(l => l.leadStatus === 'Called').length,
        'Interested': leads.filter(l => l.leadStatus === 'Interested').length,
        'Not Interested': leads.filter(l => l.leadStatus === 'Not Interested').length,
        'Call Later': leads.filter(l => l.leadStatus === 'Call Later').length,
        'Meeting Fixed': leads.filter(l => l.leadStatus === 'Meeting Fixed').length,
        'Converted Client': leads.filter(l => l.leadStatus === 'Converted Client').length
    };
    
    const data = {
        labels: Object.keys(statusCounts),
        datasets: [{
            data: Object.values(statusCounts),
            backgroundColor: [
                '#00d4ff',
                '#a855f7',
                '#3b82f6',
                '#10b981',
                '#ef4444',
                '#f59e0b',
                '#ec4899',
                'linear-gradient(135deg, #00d4ff, #ff6b35)'
            ],
            borderWidth: 2,
            borderColor: '#0f172a'
        }]
    };
    
    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };
    
    if (statusChart) {
        statusChart.destroy();
    }
    
    try {
        statusChart = new Chart(ctx, config);
    } catch (error) {
        console.error('Chart initialization error:', error);
    }
}

// Get followups for today
function getFollowupsToday() {
    const today = new Date().toISOString().split('T')[0];
    return leads.filter(lead => lead.followupDate === today);
}

// Render leads table
function renderLeadsTable() {
    const tbody = document.getElementById('leadsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody || !emptyState) return;
    
    // Check if we have any filtered leads or all leads
    const isFilterActive = document.getElementById('leadsSearch').value || 
                          document.getElementById('categoryFilter').value || 
                          document.getElementById('statusFilter').value || 
                          document.getElementById('servicesFilter').value;
    
    const leadsToShow = isFilterActive ? filteredLeads : leads;
    
    if (leadsToShow.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = leadsToShow.map(lead => `
        <tr>
            <td>${lead.businessName}</td>
            <td>${lead.phoneNumber}</td>
            <td>${lead.category}</td>
            <td>${lead.services.join(', ')}</td>
            <td>
                <span class="lead-status status-${getStatusClass(lead.leadStatus)}">${lead.leadStatus}</span>
            </td>
            <td>${lead.followupDate || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="viewLead(${lead.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary" onclick="editLead(${lead.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <a href="tel:${lead.phoneNumber}" class="btn btn-primary" title="Call">
                        <i class="fas fa-phone-alt"></i>
                    </a>
                    <a href="https://wa.me/${lead.whatsappNumber.replace(/\D/g, '')}" class="btn btn-whatsapp" target="_blank" title="WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                    <button class="btn btn-danger" onclick="deleteLead(${lead.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter leads
function filterLeads() {
    const searchTerm = document.getElementById('leadsSearch').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;
    const service = document.getElementById('servicesFilter').value;
    
    filteredLeads = leads.filter(lead => {
        const matchesSearch = !searchTerm || 
                            lead.businessName.toLowerCase().includes(searchTerm) || 
                            lead.phoneNumber.includes(searchTerm);
        const matchesCategory = !category || lead.category === category;
        const matchesStatus = !status || lead.leadStatus === status;
        const matchesService = !service || lead.services.includes(service);
        
        return matchesSearch && matchesCategory && matchesStatus && matchesService;
    });
    
    renderLeadsTable();
}

// Clear filters
function clearFilters() {
    if (document.getElementById('leadsSearch')) {
        document.getElementById('leadsSearch').value = '';
    }
    if (document.getElementById('categoryFilter')) {
        document.getElementById('categoryFilter').value = '';
    }
    if (document.getElementById('statusFilter')) {
        document.getElementById('statusFilter').value = '';
    }
    if (document.getElementById('servicesFilter')) {
        document.getElementById('servicesFilter').value = '';
    }
    filteredLeads = [];
    renderLeadsTable();
}

// Global search
function handleGlobalSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm) {
        filteredLeads = leads.filter(lead => 
            lead.businessName.toLowerCase().includes(searchTerm) ||
            lead.phoneNumber.includes(searchTerm) ||
            lead.contactPerson.toLowerCase().includes(searchTerm)
        );
    } else {
        filteredLeads = [];
    }
    
    const currentPage = document.querySelector('.nav-item.active').getAttribute('data-page');
    if (currentPage === 'all-leads') {
        renderLeadsTable();
    }
}

// View lead
function viewLead(id) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    
    const modalBody = document.getElementById('viewLeadBody');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-building"></i>
                    Business Name
                </div>
                <div class="detail-value">${lead.businessName}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-user"></i>
                    Contact Person
                </div>
                <div class="detail-value">${lead.contactPerson}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-phone-alt"></i>
                    Phone Number
                </div>
                <div class="detail-value">
                    <a href="tel:${lead.phoneNumber}" class="btn btn-primary">
                        <i class="fas fa-phone-alt"></i> Call
                    </a>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fab fa-whatsapp"></i>
                    WhatsApp Number
                </div>
                <div class="detail-value">
                    <a href="https://wa.me/${lead.whatsappNumber.replace(/\D/g, '')}" class="btn btn-whatsapp" target="_blank">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-envelope"></i>
                    Email
                </div>
                <div class="detail-value">${lead.email || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-tag"></i>
                    Category
                </div>
                <div class="detail-value">${lead.category}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-map-marker-alt"></i>
                    Location
                </div>
                <div class="detail-value">${lead.location || '-'}</div>
            </div>
            ${lead.googleMapsLink ? `
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-map"></i>
                    Google Maps
                </div>
                <div class="detail-value">
                    <a href="${lead.googleMapsLink}" target="_blank" class="btn btn-secondary">
                        <i class="fas fa-external-link-alt"></i> View on Map
                    </a>
                </div>
            </div>
            ` : ''}
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-globe"></i>
                    Website Available
                </div>
                <div class="detail-value">${lead.websiteAvailable || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-cogs"></i>
                    Required Services
                </div>
                <div class="detail-value">${lead.services.join(', ')}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-money-bill-wave"></i>
                    Budget
                </div>
                <div class="detail-value">${lead.budget || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-flag"></i>
                    Status
                </div>
                <div class="detail-value">
                    <span class="lead-status status-${getStatusClass(lead.leadStatus)}">${lead.leadStatus}</span>
                </div>
            </div>
            ${lead.followupDate ? `
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-calendar-check"></i>
                    Follow-up Date & Time
                </div>
                <div class="detail-value">${lead.followupDate} ${lead.followupTime || ''}</div>
            </div>
            ` : ''}
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-sticky-note"></i>
                    Notes
                </div>
                <div class="detail-value">${lead.notes || '-'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas fa-clock"></i>
                    Created Date
                </div>
                <div class="detail-value">${new Date(lead.createdAt).toLocaleDateString()}</div>
            </div>
        </div>
    `;
    
    document.getElementById('viewLeadModal').classList.add('active');
}

// Edit lead
function editLead(id) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    
    currentEditId = id;
    
    // Populate form
    const form = document.getElementById('leadForm');
    if (!form) return;
    
    form.businessName.value = lead.businessName;
    form.contactPerson.value = lead.contactPerson;
    form.phoneNumber.value = lead.phoneNumber;
    form.whatsappNumber.value = lead.whatsappNumber;
    form.email.value = lead.email;
    form.category.value = lead.category;
    form.location.value = lead.location;
    form.googleMapsLink.value = lead.googleMapsLink;
    form.websiteAvailable.value = lead.websiteAvailable;
    form.budget.value = lead.budget;
    form.leadStatus.value = lead.leadStatus;
    form.followupDate.value = lead.followupDate;
    form.followupTime.value = lead.followupTime;
    form.notes.value = lead.notes;
    
    // Check services
    document.querySelectorAll('input[name="services"]').forEach(checkbox => {
        checkbox.checked = lead.services.includes(checkbox.value);
    });
    
    // Handle budget custom input
    const budgetSelect = document.getElementById('budgetSelect');
    const customBudgetInput = document.getElementById('customBudgetInput');
    if (budgetSelect && customBudgetInput) {
        if (lead.budget === 'Other') {
            budgetSelect.value = 'Other';
            customBudgetInput.style.display = 'block';
            customBudgetInput.value = '';
        } else {
            budgetSelect.value = lead.budget;
            customBudgetInput.style.display = 'none';
        }
    }
    
    // Navigate to add lead page
    showAddLeadPage();
}

// Delete lead
function deleteLead(id) {
    if (confirm('Are you sure you want to delete this lead?')) {
        leads = leads.filter(l => l.id !== id);
        saveDataToLocalStorage();
        refreshAllData();
        showToast('Lead deleted successfully!', 'success');
    }
}

// Render follow-ups
function renderFollowups() {
    const today = new Date().toISOString().split('T')[0];
    const todayFollowups = leads.filter(lead => lead.followupDate === today);
    const upcomingFollowups = leads.filter(lead => lead.followupDate && lead.followupDate > today)
                                   .sort((a, b) => new Date(a.followupDate) - new Date(b.followupDate));
    
    // Today's follow-ups
    const todayContainer = document.getElementById('todayFollowups');
    if (todayContainer) {
        todayContainer.innerHTML = todayFollowups.length > 0 ? todayFollowups.map(lead => `
            <div class="followup-item">
                <div class="followup-info">
                    <h4>${lead.businessName}</h4>
                    <div class="followup-details">
                        <p>${lead.contactPerson} - ${lead.phoneNumber}</p>
                        <p>Time: ${lead.followupTime || 'Not specified'}</p>
                    </div>
                </div>
                <div class="followup-actions">
                    <a href="tel:${lead.phoneNumber}" class="btn btn-primary">
                        <i class="fas fa-phone-alt"></i>
                    </a>
                    <a href="https://wa.me/${lead.whatsappNumber.replace(/\D/g, '')}" class="btn btn-whatsapp" target="_blank">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                    <button class="btn btn-secondary" onclick="markAsCalled(${lead.id})">
                        <i class="fas fa-check"></i> Called
                    </button>
                </div>
            </div>
        `).join('') : '<p class="text-center text-gray-500">No follow-ups scheduled for today</p>';
    }
    
    // Upcoming follow-ups
    const upcomingContainer = document.getElementById('upcomingFollowups');
    if (upcomingContainer) {
        upcomingContainer.innerHTML = upcomingFollowups.length > 0 ? upcomingFollowups.slice(0, 5).map(lead => `
            <div class="followup-item">
                <div class="followup-info">
                    <h4>${lead.businessName}</h4>
                    <div class="followup-details">
                        <p>${lead.contactPerson} - ${lead.phoneNumber}</p>
                        <p>Date: ${new Date(lead.followupDate).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="followup-actions">
                    <a href="tel:${lead.phoneNumber}" class="btn btn-primary">
                        <i class="fas fa-phone-alt"></i>
                    </a>
                    <a href="https://wa.me/${lead.whatsappNumber.replace(/\D/g, '')}" class="btn btn-whatsapp" target="_blank">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                </div>
            </div>
        `).join('') : '<p class="text-center text-gray-500">No upcoming follow-ups</p>';
    }
}

// Mark as called
function markAsCalled(id) {
    const lead = leads.find(l => l.id === id);
    if (lead) {
        lead.leadStatus = 'Called';
        saveDataToLocalStorage();
        renderFollowups();
        updateDashboard();
        showToast('Marked as called!', 'success');
    }
}

// Export CSV
function exportCSV() {
    if (leads.length === 0) {
        showToast('No leads to export', 'warning');
        return;
    }
    
    const headers = [
        'Business Name',
        'Contact Person',
        'Phone Number',
        'WhatsApp Number',
        'Email',
        'Category',
        'Location',
        'Google Maps Link',
        'Website Available',
        'Services',
        'Budget',
        'Status',
        'Follow-up Date',
        'Follow-up Time',
        'Notes',
        'Created Date'
    ];
    
    const csvContent = [
        headers.join(','),
        ...leads.map(lead => [
            `"${lead.businessName}"`,
            `"${lead.contactPerson}"`,
            `"${lead.phoneNumber}"`,
            `"${lead.whatsappNumber}"`,
            `"${lead.email || ''}"`,
            `"${lead.category}"`,
            `"${lead.location || ''}"`,
            `"${lead.googleMapsLink || ''}"`,
            `"${lead.websiteAvailable || ''}"`,
            `"${lead.services.join('; ')}"`,
            `"${lead.budget || ''}"`,
            `"${lead.leadStatus}"`,
            `"${lead.followupDate || ''}"`,
            `"${lead.followupTime || ''}"`,
            `"${lead.notes || ''}"`,
            `"${new Date(lead.createdAt).toLocaleDateString()}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kodingwala_leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Leads exported successfully!', 'success');
}

// Import CSV
function importCSV() {
    const fileInput = document.getElementById('csvFileInput');
    if (!fileInput || !fileInput.files.length) {
        showToast('Please select a CSV file', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            const newLeads = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = parseCSVLine(lines[i]);
                    const lead = {
                        id: Date.now() + i,
                        businessName: values[headers.indexOf('Business Name')] || '',
                        contactPerson: values[headers.indexOf('Contact Person')] || '',
                        phoneNumber: values[headers.indexOf('Phone Number')] || '',
                        whatsappNumber: values[headers.indexOf('WhatsApp Number')] || values[headers.indexOf('Phone Number')] || '',
                        email: values[headers.indexOf('Email')] || '',
                        category: values[headers.indexOf('Category')] || '',
                        location: values[headers.indexOf('Location')] || '',
                        googleMapsLink: values[headers.indexOf('Google Maps Link')] || '',
                        websiteAvailable: values[headers.indexOf('Website Available')] || '',
                        services: values[headers.indexOf('Services')] ? values[headers.indexOf('Services')].split(';').map(s => s.trim()) : [],
                        budget: values[headers.indexOf('Budget')] || '',
                        leadStatus: values[headers.indexOf('Status')] || 'New Lead',
                        followupDate: values[headers.indexOf('Follow-up Date')] || '',
                        followupTime: values[headers.indexOf('Follow-up Time')] || '',
                        notes: values[headers.indexOf('Notes')] || '',
                        createdAt: new Date().toISOString()
                    };
                    
                    // Check for duplicates
                    if (!leads.some(l => l.phoneNumber === lead.phoneNumber)) {
                        newLeads.push(lead);
                    }
                }
            }
            
            if (newLeads.length > 0) {
                leads.push(...newLeads);
                saveDataToLocalStorage();
                refreshAllData();
                showToast(`Successfully imported ${newLeads.length} leads!`, 'success');
            } else {
                showToast('No new leads to import (duplicates or empty data)', 'warning');
            }
            
            fileInput.value = '';
        } catch (error) {
            showToast('Error importing CSV file', 'error');
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
}

// Parse CSV line with quoted fields
function parseCSVLine(line) {
    const result = [];
    let field = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(field.trim());
            field = '';
        } else {
            field += char;
        }
    }
    
    result.push(field.trim());
    return result;
}

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type !== 'text/csv') {
        showToast('Please select a CSV file', 'error');
        e.target.value = '';
    }
}

// Handle budget change
function handleBudgetChange(e) {
    const customBudgetInput = document.getElementById('customBudgetInput');
    if (customBudgetInput) {
        if (e.target.value === 'Other') {
            customBudgetInput.style.display = 'block';
            customBudgetInput.required = true;
        } else {
            customBudgetInput.style.display = 'none';
            customBudgetInput.required = false;
            customBudgetInput.value = '';
        }
    }
}

// Update categories page
function updateCategoriesPage() {
    const categories = ['Hospital', 'Salon', 'School', 'Shop', 'Interior', 'Boutique', 'Restaurant', 'Other'];
    
    categories.forEach(category => {
        const count = leads.filter(l => l.category === category).length;
        const element = document.getElementById(`${category.toLowerCase()}Count`);
        if (element) {
            element.textContent = count;
        }
    });
}

// Update services page
function updateServicesPage() {
    const services = [
        'Static Website', 'Dynamic Website', 'Meta Ads', 'SEO', 'AI Agents',
        'Digital Marketing', 'Poster Design', 'Video Editing', 'Logo Design',
        'Google Business Profile Setup', 'WhatsApp Business Setup',
        'Social Media Page Setup', 'Other'
    ];
    
    services.forEach(service => {
        const count = leads.filter(l => l.services.includes(service)).length;
        const id = service.toLowerCase().replace(/[^a-z0-9]/g, '') + 'Count';
        const element = document.getElementById(id);
        if (element) {
            element.textContent = count;
        }
    });
}

// Update export/import page
function updateExportImportPage() {
    // This page doesn't need specific updates but can be extended
}

// Update settings page
function updateSettingsPage() {
    const totalLeads = leads.length;
    const storageUsed = JSON.stringify(leads).length / 1024; // KB
    
    const totalLeadsElement = document.getElementById('totalLeadsCount');
    if (totalLeadsElement) {
        totalLeadsElement.textContent = totalLeads;
    }
    
    const storageUsedElement = document.getElementById('storageUsed');
    if (storageUsedElement) {
        storageUsedElement.textContent = storageUsed.toFixed(2) + ' KB';
    }
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
        leads = [];
        saveDataToLocalStorage();
        refreshAllData();
        showToast('All data cleared!', 'success');
    }
}

// Refresh all data
function refreshAllData() {
    updateDashboard();
    renderLeadsTable();
    renderFollowups();
    updateCategoriesPage();
    updateServicesPage();
    updateSettingsPage();
}

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-exclamation-triangle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    const container = document.getElementById('toastContainer');
    if (container) {
        container.appendChild(toast);
    }
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('viewLeadModal');
    if (modal) {
        modal.classList.remove('active');
    }
}