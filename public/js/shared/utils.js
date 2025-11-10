// ===== SHARED UTILITIES =====
// Utility functions used across components

/**
 * Calculate totals for a project (expenses, profit, margin)
 */
export function calculateTotals(project, state) {
    // Calculate expenses from orders
    const projectOrders = state.orders ? state.orders.filter(o => o.projectId === project.id) : [];
    const ordersExpenses = projectOrders.reduce((sum, order) => sum + (order.totalSum || 0), 0);
    
    // Calculate worker expenses from work assignments (סידור עבודה)
    const projectWorkAssignments = state.workAssignments ? state.workAssignments.filter(a => a.projectId === project.id) : [];
    const workerExpensesTotal = projectWorkAssignments.reduce((sum, assignment) => {
        const dailyRate = state.workerDailyRates[assignment.workerId] || 0;
        return sum + dailyRate;
    }, 0);
    
    // Total expenses
    const totalExpenses = ordersExpenses + workerExpensesTotal;
    const profit = (project.revenue || 0) - totalExpenses;
    const profitMargin = project.revenue > 0 ? (profit / project.revenue) * 100 : 0;
    
    return { 
        totalExpenses, 
        ordersExpenses, 
        workerExpensesTotal, 
        profit, 
        profitMargin 
    };
}

/**
 * Format date for display
 */
export function formatDate(date) {
    if (!date) return '';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('he-IL');
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
    return `₪${(amount || 0).toLocaleString()}`;
}

/**
 * Get status color class for project status
 */
export function getStatusColorClass(status) {
    const statusMap = {
        'שולם': 'bg-green-100 text-green-800',
        'לתשלום': 'bg-yellow-100 text-yellow-800',
        'בביצוע': 'bg-blue-100 text-blue-800',
        'אומדן': 'bg-purple-100 text-purple-800',
        'חשבון': 'bg-orange-100 text-orange-800',
        'הזמנה': 'bg-cyan-100 text-cyan-800',
        'פתוח': 'bg-gray-100 text-gray-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitize JSON for HTML attributes
 */
export function sanitizeJsonForAttribute(obj) {
    return JSON.stringify(obj).replace(/"/g, '&quot;');
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Get date range for calendar view
 */
export function getDateRange(date, mode) {
    const dates = [];
    const current = new Date(date);
    
    if (mode === 'week') {
        // Get start of week (Sunday)
        const dayOfWeek = current.getDay();
        current.setDate(current.getDate() - dayOfWeek);
        
        for (let i = 0; i < 7; i++) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
    } else if (mode === 'month') {
        // Get start of month
        current.setDate(1);
        const month = current.getMonth();
        
        while (current.getMonth() === month) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
    }
    
    return dates;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function toISODateString(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1, date2) {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    return d1.toDateString() === d2.toDateString();
}

/**
 * Get day name in Hebrew
 */
export function getHebrewDayName(date) {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const d = date instanceof Date ? date : new Date(date);
    return days[d.getDay()];
}

/**
 * Get month name in Hebrew
 */
export function getHebrewMonthName(date) {
    const months = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    const d = date instanceof Date ? date : new Date(date);
    return months[d.getMonth()];
}

