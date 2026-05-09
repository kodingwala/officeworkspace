// Auto-updating date and time
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const dateTimeString = now.toLocaleDateString('en-US', options);
    const dateTimeElement = document.getElementById('datetime');
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeString;
    }
}

// Update workspace counts display
function updateWorkspaceCounts() {
    const billingCount = localStorage.getItem('kw_billing_count') || 0;
    const crmCount = localStorage.getItem('kw_crm_count') || 0;
    const designCount = localStorage.getItem('kw_design_count') || 0;

    // Main cards
    const billingCountEl = document.getElementById('billing-count');
    if (billingCountEl) {
        billingCountEl.textContent = billingCount;
    }

    const crmCountEl = document.getElementById('crm-count');
    if (crmCountEl) {
        crmCountEl.textContent = crmCount;
    }

    const designCountEl = document.getElementById('design-count');
    if (designCountEl) {
        designCountEl.textContent = designCount;
    }

    // Status bar
    const billingCountStatusEl = document.getElementById('billing-count-status');
    if (billingCountStatusEl) {
        billingCountStatusEl.textContent = billingCount;
    }

    const crmCountStatusEl = document.getElementById('crm-count-status');
    if (crmCountStatusEl) {
        crmCountStatusEl.textContent = crmCount;
    }

    const designCountStatusEl = document.getElementById('design-count-status');
    if (designCountStatusEl) {
        designCountStatusEl.textContent = designCount;
    }
}

// Update last opened workspace display
function updateLastOpened() {
    const last = localStorage.getItem('kw_last_workspace') || 'None';
    const lastWorkspaceEl = document.getElementById('last-workspace');
    if (lastWorkspaceEl) {
        lastWorkspaceEl.textContent = last;
    }
}

// Open workspace function
function openWorkspace(name, url) {
    // Save last opened workspace
    localStorage.setItem('kw_last_workspace', name);

    // Count system
    let countKey = '';

    if (name === 'Billing') {
        countKey = 'kw_billing_count';
    } else if (name === 'CRM') {
        countKey = 'kw_crm_count';
    } else if (name === 'Designs') {
        countKey = 'kw_design_count';
    }

    // Increase count
    let currentCount = parseInt(localStorage.getItem(countKey) || 0);
    currentCount++;
    localStorage.setItem(countKey, currentCount);

    // Update UI counts
    updateWorkspaceCounts();

    // Navigate safely
    window.location.href = './' + url;
}

// Reset workspace data
function resetWorkspaceData() {
    if (confirm('Are you sure you want to reset workspace data? This will clear all counts and last opened workspace.')) {
        // Clear only workspace data, not CRM/Billing/Designs data
        localStorage.removeItem('kw_last_workspace');
        localStorage.removeItem('kw_billing_count');
        localStorage.removeItem('kw_crm_count');
        localStorage.removeItem('kw_design_count');
        
        // Update display
        updateWorkspaceCounts();
        updateLastOpened();
        
        // Show confirmation
        alert('Workspace data has been reset successfully.');
    }
}

// Help Center Functions
let currentHelpTab = 'billing';
let currentTopicIndex = 0;
let totalTopicsCount = 0;

function openHelpCenter() {
    const modal = document.getElementById('helpModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Initialize help center
    currentTopicIndex = 0;
    updateHelpNavigation();
    showCurrentTopic();
    updateProgressBar();
}

function closeHelpCenter() {
    const modal = document.getElementById('helpModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function switchHelpTab(tab, button) {
    currentHelpTab = tab;
    currentTopicIndex = 0;
    
    // Update tab buttons
    document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
    button.classList.add('active');
    
    // Update sections
    document.querySelectorAll('.help-section').forEach(s => s.classList.remove('active'));
    document.getElementById(tab + 'Help').classList.add('active');
    
    // Update section label
    const sectionLabel = document.getElementById('sectionLabel');
    if (sectionLabel) {
        const labels = {
            'billing': '📘 Billing Guide',
            'crm': '📞 CRM Guide',
            'designs': '🎨 Designs Guide'
        };
        sectionLabel.textContent = labels[tab] || '📘 Help Guide';
    }
    
    // Count topics in current section
    countTopics();
    updateHelpNavigation();
    showCurrentTopic();
    updateProgressBar();
}

function countTopics() {
    const section = document.getElementById(currentHelpTab + 'Help');
    if (section) {
        const topics = section.querySelectorAll('.help-topic');
        totalTopicsCount = topics.length;
        document.getElementById('totalTopics').textContent = totalTopicsCount;
        document.getElementById('totalProgress').textContent = totalTopicsCount;
    }
}

function showCurrentTopic() {
    const section = document.getElementById(currentHelpTab + 'Help');
    if (!section) return;
    
    const topics = section.querySelectorAll('.help-topic');
    topics.forEach((topic, index) => {
        topic.classList.toggle('active-topic', index === currentTopicIndex);
    });
    
    document.getElementById('currentTopic').textContent = currentTopicIndex + 1;
}

function navigateHelp(direction) {
    const section = document.getElementById(currentHelpTab + 'Help');
    if (!section) return;
    
    const topics = section.querySelectorAll('.help-topic');
    if (direction > 0 && currentTopicIndex < topics.length - 1) {
        currentTopicIndex++;
    } else if (direction < 0 && currentTopicIndex > 0) {
        currentTopicIndex--;
    }
    
    showCurrentTopic();
    updateHelpNavigation();
    updateProgressBar();
    
    // Auto-scroll to topic
    const activeTopic = document.querySelector('.help-topic.active-topic');
    if (activeTopic) {
        activeTopic.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function updateHelpNavigation() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const nextBtnText = document.getElementById('nextBtnText');
    
    if (prevBtn) {
        prevBtn.disabled = currentTopicIndex === 0;
    }
    
    if (nextBtn) {
        const section = document.getElementById(currentHelpTab + 'Help');
        if (section) {
            const topics = section.querySelectorAll('.help-topic');
            const isLastTopic = currentTopicIndex >= topics.length - 1;
            nextBtn.disabled = isLastTopic;
            nextBtnText.textContent = isLastTopic ? '✅ Finish Guide' : 'Next';
        }
    }
}

function updateProgressBar() {
    const progressFill = document.getElementById('progressFill');
    const currentProgress = document.getElementById('currentProgress');
    
    if (progressFill && currentProgress) {
        const percentage = ((currentTopicIndex + 1) / totalTopicsCount) * 100;
        progressFill.style.width = percentage + '%';
        currentProgress.textContent = currentTopicIndex + 1;
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('helpModal');
        if (modal && modal.classList.contains('active')) {
            closeHelpCenter();
        }
    }
    
    // Help center navigation
    const modal = document.getElementById('helpModal');
    if (modal && modal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
            navigateHelp(-1);
        } else if (e.key === 'ArrowRight') {
            navigateHelp(1);
        }
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update date/time immediately
    updateDateTime();
    
    // Update date/time every second
    setInterval(updateDateTime, 1000);
    
    // Initialize workspace counts
    updateWorkspaceCounts();
    
    // Initialize last opened workspace
    updateLastOpened();
    
    // Count initial topics
    countTopics();
});