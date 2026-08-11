// OPTION 3: MINIMALIST MODERN SIDEBAR
// Clean, minimal tasarım ile perfect spacing

import { useState } from 'react';

export const MinimalistSidebar = ({ 
  sidebarCollapsed, 
  toggleSidebar, 
  isLoaded, 
  isAdmin, 
  user, 
  handleLogout,
  logo,
  riceLogo,
  SidebarLink,
  isWeekAccessible,
  MdChevronLeft,
  MdChevronRight,
  FaUserShield,
  MdBarChart,
  FaFileExcel,
  MdMenuBook,
  sidebarFixed = true,
  onSidebarFixedChange,
  isRealAdmin = false,
  previewAsStudent = false,
  onPreviewAsStudentChange,
}) => {
  const [showHideSidebarTooltip, setShowHideSidebarTooltip] = useState(false);

  return (
    <div 
      className="sidebar-modern"
      style={{
        width: '280px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
        transform: sidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        borderRadius: '0 16px 16px 0',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Logo Section - Clean & Minimal */}
      <div 
        className="flex flex-col items-center w-full px-6"
        style={{
          paddingTop: '24px',
          paddingBottom: '32px', // Admin Panel'den uzaklaştırmak için
          opacity: sidebarCollapsed ? 0 : (isLoaded ? 1 : 0),
          transform: sidebarCollapsed ? 'translateY(-8px)' : (isLoaded ? 'translateY(0)' : 'translateY(-8px)'),
          transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
          pointerEvents: sidebarCollapsed ? 'none' : 'auto',
        }}
      >
        <div 
          className="flex flex-col items-center px-4 w-full"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.03)',
          }}
        >
          <img 
            src={logo} 
            alt="UNIV154 Logo" 
            style={{ 
              height: '70px', 
              width: 'auto',
              filter: 'drop-shadow(0 2px 8px rgba(13, 26, 75, 0.1))',
            }}
            className={`object-contain transition-all duration-700 ${isLoaded ? 'scale-100' : 'scale-75'}`}
          />
          <div className="text-center w-full flex flex-col items-center" style={{ marginTop: '8px', gap: '0px' }}>
            <h1 className="font-semibold tracking-tight text-[#0d1a4b] text-center" style={{ fontSize: '15px' }}>
              Financial Literacy for Life
            </h1>
            <p className="tracking-wide text-gray-500 text-center" style={{ fontSize: '13px', marginTop: '2px' }}>
              Preparing for the Real World
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-1 px-4">
        {/* Admin Section */}
        {isAdmin && (
          <div 
            style={{
              marginTop: '0px', // Preparing yazısından uzaklaştırmak için
              marginBottom: '40px', // Module 1'den uzaklaştırmak için
              paddingTop: '0px',
              paddingBottom: '0px',
              opacity: sidebarCollapsed ? 0 : (isLoaded ? 1 : 0),
              transform: sidebarCollapsed ? 'translateY(4px)' : (isLoaded ? 'translateY(0)' : 'translateY(4px)'),
              transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
              pointerEvents: sidebarCollapsed ? 'none' : 'auto',
            }}
          >
            <div className="flex flex-col gap-1 items-center">
              <SidebarLink
                href="/dashboard/admin"
                delay={0}
                icon={
                  <span
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '100px',
                      background: 'linear-gradient(145deg, rgba(220, 38, 38, 0.15) 0%, rgba(13, 26, 75, 0.08) 100%)',
                      boxShadow: '0 1px 4px rgba(220, 38, 38, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                      marginRight: '8px',
                    }}
                  >
                    <FaUserShield style={{ color: '#0d1a4b' }} className="w-[14px] h-[14px]" />
                  </span>
                }
                text="Admin"
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#0d1a4b',
                  textAlign: 'center',
                }}
                className="justify-center text-center w-full"
                isAdminLink={true}
              />
            </div>
          </div>
        )}

        {/* Modules Section */}
        <div 
          style={{
            marginTop: '0px',
            marginBottom: '0px',
            paddingTop: '0px',
            paddingBottom: '0px',
            opacity: sidebarCollapsed ? 0 : (isLoaded ? 1 : 0),
            transform: sidebarCollapsed ? 'translateY(4px)' : (isLoaded ? 'translateY(0)' : 'translateY(4px)'),
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            pointerEvents: sidebarCollapsed ? 'none' : 'auto',
          }}
        >
          <div className="flex flex-col gap-5">
            {(() => {
              const topicLabels = [
                'Budgeting',
                'Savings & Emergency Funds',
                'Credit & Debt Management',
                'Income & Taxes',
                'Retirement Planning',
                'Markets & Investing',
                'Constructing The Goal',
                'Insurance',
                'Real Estate & Homeownership',
              ];
              const weekIds = ['week-1', 'week-2', 'week-3', 'week-4', 'week-6', 'week-9', 'week-12', 'week-7', 'week-5'];
              return weekIds.map((_, i) => {
              const weekId = weekIds[i];
              
              const isAccessible = isWeekAccessible(weekId);
              const topic = topicLabels[i];
              const weekLabel = `Module ${i+1} - ${topic}`;
              
              const moduleIconColor = isAccessible ? '#0d1a4b' : '#9ca3af';
              const ModuleIcon = (
                <span 
                  className="flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '100px',
                    background: isAccessible
                      ? 'linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(13, 26, 75, 0.08) 100%)'
                      : 'linear-gradient(145deg, rgba(156, 163, 175, 0.2) 0%, rgba(156, 163, 175, 0.08) 100%)',
                    boxShadow: isAccessible
                      ? '0 1px 4px rgba(245, 158, 11, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)'
                      : '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <MdMenuBook
                    style={{ color: moduleIconColor }}
                    className="w-[14px] h-[14px]"
                  />
                </span>
              );
              
              const moduleTextBlock = (
                <>
                  <span style={{ color: '#94a3b8' }}>Module {i + 1} – </span>
                  <span style={{ color: moduleIconColor, fontWeight: '500' }}>{topic}</span>
                </>
              );
              const twoToneLabel = (
                <span className="flex items-center group/item min-w-0 flex-1">
                  {ModuleIcon}
                  <span
                    className="module-text-marquee-wrap flex-1 min-w-0"
                    style={{ fontSize: '13px', marginLeft: '5px' }}
                  >
                    <span className="module-text-marquee-inner">
                      {moduleTextBlock}
                      <span className="module-text-marquee-second">{moduleTextBlock}</span>
                    </span>
                  </span>
                </span>
              );
              
              if (!isAccessible && !isAdmin) {
                // Locked week'ler için de aynı format, sadece disabled
                return (
                  <SidebarLink
                    key={`excel-week-${i+1}`}
                    href="#"
                    delay={i}
                    isAdminLink={false}
                    disabled={true}
                    variant="module"
                    style={{
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                    className="rounded-2xl"
                    text={
                      <span className="flex items-center w-full gap-3">
                        {twoToneLabel}
                        <span className="ml-auto text-xs" style={{ color: '#9ca3af' }}>🔒</span>
                      </span>
                    }
                  />
                );
              }
              
              return (
                <SidebarLink
                  key={`excel-week-${i+1}`}
                  href={isAccessible ? `/dashboard/excel/${weekId}` : '#'}
                  delay={i}
                  isAdminLink={false}
                  variant="module"
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  className="rounded-2xl"
                  text={twoToneLabel}
                />
              );
            });
            })()}
          </div>
        </div>
      </nav>

      {/* User Profile - At bottom - Minimalist Style */}
      <div 
        className="mt-auto"
        style={{
          opacity: sidebarCollapsed ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: sidebarCollapsed ? 'none' : 'auto',
          paddingTop: '24px',
          paddingBottom: '20px',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="flex flex-col items-center w-full px-6">
            {onSidebarFixedChange && (
              <div
                className="relative w-full mb-4"
                onMouseEnter={() => setShowHideSidebarTooltip(true)}
                onMouseLeave={() => setShowHideSidebarTooltip(false)}
              >
                <label
                  className="flex items-center gap-2 w-full cursor-pointer select-none"
                  style={{ fontSize: '12px', color: '#64748b' }}
                >
                  <input
                    type="checkbox"
                    checked={!sidebarFixed}
                    onChange={(e) => onSidebarFixedChange(!e.target.checked)}
                    className="rounded border-slate-300 text-[#0d1a4b] focus:ring-[#0d1a4b]"
                  />
                  <span>Hide sidebar</span>
                </label>
                {showHideSidebarTooltip && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '0',
                      marginBottom: '8px',
                      zIndex: 10000,
                      background: '#0d1a4b',
                      color: 'white',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      maxWidth: '260px',
                      boxShadow: '0 4px 12px rgba(13, 26, 75, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      pointerEvents: 'none',
                      lineHeight: 1.4,
                    }}
                  >
                    When enabled, the sidebar starts closed. Click the arrow to open it.
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '20px',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #0d1a4b',
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {isRealAdmin && onPreviewAsStudentChange && (
              <div className="w-full mb-4">
                <label
                  className="flex items-center justify-between gap-2 w-full cursor-pointer select-none"
                  style={{ fontSize: '12px', color: previewAsStudent ? '#0d1a4b' : '#64748b' }}
                >
                  <span style={{ fontWeight: previewAsStudent ? '600' : '500' }}>Preview as Student</span>
                  <button
                    type="button"
                    onClick={() => onPreviewAsStudentChange(!previewAsStudent)}
                    role="switch"
                    aria-checked={previewAsStudent}
                    aria-label="Preview as Student"
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '34px',
                      height: '18px',
                      borderRadius: '999px',
                      background: previewAsStudent ? '#0d1a4b' : '#d1d5db',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'background 0.2s ease-in-out',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: previewAsStudent ? '18px' : '2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        transition: 'left 0.2s ease-in-out',
                      }}
                    />
                  </button>
                </label>
              </div>
            )}
            <img
              src={riceLogo}
              alt="Rice University Logo" 
              style={{ 
                height: '70px', 
                width: 'auto', 
                marginBottom: '20px',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05))',
              }}
              className="object-contain"
            />
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '16px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(13, 26, 75, 0.8)',
                fontWeight: '500',
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #fffde7, #fef9c3)';
                e.currentTarget.style.color = '#0d1a4b';
                e.currentTarget.style.fontWeight = '500';
                e.currentTarget.style.transform = 'scale(1.01) translateX(4px)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(250, 204, 21, 0.2), 0 0 0 1px rgba(250, 204, 21, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(13, 26, 75, 0.8)';
                e.currentTarget.style.fontWeight = '500';
                e.currentTarget.style.transform = 'scale(1) translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Logout
            </button>
          </div>
      </div>
    </div>
  );
};
