const express = require('express');
const router = express.Router();
const {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    approveEmployee,
    createAppeal,
    respondToAppeal,
    paySalary
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Routes accessible by all authenticated users (staff, cashier, owner)
router.post('/appeal', createAppeal);

// Owner-only routes
router.route('/')
    .get(authorize('owner'), getEmployees)
    .post(authorize('owner'), createEmployee);

router.route('/:id')
    .get(authorize('owner'), getEmployee)
    .put(authorize('owner'), updateEmployee)
    .delete(authorize('owner'), deleteEmployee);

router.put('/:id/approve', authorize('owner'), approveEmployee);
router.put('/:id/appeal/:appealId', authorize('owner'), respondToAppeal);
router.post('/:id/pay-salary', authorize('owner'), paySalary);

module.exports = router;
