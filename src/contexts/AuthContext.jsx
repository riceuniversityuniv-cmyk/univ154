import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchMyAdminRole } from '../utils/adminApi'

const AuthContext = createContext({})

export function useAuth() {
  return useContext(AuthContext)
}

// Helper function to validate Rice, Gmail, and Yahoo email addresses
const isValidEmail = (email) => {
  return email.endsWith('@rice.edu') || email.endsWith('@alumni.rice.edu') || email.endsWith('@gmail.com') || email.endsWith('@yahoo.com');
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMasterAdmin, setIsMasterAdmin] = useState(false)

  // Looks up the caller's role in the `admins` table (DB-backed, replaces
  // the old hardcoded-array check). Async because it's a Supabase query.
  const checkAdminStatus = async (userEmail) => {
    if (!userEmail) {
      setIsAdmin(false)
      setIsMasterAdmin(false)
      return { isAdmin: false, isMasterAdmin: false }
    }

    const { isAdmin: adminStatus, isMasterAdmin: masterStatus } = await fetchMyAdminRole(userEmail)
    setIsAdmin(adminStatus)
    setIsMasterAdmin(masterStatus)
    console.log('Admin status checked for:', userEmail, 'isAdmin:', adminStatus, 'isMasterAdmin:', masterStatus)
    return { isAdmin: adminStatus, isMasterAdmin: masterStatus }
  }

  // Re-runs the admin check for the currently signed-in user. Used by the
  // Admin panel's "Manage Admins" tab after a self-affecting change (stepping down,
  // transferring master admin away from yourself) so this session reflects
  // it immediately instead of waiting for the next TOKEN_REFRESHED.
  const refreshAdminStatus = () => checkAdminStatus(user?.email)

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!error && session?.user) {
        setUser(session.user)
        await checkAdminStatus(session.user.email)
      }
      setLoading(false)
    }
    
    getSession()

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('=== Auth State Change Debug ===');
      console.log('Event:', event);
      console.log('Session:', session);
      console.log('Session user:', session?.user);
      console.log('Session user email:', session?.user?.email);
      console.log('Session user ID:', session?.user?.id);
      console.log('Session user created_at:', session?.user?.created_at);
      console.log('Session user updated_at:', session?.user?.updated_at);
      console.log('Session user email_confirmed_at:', session?.user?.email_confirmed_at);
      console.log('OAuth in progress flag:', localStorage.getItem('oauthInProgress'));
      console.log('================================');
      
      if (event === 'SIGNED_IN') {
        const user = session?.user
        
        console.log('=== User Signed In Debug ===');
        console.log('User object:', user);
        console.log('User email:', user?.email);
        console.log('User email type:', typeof user?.email);
        console.log('User email length:', user?.email?.length);
        console.log('User email trimmed:', user?.email?.trim());
        console.log('Full user object keys:', Object.keys(user || {}));
        console.log('================================');
        
        // Check if the email is from Rice University, Gmail, or Yahoo
        if (user && !isValidEmail(user.email)) {
          // Sign out the user if not a valid email
          await supabase.auth.signOut()
          console.error('Invalid email attempted to sign in:', user.email)
          // Don't throw error here as it might cause issues with the auth flow
          setUser(null)
          setIsAdmin(false)
          setIsMasterAdmin(false)
          return
        }

        console.log('Setting user in AuthContext:', user);
        setUser(user)

        // Check admin status immediately
        await checkAdminStatus(user?.email)

        // Clear the OAuth in progress flag
        localStorage.removeItem('oauthInProgress');

        // Simple retry after delay to ensure admin status is detected
        setTimeout(() => {
          console.log('Retrying admin check after delay for:', user?.email);
          checkAdminStatus(user?.email);
        }, 3000);  // Increased from 2000 to 3000ms

        // No manual redirect here: App.jsx's PublicOnlyRoute (wrapping "/" and
        // "/signup") reactively navigates to /dashboard the instant `user` is
        // set below, client-side via React Router -- no flash of the Login
        // page and no full-page reload like the old window.location.href did.
        
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null)
        setIsAdmin(false)
        setIsMasterAdmin(false)
        // Clear OAuth progress flag on sign out
        localStorage.removeItem('oauthInProgress');
        // Don't clear remember me data on sign out
        // This allows the user to stay logged in if they chose "Remember me"
        // Only clear if it's a manual sign out (not session expiry)
      } else if (event === 'TOKEN_REFRESHED') {
        // Update user data when token is refreshed
        if (session?.user) {
          console.log('Token refreshed, updating user:', session.user);
          setUser(session.user)
          // Bug fix: this used to pass the whole session.user object instead
          // of session.user.email like every other call site.
          await checkAdminStatus(session.user.email)
        }
      } else if (event === 'TOKEN_REFRESHED_FAILED') {
        // If token refresh fails, clear remember me data
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('savedEmail')
        setUser(null)
        setIsAdmin(false)
        setIsMasterAdmin(false)
        localStorage.removeItem('oauthInProgress');
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password) => {
    try {
      console.log('AuthContext signUp called with:', { email, password: '***' })
      
      if (!isValidEmail(email)) {
        throw new Error('Please use your Rice University email address (@rice.edu or @alumni.rice.edu), Gmail address (@gmail.com), or Yahoo address (@yahoo.com)')
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('Supabase signUp response:', { data, error })
      console.log('User data details:', {
        user: data?.user,
        email_confirmed_at: data?.user?.email_confirmed_at,
        created_at: data?.user?.created_at,
        updated_at: data?.user?.updated_at
      })

      if (error) {
        console.log('Supabase signUp error details:', error)
        // Check for specific Supabase errors
        if (error.message && (
          error.message.includes('already registered') ||
          error.message.includes('User already registered') ||
          error.message.includes('already exists') ||
          error.message.includes('email address is already registered')
        )) {
          throw new Error('An account with this email already exists. Please sign in instead.')
        }
        throw error
      }

      // If signup was successful, return the data
      // Don't check email_confirmed_at as it may be null for new users
      // Supabase will return an error if the user already exists
      if (!data?.user) {
        throw new Error('Failed to create account. Please try again.')
      }

      return { data, error: null }
    } catch (error) {
      console.error('AuthContext signUp error:', error)
      return { data: null, error }
    }
  }

  const signIn = async (email, password, rememberMe = false) => {
    try {
      if (!isValidEmail(email)) {
        throw new Error('Please use your Rice University email address (@rice.edu or @alumni.rice.edu), Gmail address (@gmail.com), or Yahoo address (@yahoo.com)')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // If rememberMe is true, set a longer session duration
          // If false, use default session duration
          persistSession: true, // Always persist session
        }
      })

      if (error) throw error

      // If rememberMe is false, we could set a shorter session duration
      // But Supabase handles this automatically based on user activity
      if (!rememberMe) {
        // For non-remember me, we could implement additional logic
        // like setting a shorter session timeout, but Supabase handles this well
        console.log('User chose not to remember login')
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google OAuth sign in...');
      
      // Check if OAuth is already in progress
      if (localStorage.getItem('oauthInProgress') === 'true') {
        console.log('OAuth already in progress, clearing previous state...');
        localStorage.removeItem('oauthInProgress');
        // Wait a moment for any pending operations to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Set a flag to indicate OAuth is in progress
      localStorage.setItem('oauthInProgress', 'true');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            // Removed hosted_domain and hd restrictions to allow Gmail accounts
            // hosted_domain: 'rice.edu', // Restrict to rice.edu domain only
            // hd: 'rice.edu', // Additional hosted domain parameter
          },
          redirectTo: `${window.location.origin}/`,  // Redirect to root page instead of /dashboard
          // Add additional options for better OAuth handling
          skipBrowserRedirect: false,
        },
      })

      if (error) {
        console.error('Google OAuth error:', error);
        localStorage.removeItem('oauthInProgress');
        throw error;
      }
      
      console.log('Google OAuth initiated successfully:', data);
      
      // Don't immediately return - let the OAuth redirect handle the flow
      // The redirect will trigger the auth state change listener
      return { data, error: null }
    } catch (error) {
      console.error('Google sign in error:', error)
      localStorage.removeItem('oauthInProgress');
      return { data: null, error }
    }
  }

  const resetPassword = async (email) => {
    try {
      if (!isValidEmail(email)) {
        throw new Error('Please use your Rice University email address (@rice.edu or @alumni.rice.edu), Gmail address (@gmail.com), or Yahoo address (@yahoo.com)')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Only clear remember me data if user explicitly wants to forget
      // This allows the "Remember me" feature to work properly
      // User can manually clear this by unchecking the checkbox
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    signOut,
    isAdmin,
    isMasterAdmin,
    refreshAdminStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 