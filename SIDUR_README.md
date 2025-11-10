# Sidur (סידור עבודה) - Work Schedule Management 📅

## 🎯 What's New

The work schedule system now intelligently manages worker assignments with **automatic proportional time allocation** when workers are assigned to multiple projects on the same day.

## ✨ Key Features

### 1. **Smart Duplicate Prevention**
Workers can only be assigned once per project per day. Attempting to create a duplicate assignment shows a clear Hebrew error message.

### 2. **Automatic Time Allocation**
When a worker is assigned to multiple projects on the same day, their time is automatically split equally:
- 1 project = 100% of the day
- 2 projects = 50% per project  
- 3 projects = 33.3% per project
- And so on...

### 3. **Accurate Cost Calculation**
Worker expenses are calculated based on actual time allocation:
```
Cost = Daily Rate × Allocation Fraction
Example: ₪500/day × 0.5 (50%) = ₪250
```

### 4. **Visual Indicators**
- Percentage badges show allocation in calendar view
- Color-coded breakdown in project details
- Tooltips explain multi-project assignments
- Info box with business rules

### 5. **Detailed Reporting**
Project details show:
- Total worker days (with decimals)
- Cost per worker
- Per-date allocation breakdown
- Clear visual distinction between full and partial days

---

## 📚 Documentation

This implementation includes comprehensive documentation:

| Document | Description |
|----------|-------------|
| **SIDUR_IMPLEMENTATION.md** | Complete technical implementation details, API reference, code examples |
| **SIDUR_VISUAL_GUIDE.md** | Visual examples, UI mockups, diagrams, color schemes |
| **SIDUR_TESTING_GUIDE.md** | Test scenarios, checklists, validation procedures |
| **SIDUR_README.md** | This file - quick overview and getting started |

---

## 🚀 Quick Start

### For Users

1. **Navigate to Work Schedule**
   - Click "סידור עבודה" in the main navigation

2. **Assign a Worker**
   - Drag a worker badge onto a project date cell
   - Worker appears in the cell

3. **Create Split Assignment**
   - Drag the same worker to another project on the same date
   - Both cells now show percentage badges (e.g., "יאסר 50%")

4. **View Costs**
   - Click on a project to see details
   - Scroll to "הוצאות עובדים" section
   - See breakdown with allocation percentages

5. **Edit Daily Rates**
   - In project details, click "ערוך תעריפים יומיים"
   - Update rates as needed
   - Click "שמור" to save

### For Developers

**Access the API:**
```javascript
// All functions available via window.appHandlers.sidur

// Add assignment (with validation)
await window.appHandlers.sidur.addWorkAssignment('a', 'project-123', '2024-11-10');

// Get allocation for specific assignment
const allocation = window.appHandlers.sidur.getWorkerAllocationForProjectOnDate(
  'a', 'project-123', '2024-11-10'
);

// Get detailed project expenses
const expenses = window.appHandlers.sidur.getProjectWorkerExpensesDetailed('project-123');

// Get worker's schedule for a day
const schedule = window.appHandlers.sidur.getWorkerDayAllocation('a', '2024-11-10');
```

**Files Modified:**
- `public/js/components/sidur.js` - Component logic
- `public/index.html` - UI rendering

---

## 💡 Business Rules

### Rule 1: One Assignment Per Project Per Day
A worker can only be assigned **once** to any given project on any given day.

**Why?** Prevents data duplication and ensures clean accounting.

### Rule 2: Equal Time Distribution
When assigned to multiple projects on the same day, time is split equally.

**Why?** Fair, transparent, and easy to understand. Can be enhanced later for custom splits.

### Rule 3: Proportional Cost Allocation
Costs are calculated based on actual time allocation.

**Why?** Accurate project accounting. Each project pays only for the time actually spent.

### Rule 4: Unique Days Counting
A worker working on 2 projects in one day counts as 1 day worked, not 2.

**Why?** Realistic time tracking. A worker can't work more than one day per day.

---

## 📊 Example Scenarios

### Scenario A: Simple Assignment
```
Date: November 10
Worker: יאסר (₪500/day)
Projects: Building A only

Result:
- Building A gets 100% of יאסר's time
- Building A pays ₪500
- יאסר works 1 day
```

### Scenario B: Split Assignment
```
Date: November 10
Worker: יאסר (₪500/day)
Projects: Building A and Building B

Result:
- Building A gets 50% of יאסר's time
- Building B gets 50% of יאסר's time
- Building A pays ₪250
- Building B pays ₪250
- יאסר works 1 day total, earns ₪500
```

### Scenario C: Complex Week
```
Worker: יאסר (₪500/day)

Monday: Projects A + B (50% each)
Tuesday: Project A only (100%)
Wednesday: Projects A + B + C (33% each)

Building A Costs:
- Monday: ₪250 (50%)
- Tuesday: ₪500 (100%)
- Wednesday: ₪167 (33%)
- Total: ₪917 for 1.83 days

יאסר Stats:
- Days worked: 3 (unique dates)
- Total earned: ₪1,500
```

---

## 🎨 UI Components

### Calendar View
- **Workers List**: Draggable badges at top
- **Calendar Grid**: Projects × Dates
- **Worker Badges**: Green boxes with names
- **Percentage Badges**: Blue text when split
- **Delete Buttons**: Red × on hover
- **Legend**: Explains colors and badges
- **Info Box**: Business rules explanation

