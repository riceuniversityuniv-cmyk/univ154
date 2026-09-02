import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const WeekAccessContext = createContext();
export const SUPPORTED_WEEK_IDS = ['week-0', 'week-1', 'week-2', 'week-3', 'week-4', 'week-5', 'week-6', 'week-7', 'week-9', 'week-12'];

// Fallback topic name shown for a week until an admin overrides it via the
// Week Access admin table (persisted as display_topic_label -- see
// globalWeekSettings[weekId].topicLabel). Used by both the Week Access
// admin table and the student-facing sidebar (Option3_Minimalist.jsx).
export const WEEK_TOPIC_LABELS = {
  'week-0': 'Course Introduction',
  'week-1': 'Budgeting',
  'week-2': 'Savings & Emergency Funds',
  'week-3': 'Credit & Debt Management',
  'week-4': 'Income & Taxes',
  'week-5': 'Real Estate & Homeownership',
  'week-6': 'Retirement Planning',
  'week-7': 'Insurance',
  'week-9': 'Markets & Investing',
  'week-12': 'Constructing The Goal',
};

// Default sidebar module order (position, 1-indexed) -- matches the order
// the sidebar rendered in before this became admin-editable. Used as a
// fallback until an admin sets display_order in the DB (see migration
// 20260813000000_add_display_order_to_global_week_settings.sql).
const DEFAULT_ORDER = {
  'week-0': 1,
  'week-1': 2,
  'week-2': 3,
  'week-3': 4,
  'week-4': 5,
  'week-6': 6,
  'week-9': 7,
  'week-12': 8,
  'week-7': 9,
  'week-5': 10,
};

const createDefaultWeekSettings = () => {
  const defaults = {};
  SUPPORTED_WEEK_IDS.forEach((weekId) => {
    defaults[weekId] = {
      // week-0 (Course Introduction) is now the first thing a new student
      // sees -- it replaces week-1 as the sole default-unlocked module.
      isAvailable: weekId === 'week-0',
      releaseDate: null,
      order: DEFAULT_ORDER[weekId] ?? 99,
      topicLabel: WEEK_TOPIC_LABELS[weekId] || weekId
    };
  });
  return defaults;
};

export const useWeekAccess = () => {
  return useContext(WeekAccessContext);
};

