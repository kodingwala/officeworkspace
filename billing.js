// Global variables
let selectedServices = [];
let invoiceNumber = 'KW-INV-2026-000001';
let invoiceLocked = false;
let bills = JSON.parse(localStorage.getItem('kodingwalaBills')) || [];
let usedInvoiceNumbers = JSON.parse(localStorage.getItem('usedInvoiceNumbers')) || [];
let reusableInvoiceNumbers = JSON.parse(localStorage.getItem('reusableInvoiceNumbers')) || [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeInvoiceNumbers();
    initializeEventListeners();
    updateInvoiceNumberDisplay();
    loadBillsHistory();
    updateClientTypeLabel();
});

// Initialize invoice numbers
function initializeInvoiceNumbers() {
    // Load used invoice numbers from localStorage
    if (usedInvoiceNumbers.length === 0) {
        // Start with 000001 but don't mark as used yet
        invoiceNumber = 'KW-INV-2026-000001';
    } else {
        // Get the next available invoice number
        invoiceNumber = getNextAvailableInvoiceNumber();
    }
}

// Get next available invoice number
function getNextAvailableInvoiceNumber() {
    // Check if there are reusable numbers first
    if (reusableInvoiceNumbers.length > 0) {
        const smallestNumber = Math.min(...reusableInvoiceNumbers);
        const invoiceNumber = `KW-INV-2026-${String(smallestNumber).padStart(6, '0')}`;
        reusableInvoiceNumbers = reusableInvoiceNumbers.filter(num => num !== smallestNumber);
        localStorage.setItem('reusableInvoiceNumbers', JSON.stringify(reusableInvoiceNumbers));
        return invoiceNumber;
    }
    
    // Get the highest number from used numbers and increment
    const numericNumbers = usedInvoiceNumbers.map(num => parseInt(num.split('-')[3]));
    const maxNumber = numericNumbers.length > 0 ? Math.max(...numericNumbers) : 0;
    const nextNumber = maxNumber + 1;
    
    return `KW-INV-2026-${String(nextNumber).padStart(6, '0')}`;
}

// Check if invoice number is already used
function isInvoiceNumberUsed(invoiceNum) {
    return usedInvoiceNumbers.includes(invoiceNum);
}

// Add invoice number to used numbers
function addInvoiceNumberToUsed(invoiceNum) {
    if (!usedInvoiceNumbers.includes(invoiceNum)) {
        usedInvoiceNumbers.push(invoiceNum);
        localStorage.setItem('usedInvoiceNumbers', JSON.stringify(usedInvoiceNumbers));
    }
}

// Remove invoice number from used numbers
function removeInvoiceNumberFromUsed(invoiceNum) {
    const index = usedInvoiceNumbers.indexOf(invoiceNum);
    if (index > -1) {
        usedInvoiceNumbers.splice(index, 1);
        localStorage.setItem('usedInvoiceNumbers', JSON.stringify(usedInvoiceNumbers));
        
        // Add to reusable numbers
        const numericPart = parseInt(invoiceNum.split('-')[3]);
        reusableInvoiceNumbers.push(numericPart);
        reusableInvoiceNumbers.sort((a, b) => a - b);
        localStorage.setItem('reusableInvoiceNumbers', JSON.stringify(reusableInvoiceNumbers));
    }
}

