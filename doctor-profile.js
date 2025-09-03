document.addEventListener('DOMContentLoaded', () => {
    // Checks authentication
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert('Please sign in to access this page');
        window.location.href = 'signin.html';
        return;
    }

    // Initialize doctor profile
    window.doctorProfile = new DoctorProfile();
});

class DoctorProfile {
    constructor() {
        this.profileData = JSON.parse(localStorage.getItem('doctor_profile')) || this.getDefaultProfile();
        this.availability = JSON.parse(localStorage.getItem('doctor_availability')) || [];
        this.appointments = JSON.parse(localStorage.getItem('doctor_appointments')) || [];
        this.earnings = {
            today: { amount: 0, consultations: 0 },
            weekly: { amount: 0, consultations: 0 }
        };
        this.editingAvailabilityId = null;
        this.selectedAppointment = null;
        
        this.initializeDemoData();
        this.initializeEventListeners();
        this.loadAllData();
    }

    getDefaultProfile() {
        return {
            name: 'Dr. Rajesh Sharma',
            speciality: 'Cardiology',
            experience: '15',
            email: 'rajesh.sharma@healthconnect.com',
            phone: '+91-9876543210',
            address: '123 Medical Street, Mumbai, Maharashtra'
        };
    }

    initializeDemoData() {
        if (this.availability.length === 0) {
            const today = new Date();
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() + i);
                this.availability.push({
                    id: Date.now() + i,
                    date: date.toISOString().split('T')[0],
                    startTime: '09:00',
                    endTime: '17:00',
                    duration: 30,
                    fee: 500
                });
            }
            this.saveAvailability();
        }

        if (this.appointments.length === 0) {
            const today = new Date().toISOString().split('T')[0];
            this.appointments = [
                { id: 1, date: today, time: '10:30', patientName: 'John Doe', type: 'Follow-up', fee: 500, status: 'completed' },
                { id: 2, date: today, time: '11:00', patientName: 'Jane Smith', type: 'Consultation', fee: 600, status: 'completed' },
                { id: 3, date: today, time: '14:30', patientName: 'Mike Johnson', type: 'Regular Checkup', fee: 500, status: 'confirmed' },
                { id: 4, date: today, time: '15:00', patientName: 'Sarah Wilson', type: 'Emergency', fee: 800, status: 'pending' },
                { id: 5, date: today, time: '16:00', patientName: 'David Brown', type: 'Consultation', fee: 500, status: 'completed' }
            ];
            this.saveAppointments();
        }
        this.calculateEarnings();
    }

    initializeEventListeners() {
        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('show');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            });
        }

        // Profile edit
        document.getElementById('editProfileBtn').addEventListener('click', () => this.showProfileModal());
        document.getElementById('closeProfileModal').addEventListener('click', () => this.hideProfileModal());
        document.getElementById('cancelProfileBtn').addEventListener('click', () => this.hideProfileModal());
        document.getElementById('profileForm').addEventListener('submit', (e) => this.handleProfileSubmit(e));

        // Availability
        document.getElementById('addAvailabilityBtn').addEventListener('click', () => this.showAvailabilityModal());
        document.getElementById('closeAvailabilityModal').addEventListener('click', () => this.hideAvailabilityModal());
        document.getElementById('cancelAvailabilityBtn').addEventListener('click', () => this.hideAvailabilityModal());
        document.getElementById('availabilityForm').addEventListener('submit', (e) => this.handleAvailabilitySubmit(e));

        // Appointment filters
        document.getElementById('appointmentDate').addEventListener('change', () => this.loadAppointments());
        document.getElementById('appointmentStatus').addEventListener('change', () => this.loadAppointments());

        // Appointment modal
        document.getElementById('closeAppointmentModal').addEventListener('click', () => this.hideAppointmentModal());
        document.getElementById('cancelAppointmentBtn').addEventListener('click', () => this.cancelAppointment());
        document.getElementById('completeAppointmentBtn').addEventListener('click', () => this.completeAppointment());

        // Logout
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });

        // Smooth scrolling
        document.querySelectorAll('.nav a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });
    }

    loadAllData() {
        this.loadProfileDetails();
        this.loadAvailabilityList();
        this.loadAppointments();
        this.loadEarningsStats();
    }

    // Profile Methods
    loadProfileDetails() {
        document.getElementById('profileName').textContent = this.profileData.name;
        document.getElementById('profileSpeciality').textContent = this.profileData.speciality;
        document.getElementById('profileExperience').textContent = `${this.profileData.experience} years`;
        document.getElementById('profileEmail').textContent = this.profileData.email;
        document.getElementById('profilePhone').textContent = this.profileData.phone;
        document.getElementById('profileAddress').textContent = this.profileData.address;
    }

    showProfileModal() {
        document.getElementById('editName').value = this.profileData.name;
        document.getElementById('editSpeciality').value = this.profileData.speciality;
        document.getElementById('editExperience').value = this.profileData.experience;
        document.getElementById('editEmail').value = this.profileData.email;
        document.getElementById('editPhone').value = this.profileData.phone;
        document.getElementById('editAddress').value = this.profileData.address;
        
        document.getElementById('profileModal').classList.add('show');
    }

    hideProfileModal() {
        document.getElementById('profileModal').classList.remove('show');
    }

    handleProfileSubmit(e) {
        e.preventDefault();
        
        this.profileData = {
            name: document.getElementById('editName').value,
            speciality: document.getElementById('editSpeciality').value,
            experience: document.getElementById('editExperience').value,
            email: document.getElementById('editEmail').value,
            phone: document.getElementById('editPhone').value,
            address: document.getElementById('editAddress').value
        };
        
        this.saveProfile();
        this.loadProfileDetails();
        this.hideProfileModal();
        this.showNotification('Profile updated successfully!', 'success');
    }

    // Availability Methods
    loadAvailabilityList() {
        const availabilityList = document.getElementById('availabilityList');
        availabilityList.innerHTML = '';

        if (this.availability.length === 0) {
            availabilityList.innerHTML = `
                <div style="text-align: center; color: #666; padding: 40px;">
                    <i class="fas fa-calendar-plus" style="font-size: 3rem; margin-bottom: 20px; color: #e2e8f0;"></i>
                    <h3>No availability set</h3>
                    <p>Click "Add Availability" to set your working hours</p>
                </div>
            `;
            return;
        }

        this.availability.forEach(item => {
            const availabilityElement = document.createElement('div');
            availabilityElement.className = 'availability-item';
            availabilityElement.innerHTML = `
                <div class="availability-info">
                    <h3>${this.formatDate(item.date)}</h3>
                    <div class="availability-details">
                        <span><i class="fas fa-clock"></i> ${item.startTime} - ${item.endTime}</span>
                        <span><i class="fas fa-hourglass-half"></i> ${item.duration} min slots</span>
                        <span><i class="fas fa-rupee-sign"></i> ₹${item.fee} per consultation</span>
                    </div>
                </div>
                <div class="availability-actions">
                    <button class="btn btn-secondary btn-small" onclick="doctorProfile.editAvailability(${item.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="doctorProfile.deleteAvailability(${item.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            availabilityList.appendChild(availabilityElement);
        });
    }

    showAvailabilityModal(editData = null) {
        this.editingAvailabilityId = editData ? editData.id : null;
        
        if (editData) {
            document.getElementById('availabilityModalTitle').textContent = 'Edit Availability';
            document.getElementById('saveAvailabilityBtn').textContent = 'Update Availability';
            document.getElementById('editAvailabilityId').value = editData.id;
            document.getElementById('availabilityDate').value = editData.date;
            document.getElementById('startTime').value = editData.startTime;
            document.getElementById('endTime').value = editData.endTime;
            document.getElementById('slotDuration').value = editData.duration;
            document.getElementById('consultationFee').value = editData.fee;
        } else {
            document.getElementById('availabilityModalTitle').textContent = 'Add Availability';
            document.getElementById('saveAvailabilityBtn').textContent = 'Add Availability';
            document.getElementById('availabilityForm').reset();
            document.getElementById('availabilityDate').value = new Date().toISOString().split('T')[0];
        }
        
        document.getElementById('availabilityModal').classList.add('show');
    }

    hideAvailabilityModal() {
        document.getElementById('availabilityModal').classList.remove('show');
        this.editingAvailabilityId = null;
    }

    handleAvailabilitySubmit(e) {
        e.preventDefault();
        
        const availabilityData = {
            date: document.getElementById('availabilityDate').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            duration: parseInt(document.getElementById('slotDuration').value),
            fee: parseInt(document.getElementById('consultationFee').value)
        };

        if (availabilityData.startTime >= availabilityData.endTime) {
            this.showNotification('End time must be after start time', 'error');
            return;
        }

        if (this.editingAvailabilityId) {
            // Update existing availability
            const index = this.availability.findIndex(a => a.id === this.editingAvailabilityId);
            if (index !== -1) {
                this.availability[index] = { ...this.availability[index], ...availabilityData };
                this.showNotification('Availability updated successfully!', 'success');
            }
        } else {
            // Add new availability
            availabilityData.id = Date.now();
            this.availability.push(availabilityData);
            this.showNotification('Availability added successfully!', 'success');
        }

        this.saveAvailability();
        this.loadAvailabilityList();
        this.hideAvailabilityModal();
    }

    editAvailability(id) {
        const item = this.availability.find(a => a.id === id);
        if (item) {
            this.showAvailabilityModal(item);
        }
    }

    deleteAvailability(id) {
        if (confirm('Are you sure you want to delete this availability?')) {
            this.availability = this.availability.filter(a => a.id !== id);
            this.saveAvailability();
            this.loadAvailabilityList();
            this.showNotification('Availability deleted successfully!', 'success');
        }
    }

    // Appointments Methods
    loadAppointments() {
        const selectedDate = document.getElementById('appointmentDate').value;
        const selectedStatus = document.getElementById('appointmentStatus').value;
        
        let filteredAppointments = this.appointments;
        
        if (selectedDate) {
            filteredAppointments = filteredAppointments.filter(apt => apt.date === selectedDate);
        }
        
        if (selectedStatus !== 'all') {
            filteredAppointments = filteredAppointments.filter(apt => apt.status === selectedStatus);
        }

        const tbody = document.querySelector('#appointmentsTable tbody');
        tbody.innerHTML = '';

        if (filteredAppointments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #666; padding: 40px;">
                        No appointments found for the selected criteria
                    </td>
                </tr>
            `;
            return;
        }

        filteredAppointments.forEach(appointment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${appointment.time}</td>
                <td>${appointment.patientName}</td>
                <td>${appointment.type}</td>
                <td>₹${appointment.fee}</td>
                <td><span class="status-badge status-${appointment.status}">${appointment.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="doctorProfile.viewAppointment(${appointment.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-primary btn-small" onclick="doctorProfile.updateAppointmentStatus(${appointment.id})" style="margin-left: 5px;">
                        <i class="fas fa-edit"></i> Update
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    viewAppointment(id) {
        const appointment = this.appointments.find(apt => apt.id === id);
        if (!appointment) return;

        this.selectedAppointment = appointment;
        
        const appointmentDetails = document.getElementById('appointmentDetails');
        appointmentDetails.innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong>Patient:</strong> ${appointment.patientName}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Date:</strong> ${this.formatDate(appointment.date)}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Time:</strong> ${appointment.time}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Type:</strong> ${appointment.type}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Fee:</strong> ₹${appointment.fee}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Status:</strong> <span class="status-badge status-${appointment.status}">${appointment.status}</span>
            </div>
        `;

        // Update modal buttons based on status
        const cancelBtn = document.getElementById('cancelAppointmentBtn');
        const completeBtn = document.getElementById('completeAppointmentBtn');
        
        if (appointment.status === 'completed' || appointment.status === 'cancelled') {
            cancelBtn.style.display = 'none';
            completeBtn.style.display = 'none';
        } else {
            cancelBtn.style.display = appointment.status === 'cancelled' ? 'none' : 'block';
            completeBtn.style.display = appointment.status === 'completed' ? 'none' : 'block';
        }

        document.getElementById('appointmentModal').classList.add('show');
    }

    hideAppointmentModal() {
        document.getElementById('appointmentModal').classList.remove('show');
        this.selectedAppointment = null;
    }

    cancelAppointment() {
        if (this.selectedAppointment && confirm('Are you sure you want to cancel this appointment?')) {
            this.selectedAppointment.status = 'cancelled';
            this.saveAppointments();
            this.loadAppointments();
            this.calculateEarnings();
            this.loadEarningsStats();
            this.hideAppointmentModal();
            this.showNotification('Appointment cancelled successfully!', 'success');
        }
    }

    completeAppointment() {
        if (this.selectedAppointment) {
            this.selectedAppointment.status = 'completed';
            this.saveAppointments();
            this.loadAppointments();
            this.calculateEarnings();
            this.loadEarningsStats();
            this.hideAppointmentModal();
            this.showNotification('Appointment marked as completed!', 'success');
        }
    }

    updateAppointmentStatus(id) {
        const appointment = this.appointments.find(apt => apt.id === id);
        if (!appointment) return;

        const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        const currentIndex = statuses.indexOf(appointment.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        
        appointment.status = statuses[nextIndex];
        this.saveAppointments();
        this.loadAppointments();
        this.calculateEarnings();
        this.loadEarningsStats();
        this.showNotification(`Appointment status updated to ${appointment.status}`, 'success');
    }

    // Earnings Methods
    calculateEarnings() {
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = this.appointments.filter(apt => 
            apt.date === today && apt.status === 'completed'
        );
        
        this.earnings.today.amount = todayAppointments.reduce((sum, apt) => sum + apt.fee, 0);
        this.earnings.today.consultations = todayAppointments.length;

        // Calculate weekly earnings (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 6);
        
        const weeklyAppointments = this.appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= weekAgo && apt.status === 'completed';
        });
        
        this.earnings.weekly.amount = weeklyAppointments.reduce((sum, apt) => sum + apt.fee, 0);
        this.earnings.weekly.consultations = weeklyAppointments.length;
    }

    loadEarningsStats() {
        document.getElementById('todayEarnings').textContent = `₹${this.earnings.today.amount.toLocaleString()}`;
        document.getElementById('todayConsultations').textContent = this.earnings.today.consultations;
        document.getElementById('weeklyEarnings').textContent = `₹${this.earnings.weekly.amount.toLocaleString()}`;
        document.getElementById('weeklyConsultations').textContent = this.earnings.weekly.consultations;
    }

    // Utility Methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentUser');
            this.showNotification('Logged out successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    // Storage Methods
    saveProfile() {
        localStorage.setItem('doctor_profile', JSON.stringify(this.profileData));
    }

    saveAvailability() {
        localStorage.setItem('doctor_availability', JSON.stringify(this.availability));
    }

    saveAppointments() {
        localStorage.setItem('doctor_appointments', JSON.stringify(this.appointments));
    }
}
