const mongoose = require('mongoose');

const bannerConfigSchema = new mongoose.Schema({
    company: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    },
    store: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Store' 
    }, // Optional: only for store-specific banners
    section: { 
        type: String, 
        enum: ['TOP_HERO', 'BOTTOM_HERO', 'MARQUEE'], 
        default: 'TOP_HERO' 
    },
    layoutType: { 
        type: String, 
        enum: ['GRID_1', 'GRID_2', 'GRID_3', 'MARQUEE_TEXT'],
        default: 'GRID_2' 
    },
    items: [{
        imageUrl: String,
        title: String,
        subtitle: String,
        redirectType: { 
            type: String, 
            enum: ['store', 'product', 'offer', 'category', 'external', 'none'],
            default: 'none'
        },
        redirectTo: String, // StoreID, ProductID, Category Name, or URL
        order: { type: Number, default: 0 }
    }],
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
}, { timestamps: true });

// Index for efficient querying by customer portal (which queries by store or company and section)
bannerConfigSchema.index({ company: 1, store: 1, section: 1, isActive: 1 });

module.exports = mongoose.model('BannerConfig', bannerConfigSchema);
