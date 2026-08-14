import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/logo with name for univ154.png'
import riceLogo from '../assets/rice-logo.png'

export default function Login() {
  const [rememberMe, setRememberMe] = useState(() => {
    // Check if user previously chose to remember login
    return localStorage.getItem('rememberMe') === 'true'
  })
  const [email, setEmail] = useState(() => {
    // Pre-fill email if user chose to remember
    const shouldRemember = localStorage.getItem('rememberMe') === 'true'
    const savedEmail = localStorage.getItem('savedEmail')
    return shouldRemember && savedEmail ? savedEmail : ''
  })
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const { signIn, signInWithGoogle, resetPassword } = useAuth()

  // Check for OAuth in progress on component mount
  useEffect(() => {
    const oauthInProgress = localStorage.getItem('oauthInProgress')
    if (oauthInProgress === 'true') {
      // Automatically clear OAuth state after a short delay
      const timeout = setTimeout(() => {
        localStorage.removeItem('oauthInProgress')
        setGoogleLoading(false)
        // Don't show any message to avoid confusing students
      }, 2000) // Reduced from 30 seconds to 2 seconds
      
      return () => clearTimeout(timeout)
    }
  }, [])

  const validateEmail = (email) => {
    const validEmailRegex = /@(rice\.edu|alumni\.rice\.edu|gmail\.com|yahoo\.com)$/
    return validEmailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Proceed directly with login - Supabase will handle authentication
      const { error: signInError } = await signIn(email, password, rememberMe)
      
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Incorrect email or password. Please try again.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.')
        } else {
          setError(signInError.message)
        }
      } else {
        // Save remember me preference and email if checked
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('savedEmail', email)
        } else {
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('savedEmail')
        }
        
        navigate('/dashboard')
      }
    } catch (error) {
      setError('Failed to log in. Please try again.')
    }

    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    try {
      setError('')
      setMessage('')
      setGoogleLoading(true)
      
      const { error } = await signInWithGoogle()
      
      if (error) {
        console.error('Google sign in error:', error)
        if (error.message.includes('Rice University email address')) {
          setError('Please use your Rice University email address (@rice.edu)')
        } else if (error.message.includes('hosted_domain')) {
          setError('Please use your Rice University email address (@rice.edu) for Google sign-in')
        } else {
          setError(error.message || 'Failed to sign in with Google')
        }
        setGoogleLoading(false)
      } else {
        // Show a message that redirect is happening
        setMessage('Redirecting to Google... Please complete the sign-in process.')
        // Don't set googleLoading to false here as the redirect will happen
      }
      // The OAuth redirect will handle navigation to dashboard
    } catch (error) {
      console.error('Google sign in error:', error)
      setError('Failed to sign in with Google. Please ensure you use your Rice email.')
      setGoogleLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address')
      return
    }

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setError(error.message)
      } else {
        setMessage('Password reset instructions have been sent to your email.')
        setError('')
      }
    } catch (error) {
      setError('Failed to send reset instructions. Please try again.')
    }
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (error && validateEmail(e.target.value)) {
      setError('')
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col items-center justify-center p-4 relative">
      {/* Success Message - Fixed on Right Side - Same format as Week 1 budget warning */}
      {message && (message.includes('inbox') || message.includes('Password reset instructions')) && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '32px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(2px)',
          border: '1px solid #bfdbfe',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          borderRadius: '14px',
          padding: '12px 20px',
          color: '#0d1a4b',
          fontWeight: 500,
          fontSize: 12
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
          {message} Please check your inbox and spam folder.
        </div>
      )}
      
      <div className="w-full max-w-[560px] space-y-6 bg-white p-8 rounded-2xl shadow-lg px-6">
        {/* Logo and Title Section - Minimalist Gradient Card */}
        <div className="flex flex-col items-center w-full">
          {/* Rice University Logo with fade-in */}
          <div 
            className="opacity-0 animate-[fadeIn_0.6s_ease-out_0.2s_forwards]"
            style={{
              animationFillMode: 'forwards'
            }}
          >
            <img 
              src={riceLogo} 
              alt="Rice University Logo" 
              style={{ height: '100px', width: 'auto', marginBottom: '32px' }}
              className="object-contain drop-shadow-sm"
            />
          </div>
          
          {/* Main Logo Card with Gradient Background */}
          <div 
            className="w-full rounded-2xl bg-gradient-to-br from-[#fffde7] via-yellow-50 to-white
            shadow-lg overflow-hidden
            opacity-0 animate-[fadeIn_0.8s_ease-out_0.4s_forwards] transform"
            style={{
              animationFillMode: 'forwards',
              boxShadow: '0 10px 25px -5px rgba(253, 230, 19, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.07)',
              padding: '20px 60px',
              border: '1px solid rgba(242, 250, 3, 0.08)'
            }}
          >
            {/* UNIV154 Logo */}
            <div className="flex justify-center mb-6" style={{ padding: '0 20px' }}>
              <img 
                src={logo} 
                alt="UNIV154 Logo" 
                style={{ height: '145px', width: 'auto' }} 
                className="object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
              />
            </div>
            
            {/* Course Title Section */}
            <div className="text-center w-full">
              <h1 
                className="font-bold tracking-wide text-[#0d1a4b] mb-2"
                style={{ 
                  fontSize: '26px',
                  letterSpacing: '-0.02em',
                  textShadow: '0 1px 2px rgba(13, 26, 75, 0.1)'
                }}
              >
                Financial Literacy for Life
              </h1>
              <p 
                className="text-sm tracking-wide text-[#0d1a4b]/70"
                style={{ 
                  fontSize: '17px',
                  letterSpacing: '0.01em'
                }}
              >
                Preparing for the Real World
              </p>
            </div>
          </div>
        </div>
        
        {/* CSS Animation for fade-in */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Spacer */}
        <div style={{ height: '1px' }}></div>
        
        {/* Welcome Text */}
        <div className="text-center space-y-2" style={{ marginTop: '30px', marginBottom: '25px' }}>
          <h2 className="text-lg font-semibold text-[#0d1a4b]" style={{ fontSize: '18px' }}>Please sign in to your account</h2>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 text-red-600 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm mb-5" style={{ fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Email Input */}
          <div style={{ marginBottom: '10px', width: '100%' }}>
            {email && !validateEmail(email) && (
              <p className="text-red-500" style={{ fontSize: '14px', marginBottom: '10px' }}>
                ⚠️ Please use your Rice University email address (@rice.edu or @alumni.rice.edu), Gmail address (@gmail.com), or Yahoo address (@yahoo.com)
              </p>
            )}
            <label className="block font-semibold text-[#0d1a4b] mb-2" style={{ fontSize: '14px' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={handleEmailChange}
              placeholder="username@rice.edu, @gmail.com, or @yahoo.com"
              pattern=".*@(rice\.edu|alumni\.rice\.edu|gmail\.com|yahoo\.com)$"
              title="Please use your Rice University email address (@rice.edu or @alumni.rice.edu), Gmail address (@gmail.com), or Yahoo address (@yahoo.com)"
              style={{ height: '42px', fontSize: '14px', borderRadius: '10px', width: '100%', boxSizing: 'border-box', border: '2px solid #d1d5db' }}
              className="px-4 text-[#0d1a4b] bg-white
              placeholder-gray-400 transition-all duration-200
              hover:border-[#fdb913] hover:shadow-sm focus:border-[#fdb913]
              focus:ring-2 focus:ring-[#fdb913] focus:ring-opacity-30 focus:outline-none focus:shadow-md"
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '15px', width: '100%' }}>
            <label className="block font-semibold text-[#0d1a4b] mb-2" style={{ fontSize: '14px' }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ height: '42px', fontSize: '14px', borderRadius: '10px', width: '100%', boxSizing: 'border-box', paddingRight: '50px', border: '2px solid #d1d5db' }}
                className="px-4 text-[#0d1a4b] bg-white
                placeholder-gray-400 transition-all duration-200
                hover:border-[#fdb913] hover:shadow-sm focus:border-[#fdb913]
                focus:ring-2 focus:ring-[#fdb913] focus:ring-opacity-30 focus:outline-none focus:shadow-md"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '13px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: '#0d1a4b',
                  fontWeight: '500',
                  zIndex: 10
                }}
                onMouseOver={(e) => e.target.style.color = '#162456'}
                onMouseOut={(e) => e.target.style.color = '#0d1a4b'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between" style={{ marginBottom: '0px', width: '99.9%' }}>
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  const checked = e.target.checked
                  setRememberMe(checked)
                  // If unchecked, clear saved data immediately
                  if (!checked) {
                    localStorage.removeItem('rememberMe')
                    localStorage.removeItem('savedEmail')
                  }
                }}
                className="h-4 w-4 border-gray-300 rounded text-[#0d1a4b] 
                focus:ring-2 focus:ring-[#fdb913] focus:ring-opacity-30 focus:border-[#fdb913]
                hover:border-[#fdb913] transition-all duration-200"
              />
              <label htmlFor="remember-me" className="ml-2 text-[#0d1a4b]" style={{ fontSize: '14px' }}>
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[#0d1a4b] bg-white
              hover:bg-gradient-to-r hover:from-[#fffde7] hover:to-yellow-50 hover:border-[#fdb913] 
              hover:shadow-sm focus:border-[#fdb913] transition-all duration-200 transform hover:scale-[1.02]
              focus:ring-2 focus:ring-[#fdb913] focus:ring-opacity-30 focus:outline-none"
              style={{ 
                fontSize: '14px', 
                borderRadius: '10px', 
                padding: '4px 10px',
                border: '1px solid #d1d5db',
                backgroundColor: 'transparent'
              }}
            >
              Forgot your password?
            </button>
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: '15px', marginBottom: '10px', width: '100%' }}>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 text-[#0d1a4b] bg-white
              hover:bg-gradient-to-r hover:from-[#fffde7] hover:to-yellow-50 hover:border-[#fdb913] 
              hover:shadow-md focus:border-[#fdb913] transition-all duration-200 transform hover:scale-[1.02]
              focus:ring-2 focus:ring-[#fdb913] focus:ring-opacity-30 focus:outline-none
              text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ height: '42px', fontSize: '14px', borderRadius: '10px', width: '100%', boxSizing: 'border-box', border: '2px solid #d1d5db' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Or continue with */}
          <div className="text-center space-y-4" style={{ width: '100%' }}>
            <p className="text-[#0d1a4b]" style={{ marginBottom: '10px', marginTop: '10px', fontSize: '14px' }}>or</p>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="px-4 py-2.5 text-[#0d1a4b] bg-white
              hover:bg-gradient-to-r hover:from-[#fffde7] hover:to-yellow-50 hover:border-[#fdb913] 
              hover:shadow-md focus:border-[#fdb913] transition-all duration-200 transform hover:scale-[1.02]
              focus:ring-2 focus:ring-[#fdb913] focus:ring-opacity-30 focus:outline-none
              text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              flex items-center justify-center gap-3"
              style={{ height: '42px', fontSize: '14px', borderRadius: '10px', width: '100%', boxSizing: 'border-box', border: '2px solid #d1d5db' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16" style={{ marginRight: '6px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
            </button>
          </div>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-8">
          <p className="text-[#0d1a4b]" style={{ fontSize: '14px' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#0d1a4b] hover:text-[#162456]" style={{ fontSize: '14px' }}>
              Sign up
            </Link>
          </p>
        </div>


      </div>
    </div>
  )
}
