import mongoose from 'mongoose';

const DollarSpendSchema = new mongoose.Schema({
    type: { type: String, required: true, enum: ['Spend', 'Load'], default: 'Spend' },
    companyName: { type: String, default: 'N/A' },
    platform: { type: String, required: true },
    campaignName: { type: String, default: '' }, // ✅ This tracks the Ad Campaign
    amount: { type: Number, required: true },
    exchangeRate: { type: Number, required: true },
    nprEquivalent: { type: Number },
    date: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

if (mongoose.models.DollarSpend) { delete mongoose.models.DollarSpend; }
export default mongoose.model('DollarSpend', DollarSpendSchema);