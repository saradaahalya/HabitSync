/* ============================================
   HabitSync Stats - Progress Visualization
   Canvas-based weekly progress graph and statistics
   ============================================ */

// ============================================
// LocalStorage Manager (Same as dashboard.js)
// ============================================
const LocalStorageManager = {
    HABITS_KEY: 'habitsync_habits',
    
    init() {
        if (!this.getHabits()) {
            this.saveHabits([]);
        }
    },
    
    getHabits() {
        const data = localStorage.getItem(this.HABITS_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    saveHabits(habits) {
        localStorage.setItem(this.HABITS_KEY, JSON.stringify(habits));
    },
    
    getHabitById(id) {
        const habits = this.getHabits();
        return habits.find(habit => habit.id === id) || null;
    },
    
    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

// ============================================
// Canvas Graph Manager - Weekly progress visualization
// ============================================
const CanvasGraphManager = {
    canvas: null,
    ctx: null,
    
    // Graph constants
    MARGIN: 60,
    BAR_COLOR: '#00d4ff',
    BAR_HOVER_COLOR: '#00ff88',
    GRID_COLOR: 'rgba(255, 255, 255, 0.1)',
    TEXT_COLOR: '#b0b5c8',
    
    /**
     * Initialize canvas graph
     */
    init() {
        this.canvas = document.getElementById('progressChart');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Draw the graph
        this.draw();
    },
    
    /**
     * Resize canvas to container width
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        
        // Set canvas resolution (for retina displays)
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = 400 * dpr;
        
        // Scale context for retina displays
        this.ctx.scale(dpr, dpr);
        
        // Adjust canvas display size
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = '400px';
    },
    
    /**
     * Main draw function - orchestrates all graph elements
     */
    draw() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw background grid
        this.drawGrid(width, height);
        
        // Draw axes
        this.drawAxes(width, height);
        
        // Get weekly data
        const weekData = this.getWeeklyData();
        
        // Draw bars
        this.drawBars(weekData, width, height);
        
        // Draw labels
        this.drawLabels(width, height);
    },
    
    /**
     * Draw background grid lines
     * Helps visualize the scale
     */
    drawGrid(width, height) {
        const graphWidth = width - 2 * this.MARGIN;
        const graphHeight = height - 2 * this.MARGIN;
        
        this.ctx.strokeStyle = this.GRID_COLOR;
        this.ctx.lineWidth = 1;
        
        // Horizontal grid lines (Y-axis)
        const habits = LocalStorageManager.getHabits();
        const maxHabits = habits.length > 0 ? habits.length : 5;
        const lineSpacing = graphHeight / maxHabits;
        
        for (let i = 1; i < maxHabits; i++) {
            const y = this.MARGIN + (i * lineSpacing);
            this.ctx.beginPath();
            this.ctx.moveTo(this.MARGIN, y);
            this.ctx.lineTo(width - this.MARGIN, y);
            this.ctx.stroke();
        }
    },
    
    /**
     * Draw X and Y axes
     */
    drawAxes(width, height) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        
        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.MARGIN, this.MARGIN);
        this.ctx.lineTo(this.MARGIN, height - this.MARGIN);
        this.ctx.stroke();
        
        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.MARGIN, height - this.MARGIN);
        this.ctx.lineTo(width - this.MARGIN, height - this.MARGIN);
        this.ctx.stroke();
    },
    
    /**
     * Draw bars for weekly data
     * Each bar represents habits completed on that day
     */
    drawBars(weekData, width, height) {
        const graphWidth = width - 2 * this.MARGIN;
        const graphHeight = height - 2 * this.MARGIN;
        
        const habits = LocalStorageManager.getHabits();
        const maxHabits = habits.length > 0 ? habits.length : 5;
        
        const barWidth = graphWidth / 7; // 7 days of week
        const barSpacing = barWidth * 0.8;
        const actualBarWidth = barWidth * 0.7;
        
        // Draw bars for each day
        weekData.forEach((dayData, dayIndex) => {
            const x = this.MARGIN + (dayIndex * barWidth) + (barWidth - actualBarWidth) / 2;
            const barHeight = (dayData.count / maxHabits) * graphHeight;
            const y = height - this.MARGIN - barHeight;
            
            // Bar background
            this.ctx.fillStyle = this.BAR_COLOR;
            this.ctx.fillRect(x, y, actualBarWidth, barHeight);
            
            // Bar outline
            this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, actualBarWidth, barHeight);
        });
    },
    
    /**
     * Draw axis labels
     */
    drawLabels(width, height) {
        this.ctx.fillStyle = this.TEXT_COLOR;
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        this.ctx.textAlign = 'center';
        
        // Days of week labels (X-axis)
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const graphWidth = width - 2 * this.MARGIN;
        const barWidth = graphWidth / 7;
        
        days.forEach((day, index) => {
            const x = this.MARGIN + (index * barWidth) + barWidth / 2;
            const y = height - this.MARGIN + 25;
            this.ctx.fillText(day, x, y);
        });
        
        // Y-axis labels (number of habits)
        this.ctx.textAlign = 'right';
        
        const habits = LocalStorageManager.getHabits();
        const maxHabits = habits.length > 0 ? habits.length : 5;
        const graphHeight = height - 2 * this.MARGIN;
        const lineSpacing = graphHeight / maxHabits;
        
        for (let i = 0; i <= maxHabits; i++) {
            const y = height - this.MARGIN - (i * lineSpacing);
            const x = this.MARGIN - 10;
            this.ctx.fillText(i.toString(), x, y + 5);
        }
        
        // Axis titles
        this.ctx.fillStyle = '#b0b5c8';
        this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        this.ctx.textAlign = 'center';
        
        // X-axis title
        this.ctx.fillText('Days of Week', width / 2, height - 5);
        
        // Y-axis title (rotated)
        this.ctx.save();
        this.ctx.translate(15, height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Habits Completed', 0, 0);
        this.ctx.restore();
    },
    
    /**
     * Get weekly completion data
     * Counts habits completed each day of the past 7 days
     * @returns {Array} Array of {day, count, date}
     */
    getWeeklyData() {
        const habits = LocalStorageManager.getHabits();
        const weekData = [];
        
        // Generate data for past 7 days (starting from 6 days ago)
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            // Count completed habits for this day
            let count = 0;
            habits.forEach(habit => {
                if (habit.completedDays && habit.completedDays[dateStr]) {
                    count++;
                }
            });
            
            weekData.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count: count,
                date: dateStr
            });
        }
        
        return weekData;
    }
};