// Event Listeners
function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Service selection
    document.querySelectorAll('.service-item').forEach(item => {
        item.addEventListener('click', function() {
            selectService(this);
        });
    });

    // Form inputs
    document.getElementById('clientType').addEventListener('change', updateClientTypeLabel);
    document.getElementById('gstPercentage').addEventListener('input', calculateTotals);
    document.getElementById('discountPercentage').addEventListener('input', calculateTotals);
    document.getElementById('advancePaid').addEventListener('input', calculateTotals);
    document.getElementById('paymentStatus').addEventListener('change', calculateTotals);

    // Action buttons
    document.getElementById('newBillBtn').addEventListener('click', newBill);
    document.getElementById('checkInvoiceBtn').addEventListener('click', checkInvoice);
    document.getElementById('generateInvoiceBtn').addEventListener('click', generateInvoice);
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);
    document.getElementById('sendWhatsAppBtn').addEventListener('click', sendWhatsApp);
    document.getElementById('printBtn').addEventListener('click', printBill);
    document.getElementById('saveBillBtn').addEventListener('click', saveBill);
    document.getElementById('clearFormBtn').addEventListener('click', clearForm);
    document.getElementById('viewHistoryBtn').addEventListener('click', viewHistory);

    // Post-action modal buttons
    document.getElementById('downloadPdfOption').addEventListener('click', downloadPDF);
    document.getElementById('printOption').addEventListener('click', printBill);
    document.getElementById('sendWhatsAppOption').addEventListener('click', sendWhatsApp);
    document.getElementById('laterOption').addEventListener('click', function() {
        document.getElementById('postActionModal').style.display = 'none';
    });

    // Modal controls
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Search bills
    document.getElementById('searchBills').addEventListener('input', searchBills);
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// Update client type label
function updateClientTypeLabel() {
    const clientType = document.getElementById('clientType').value;
    const label = document.getElementById('businessCollegeLabel');
    label.textContent = clientType === 'Student' ? 'College Name' : 'Business Name';
}

// Service selection
function selectService(serviceItem) {
    const service = serviceItem.dataset.service;
    const price = parseFloat(serviceItem.dataset.price) || 0;
    const perDay = serviceItem.dataset.perDay === 'true';
    const perMonth = serviceItem.dataset.perMonth === 'true';

    // Check if service is already selected
    const existingIndex = selectedServices.findIndex(s => s.name === service);
    
    if (existingIndex > -1) {
        selectedServices.splice(existingIndex, 1);
        serviceItem.classList.remove('selected');
        showNotification('Service removed successfully', 'success');
    } else {
        selectedServices.push({
            name: service,
            price: price,
            quantity: 1,
            perDay: perDay,
            perMonth: perMonth
        });
        serviceItem.classList.add('selected');
        showNotification('Service added successfully', 'success');
    }

    updateSelectedServicesList();
}

