const User = require('../models/User');
const Expense = require('../models/Expense');
const bcrypt = require('bcryptjs');

// @desc    Get all employees (Staff & Cashiers)
// @route   GET /api/employees
// @access  Private (Owner only)
const getEmployees = async (req, res, next) => {
    try {
        const employees = await User.find({ companyId: req.user.companyId, role: { $ne: 'owner' } })
            .select('-password')
            .populate('defaultStore', 'name code')
            .populate('accessibleStores', 'name code')
            .populate('accessibleWarehouses', 'name code')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: employees.length, data: employees });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private (Owner only)
const getEmployee = async (req, res, next) => {
    try {
        const employee = await User.findOne({ _id: req.params.id, companyId: req.user.companyId })
            .select('-password')
            .populate('defaultStore', 'name code')
            .populate('accessibleStores', 'name code')
            .populate('accessibleWarehouses', 'name code');
        if (!employee) {
            res.status(404);
            return next(new Error('Employee not found'));
        }
        res.status(200).json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new employee (Register User)
// @route   POST /api/employees
// @access  Private (Owner only)
const createEmployee = async (req, res, next) => {
    try {
        const { name, email, password, role, phone, shiftStart, shiftEnd, workingDays, permissions, defaultStore, accessibleStores, accessibleWarehouses } = req.body;

        if (!name || !email || !password || !role) {
            res.status(400);
            return next(new Error('Please provide name, email, password and role'));
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            return next(new Error('User already exists'));
        }

        // Create user (owner-created employees are auto-approved)
        const user = await User.create({
            name,
            email,
            password,
            role, // 'cashier' or 'staff'
            phone,
            isApproved: true,
            status: 'active',
            permissions: permissions || (role === 'cashier'
                ? ['dashboard', 'billing', 'customers', 'employees']
                : ['dashboard', 'products', 'inventory', 'expired-products', 'customers', 'employees', 'alerts']),
            shift: {
                startTime: shiftStart || '09:00',
                endTime: shiftEnd || '17:00',
                workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            },
            defaultStore: defaultStore || null,
            accessibleStores: accessibleStores || (defaultStore ? [defaultStore] : []),
            accessibleWarehouses: accessibleWarehouses || [],
            companyId: req.user.companyId,
        });

        res.status(201).json({
            success: true,
            data: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Owner only)
const updateEmployee = async (req, res, next) => {
    try {
        let user = await User.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!user) {
            res.status(404);
            return next(new Error('Employee not found'));
        }

        // Prevent updating owner via this route
        if (user.role === 'owner') {
            res.status(403);
            return next(new Error('Cannot update owner via employee route'));
        }

        const { name, email, role, phone, password, salary, joiningDate, designation, bonus, leaveAllowance, shiftStart, shiftEnd, workingDays, permissions, defaultStore, accessibleStores, accessibleWarehouses } = req.body;

        // Build update object
        const updateData = { name, email, role, phone };

        if (permissions !== undefined) updateData.permissions = permissions;

        if (shiftStart !== undefined || shiftEnd !== undefined || workingDays !== undefined) {
            updateData.shift = {
                startTime: shiftStart !== undefined ? shiftStart : user.shift?.startTime,
                endTime: shiftEnd !== undefined ? shiftEnd : user.shift?.endTime,
                workingDays: workingDays !== undefined ? workingDays : user.shift?.workingDays
            };
        }

        if (salary !== undefined) updateData.salary = salary;
        if (joiningDate !== undefined) updateData.joiningDate = joiningDate;
        if (designation !== undefined) updateData.designation = designation;
        if (bonus !== undefined) updateData.bonus = Number(bonus);
        if (leaveAllowance !== undefined) updateData.leaveAllowance = Number(leaveAllowance);
        if (defaultStore !== undefined) {
            updateData.defaultStore = defaultStore || null;
            if (defaultStore && !accessibleStores) {
                updateData.accessibleStores = Array.from(new Set([...(user.accessibleStores || []), defaultStore]));
            }
        }
        if (accessibleStores !== undefined) updateData.accessibleStores = accessibleStores;
        if (accessibleWarehouses !== undefined) updateData.accessibleWarehouses = accessibleWarehouses;

        // Only update password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).select('-password');

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Create appeal (From staff)
// @route   POST /api/employees/appeal
// @access  Private
const createAppeal = async (req, res, next) => {
    try {
        const { subject, message } = req.body;
        const user = await User.findById(req.user._id);

        user.appeals.push({
            subject,
            message,
            status: 'pending'
        });

        await user.save();
        res.status(200).json({ success: true, data: user.appeals[user.appeals.length - 1] });
    } catch (error) {
        next(error);
    }
};

// @desc    Respond to appeal (From owner)
// @route   PUT /api/employees/:id/appeal/:appealId
// @access  Private (Owner only)
const respondToAppeal = async (req, res, next) => {
    try {
        const { response, status } = req.body;
        const user = await User.findOne({ _id: req.params.id, companyId: req.user.companyId });

        const appeal = user.appeals.id(req.params.appealId);
        if (!appeal) {
            res.status(404);
            return next(new Error('Appeal not found'));
        }

        if (response) appeal.response = response;
        if (status) appeal.status = status;

        await user.save();
        res.status(200).json({ success: true, data: appeal });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Owner only)
const deleteEmployee = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!user) {
            res.status(404);
            return next(new Error('Employee not found'));
        }

        if (user.role === 'owner') {
            res.status(403);
            return next(new Error('Cannot delete owner account'));
        }

        await user.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve pending employee
// @route   PUT /api/employees/:id/approve
// @access  Private (Owner only)
const approveEmployee = async (req, res, next) => {
    try {
        const { role } = req.body; // Owner can set role while approving

        let user = await User.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!user) {
            res.status(404);
            return next(new Error('Employee not found'));
        }

        user.isApproved = true;
        user.status = 'active';
        if (role) user.role = role;

        await user.save();

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Pay salary to employee (Creates an Expense and resets bonus)
// @route   POST /api/employees/:id/pay-salary
// @access  Private (Owner only)
const paySalary = async (req, res, next) => {
    try {
        const employeeId = req.params.id;
        const employee = await User.findOne({ _id: employeeId, companyId: req.user.companyId });

        if (!employee) {
            res.status(404);
            return next(new Error('Employee not found'));
        }

        if (employee.role === 'owner') {
            res.status(403);
            return next(new Error('Cannot pay salary to owner'));
        }

        // Calculate total payout (Base Salary + Bonus)
        const baseSalary = employee.salary?.amount || 0;
        const bonus = employee.bonus || 0;
        const totalAmount = baseSalary + bonus;

        if (totalAmount <= 0) {
            res.status(400);
            return next(new Error('Total salary amount must be greater than 0'));
        }

        // 1. Create an Expense Record
        const expenseTitle = `Salary - ${employee.name}`;
        await Expense.create({
            title: expenseTitle,
            amount: totalAmount,
            category: 'salary',
            description: `Base: ₹${baseSalary}, Bonus: ₹${bonus}`,
            createdBy: req.user._id,
            companyId: req.user.companyId,
        });

        // 2. Reset Employee Bonus to 0 for next month
        employee.bonus = 0;
        await employee.save();

        res.status(200).json({
            success: true,
            data: employee,
            message: `Paid ₹${totalAmount} to ${employee.name} and logged as Expense.`
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update employee page permissions
// @route   PUT /api/employees/:id/permissions
// @access  Private (Owner only)
const updatePermissions = async (req, res, next) => {
    try {
        const { permissions } = req.body;

        const employee = await User.findOne({ _id: req.params.id, companyId: req.user.companyId });

        if (!employee) {
            res.status(404);
            return next(new Error('Employee not found'));
        }

        employee.permissions = Array.isArray(permissions) ? permissions : [];
        await employee.save();

        res.status(200).json({
            success: true,
            data: {
                _id: employee._id,
                name: employee.name,
                role: employee.role,
                permissions: employee.permissions,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    approveEmployee,
    createAppeal,
    respondToAppeal,
    paySalary,
    updatePermissions,
};
