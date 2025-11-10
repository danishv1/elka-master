// ===== SIDUR (WORK SCHEDULE) COMPONENT =====
// Handles all work schedule and assignment functionality

export function initSidurComponent(context) {
    const { state, db, firebase, render, updateHistory } = context;

    // ===== WORK SCHEDULE FUNCTIONS =====
    
    async function loadWorkAssignments() {
        if (!state.user) {
            console.log('Cannot load work assignments: user not authenticated');
            return;
        }
        if (state.loadingAssignments) {
            console.log('Already loading assignments, skipping...');
            return;
        }
        try {
            state.loadingAssignments = true;
            console.log('Loading work assignments...');
            const snapshot = await db.collection('workAssignments').get();
            state.workAssignments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('Loaded work assignments:', state.workAssignments.length);
            state.assignmentsLoaded = true;
            state.loadingAssignments = false;
            render();
        } catch (error) {
            console.error('Error loading work assignments:', error);
            state.loadingAssignments = false;
            if (state.user) {
                alert('שגיאה בטעינת סידור עבודה: ' + error.message);
            }
        }
    }
    
    async function addWorkAssignment(workerId, projectId, date) {
        try {
            const project = state.allProjects.find(p => p.id === projectId);
            if (!project) {
                alert('פרויקט לא נמצא');
                return;
            }
            
            // Check if worker is already assigned to this project on this date
            const existingAssignment = state.workAssignments.find(a => 
                a.workerId === workerId && 
                a.projectId === projectId && 
                a.date === date
            );
            
            if (existingAssignment) {
                alert('עובד זה כבר משובץ לפרויקט זה באותו יום');
                return;
            }
            
            const assignmentData = {
                workerId: workerId,
                projectId: projectId,
                projectName: project.name,
                clientId: project.clientId,
                clientName: project.clientName,
                date: date, // Store as ISO string: YYYY-MM-DD
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: state.user.uid
            };
            
            const docRef = await db.collection('workAssignments').add(assignmentData);
            console.log('Work assignment added:', docRef.id);
            
            state.workAssignments.push({
                id: docRef.id,
                ...assignmentData,
                createdAt: new Date()
            });
            
            render();
        } catch (error) {
            console.error('Error adding work assignment:', error);
            alert('שגיאה בהוספת שיבוץ: ' + error.message);
        }
    }
    
    async function deleteWorkAssignment(assignmentId) {
        if (!confirm('האם למחוק את השיבוץ?')) return;
        
        try {
            await db.collection('workAssignments').doc(assignmentId).delete();
            state.workAssignments = state.workAssignments.filter(a => a.id !== assignmentId);
            render();
        } catch (error) {
            console.error('Error deleting work assignment:', error);
            alert('שגיאה במחיקת שיבוץ: ' + error.message);
        }
    }

    async function updateWorkerDailyRate(workerId, rate) {
        try {
            const updates = { [`workerDailyRates.${workerId}`]: parseFloat(rate) || 0 };
            
            // Save to user's settings or a dedicated collection
            await db.collection('settings').doc('workerRates').set(updates, { merge: true });
            
            // Update local state
            if (!state.workerDailyRates) {
                state.workerDailyRates = {};
            }
            state.workerDailyRates[workerId] = parseFloat(rate) || 0;
            
            render();
        } catch (error) {
            console.error('Error updating worker daily rate:', error);
            alert('שגיאה בעדכון תעריף יומי: ' + error.message);
        }
    }

    async function loadWorkerDailyRates() {
        try {
            const doc = await db.collection('settings').doc('workerRates').get();
            if (doc.exists) {
                state.workerDailyRates = doc.data().workerDailyRates || {};
            } else {
                state.workerDailyRates = {};
            }
        } catch (error) {
            console.error('Error loading worker daily rates:', error);
            state.workerDailyRates = {};
        }
    }

    function showWorkScheduleView() {
        state.view = 'workSchedule';
        state.selectedClient = null;
        state.selectedProject = null;
        updateHistory();
        loadWorkAssignments();
        loadWorkerDailyRates();
    }

    // Helper functions for managing the work schedule UI
    function getWorkerAssignmentsForDate(workerId, date) {
        return state.workAssignments.filter(a => a.workerId === workerId && a.date === date);
    }

    function getProjectAssignmentsForDate(projectId, date) {
        return state.workAssignments.filter(a => a.projectId === projectId && a.date === date);
    }

    function getAllAssignmentsForDate(date) {
        return state.workAssignments.filter(a => a.date === date);
    }

    /**
     * Get the proportional allocation (fraction of the day) for a worker on a specific project and date
     * @param {string} workerId - Worker ID
     * @param {string} projectId - Project ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {number} - Fraction of the day (e.g., 0.5 for half day, 0.33 for third of day)
     */
    function getWorkerAllocationForProjectOnDate(workerId, projectId, date) {
        const workerAssignmentsOnDate = getWorkerAssignmentsForDate(workerId, date);
        const totalProjects = workerAssignmentsOnDate.length;
        
        if (totalProjects === 0) return 0;
        
        // Each project gets an equal share of the worker's time
        return 1 / totalProjects;
    }

    /**
     * Get all projects a worker is assigned to on a specific date with their allocation
     * @param {string} workerId - Worker ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Array} - Array of {projectId, projectName, allocation} objects
     */
    function getWorkerDayAllocation(workerId, date) {
        const assignments = getWorkerAssignmentsForDate(workerId, date);
        const totalProjects = assignments.length;
        const allocation = totalProjects > 0 ? 1 / totalProjects : 0;
        
        return assignments.map(a => ({
            projectId: a.projectId,
            projectName: a.projectName,
            allocation: allocation,
            allocationPercent: Math.round(allocation * 100)
        }));
    }

    function getWorkerTotalDays(workerId) {
        // Group by date and count each date as one day regardless of how many projects
        const dates = new Set(state.workAssignments
            .filter(a => a.workerId === workerId)
            .map(a => a.date));
        return dates.size;
    }

    function getWorkerTotalExpenses(workerId) {
        const dailyRate = state.workerDailyRates[workerId] || 0;
        const totalDays = getWorkerTotalDays(workerId);
        return dailyRate * totalDays;
    }

    function getProjectWorkerExpenses(projectId) {
        const projectAssignments = state.workAssignments.filter(a => a.projectId === projectId);
        
        return projectAssignments.reduce((total, assignment) => {
            const dailyRate = state.workerDailyRates[assignment.workerId] || 0;
            // Get the allocation for this worker on this project on this date
            const allocation = getWorkerAllocationForProjectOnDate(
                assignment.workerId, 
                assignment.projectId, 
                assignment.date
            );
            return total + (dailyRate * allocation);
        }, 0);
    }

    /**
     * Get detailed worker expenses for a project with allocation breakdown
     * @param {string} projectId - Project ID
     * @returns {Object} - {total, breakdown: [{workerId, workerName, days, allocations, cost}]}
     */
    function getProjectWorkerExpensesDetailed(projectId) {
        const projectAssignments = state.workAssignments.filter(a => a.projectId === projectId);
        
        // Group by worker
        const workerData = {};
        
        projectAssignments.forEach(assignment => {
            if (!workerData[assignment.workerId]) {
                workerData[assignment.workerId] = {
                    workerId: assignment.workerId,
                    assignments: []
                };
            }
            workerData[assignment.workerId].assignments.push(assignment);
        });
        
        const breakdown = Object.values(workerData).map(data => {
            const workerId = data.workerId;
            const dailyRate = state.workerDailyRates[workerId] || 0;
            
            // Calculate total allocation and cost
            let totalAllocation = 0;
            const allocations = [];
            
            data.assignments.forEach(assignment => {
                const allocation = getWorkerAllocationForProjectOnDate(
                    workerId, 
                    projectId, 
                    assignment.date
                );
                totalAllocation += allocation;
                allocations.push({
                    date: assignment.date,
                    allocation: allocation,
                    allocationPercent: Math.round(allocation * 100),
                    cost: dailyRate * allocation
                });
            });
            
            const worker = state.workers?.find(w => w.id === workerId);
            
            return {
                workerId: workerId,
                workerName: worker?.name || workerId,
                totalDays: totalAllocation,
                allocations: allocations,
                cost: dailyRate * totalAllocation
            };
        });
        
        const total = breakdown.reduce((sum, w) => sum + w.cost, 0);
        
        return { total, breakdown };
    }

    // Return public API
    return {
        loadWorkAssignments,
        addWorkAssignment,
        deleteWorkAssignment,
        updateWorkerDailyRate,
        loadWorkerDailyRates,
        showWorkScheduleView,
        getWorkerAssignmentsForDate,
        getProjectAssignmentsForDate,
        getAllAssignmentsForDate,
        getWorkerTotalDays,
        getWorkerTotalExpenses,
        getProjectWorkerExpenses,
        getWorkerAllocationForProjectOnDate,
        getWorkerDayAllocation,
        getProjectWorkerExpensesDetailed
    };
}

