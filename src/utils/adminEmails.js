// Admin email addresses for the application
export const adminEmails = [
  'riceuniversityuniv@gmail.com'
];

// Helper function to check if a user is admin
export const isUserAdmin = (email) => {
  console.log('=== isUserAdmin Function Debug ===');
  console.log('Input email:', email);
  console.log('Email type:', typeof email);
  console.log('Email length:', email?.length);
  console.log('Email trimmed:', email?.trim());
  console.log('Email after trim length:', email?.trim()?.length);
  console.log('Admin emails list:', adminEmails);
  console.log('Admin emails type:', typeof adminEmails);
  console.log('Admin emails length:', adminEmails.length);

  if (!email) {
    console.log('Email is falsy, returning false');
    return false;
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    console.log('Email is empty after trim, returning false');
    return false;
  }

  const isAdmin = adminEmails.includes(trimmedEmail);
  console.log('Array.includes() result:', isAdmin);
  console.log('Final result:', isAdmin);
  console.log('================================');

  return isAdmin;
};