export const WeekAccessProvider = ({ children, user, isAdmin }) => {
  const [globalWeekSettings, setGlobalWeekSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch global week settings data when user changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('=== WeekAccessContext useEffect Debug ===');
        console.log('User prop received:', user);
        console.log('User email:', user?.email);
        console.log('User email type:', typeof user?.email);
        console.log('User email length:', user?.email?.length);
        console.log('User email trimmed:', user?.email?.trim());
        console.log('Is admin prop received:', isAdmin);
        console.log('========================================');
        
        if (user) {
          // Fetch global week settings. display_order/display_topic_label may
          // not exist yet if their migrations haven't been applied to this DB
          // -- fall back progressively rather than leaving settings empty and
          // locking every week for every student.
          let { data: globalSettings, error: globalError } = await supabase
            .from('global_week_settings')
            .select('week_id, is_globally_available, release_date, display_order, display_topic_label');

          if (globalError) {
            console.warn('display_topic_label column not available yet, falling back:', globalError.message);
            ({ data: globalSettings, error: globalError } = await supabase
              .from('global_week_settings')
              .select('week_id, is_globally_available, release_date, display_order'));
          }

          if (globalError) {
            console.warn('display_order column not available yet, falling back:', globalError.message);
            ({ data: globalSettings, error: globalError } = await supabase
              .from('global_week_settings')
              .select('week_id, is_globally_available, release_date'));
          }

          if (globalError) {
            console.error('Error fetching global week settings:', globalError);
          } else {
            const globalMap = createDefaultWeekSettings();
            if (globalSettings && globalSettings.length > 0) {
              globalSettings.forEach(item => {
                if (SUPPORTED_WEEK_IDS.includes(item.week_id)) {
                  globalMap[item.week_id] = {
                    isAvailable: item.is_globally_available,
                    releaseDate: item.release_date,
                    order: item.display_order ?? DEFAULT_ORDER[item.week_id] ?? 99,
                    topicLabel: item.display_topic_label || WEEK_TOPIC_LABELS[item.week_id] || item.week_id
                  };
                }
              });
            }
            setGlobalWeekSettings(globalMap);
          }
        } else {
          // Clear settings when no user
          console.log('WeekAccessContext: No user, clearing settings');
          setGlobalWeekSettings({});
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        setGlobalWeekSettings(createDefaultWeekSettings());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, isAdmin]);

  // Check if a specific week is accessible
  const isWeekAccessible = (weekId) => {
    if (!user) return false;
    if (isAdmin) return true;  // Use the prop instead of calling isUserAdmin
    return globalWeekSettings[weekId]?.isAvailable === true;
  };

  // Get all accessible weeks
  const getAccessibleWeeks = () => {
    if (!user) return [];
    if (isAdmin) {  // Use the prop instead of calling isUserAdmin
      return SUPPORTED_WEEK_IDS;
    }
    return Object.keys(globalWeekSettings).filter(weekId => 
      globalWeekSettings[weekId]?.isAvailable === true
    );
  };

  // Admin function to update global week settings
  const updateGlobalWeekSettings = async (weekId, isAvailable, releaseDate = null) => {
    if (!isAdmin) {
      throw new Error('Only admins can update global week settings');
    }

    try {
      const { error } = await supabase
        .from('global_week_settings')
        .upsert({
          week_id: weekId,
          is_globally_available: isAvailable,
          release_date: releaseDate,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'week_id'
        });

      if (error) throw error;

      // Update local state -- preserve order, only isAvailable/releaseDate changed
      setGlobalWeekSettings(prev => ({
        ...prev,
        [weekId]: {
          ...prev[weekId],
          isAvailable,
          releaseDate
        }
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating global week settings:', error);
      throw error;
    }
  };

  // Admin function to bulk update global week settings
  const bulkUpdateGlobalWeekSettings = async (updates) => {
    if (!isAdmin) {
      throw new Error('Only admins can update global week settings');
    }

    try {
      const rows = Object.entries(updates).map(([weekId, isAvailable]) => ({
        week_id: weekId,
        is_globally_available: isAvailable,
        release_date: globalWeekSettings[weekId]?.releaseDate ?? null,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('global_week_settings')
        .upsert(rows, {
          onConflict: 'week_id'
        });

      if (error) throw error;

      // Update local state -- preserve order, only isAvailable/releaseDate changed
      setGlobalWeekSettings(prev => {
        const newGlobalSettings = { ...prev };
        Object.entries(updates).forEach(([weekId, isAvailable]) => {
          newGlobalSettings[weekId] = {
            ...newGlobalSettings[weekId],
            isAvailable,
            releaseDate: newGlobalSettings[weekId]?.releaseDate || null
          };
        });
        return newGlobalSettings;
      });

      return { success: true };
    } catch (error) {
      console.error('Error bulk updating global week settings:', error);
      throw error;
    }
  };

  // Weeks in student-facing sidebar order (by admin-editable display_order,
  // falling back to DEFAULT_ORDER for weeks the DB hasn't seen yet).
  const getOrderedWeekIds = () => {
    return [...SUPPORTED_WEEK_IDS].sort((a, b) => {
      const orderA = globalWeekSettings[a]?.order ?? DEFAULT_ORDER[a] ?? 99;
      const orderB = globalWeekSettings[b]?.order ?? DEFAULT_ORDER[b] ?? 99;
      return orderA - orderB;
    });
  };

  // Admin function to reassign every week's sidebar position in one write
  // (used when moving one week to a new slot -- the whole list is
  // renumbered 1..n so there are never duplicate/gapped positions).
  const bulkUpdateWeekOrder = async (orderMap) => {
    if (!isAdmin) {
      throw new Error('Only admins can update global week settings');
    }

    try {
      const rows = Object.entries(orderMap).map(([weekId, order]) => ({
        week_id: weekId,
        is_globally_available: globalWeekSettings[weekId]?.isAvailable ?? false,
        release_date: globalWeekSettings[weekId]?.releaseDate ?? null,
        display_order: order,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('global_week_settings')
        .upsert(rows, { onConflict: 'week_id' });

      if (error) throw error;

      setGlobalWeekSettings(prev => {
        const next = { ...prev };
        Object.entries(orderMap).forEach(([weekId, order]) => {
          next[weekId] = { ...next[weekId], order };
        });
        return next;
      });

      return { success: true };
    } catch (error) {
      console.error('Error bulk updating week order:', error);
      throw error;
    }
  };

  // Admin function to rename a week's topic/module name (independent of
  // display_order, which controls sidebar position). Persisted as
  // display_topic_label; read by both the Week Access admin table and the
  // student-facing sidebar (Option3_Minimalist.jsx via Dashboard.jsx).
  const updateWeekTopic = async (weekId, topicLabel) => {
    if (!isAdmin) {
      throw new Error('Only admins can update global week settings');
    }

    try {
      const { error } = await supabase
        .from('global_week_settings')
        .upsert({
          week_id: weekId,
          is_globally_available: globalWeekSettings[weekId]?.isAvailable ?? false,
          release_date: globalWeekSettings[weekId]?.releaseDate ?? null,
          display_order: globalWeekSettings[weekId]?.order ?? DEFAULT_ORDER[weekId] ?? 99,
          display_topic_label: topicLabel,
          updated_at: new Date().toISOString()
        }, { onConflict: 'week_id' });

      if (error) throw error;

      setGlobalWeekSettings(prev => ({
        ...prev,
        [weekId]: { ...prev[weekId], topicLabel }
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating week topic:', error);
      throw error;
    }
  };

  const value = {
    globalWeekSettings,
    isLoading,
    isWeekAccessible,
    getAccessibleWeeks,
    getOrderedWeekIds,
    updateGlobalWeekSettings,
    bulkUpdateGlobalWeekSettings,
    bulkUpdateWeekOrder,
    updateWeekTopic,
    isAdmin: isAdmin  // Use the prop instead of calling isUserAdmin
  };

  return (
    <WeekAccessContext.Provider value={value}>
      {children}
    </WeekAccessContext.Provider>
  );
}; 