// Update selected services list
function updateSelectedServicesList() {
    const listContainer = document.getElementById('selectedServicesList');
    
    if (selectedServices.length === 0) {
        listContainer.innerHTML = '<p class="no-services">No services selected</p>';
        return;
    }

    listContainer.innerHTML = selectedServices.map((service, index) => `
        <div class="service-row">
            <div class="service-info">
                <div class="service-name">${service.name}</div>
                <div class="service-details">
                    ${service.perDay ? 'per day' : service.perMonth ? 'per month' : ''}
                    <input type="number" value="${service.quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
                </div>
            </div>
            <div class="service-price">₹${(service.price * service.quantity).toFixed(2)}</div>
            <button class="remove-btn" onclick="removeService(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    calculateTotals();
}

// Update service quantity
function updateQuantity(index, value) {
    selectedServices[index].quantity = parseInt(value) || 1;
    updateSelectedServicesList();
}

// Remove service
function removeService(index) {
    selectedServices.splice(index, 1);
    updateSelectedServicesList();
    
    // Update UI to reflect deselection
    document.querySelectorAll('.service-item').forEach(item => {
        if (selectedServices.some(s => s.name === item.dataset.service)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// Calculate totals
function calculateTotals() {
    const gstPercentage = parseFloat(document.getElementById('gstPercentage').value) || 0;
    const discountPercentage = parseFloat(document.getElementById('discountPercentage').value) || 0;
    const advancePaid = parseFloat(document.getElementById('advancePaid').value) || 0;

    // Calculate subtotal
    const subtotal = selectedServices.reduce((sum, service) => {
        return sum + (service.price * service.quantity);
    }, 0);

    // Calculate GST
    const gstAmount = (subtotal * gstPercentage) / 100;

    // Calculate discount
    const discountAmount = (subtotal * discountPercentage) / 100;

    // Calculate grand total
    const grandTotal = subtotal + gstAmount - discountAmount;

    // Calculate balance
    const balanceAmount = grandTotal - advancePaid;

    // Update display
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('gstAmount').textContent = `₹${gstAmount.toFixed(2)}`;
    document.getElementById('discountAmount').textContent = `₹${discountAmount.toFixed(2)}`;
    document.getElementById('grandTotal').textContent = `₹${grandTotal.toFixed(2)}`;
    document.getElementById('balanceAmount').textContent = `₹${balanceAmount.toFixed(2)}`;
}

// Validate invoice form
function validateInvoiceForm() {
    const requiredFields = ['clientName', 'clientType', 'phoneNumber', 'email', 'paymentMode'];
    for (let field of requiredFields) {
        if (!document.getElementById(field).value) {
            showNotification('Please fill in all required fields', 'error');
            return false;
        }
    }

    if (selectedServices.length === 0) {
        showNotification('Please select at least one service', 'error');
        return false;
    }

    return true;
}

// Build invoice preview
function buildInvoicePreview(isPreview = true) {
    const clientName = document.getElementById('clientName').value;
    const clientType = document.getElementById('clientType').value;
    const businessCollegeName = document.getElementById('businessCollegeName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const projectDescription = document.getElementById('projectDescription').value;
    const paymentMode = document.getElementById('paymentMode').value;
    const notes = document.getElementById('notes').value;
    const paymentStatus = document.getElementById('paymentStatus').value;

    const subtotal = selectedServices.reduce((sum, service) => sum + (service.price * service.quantity), 0);
    const gstPercentage = parseFloat(document.getElementById('gstPercentage').value) || 0;
    const discountPercentage = parseFloat(document.getElementById('discountPercentage').value) || 0;
    const advancePaid = parseFloat(document.getElementById('advancePaid').value) || 0;
    const gstAmount = (subtotal * gstPercentage) / 100;
    const discountAmount = (subtotal * discountPercentage) / 100;
    const grandTotal = subtotal + gstAmount - discountAmount;
    const balanceAmount = grandTotal - advancePaid;
    const invoiceDateTime = new Date().toLocaleString();

    return `
        <div class="invoice-header">
            <div class="invoice-logo">
                <span class="koding">Koding</span><span class="wala">Wala</span>
            </div>
            <div class="invoice-tagline">Design • Develop • Deliver</div>
            <a href="https://kodingwala.site" target="_blank" class="invoice-website">kodingwala.site</a>
            ${isPreview ? '<div class="invoice-preview-label">INVOICE PREVIEW ONLY</div>' : ''}
            <div class="invoice-number">INVOICE ${invoiceNumber}</div>
            <div class="invoice-date">Date & Time: ${invoiceDateTime}</div>
        </div>

        <div class="invoice-details">
            <div class="invoice-client-info">
                <h3>Seller Details</h3>
                <p><strong>KodingWala</strong></p>
                <p>Website: <a href="https://kodingwala.site" target="_blank">kodingwala.site</a></p>
                <p>Tagline: Design • Develop • Deliver</p>
                
                <h3 style="margin-top: 20px;">Client Details</h3>
                <p><strong>Client Name:</strong> ${clientName}</p>
                <p><strong>Client Type:</strong> ${clientType}</p>
                ${businessCollegeName ? `<p><strong>${clientType === 'Student' ? 'College' : 'Business'}:</strong> ${businessCollegeName}</p>` : ''}
                <p><strong>Phone:</strong> ${phoneNumber}</p>
                <p><strong>Email:</strong> ${email}</p>
                ${address ? `<p><strong>Address:</strong> ${address}</p>` : ''}
                ${projectDescription ? `<p><strong>Project Description:</strong> ${projectDescription}</p>` : ''}
            </div>

            <div class="invoice-services">
                <h3>Services (${selectedServices.length} items)</h3>
                <table class="invoice-services-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Service</th>
                            <th>Qty/Days</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${selectedServices.map((service, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${service.name}</td>
                                <td>${service.perDay ? service.quantity + ' days' : service.perMonth ? service.quantity + ' months' : service.quantity}</td>
                                <td>₹${service.price.toFixed(2)}</td>
                                <td>₹${(service.price * service.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="invoice-totals">
            <div class="invoice-totals-row">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="invoice-totals-row">
                <span>GST (${gstPercentage}%):</span>
                <span>₹${gstAmount.toFixed(2)}</span>
            </div>
            <div class="invoice-totals-row">
                <span>Discount (${discountPercentage}%):</span>
                <span>₹${discountAmount.toFixed(2)}</span>
            </div>
            <div class="invoice-totals-row total">
                <span>Grand Total:</span>
                <span>₹${grandTotal.toFixed(2)}</span>
            </div>
            <div class="invoice-payment">
                <div>
                    <span>Advance Paid:</span>
                    <span>₹${advancePaid.toFixed(2)}</span>
                </div>
                <div>
                    <span>Balance Amount:</span>
                    <span>₹${balanceAmount.toFixed(2)}</span>
                </div>
            </div>
            <div class="invoice-totals-row">
                <span>Payment Mode:</span>
                <span>${paymentMode}</span>
            </div>
            <div class="invoice-totals-row">
                <span>Payment Status:</span>
                <span>${paymentStatus}</span>
            </div>
        </div>

        ${notes ? `
            <div class="invoice-notes">
                <h3>Notes</h3>
                <p>${notes}</p>
            </div>
        ` : ''}

        <div class="invoice-terms">
            <h3>Terms and Conditions</h3>
            <p>50% advance payment is required to start the work. Remaining 50% should be paid after project completion before final delivery.</p>
        </div>

        <div class="invoice-footer">
            <p>Work Together, Grow Together</p>
        </div>
    `;
}

// Check Invoice
function checkInvoice() {
    if (!validateInvoiceForm()) {
        return;
    }

    const invoiceHTML = buildInvoicePreview(true);
    document.getElementById('invoiceDisplay').innerHTML = invoiceHTML;
    document.getElementById('invoiceModal').style.display = 'block';
    
    showNotification('Preview ready. Click Generate Invoice to finalize.', 'success');
}

// Generate Invoice
function generateInvoice() {
    if (!validateInvoiceForm()) {
        return;
    }

    // Check if invoice number is already used
    if (isInvoiceNumberUsed(invoiceNumber) && invoiceLocked) {
        showNotification('This invoice number is already generated. Click New Bill.', 'error');
        return;
    }

    // Lock invoice number
    invoiceLocked = true;
    addInvoiceNumberToUsed(invoiceNumber);
    
    // Generate invoice HTML
    const invoiceHTML = buildInvoicePreview(false);
    document.getElementById('invoiceDisplay').innerHTML = invoiceHTML;
    document.getElementById('invoiceModal').style.display = 'block';
    
    showNotification('Invoice generated successfully. Please click Save Bill to store it.', 'success');
    
    // Show post-action modal
    setTimeout(() => {
        document.getElementById('postActionModal').style.display = 'block';
    }, 1000);
}

// Save Bill
function saveBill() {
    if (!invoiceLocked) {
        showNotification('Please generate invoice first.', 'error');
        return;
    }

    const billData = {
        invoiceNumber: invoiceNumber,
        clientName: document.getElementById('clientName').value,
        clientType: document.getElementById('clientType').value,
        businessCollegeName: document.getElementById('businessCollegeName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        projectDescription: document.getElementById('projectDescription').value,
        paymentMode: document.getElementById('paymentMode').value,
        notes: document.getElementById('notes').value,
        paymentStatus: document.getElementById('paymentStatus').value,
        services: [...selectedServices],
        servicesCount: selectedServices.length,
        subtotal: document.getElementById('subtotal').textContent,
        gstAmount: document.getElementById('gstAmount').textContent,
        discountAmount: document.getElementById('discountAmount').textContent,
        grandTotal: document.getElementById('grandTotal').textContent,
        advancePaid: document.getElementById('advancePaid').value,
        balanceAmount: document.getElementById('balanceAmount').textContent,
        date: new Date().toISOString()
    };

    bills.push(billData);
    localStorage.setItem('kodingwalaBills', JSON.stringify(bills));
    
    showNotification('Bill saved successfully in history.', 'success');
}

// Download PDF
function downloadPDF() {
    // Generate invoice if not already generated
    if (!invoiceLocked) {
        if (!validateInvoiceForm()) {
            showNotification('Please fill the form first', 'error');
            return;
        }
        buildInvoicePreview(true);
    }

    const invoiceElement = document.getElementById('invoiceDisplay');
    
    if (!invoiceElement.innerHTML) {
        showNotification('No invoice to download', 'error');
        return;
    }
    
    // Check if jsPDF and html2canvas are loaded
    if (!window.jspdf || !window.html2canvas) {
        showNotification('PDF libraries not loaded. Please refresh the page.', 'error');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    
    html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        const fileName = `KodingWala_Bill_${invoiceNumber}.pdf`;
        pdf.save(fileName);
        
        showNotification('PDF downloaded successfully!', 'success');
    });
}

// Print bill
function printBill() {
    // Generate invoice if not already generated
    if (!invoiceLocked) {
        if (!validateInvoiceForm()) {
            showNotification('Please fill the form first', 'error');
            return;
        }
        buildInvoicePreview(true);
    }

    const invoiceElement = document.getElementById('invoiceDisplay');
    
    if (!invoiceElement.innerHTML) {
        showNotification('No invoice to print', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const invoiceHTML = invoiceElement.innerHTML;
    
    printWindow.document.write(`
        <html>
            <head>
                <title>KodingWala Bill - ${invoiceNumber}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        color: #333;
                    }
                    .invoice-header {
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    .invoice-logo {
                        font-size: 2em;
                        font-weight: bold;
                    }
                    .koding { color: #00ffff; }
                    .wala { color: #ff6b00; }
                    .invoice-details {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                        margin-bottom: 30px;
                    }
                    .invoice-totals {
                        margin-top: 30px;
                        padding: 20px;
                        background: #f0f8ff;
                        border-radius: 8px;
                        border: 2px solid #00ffff;
                    }
                    .invoice-totals-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                    }
                    .invoice-footer {
                        text-align: center;
                        margin-top: 40px;
                        color: #666;
                    }
                    .invoice-preview-label {
                        background: #ff6b00;
                        color: white;
                        padding: 5px 15px;
                        border-radius: 5px;
                        display: inline-block;
                        margin-bottom: 15px;
                        font-weight: bold;
                    }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${invoiceHTML}
                <script>window.print(); window.close();</script>
            </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Send WhatsApp
function sendWhatsApp() {
    const clientName = document.getElementById('clientName').value;
    const grandTotal = document.getElementById('grandTotal').textContent;
    const advancePaid = document.getElementById('advancePaid').value;
    const balanceAmount = document.getElementById('balanceAmount').textContent;
    const paymentMode = document.getElementById('paymentMode').value;
    const paymentStatus = document.getElementById('paymentStatus').value;

    let message = `Hello ${clientName},\n\n`;
    
    if (invoiceLocked) {
        message += `Your KodingWala Invoice:\n`;
        message += `Invoice Number: ${invoiceNumber}\n\n`;
    } else {
        message += `Your KodingWala Invoice Preview:\n`;
        message += `Invoice Number: ${invoiceNumber} (Preview Only)\n\n`;
    }
    
    message += `Services:\n`;
    selectedServices.forEach(service => {
        message += `- ${service.name}: ₹${(service.price * service.quantity).toFixed(2)}\n`;
    });
    message += `\nGrand Total: ${grandTotal}\n`;
    message += `Advance Paid: ₹${advancePaid}\n`;
    message += `Balance Amount: ${balanceAmount}\n`;
    message += `Payment Mode: ${paymentMode}\n`;
    message += `Payment Status: ${paymentStatus}\n\n`;
    message += `Thank you for choosing KodingWala!\n`;
    message += `Visit us at: https://kodingwala.site\n\n`;
    message += `Work Together, Grow Together`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    showNotification('Opening WhatsApp...', 'success');
}

// New Bill
function newBill() {
    if (confirm('Are you sure you want to create a new bill? Current bill data will be cleared.')) {
        // Clear form
        document.querySelectorAll('input, select, textarea').forEach(field => {
            if (field.type !== 'button' && field.type !== 'submit') {
                field.value = '';
            }
        });
        
        selectedServices = [];
        updateSelectedServicesList();
        calculateTotals();
        
        // Unlock invoice and get next number
        invoiceLocked = false;
        invoiceNumber = getNextAvailableInvoiceNumber();
        updateInvoiceNumberDisplay();
        
        // Update client type label
        document.getElementById('clientType').value = '';
        updateClientTypeLabel();
        
        showNotification('New bill created successfully', 'success');
    }
}

// Clear form
function clearForm() {
    if (confirm('Are you sure you want to clear all data?')) {
        document.querySelectorAll('input, select, textarea').forEach(field => {
            if (field.type !== 'button' && field.type !== 'submit') {
                field.value = '';
            }
        });
        
        selectedServices = [];
        updateSelectedServicesList();
        calculateTotals();
        
        document.getElementById('clientType').value = '';
        updateClientTypeLabel();
        
        showNotification('Form cleared successfully!', 'success');
    }
}

// View history
function viewHistory() {
    document.getElementById('billHistoryModal').style.display = 'block';
    loadBillsHistory();
}

// Load bills history
function loadBillsHistory() {
    const historyList = document.getElementById('billHistoryList');
    
    if (bills.length === 0) {
        historyList.innerHTML = '<p class="no-services">No bills saved yet</p>';
        return;
    }

    historyList.innerHTML = bills.map((bill, index) => `
        <div class="bill-history-item">
            <div class="bill-history-info">
                <div class="bill-history-details">
                    <h4>${bill.invoiceNumber} - ${bill.clientName}</h4>
                    <p>Date: ${new Date(bill.date).toLocaleDateString()}</p>
                    <p>Total: ${bill.grandTotal} | Status: ${bill.paymentStatus}</p>
                    <p>Services: ${bill.servicesCount} items</p>
                </div>
            </div>
            <div class="bill-history-actions">
                <button class="view-btn" onclick="viewBill(${index})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="reload-btn" onclick="reloadBill(${index})">
                    <i class="fas fa-sync"></i> Reload
                </button>
                <button class="delete-btn" onclick="deleteBill(${index})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Search bills
function searchBills() {
    const searchTerm = document.getElementById('searchBills').value.toLowerCase();
    const filteredBills = bills.filter(bill => 
        bill.clientName.toLowerCase().includes(searchTerm) ||
        bill.invoiceNumber.toLowerCase().includes(searchTerm)
    );
    
    const historyList = document.getElementById('billHistoryList');
    
    if (filteredBills.length === 0) {
        historyList.innerHTML = '<p class="no-services">No matching bills found</p>';
        return;
    }

    historyList.innerHTML = filteredBills.map((bill, index) => {
        const originalIndex = bills.indexOf(bill);
        return `
            <div class="bill-history-item">
                <div class="bill-history-info">
                    <div class="bill-history-details">
                        <h4>${bill.invoiceNumber} - ${bill.clientName}</h4>
                        <p>Date: ${new Date(bill.date).toLocaleDateString()}</p>
                        <p>Total: ${bill.grandTotal} | Status: ${bill.paymentStatus}</p>
                        <p>Services: ${bill.servicesCount} items</p>
                    </div>
                </div>
                <div class="bill-history-actions">
                    <button class="view-btn" onclick="viewBill(${originalIndex})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="reload-btn" onclick="reloadBill(${originalIndex})">
                        <i class="fas fa-sync"></i> Reload
                    </button>
                    <button class="delete-btn" onclick="deleteBill(${originalIndex})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// View bill
function viewBill(index) {
    const bill = bills[index];
    selectedServices = [...bill.services];
    
    // Populate form with bill data
    document.getElementById('clientName').value = bill.clientName;
    document.getElementById('clientType').value = bill.clientType;
    document.getElementById('businessCollegeName').value = bill.businessCollegeName;
    document.getElementById('phoneNumber').value = bill.phoneNumber;
    document.getElementById('email').value = bill.email;
    document.getElementById('address').value = bill.address;
    document.getElementById('projectDescription').value = bill.projectDescription;
    document.getElementById('paymentMode').value = bill.paymentMode;
    document.getElementById('notes').value = bill.notes;
    document.getElementById('paymentStatus').value = bill.paymentStatus;
    document.getElementById('advancePaid').value = bill.advancePaid;
    
    updateClientTypeLabel();
    updateSelectedServicesList();
    
    // Generate invoice
    const invoiceHTML = buildInvoicePreview(false);
    document.getElementById('invoiceDisplay').innerHTML = invoiceHTML;
    document.getElementById('invoiceModal').style.display = 'block';
    document.getElementById('billHistoryModal').style.display = 'none';
}

// Reload bill
function reloadBill(index) {
    const bill = bills[index];
    
    // Update invoice number
    invoiceNumber = bill.invoiceNumber;
    invoiceLocked = true;
    addInvoiceNumberToUsed(invoiceNumber);
    updateInvoiceNumberDisplay();
    
    // Populate form with bill data
    document.getElementById('clientName').value = bill.clientName;
    document.getElementById('clientType').value = bill.clientType;
    document.getElementById('businessCollegeName').value = bill.businessCollegeName;
    document.getElementById('phoneNumber').value = bill.phoneNumber;
    document.getElementById('email').value = bill.email;
    document.getElementById('address').value = bill.address;
    document.getElementById('projectDescription').value = bill.projectDescription;
    document.getElementById('paymentMode').value = bill.paymentMode;
    document.getElementById('notes').value = bill.notes;
    document.getElementById('paymentStatus').value = bill.paymentStatus;
    document.getElementById('advancePaid').value = bill.advancePaid;
    
    selectedServices = [...bill.services];
    updateClientTypeLabel();
    updateSelectedServicesList();
    
    showNotification('Bill reloaded successfully', 'success');
}

// Delete bill
function deleteBill(index) {
    if (confirm('Are you sure you want to delete this bill?')) {
        const deletedBill = bills[index];
        bills.splice(index, 1);
        localStorage.setItem('kodingwalaBills', JSON.stringify(bills));
        
        // Remove from used numbers and add to reusable
        removeInvoiceNumberFromUsed(deletedBill.invoiceNumber);
        
        loadBillsHistory();
        showNotification('Bill deleted successfully!', 'success');
    }
}

// Update invoice number display
function updateInvoiceNumberDisplay() {
    document.getElementById('currentInvoiceNumber').textContent = invoiceNumber;
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'times-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .notification-success {
        background: #00ff88;
        color: #0a0a0a;
    }
    
    .notification-warning {
        background: #ffc107;
        color: #0a0a0a;
    }
    
    .notification-error {
        background: #ff4444;
        color: #ffffff;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .invoice-preview-label {
        background: #ff6b00;
        color: white;
        padding: 5px 15px;
        border-radius: 5px;
        display: inline-block;
        margin-bottom: 15px;
        font-weight: bold;
    }
`;
document.head.appendChild(style);