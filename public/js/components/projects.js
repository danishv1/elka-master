// ===== PROJECTS COMPONENT =====
// Handles all project and invoice-related functionality

export function initProjectsComponent(context) {
    const { state, db, firebase, storage, render, updateHistory } = context;

    // ===== PROJECT FUNCTIONS =====
    
    async function loadProjectsForClient(clientId) {
        try {
            console.log('Loading projects for client:', clientId);
            const snapshot = await db.collection('projects')
                .where('clientId', '==', clientId)
                .get();
            
            state.projects = await Promise.all(snapshot.docs.map(async doc => {
                const projectData = {
                    id: doc.id,
                    ...doc.data()
                };
                
                // Load invoices for calculations
                const invoices = await loadInvoices(doc.id);
                projectData.invoices = invoices;
                
                return projectData;
            }));
            
            state.projects.sort((a, b) => {
                const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt || new Date(0));
                const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt || new Date(0));
                return bTime - aTime;
            });
            
            console.log('Loaded projects:', state.projects.length);
            render();
        } catch (error) {
            console.error('Error loading projects:', error);
            // Only show error if user is authenticated (not during initial load)
            if (state.user) {
                alert('שגיאה בטעינת פרויקטים: ' + error.message);
            }
        }
    }

    async function loadAllProjects() {
        if (!state.user) {
            console.log('Cannot load all projects: user not authenticated');
            return;
        }

        // Check if already loaded (cache)
        if (state.allProjects && state.allProjects.length > 0) {
            console.log('Using cached projects list');
            return;
        }

        try {
            console.log('Loading all projects with full data...');
            const snapshot = await db.collection('projects').get();

            state.allProjects = await Promise.all(snapshot.docs.map(async doc => {
                const data = doc.data();
                const client = state.clients.find(c => c.id === data.clientId);

                // Load invoices for this project to calculate totals
                const invoices = await loadInvoices(doc.id);

                return {
                    id: doc.id,
                    ...data,
                    clientName: client ? client.name : 'לקוח לא ידוע',
                    invoices: invoices
                };
            }));

            // Sort by creation date (newest first)
            state.allProjects.sort((a, b) => {
                const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt || new Date(0));
                const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt || new Date(0));
                return bTime - aTime;
            });

            console.log('Loaded all projects:', state.allProjects.length);
            render();
        } catch (error) {
            console.error('Error loading all projects:', error);
            if (state.user) {
                alert('שגיאה בטעינת כל הפרויקטים: ' + error.message);
            }
        }
    }

    async function addProject() {
        if (!state.newProject.name || !state.selectedClient) {
            alert('יש להזין שם לפרויקט');
            return;
        }
        
        try {
            const projectData = {
                clientId: state.selectedClient.id,
                name: state.newProject.name,
                revenue: parseFloat(state.newProject.revenue) || 0,
                status: state.newProject.status || 'פתוח',
                description: state.newProject.description || '',
                activeInSchedule: state.newProject.activeInSchedule !== false,
                createdAt: new Date(state.newProject.creationDate)
            };
            
            const docRef = await db.collection('projects').add(projectData);
            console.log('Project added:', docRef.id);
            
            state.projects.unshift({
                id: docRef.id,
                ...projectData,
                createdAt: new Date(state.newProject.creationDate),
                invoices: []
            });
            
            state.newProject = { name: '', revenue: '', status: 'פתוח', creationDate: new Date().toISOString().split('T')[0], description: '', activeInSchedule: true };
            state.showNewProject = false;
            render();
        } catch (error) {
            console.error('Error adding project:', error);
            alert('שגיאה בהוספת פרויקט: ' + error.message);
        }
    }

    async function deleteProject(projectId) {
        if (!confirm('האם למחוק את הפרויקט?')) return;
        
        try {
            const batch = db.batch();
            
            // Delete all invoices
            const invoicesSnapshot = await db.collection('invoices')
                .where('projectId', '==', projectId).get();
            invoicesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            
            // Delete project
            batch.delete(db.collection('projects').doc(projectId));
            await batch.commit();
            
            state.projects = state.projects.filter(p => p.id !== projectId);
            if (state.selectedProject?.id === projectId) {
                state.selectedProject = null;
            }
            render();
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('שגיאה במחיקת פרויקט: ' + error.message);
        }
    }

    async function saveEditProject() {
        if (!state.editingProject.name) return;
        
        try {
            const updates = {
                name: state.editingProject.name,
                revenue: parseFloat(state.editingProject.revenue) || 0,
                status: state.editingProject.status || 'פתוח',
                description: state.editingProject.description || '',
                activeInSchedule: state.editingProject.activeInSchedule !== false
            };
            
            // Only update creationDate if it's provided and valid
            if (state.editingProject.creationDate) {
                updates.creationDate = new Date(state.editingProject.creationDate);
            }
            
            await db.collection('projects').doc(state.editingProject.id).update(updates);
            
            state.projects = state.projects.map(p =>
                p.id === state.editingProject.id ? { ...p, ...updates } : p
            );
            
            if (state.selectedProject?.id === state.editingProject.id) {
                state.selectedProject = { ...state.selectedProject, ...updates };
            }
            
            state.editingProject = null;
            render();
        } catch (error) {
            console.error('Error updating project:', error);
            alert('שגיאה בעדכון פרויקט: ' + error.message);
        }
    }

    async function selectProject(projectId) {
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;
        
        state.selectedProject = { ...project };
        const invoices = await loadInvoices(projectId);
        state.selectedProject.invoices = invoices;
        updateHistory();
        render();
    }

    // ===== INVOICE FUNCTIONS =====
    
    async function loadInvoices(projectId) {
        try {
            const snapshot = await db.collection('invoices')
                .where('projectId', '==', projectId)
                .get();
            
            const invoices = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
            return invoices;
        } catch (error) {
            console.error('Error loading invoices:', error);
            return [];
        }
    }

    async function addInvoice() {
        if (!state.newInvoice.supplier || !state.selectedProject) {
            alert('יש להזין ספק');
            return;
        }
        
        const validItems = state.newInvoice.items.filter(item => item.amount && parseFloat(item.amount) > 0);
        if (validItems.length === 0) {
            alert('יש להוסיף לפחות פריט אחד עם סכום');
            return;
        }
        
        try {
            // Upload files with authentication
            const uploadedFiles = [];
            for (const file of state.newInvoice.attachments) {
                const storageRef = storage.ref(`invoices/${state.selectedProject.id}/${Date.now()}_${file.name}`);
                await storageRef.putString(file.data, 'data_url');
                const downloadURL = await getAuthenticatedDownloadURL(storageRef);
                uploadedFiles.push({
                    name: file.name,
                    url: downloadURL,
                    type: file.type
                });
            }
            
            // Add invoices
            const batch = db.batch();
            validItems.forEach(item => {
                const invoiceData = {
                    projectId: state.selectedProject.id,
                    clientId: state.selectedClient.id,
                    supplier: state.newInvoice.supplier,
                    invoiceNumber: state.newInvoice.invoiceNumber || '',
                    date: state.newInvoice.date,
                    description: item.description,
                    amount: parseFloat(item.amount),
                    category: item.category || 'שונות',
                    attachments: uploadedFiles,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                const ref = db.collection('invoices').doc();
                batch.set(ref, invoiceData);
            });
            
            await batch.commit();
            
            // Reload invoices
            const updatedInvoices = await loadInvoices(state.selectedProject.id);
            state.selectedProject.invoices = updatedInvoices;
            
            state.newInvoice = {
                supplier: '',
                invoiceNumber: '',
                date: new Date().toISOString().split('T')[0],
                items: [{ description: '', amount: '', category: 'שונות' }],
                attachments: []
            };
            state.showNewInvoice = false;
            render();
        } catch (error) {
            console.error('Error adding invoice:', error);
            alert('שגיאה בהוספת חשבונית: ' + error.message);
        }
    }

    async function deleteInvoice(invoiceId) {
        if (!confirm('האם למחוק את החשבונית?')) return;
        
        try {
            await db.collection('invoices').doc(invoiceId).delete();
            state.selectedProject.invoices = state.selectedProject.invoices.filter(inv => inv.id !== invoiceId);
            render();
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert('שגיאה במחיקת חשבונית: ' + error.message);
        }
    }

    async function saveEditInvoice() {
        if (!state.editingInvoice.supplier || !state.editingInvoice.amount) {
            alert('יש להזין ספק וסכום');
            return;
        }
        
        try {
            const updates = {
                supplier: state.editingInvoice.supplier,
                invoiceNumber: state.editingInvoice.invoiceNumber,
                date: state.editingInvoice.date,
                description: state.editingInvoice.description,
                amount: parseFloat(state.editingInvoice.amount),
                category: state.editingInvoice.category || 'שונות'
            };
            
            await db.collection('invoices').doc(state.editingInvoice.id).update(updates);
            
            state.selectedProject.invoices = state.selectedProject.invoices.map(inv =>
                inv.id === state.editingInvoice.id ? { ...inv, ...updates } : inv
            );
            
            state.editingInvoice = null;
            render();
        } catch (error) {
            console.error('Error updating invoice:', error);
            alert('שגיאה בעדכון חשבונית: ' + error.message);
        }
    }

    // Helper functions
    async function getAuthenticatedDownloadURL(storageRef) {
        try {
            const url = await storageRef.getDownloadURL();
            return url;
        } catch (error) {
            console.error('Error getting download URL:', error);
            throw error;
        }
    }

    function handleFileUpload(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                state.newInvoice.attachments.push({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: file.type,
                    data: e.target.result,
                    size: file.size
                });
                render();
            };
            reader.readAsDataURL(file);
        });
    }

    function removeAttachment(index) {
        state.newInvoice.attachments.splice(index, 1);
        render();
    }

    function addInvoiceItem() {
        state.newInvoice.items.push({ description: '', amount: '', category: 'שונות' });
        render();
    }

    function removeInvoiceItem(index) {
        if (state.newInvoice.items.length > 1) {
            state.newInvoice.items.splice(index, 1);
            render();
        }
    }

    function updateInvoiceItem(index, field, value) {
        state.newInvoice.items[index][field] = value;
        render();
    }

    function backToClients() {
        state.view = 'clients';
        state.selectedClient = null;
        state.selectedProject = null;
        state.projects = [];
        updateHistory();
        render();
    }

    function backToProjects() {
        state.selectedProject = null;
        updateHistory();
        render();
    }

    // Return public API
    return {
        loadProjectsForClient,
        loadAllProjects,
        addProject,
        deleteProject,
        saveEditProject,
        selectProject,
        loadInvoices,
        addInvoice,
        deleteInvoice,
        saveEditInvoice,
        handleFileUpload,
        removeAttachment,
        addInvoiceItem,
        removeInvoiceItem,
        updateInvoiceItem,
        backToClients,
        backToProjects
    };
}

