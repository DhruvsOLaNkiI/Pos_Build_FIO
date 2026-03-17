const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes — verify JWT
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        res.status(401);
        return next(new Error('Not authorized, no token'));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from the token (Either User/Employee OR Customer)
        if (decoded.role === 'customer') {
            const Customer = require('../models/Customer');
            req.user = await Customer.findById(decoded.id).select('-__v');
            req.user.role = 'customer'; // explicitly attach role
        } else {
            req.user = await User.findById(decoded.id).select('-password');
        }

        if (!req.user) {
            res.status(401);
            return next(new Error('User not found'));
        }
        next();
    } catch (error) {
        res.status(401);
        return next(new Error('Not authorized, token failed'));
    }
};

// Role-based access
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            res.status(403);
            return next(
                new Error(`Role '${req.user.role}' is not authorized to access this route`)
            );
        }
        next();
    };
};

module.exports = { protect, authorize };
