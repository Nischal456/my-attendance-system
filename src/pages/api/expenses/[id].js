import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import Expense from '../../../../models/Expense';
import User from '../../../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;
  const { token } = req.cookies;

  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const userId = decoded.userId;

  if (req.method === 'PUT') {
    try {
      const { action } = req.body;

      if (action === 'markRead') {
        const expense = await Expense.findById(id);
        if (!expense) {
          return res.status(404).json({ success: false, message: 'Expense not found.' });
        }

        // Use atomic update to prevent validation errors on old schema fields
        await Expense.findByIdAndUpdate(id, { $addToSet: { readBy: userId } });

        const updatedExpense = await Expense.findById(id)
          .populate('createdBy', 'name avatar role');
        
        return res.status(200).json({ success: true, data: updatedExpense });
      }

      return res.status(400).json({ success: false, message: 'Invalid action.' });
    } catch (error) {
      console.error("Update Expense Error:", error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } 
  else if (req.method === 'DELETE') {
    try {
      // Check permissions
      const user = await User.findById(userId);
      const isAuthorized = ['Superadmin', 'Finance', 'Manager', 'Project Manager'].includes(user.role) || (user.accessRoles && user.accessRoles.includes('Expense Manager'));

      const expense = await Expense.findById(id);
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense not found.' });
      }

      // Allow deletion if the user is authorized OR if the user created the expense AND it is still Pending
      if (!isAuthorized) {
          if (expense.createdBy.toString() !== userId || expense.status !== 'Pending') {
              return res.status(403).json({ success: false, message: 'Forbidden: Cannot delete this expense.' });
          }
      }

      await Expense.findByIdAndDelete(id);
      
      return res.status(200).json({ success: true, message: 'Expense deleted successfully.' });

    } catch (error) {
      console.error("Delete Expense Error:", error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
