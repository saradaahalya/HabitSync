const userId = localStorage.getItem("habitsync_user");

// If no userId, redirect to index (user not logged in)
if (!userId) {
  window.location.href = "index.html";
}

// Setup logout handler immediately
console.log("Dashboard.js loaded, setting up logout handler...");

// Try to initialize logout handler right away
function setupLogoutHandler() {
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (!logoutBtn) {
    console.error("Logout button not found in DOM");
    return false;
  }
  
  console.log("Logout button found, attaching click handler...");
  
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    console.log("=== LOGOUT PROCESS STARTED ===");
    
    try {
      // Step 1: Notify backend of logout
      console.log("Step 1: Calling backend logout...");
      if (typeof APIClient !== 'undefined') {
        try {
          const backendResponse = await APIClient.logoutUser();
          console.log("✓ Backend logout response:", backendResponse);
        } catch (err) {
          console.warn("⚠ Backend logout failed (continuing):", err.message);
        }
      } else {
        console.warn("⚠ APIClient not available");
      }
      
      // Step 2: Clear localStorage
      console.log("Step 2: Clearing localStorage...");
      localStorage.removeItem("habitsync_user");
      console.log("✓ localStorage cleared");
      
      // Step 3: Sign out from Firebase
      console.log("Step 3: Signing out from Firebase...");
      if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
          await firebase.auth().signOut();
          console.log("✓ Firebase sign out successful");
        } catch (err) {
          console.error("⚠ Firebase sign out error:", err.message);
        }
      } else {
        console.warn("⚠ Firebase not available");
      }
      
      // Step 4: Redirect to home
      console.log("Step 4: Redirecting to home...");
      console.log("=== LOGOUT COMPLETE ===");
      window.location.href = "index.html";
      
    } catch (err) {
      console.error("❌ Logout process error:", err);
      console.log("Force redirecting to home...");
      window.location.href = "index.html";
    }
  });
  
  return true;
}

// Initialize immediately if DOM is ready
if (document.readyState === 'loading') {
  console.log("DOM still loading, waiting for DOMContentLoaded...");
  document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired");
    setupLogoutHandler();
  });
} else {
  console.log("DOM already loaded, initializing logout handler...");
  setupLogoutHandler();
}
/* ============================================
   HabitSync Dashboard - Main Logic
   Handles habit management, local storage, and UI updates
   ============================================ */

