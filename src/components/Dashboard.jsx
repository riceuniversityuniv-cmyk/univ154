import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/logo with name for univ154.png'
import riceLogo from '../assets/rice-logo.png'
import ModuleView from './ModuleView'
import ExcelWorkshop from './ExcelWorkshop'
import LectureNotes from './LectureNotes'
import Overview from './pages/Overview'
import BudgetPlanner from './pages/BudgetPlanner'
import Analytics from './pages/Analytics'
import { BudgetProvider } from '../contexts/BudgetContext'
import { WeekAccessProvider, useWeekAccess } from '../contexts/WeekAccessContext'
import { AssumptionsProvider } from '../contexts/AssumptionsContext'

// Import icons
import { MdDashboard, MdSchool, MdInsertChart, MdChat, MdNotifications, MdUpload, MdDownload, MdBook, MdCheckCircle, MdBarChart, MdAccountBalance, MdTimeline, MdCalendarToday, MdAssignment, MdTrendingUp, MdChevronLeft, MdChevronRight, MdFolderOpen } from 'react-icons/md'
import { BsCalendar3 } from 'react-icons/bs'
import { FaUserShield } from 'react-icons/fa'
import { FaFileExcel } from 'react-icons/fa'
import { MinimalistSidebar } from './sidebar-variants/Option3_Minimalist'

// Avatar component with initials fallback
const Avatar = ({ url, name }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  
  if (url) {
    return (
      <img 
        src={url} 
        alt={name || 'Profile'} 
        className="w-full h-full object-cover rounded-full bg-white"
        style={{ minWidth: '100%', minHeight: '100%' }}
      />
    )
  }

  return (
    <div 
      className="w-full h-full rounded-full flex items-center justify-center text-white text-2xl font-medium bg-white"
      style={{ backgroundColor: '#ffffff', color: '#0d1a4b', minWidth: '60%', minHeight: '60%' }}
    >
      {initial}
    </div>
  )
}

