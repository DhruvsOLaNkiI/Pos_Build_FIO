const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    isApproved: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Calculate average rating after saving a review
reviewSchema.statics.calculateAverageRating = async function (productId) {
    const stats = await this.aggregate([
        {
            $match: { product: productId, isApproved: true }
        },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    try {
        if (stats.length > 0) {
            await mongoose.model('Product').findByIdAndUpdate(productId, {
                averageRating: Math.round(stats[0].averageRating * 10) / 10,
                totalReviews: stats[0].totalReviews
            });
        } else {
            await mongoose.model('Product').findByIdAndUpdate(productId, {
                averageRating: 0,
                totalReviews: 0
            });
        }
    } catch (err) {
        console.error(err);
    }
};

reviewSchema.post('save', function () {
    this.constructor.calculateAverageRating(this.product);
});

reviewSchema.post('remove', function () {
    this.constructor.calculateAverageRating(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);