// ============================================
// Stats Manager - Summary statistics and layout
// ============================================
const StatsManager = {
    /**
     * Initialize stats page
     */
    init() {
        LocalStorageManager.init();
        this.renderStats();
        this.renderStreaks();
        CanvasGraphManager.init();
        
        // Redraw graph on window resize
        window.addEventListener('resize', () => {
            CanvasGraphManager.resizeCanvas();
            CanvasGraphManager.draw();
        });
    },
    
    /**
     * Render summary statistics
     */
    renderStats() {
        const habits = LocalStorageManager.getHabits();
        
        // Total habits
        document.getElementById('totalHabits').textContent = habits.length;
        
        // Completed today
        const completedToday = this.getCompletedTodayCount(habits);
        document.getElementById('completedToday').textContent = completedToday;
        
        // Average streak
        const avgStreak = this.getAverageStreak(habits);
        document.getElementById('averageStreak').textContent = Math.round(avgStreak);
        
        // Longest streak
        const longestStreak = this.getLongestStreak(habits);
        document.getElementById('longestStreak').textContent = longestStreak;
    },
    
    /**
     * Count habits completed today
     * @param {Array} habits - Array of habits
     * @returns {number} Count
     */
    getCompletedTodayCount(habits) {
        const today = LocalStorageManager.getTodayDate();
        return habits.filter(habit => habit.completedDays && habit.completedDays[today]).length;
    },
    
    /**
     * Calculate average streak across all habits
     * @param {Array} habits - Array of habits
     * @returns {number} Average streak
     */
    getAverageStreak(habits) {
        if (habits.length === 0) return 0;
        const totalStreak = habits.reduce((sum, habit) => sum + (habit.streak || 0), 0);
        return totalStreak / habits.length;
    },
    
    /**
     * Get longest streak among all habits
     * @param {Array} habits - Array of habits
     * @returns {number} Longest streak
     */
    getLongestStreak(habits) {
        if (habits.length === 0) return 0;
        return Math.max(...habits.map(habit => habit.streak || 0));
    },
    
    /**
     * Render individual habit streaks
     */
    renderStreaks() {
        const habits = LocalStorageManager.getHabits();
        const streaksList = document.getElementById('streaksList');
        
        if (habits.length === 0) {
            streaksList.innerHTML = '<p class="empty-state">No habits yet. Create your first habit on the dashboard!</p>';
            return;
        }
        
        // Sort by streak (highest first)
        const sortedHabits = [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0));
        
        streaksList.innerHTML = sortedHabits.map(habit => `
            <div class="streak-item">
                <div class="streak-name">${this.escapeHtml(habit.name)}</div>
                <div class="streak-value">🔥 ${habit.streak || 0}</div>
            </div>
        `).join('');
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
    StatsManager.init();
});