// Enhanced SidebarLink with better hover effects and animations
const SidebarLink = ({ icon: Icon, text, href, subText, style, delay = 0, isAdminLink = false, className = '', disabled = false, onClick, variant }) => {
  const location = useLocation();
  // Exact match, except the single "Admin" link: it gets a startsWith
  // special case so old bookmarked sub-paths (redirected to /dashboard/admin)
  // still light it up during the redirect.
  const isActive = location.pathname === href ||
                   (href === '/dashboard' && location.pathname === '/dashboard/') ||
                   (isAdminLink && location.pathname.startsWith('/dashboard/admin'));

  const handleClick = (e) => {
    if (disabled || href === '#') {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onClick) {
      onClick(e);
    }
  };

  const isModule = variant === 'module';
  const paddingClass = isModule ? 'px-4' : 'px-[12px] py-[12px]';
  const activeShadow = isModule
    ? 'none'
    : '0 2px 12px rgba(250, 204, 21, 0.2), 0 0 0 1px rgba(250, 204, 21, 0.1)';
  const hoverShadow = isModule ? '0 2px 12px rgba(0, 0, 0, 0.06)' : '0 2px 8px rgba(0, 0, 0, 0.08)';

  return (
    <Link
      to={disabled || href === '#' ? '#' : href}
      onClick={handleClick}
      className={`
        group flex items-center ${paddingClass} transition-all duration-300 ease-out no-underline
        ${isModule ? 'rounded-xl hover:translate-x-0.5' : 'rounded-2xl transform hover:scale-[1.01] hover:translate-x-1'}
        ${disabled ? 'cursor-not-allowed opacity-60' : ''}
        ${isActive && isModule ? 'module-item-active' : ''}
        ${isActive 
          ? isAdminLink 
            ? 'bg-gradient-to-r from-red-50 to-red-100 text-[#0d1a4b] font-medium' 
            : isModule
              ? 'bg-slate-50/90 text-[#0d1a4b] font-medium'
              : 'bg-gradient-to-r from-[#fffde7] to-[#facc15]/20 text-[#0d1a4b] font-medium'
          : 'bg-transparent text-[#0d1a4b]/80'
        }
        ${!disabled && !isModule ? 'hover:bg-gradient-to-r hover:from-[#fffde7] hover:to-yellow-50 hover:text-[#0d1a4b]' : ''}
        ${!disabled && isModule ? 'hover:bg-slate-100/80 hover:text-[#0d1a4b]' : ''}
        animate-fadeInUp
        ${className}
      `}
      style={{
        animationDelay: `${delay * 100}ms`,
        animationFillMode: 'both',
        boxShadow: isActive ? activeShadow : 'none',
        borderRadius: isModule ? '12px' : '16px',
        ...(isModule ? { paddingTop: '14px', paddingBottom: '14px' } : {}),
        ...(isModule && isActive ? { borderLeft: '3px solid #64748b' } : {}),
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.boxShadow = hoverShadow;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <span className="flex items-center flex-1 min-w-0">
        {Icon && (typeof Icon === 'function' ? (
          <Icon 
            className="w-[18px] h-[18px] mr-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" 
            style={{ 
              transform: 'scale(1)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ) : Icon)}
        <span className={`font-medium text-[15px] transition-colors duration-300 ${isModule ? 'tracking-tight' : ''}`} style={style}>{text}</span>
      </span>
      {subText && <span className="text-xs text-gray-500 transition-colors duration-300">{subText}</span>}
      {/* Active indicator */}
      {isActive && (
        <div 
          className="ml-auto flex-shrink-0 rounded-full" 
          style={{
            width: '6px',
            height: '6px',
            background: isAdminLink ? '#dc2626' : (isModule ? '#64748b' : '#0d1a4b'),
          }}
        />
      )}
    </Link>
  );
};

const ModuleCard = ({ title, description, progress, isActive, onClick, dependencies }) => (
  <div 
    className={`relative p-6 rounded-lg border-2 ${
      isActive ? 'border-[#0d1a4b] bg-white' : 'border-gray-200 bg-gray-50'
    } transition-all duration-200 cursor-pointer hover:shadow-lg`}
    onClick={onClick}
  >
    <h3 className="text-xl font-semibold text-[#0d1a4b] mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{description}</p>
    <div className="flex items-center justify-between">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-[#0d1a4b] h-2.5 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="ml-2 text-sm text-gray-600">{progress}%</span>
    </div>
    {dependencies && dependencies.length > 0 && (
      <div className="absolute -top-3 left-4 bg-yellow-100 px-2 py-1 rounded text-xs text-yellow-800">
        Requires: {dependencies.join(', ')}
      </div>
    )}
  </div>
)

const PathConnector = ({ isActive }) => (
  <div className="flex items-center justify-center h-12">
    <div className={`h-full w-0.5 ${isActive ? 'bg-[#0d1a4b]' : 'bg-gray-200'}`}></div>
  </div>
)

function DashboardContent() {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [isLoaded, setIsLoaded] = useState(false)

  // "Preview as Student" -- lets a real admin see the app as a regular
  // viewer would (admin nav hidden, week locks enforced) without actually
  // losing admin rights. Plain component state, not persisted to
  // localStorage: a page reload always starts back in normal Admin view,
  // so refreshing mid-preview can't be mistaken for losing admin access.
  // See docs/superpowers/specs/2026-08-11-admin-consolidation-and-preview-mode-design.md.
  const [previewAsStudent, setPreviewAsStudent] = useState(false)
  const effectiveIsAdmin = isAdmin && !previewAsStudent

  // Clear OAuth progress flag when dashboard loads
  useEffect(() => {
    if (user) {
      localStorage.removeItem('oauthInProgress');
      console.log('Dashboard loaded, cleared OAuth progress flag');
    }
  }, [user]);

  console.log('=== DashboardContent Debug ===');
  console.log('User object:', user);
  console.log('User email:', user?.email);
  console.log('User ID:', user?.id);
  console.log('User created_at:', user?.created_at);
  console.log('Is admin?', isAdmin);
  console.log('Admin check from AuthContext:', isAdmin);
  console.log('=============================');

  return (
    <AssumptionsProvider isAdmin={effectiveIsAdmin} userEmail={user?.email}>
      <WeekAccessProvider user={user} isAdmin={effectiveIsAdmin}>
        <DashboardContentInner
          isAdmin={effectiveIsAdmin}
          isRealAdmin={isAdmin}
          previewAsStudent={previewAsStudent}
          onPreviewAsStudentChange={setPreviewAsStudent}
          user={user}
          signOut={signOut}
        />
      </WeekAccessProvider>
    </AssumptionsProvider>
  )
}

function DashboardContentInner({ isAdmin, isRealAdmin, previewAsStudent, onPreviewAsStudentChange, user, signOut }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoaded, setIsLoaded] = useState(false)
  const [sidebarFixed, setSidebarFixed] = useState(() => {
    try {
      return localStorage.getItem('univ154_sidebar_fixed') !== 'false'
    } catch {
      return true
    }
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('univ154_sidebar_fixed') === 'false'
    } catch {
      return false
    }
  })
  // Use week access context
  const { isWeekAccessible, getOrderedWeekIds } = useWeekAccess()

  const handleSidebarFixedChange = (fixed) => {
    setSidebarFixed(fixed)
    setSidebarCollapsed(!fixed)
    try {
      localStorage.setItem('univ154_sidebar_fixed', fixed ? 'true' : 'false')
    } catch (_) {}
  }
  
  console.log('DashboardContentInner: User:', user);
  console.log('DashboardContentInner: User email:', user?.email);
  console.log('DashboardContentInner: Is admin?', isAdmin);

  // Animation effect on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error during logout:', error)
      // Even if there's an error, navigate to login page
      navigate('/')
    }
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Turning preview on while sitting on an admin page would otherwise land
  // on that page's own "Access Denied" state -- send the admin to the
  // normal student landing route instead, since they clearly meant to look
  // around as a student, not to hit a wall. Turning it off doesn't force
  // navigation; admin nav and content just reappear in place.
  const handlePreviewAsStudentChange = (next) => {
    onPreviewAsStudentChange(next)
    if (next && location.pathname.startsWith('/dashboard/admin')) {
      navigate('/dashboard/excel/week-1')
    }
  }

  // Sidebar visibility is driven solely by the toggle button -- no hover-to-expand.
  const showSidebar = !sidebarCollapsed

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar - Minimalist Modern Design. Visibility is click-only (toggle
          button below), no hover-to-expand. */}
      <div className="fixed left-0 top-0 h-full z-20">
        <MinimalistSidebar
          sidebarCollapsed={!showSidebar}
          toggleSidebar={toggleSidebar}
          isLoaded={isLoaded}
          isAdmin={isAdmin}
          user={user}
          handleLogout={handleLogout}
          logo={logo}
          riceLogo={riceLogo}
          SidebarLink={SidebarLink}
          isWeekAccessible={isWeekAccessible}
          weekIds={getOrderedWeekIds()}
          MdChevronLeft={MdChevronLeft}
          MdChevronRight={MdChevronRight}
          FaUserShield={FaUserShield}
          MdBarChart={MdBarChart}
          FaFileExcel={FaFileExcel}
          MdMenuBook={MdFolderOpen}
          sidebarFixed={sidebarFixed}
          onSidebarFixedChange={handleSidebarFixedChange}
          isRealAdmin={isRealAdmin}
          previewAsStudent={previewAsStudent}
          onPreviewAsStudentChange={handlePreviewAsStudentChange}
        />
      </div>

      {/* Sidebar collapse/expand toggle button -- the only way to show/hide
          the sidebar. Follows the sidebar's right edge when open; when
          collapsed, sits fully on-screen at the left edge instead of being
          half-clipped off it. */}
      <button
        onClick={toggleSidebar}
        aria-label={showSidebar ? 'Collapse sidebar' : 'Expand sidebar'}
        title={showSidebar ? 'Collapse sidebar' : 'Expand sidebar'}
        className="fixed z-40 flex items-center justify-center"
        style={{
          top: '28px',
          left: showSidebar ? '320px' : '18px',
          transform: 'translateX(-50%)',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: '#ffffff',
          border: '1px solid rgba(13, 26, 75, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          color: '#0d1a4b',
          cursor: 'pointer',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {showSidebar ? <MdChevronLeft size={22} /> : <MdChevronRight size={22} />}
      </button>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto">
        {/* Top Bar - DISABLED */}
        {/* 
        <div className="bg-white border-b border-gray-100 px-8" style={{ height: '80px' }}>
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type to search..."
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-[300px] text-sm focus:outline-none focus:border-[#fdb913] focus:ring-1 focus:ring-[#fdb913]"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center px-2" style={{ gap: '20px' }}>
                <div className="mr-8 flex flex-col items-end">
                  <div className="mb-2">
                    {isEditingName ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const trimmedName = displayName.trim();
                          if (trimmedName) {
                            saveDisplayName();
                          } else {
                            setIsEditingName(false);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setIsEditingName(false);
                            }
                          }}
                          placeholder="Enter your name"
                          className="w-[200px] px-3 py-2 text-base border border-gray-200 rounded-lg
                          focus:border-[#fdb913] focus:ring-1 focus:ring-[#fdb913] focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={isSaving || !displayName.trim()}
                          className="text-base px-3 py-2 bg-white border border-gray-200 rounded-lg
                          hover:border-[#fdb913] text-[#0d1a4b]"
                        >
                          {isSaving ? '...' : '✓'}
                        </button>
                      </form>
                    ) : displayName ? (
                      <p 
                        onClick={() => setIsEditingName(true)}
                        className="text-[#0d1a4b] text-base font-medium text-right cursor-pointer hover:text-[#162456]"
                      >
                        {displayName}
                      </p>
                    ) : (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-[#0d1a4b] text-base font-medium hover:text-[#162456] text-right"
                      >
                        Click to add name
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {isAdmin ? 'Admin' : 'Student'}
                  </div>
                </div>

                <div className="relative group">
                  <div className="w-[50px] h-[50px] rounded-full bg-white overflow-hidden border-[2.7px] border-[#0d1a4b] p-0.5">
                    <Avatar 
                      url={avatarUrl}
                      name={displayName}
                      color={avatarColor}
                      size={50}
                    />
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white 
                    opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    {isUploadingAvatar ? (
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        */}

        {/* Main Content Area */}
        <div className="py-8 px-8 flex justify-center w-full">
          {/* Top Navigation Bar - DISABLED */}
          {/* 
          <div className="mb-8">
            <h1 className="text-[24px] font-semibold text-gray-900 mb-1">
              {location.pathname.includes('modules') ? 'Course Modules' 
                : location.pathname.includes('excel') ? 'Excel Workshop' 
                : location.pathname.includes('lectures') ? 'Lecture Notes' 
                : location.pathname.includes('budget') ? 'Budget Planner'
                : location.pathname.includes('charts') ? 'Analytics'
                : 'Dashboard'}
            </h1>
            <p className="text-gray-500 text-[14px]">
              {location.pathname.includes('modules') 
                ? 'Explore and complete your financial education modules'
                : location.pathname.includes('excel')
                ? 'Upload and analyze your Excel data'
                : location.pathname.includes('lectures')
                ? 'Access your lecture notes'
                : location.pathname.includes('budget')
                ? 'Plan and track your budget'
                : location.pathname.includes('charts')
                ? 'Analyze your financial data'
                : 'Welcome back to your financial journey!'}
            </p>
          </div>
          */}

          {/* Render nested routes */}
          <div className="w-full max-w-[1400px]">
            <BudgetProvider>
              <Outlet />
            </BudgetProvider>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DashboardContent />
  )
} 