// ============================================
// LocalStorage Manager - Centralized data management
// ============================================
const LocalStorageManager = {
    // Keys for localStorage
    HABITS_KEY: `habitsync_habits_${userId}`,
    
    /**
     * Initialize default structure if empty
     */
    init() {
        if (!this.getHabits()) {
            this.saveHabits([]);
        }
    },
    
    /**
     * Get all habits from localStorage
     * @returns {Array} Array of habit objects
     */
    getHabits() {
        const data = localStorage.getItem(this.HABITS_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    /**
     * Save habits to localStorage
     * @param {Array} habits - Array of habit objects to save
     */
    saveHabits(habits) {
        localStorage.setItem(this.HABITS_KEY, JSON.stringify(habits));
    },
    
    /**
     * Get a single habit by ID
     * @param {string} id - Habit ID
     * @returns {Object|null} Habit object or null
     */
    getHabitById(id) {
        const habits = this.getHabits();
        return habits.find(habit => habit.id === id) || null;
    },
    
    /**
     * Add a new habit
     * @param {Object} habitData - {name, frequency}
     * @returns {Object} Created habit object
     */
    addHabit(habitData) {
        const habits = this.getHabits();
        const newHabit = {
            id: this.generateId(),
            name: habitData.name,
            frequency: habitData.frequency,
            streak: 0,
            completedDays: {}, // Format: {'2026-02-19': true}
            createdAt: new Date().toISOString()
        };
        habits.push(newHabit);
        this.saveHabits(habits);
        return newHabit;
    },
    
    /**
     * Update an existing habit
     * @param {string} id - Habit ID
     * @param {Object} updates - Fields to update
     */
    updateHabit(id, updates) {
        const habits = this.getHabits();
        const habitIndex = habits.findIndex(h => h.id === id);
        if (habitIndex !== -1) {
            habits[habitIndex] = { ...habits[habitIndex], ...updates };
            this.saveHabits(habits);
        }
    },
    
    /**
     * Delete a habit by ID
     * @param {string} id - Habit ID
     */
    deleteHabit(id) {
        const habits = this.getHabits().filter(h => h.id !== id);
        this.saveHabits(habits);
    },
    
    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return 'habit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Toggle habit completion for today
     * Prevents multiple check-offs in the same day
     * @param {string} id - Habit ID
     * @returns {boolean} Whether the habit was successfully toggled
     */
    toggleHabitToday(id) {
        const habit = this.getHabitById(id);
        if (!habit) return false;
        
        const today = this.getTodayDate();
        const completedDays = habit.completedDays || {};
        
        if (completedDays[today]) {
            // Already completed today - uncheck
            delete completedDays[today];
            // Recalculate streak when unchecking
            this.updateHabit(id, {
                completedDays: completedDays,
                streak: this.calculateStreak(completedDays)
            });
        } else {
            // Not completed today - check
            completedDays[today] = true;
            // Recalculate streak when checking
            this.updateHabit(id, {
                completedDays: completedDays,
                streak: this.calculateStreak(completedDays)
            });
        }
        
        return true;
    },
    
    /**
     * Check if a habit is completed today
     * @param {string} id - Habit ID
     * @returns {boolean} Whether completed today
     */
    isCompletedToday(id) {
        const habit = this.getHabitById(id);
        if (!habit) return false;
        
        const today = this.getTodayDate();
        return !!habit.completedDays[today];
    },
    
    /**
     * Calculate streak based on consecutive days
     * Streak resets if a day is missed
     * @param {Object} completedDays - Map of dates to completion status
     * @returns {number} Current streak count
     */
    calculateStreak(completedDays) {
        if (!completedDays || Object.keys(completedDays).length === 0) {
            return 0;
        }
        
        // Get sorted dates in descending order (newest first)
        const dates = Object.keys(completedDays)
            .filter(date => completedDays[date])
            .sort()
            .reverse();
        
        if (dates.length === 0) return 0;
        
        let streak = 0;
        let currentDate = new Date();
        
        for (let i = 0; i < dates.length; i++) {
            const checkDate = new Date(dates[i]);
            
            // Calculate days difference
            const diffTime = currentDate - checkDate;
            const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            // If this is the first check or consecutive with previous
            if (i === 0) {
                // First date must be today or yesterday (accounting for time zones)
                if (daysDiff > 1) {
                    break;
                }
                streak = 1;
                currentDate = checkDate;
            } else {
                // Must be exactly 1 day before previous
                if (daysDiff !== 1) {
                    break;
                }
                streak++;
                currentDate = checkDate;
            }
        }
        
        return streak;
    },
    
    /**
     * Reset progress for a habit (clear all completed days and streak)
     * @param {string} id - Habit ID
     */
    resetHabitProgress(id) {
        this.updateHabit(id, {
            completedDays: {},
            streak: 0
        });
    },
    
    /**
     * Get today's date in YYYY-MM-DD format
     * @returns {string} Today's date
     */
    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

// ============================================
// Dashboard Manager - UI and interaction logic
// ============================================
const DashboardManager = {
    // Cache DOM elements
    habitForm: null,
    habitNameInput: null,
    habitFrequencySelect: null,
    habitsList: null,
    formMessage: null,
    editModal: null,
    editForm: null,
    editHabitId: null,
    editHabitName: null,
    editHabitFrequency: null,
    modalClose: null,
    
    /**
     * Initialize the dashboard
     */
    init() {
        // Initialize LocalStorage
        LocalStorageManager.init();
        
        // Cache DOM elements
        this.cacheElements();
        
        // Bind event listeners
        this.bindEvents();
        
        // Render initial habits
        this.renderHabits();
    },
    
    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        this.habitForm = document.getElementById('habitForm');
        this.habitNameInput = document.getElementById('habitName');
        this.habitFrequencySelect = document.getElementById('habitFrequency');
        this.habitsList = document.getElementById('habitsList');
        this.formMessage = document.getElementById('formMessage');
        this.editModal = document.getElementById('editModal');
        this.editForm = document.getElementById('editForm');
        this.editHabitId = document.getElementById('editHabitId');
        this.editHabitName = document.getElementById('editHabitName');
        this.editHabitFrequency = document.getElementById('editHabitFrequency');
        this.modalClose = document.querySelector('.modal-close');
    },
    
    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Form submission
        this.habitForm.addEventListener('submit', (e) => this.handleAddHabit(e));
        
        // Modal close button
        this.modalClose.addEventListener('click', () => this.closeModal());
        
        // Click outside modal to close
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeModal();
            }
        });
        
        // Edit form submission
        this.editForm.addEventListener('submit', (e) => this.handleEditHabit(e));
    },
    
    /**
     * Handle adding a new habit
     * @param {Event} e - Form submit event
     */
    handleAddHabit(e) {
        e.preventDefault();
        
        const name = this.habitNameInput.value.trim();
        const frequency = this.habitFrequencySelect.value;
        
        if (!name) {
            this.showMessage('Please enter a habit name', 'error');
            return;
        }
        
        // Add habit to storage
        LocalStorageManager.addHabit({ name, frequency });
        
        // Reset form
        this.habitForm.reset();
        
        // Update UI
        this.renderHabits();
        this.showMessage('Habit added successfully!', 'success');
    },
    
    /**
     * Render all habits
     */
    renderHabits() {
        const habits = LocalStorageManager.getHabits();
        
        if (habits.length === 0) {
            this.habitsList.innerHTML = '<p class="empty-state">No habits yet. Create your first habit above!</p>';
            return;
        }
        
        this.habitsList.innerHTML = habits.map(habit => this.createHabitCard(habit)).join('');
        
        // Bind event listeners to habit cards
        this.bindHabitCardEvents();
    },
    
    /**
     * Create HTML for a habit card
     * @param {Object} habit - Habit object
     * @returns {string} HTML string
     */
    createHabitCard(habit) {
        const isCompletedToday = LocalStorageManager.isCompletedToday(habit.id);
        const lastCompletedDate = this.getLastCompletedDate(habit.completedDays);
        
        return `
            <div class="habit-card" data-habit-id="${habit.id}">
                <input 
                    type="checkbox" 
                    class="habit-checkbox" 
                    ${isCompletedToday ? 'checked' : ''}
                    data-habit-id="${habit.id}"
                >
                <div class="habit-info">
                    <h3>${this.escapeHtml(habit.name)}</h3>
                    <div class="habit-meta">
                        <span class="habit-frequency">${habit.frequency}</span>
                        <span class="habit-streak">🔥 ${habit.streak} day streak</span>
                        ${lastCompletedDate ? `<span class="habit-last-checked">Last: ${lastCompletedDate}</span>` : ''}
                    </div>
                </div>
                <div class="habit-actions">
                    <button class="btn btn-secondary btn-small btn-edit" data-habit-id="${habit.id}">Edit</button>
                    <button class="btn btn-secondary btn-small btn-reset" data-habit-id="${habit.id}">Reset</button>
                    <button class="btn btn-danger btn-small btn-delete" data-habit-id="${habit.id}">Delete</button>
                </div>
            </div>
        `;
    },
    
    /**
     * Get the last completed date from completedDays object
     * @param {Object} completedDays - Map of dates
     * @returns {string} Formatted date or empty string
     */
    getLastCompletedDate(completedDays) {
        if (!completedDays || Object.keys(completedDays).length === 0) {
            return '';
        }
        
        const dates = Object.keys(completedDays)
            .filter(date => completedDays[date])
            .sort()
            .reverse();
        
        if (dates.length === 0) return '';
        
        const lastDate = new Date(dates[0]);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (lastDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    },
    
    /**
     * Bind event listeners to habit cards
     */
    bindHabitCardEvents() {
        // Checkbox change
        document.querySelectorAll('.habit-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const habitId = e.target.dataset.habitId;
                LocalStorageManager.toggleHabitToday(habitId);
                this.renderHabits();
            });
        });
        
        // Edit button
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const habitId = e.target.dataset.habitId;
                this.openEditModal(habitId);
            });
        });
        
        // Reset button
        document.querySelectorAll('.btn-reset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const habitId = e.target.dataset.habitId;
                if (confirm('Are you sure you want to reset this habit\'s progress? This action cannot be undone.')) {
                    LocalStorageManager.resetHabitProgress(habitId);
                    this.renderHabits();
                    this.showMessage('Habit progress reset', 'success');
                }
            });
        });
        
        // Delete button
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const habitId = e.target.dataset.habitId;
                if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
                    LocalStorageManager.deleteHabit(habitId);
                    this.renderHabits();
                    this.showMessage('Habit deleted', 'success');
                }
            });
        });
    },
    
    /**
     * Open edit modal for a habit
     * @param {string} habitId - Habit ID to edit
     */
    openEditModal(habitId) {
        const habit = LocalStorageManager.getHabitById(habitId);
        if (!habit) return;
        
        this.editHabitId.value = habit.id;
        this.editHabitName.value = habit.name;
        this.editHabitFrequency.value = habit.frequency;
        
        this.editModal.classList.add('show');
    },
    
    /**
     * Close edit modal
     */
    closeModal() {
        this.editModal.classList.remove('show');
        this.editForm.reset();
    },
    
    /**
     * Handle editing a habit
     * @param {Event} e - Form submit event
     */
    handleEditHabit(e) {
        e.preventDefault();
        
        const habitId = this.editHabitId.value;
        const name = this.editHabitName.value.trim();
        const frequency = this.editHabitFrequency.value;
        
        if (!name) {
            alert('Please enter a habit name');
            return;
        }
        
        LocalStorageManager.updateHabit(habitId, { name, frequency });
        
        this.closeModal();
        this.renderHabits();
        this.showMessage('Habit updated successfully!', 'success');
    },
    
    /**
     * Show a temporary message
     * @param {string} message - Message to display
     * @param {string} type - 'success' or 'error'
     */
    showMessage(message, type) {
        this.formMessage.textContent = message;
        this.formMessage.className = `form-message show ${type}`;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.formMessage.classList.remove('show');
        }, 3000);
    },
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ============================================
// Initialize when DOM is ready
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    DashboardManager.init();
});
