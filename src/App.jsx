// Force deploy - Netlify cache fix
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import SignUp from './components/SignUp'
import SignUpSuccess from './components/SignUpSuccess'
import UpdatePassword from './components/UpdatePassword'
import Dashboard from './components/Dashboard'
import Week1Budgeting from './components/Week1Budgeting'
import Week2Savings from './components/Week2Savings'
import Week3CreditCardPage from './components/Week3CreditCardWrapper'
import Week4 from './components/Week4'
import Week5 from './components/Week5'
import Week6Retirement from './components/Week6Retirement'
import Week7 from './components/Week7'
import Week9 from './components/Week9'
import Week12 from './components/Week12'
import WeekAccessAdmin from './components/WeekAccessAdmin'
import Overview from './components/pages/Overview'

// Sample data for Overview component
const sampleData = {
  todaysClasses: [
    {
      id: 1,
      title: "Budgeting Basics",
      time: "9:30 - 11:00",
      room: "Online Session 1",
      instructor: "Dr. Sarah Johnson"
    },
    {
      id: 2,
      title: "Investment Strategies",
      time: "11:10 - 12:40",
      room: "Online Session 2",
      instructor: "Prof. Michael Chen"
    },
    {
      id: 3,
      title: "Debt Management",
      time: "12:45 - 13:45",
      room: "Online Session 3",
      instructor: "Dr. Emily Rodriguez"
    }
  ],
  todoList: [
    {
      id: 1,
      task: "Complete Budget Assessment",
      dueDate: "by Tomorrow",
      completed: false
    },
    {
      id: 2,
      task: "Submit Investment Plan",
      dueDate: "by 15 Jul",
      completed: false
    },
    {
      id: 3,
      task: "Review Credit Score Module",
      dueDate: "by Today",
      completed: true
    }
  ],
  upcomingDeadlines: [
    {
      id: 1,
      title: "Monthly Budget Review",
      type: "Assignment",
      dueTime: "23:59",
      dueDate: "2 Jul, 2024"
    },
    {
      id: 2,
      title: "Investment Portfolio",
      type: "Project",
      dueTime: "23:59",
      dueDate: "11 Jul, 2024"
    },
    {
      id: 3,
      title: "Debt Management Quiz",
      type: "Quiz",
      dueTime: "23:59",
      dueDate: "15 Jul, 2024"
    }
  ]
};

// Overview wrapper component
const OverviewWrapper = () => (
  <Overview
    todaysClasses={sampleData.todaysClasses}
    todoList={sampleData.todoList}
    upcomingDeadlines={sampleData.upcomingDeadlines}
  />
);

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d1a4b] mx-auto"></div>
          <p className="mt-4 text-[#0d1a4b]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signup-success" element={<SignUpSuccess />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard/excel/week-1" replace />} />
            <Route path="excel/week-1" element={<Week1Budgeting />} />
            <Route path="excel/week-1/*" element={<Week1Budgeting />} />
            <Route path="excel/week-2" element={<Week2Savings />} />
            <Route path="excel/week-2/*" element={<Week2Savings />} />
            <Route path="excel/week-3" element={<Week3CreditCardPage />} />
            <Route path="excel/week-3/*" element={<Week3CreditCardPage />} />
            <Route path="excel/week-4" element={<Week4 />} />
            <Route path="excel/week-4/*" element={<Week4 />} />
            <Route path="excel/week-5" element={<Week5 />} />
            <Route path="excel/week-5/*" element={<Week5 />} />
            <Route path="excel/week-6/*" element={<Week6Retirement />} />
            <Route path="excel/week-7" element={<Week7 />} />
            <Route path="excel/week-7/*" element={<Week7 />} />
            <Route path="excel/week-9" element={<Week9 />} />
            <Route path="excel/week-9/*" element={<Week9 />} />
            <Route path="excel/week-12" element={<Week12 />} />
            <Route path="excel/week-12/*" element={<Week12 />} />
            <Route path="admin/week-access" element={<WeekAccessAdmin />} />
            {/* Add routes for other weeks here as they are created */}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
