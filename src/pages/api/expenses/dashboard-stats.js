import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import Expense from '../../../../models/Expense';
import User from '../../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  await dbConnect();

  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    const isAuthorized = ['Superadmin', 'Finance', 'Manager', 'Project Manager'].includes(user.role) || (user.accessRoles && user.accessRoles.includes('Expense Manager'));

    let filter = {};
    // If not authorized as a manager, only see their own stats (or we can just restrict access to the dashboard entirely)
    // For now, let's allow staff to see their own submitted expenses, and managers to see all.
    if (!isAuthorized) {
        filter.createdBy = userId;
    }

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0,0,0,0);

    const allExpenses = await Expense.find(filter).lean();
    
    const todayExpenses = allExpenses.filter(e => new Date(e.englishDate) >= todayStart)
                                     .reduce((sum, e) => sum + e.amount, 0);

    const monthlyExpenses = allExpenses.filter(e => new Date(e.englishDate) >= monthStart)
                                       .reduce((sum, e) => sum + e.amount, 0);

    const totalExpensesCount = allExpenses.length;

    // Top Spending Category
    const categoryTotals = {};
    allExpenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    let topCategory = 'None';
    let topCategoryAmount = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
        if (amt > topCategoryAmount) {
            topCategory = cat;
            topCategoryAmount = amt;
        }
    }

    return res.status(200).json({
      success: true,
      stats: {
          todayExpenses,
          monthlyExpenses,
          totalExpensesCount,
          topCategory,
          topCategoryAmount
      }
    });

  } catch (error) {
    console.error("Expense Stats Error:", error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
