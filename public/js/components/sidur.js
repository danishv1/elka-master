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

    function getWorkerTotalDays(workerId) {
        return state.workAssignments.filter(a => a.workerId === workerId).length;
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
            return total + dailyRate;
        }, 0);
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
        getProjectWorkerExpenses
    };
}

