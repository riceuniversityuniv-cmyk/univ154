// Supabase calls for the `admins` roles table (master_admin / admin).
// Centralized here the same way WeekAccessContext.jsx centralizes
// global_week_settings calls -- AuthContext (self-check) and
// AdminSettingsPanel (roster + mutations) both go through this module
// instead of querying Supabase directly.
import { supabase } from '../lib/supabaseClient';

const normalize = (email) => email?.trim().toLowerCase() ?? '';

// Look up the caller's own role. Returns { isAdmin: false, isMasterAdmin: false }
// for anyone with no row in `admins` (including query errors, so a transient
// network hiccup fails closed rather than granting admin UI).
export const fetchMyAdminRole = async (email) => {
  const normalized = normalize(email);
  if (!normalized) {
    return { isAdmin: false, isMasterAdmin: false };
  }

  const { data, error } = await supabase
    .from('admins')
    .select('role')
    .eq('email', normalized)
    .maybeSingle();

  if (error) {
    console.error('Error fetching admin role:', error);
    return { isAdmin: false, isMasterAdmin: false };
  }

  if (!data) {
    return { isAdmin: false, isMasterAdmin: false };
  }

  return { isAdmin: true, isMasterAdmin: data.role === 'master_admin' };
};

// Full admin roster, for the Admin panel's "Manage Admins" tab. RLS only lets admins see
// this at all.
export const fetchAllAdmins = async () => {
  const { data, error } = await supabase
    .from('admins')
    .select('email, role, granted_by, created_at')
    .order('role', { ascending: false }) // master_admin sorts before admin
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
};

// All registered users, for the "grant admin to" / "transfer master to"
// pickers. RLS only lets admins see the full table.
export const fetchAllRegisteredUsers = async () => {
  const { data, error } = await supabase
    .from('registered_users')
    .select('email, created_at')
    .order('email', { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const addAdmin = async (email, grantedByEmail) => {
  const normalized = normalize(email);
  if (!normalized) {
    throw new Error('Email is required');
  }

  const { error } = await supabase
    .from('admins')
    .insert({
      email: normalized,
      role: 'admin',
      granted_by: normalize(grantedByEmail) || null,
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error(`${normalized} is already an admin`);
    }
    throw error;
  }
};

export const removeAdmin = async (email) => {
  const normalized = normalize(email);
  const { error } = await supabase.from('admins').delete().eq('email', normalized);
  if (error) throw error;
};

export const transferMasterAdmin = async (newMasterEmail) => {
  const normalized = normalize(newMasterEmail);
  const { error } = await supabase.rpc('transfer_master_admin', {
    new_master_email: normalized,
  });
  if (error) throw error;
};