### Project Details
- **Summary Card**: Total days and costs
- **Worker Cards**: Individual breakdowns
- **Allocation Details**: Expandable per-date view
- **Edit Rates Button**: Quick access to rate editor

### Rate Editor
- **Worker List**: All workers with current rates
- **Input Fields**: Numeric inputs for rates
- **Save/Cancel**: Action buttons

---

## 🔧 Technical Details

### Data Structure
```javascript
{
  id: 'assignment-123',
  workerId: 'a',
  projectId: 'project-456',
  projectName: 'Building A',
  clientId: 'client-789',
  clientName: 'Client Corp',
  date: '2024-11-10',
  createdAt: Timestamp,
  userId: 'user-uid'
}
```

### Key Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `addWorkAssignment()` | Create new assignment with validation | Promise |
| `deleteWorkAssignment()` | Remove assignment | Promise |
| `getWorkerAllocationForProjectOnDate()` | Get fraction of day (0-1) | Number |
| `getWorkerDayAllocation()` | Get all projects for worker on date | Array |
| `getProjectWorkerExpenses()` | Get total worker costs | Number |
| `getProjectWorkerExpensesDetailed()` | Get detailed breakdown | Object |
| `getWorkerTotalDays()` | Count unique days worked | Number |
| `updateWorkerDailyRate()` | Update rate | Promise |

### Calculation Algorithm
```javascript
// For each worker assignment on a date:
const workerAssignmentsOnDate = assignments.filter(a => 
  a.workerId === workerId && a.date === date
);

const allocation = 1 / workerAssignmentsOnDate.length;
const cost = dailyRate × allocation;
```

---

## ✅ Testing

See **SIDUR_TESTING_GUIDE.md** for comprehensive test scenarios.

**Quick Tests:**
1. Assign worker to one project → No percentage shown
2. Assign same worker to second project (same day) → Shows 50%
3. Try duplicate assignment → Error shown
4. Delete one assignment → Percentages update
5. View project details → Costs calculated correctly

---

## 🐛 Troubleshooting

### Problem: Percentage not showing
**Solution:** Check that worker is assigned to multiple projects on the exact same date.

### Problem: Wrong cost calculation
**Solution:** Verify daily rate is set correctly. Check console for calculation logs.

### Problem: Can't assign worker
**Solution:** Check if worker is already assigned to that project on that date (duplicate prevention).

### Problem: UI not updating
**Solution:** Check browser console for errors. Try refreshing the page.

---

## 🎓 Training Tips

### For Managers
1. Start with simple single-day assignments
2. Practice with one worker on multiple projects
3. Review project details to see cost impact
4. Set up daily rates before scheduling
5. Use the info box as a reference

### For Accountants
1. Understand that costs are proportional
2. Check project details for breakdowns
3. Verify totals match expectations
4. Use detailed view for auditing
5. Export or screenshot for records

### For System Admins
1. Set up daily rates first
2. Train users on business rules
3. Monitor for unusual patterns
4. Regular data backups
5. Keep documentation accessible

---

## 📈 Future Enhancements

Potential additions (not yet implemented):

- [ ] Custom allocation percentages (not equal split)
- [ ] Worker availability calendar
- [ ] Over-allocation warnings
- [ ] Excel export of schedules
- [ ] Time tracking integration
- [ ] Automatic scheduling suggestions
- [ ] Conflict detection
- [ ] Email notifications

---

## 🆘 Support

### In-App Help
- Hover over elements for tooltips
- Read the info box in calendar view
- Check project details for cost breakdowns

### Documentation
- **Implementation**: SIDUR_IMPLEMENTATION.md
- **Visual Guide**: SIDUR_VISUAL_GUIDE.md
- **Testing**: SIDUR_TESTING_GUIDE.md

### Common Questions

**Q: Why can't I assign a worker twice to the same project?**  
A: This prevents duplicate data and ensures accurate counting.

**Q: How is the percentage calculated?**  
A: 100% divided by number of projects. Example: 3 projects = 100% ÷ 3 = 33%.

**Q: Does the worker earn more if assigned to multiple projects?**  
A: No. The daily rate is the total for the day, split across projects.

**Q: Can I change the allocation percentages?**  
A: Not currently. The system uses equal distribution. This could be added in the future.

**Q: What happens if I delete an assignment?**  
A: All other assignments for that worker on that day automatically recalculate.

---

## 📊 Success Metrics

After implementation, you should see:

✅ No duplicate assignments in database  
✅ All project costs accurately calculated  
✅ Clear visual feedback in UI  
✅ Workers correctly scheduled across projects  
✅ Accurate accounting reports  
✅ User satisfaction with transparency  

---

## 🎉 Summary

The sidur system now provides:
- **Smart validation** to prevent errors
- **Automatic allocation** for fair distribution  
- **Accurate calculations** for proper accounting
- **Clear visuals** for easy understanding
- **Detailed breakdowns** for transparency

All business rules are enforced automatically, making it easy to manage worker schedules while maintaining accurate project costs.

---

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** November 10, 2025  
**Maintained By:** Development Team

---

## Quick Links

- [Technical Implementation](SIDUR_IMPLEMENTATION.md)
- [Visual Guide](SIDUR_VISUAL_GUIDE.md)
- [Testing Guide](SIDUR_TESTING_GUIDE.md)
- [File Structure](FILE_STRUCTURE.txt)
- [Component Structure](COMPONENT_STRUCTURE.md)

