import React from 'react';

/**
 * Custom event for admin profile updates.
 * Fired when the admin profile (name/email) is successfully updated.
 * The navbar listens to this event to update without page refresh.
 */
export class AdminProfileUpdatedEvent extends CustomEvent<{ name: string; email: string }> {
  constructor(detail: { name: string; email: string }) {
    super('admin-profile-updated', {
      detail,
      bubbles: true,
      cancelable: false,
    });
  }
}

/**
 * Hook to notify the navbar of admin profile changes.
 * After a successful update, emit an event that the navbar can listen to.
 */
export const useAdminProfileSync = () => {
  const notifyProfileUpdate = React.useCallback((name: string, email: string) => {
    // Dispatch custom event for navbar to listen to
    window.dispatchEvent(new AdminProfileUpdatedEvent({ name, email }));
    
    // Also update localStorage for persistence across page reloads
    localStorage.setItem('admin-profile-name', name);
    localStorage.setItem('admin-profile-email', email);
  }, []);

  return { notifyProfileUpdate };
};

/**
 * Hook for the navbar to listen to admin profile updates.
 * Returns the name and email from either the listener or localStorage fallback.
 */
export const useAdminProfileListener = () => {
  const [profile, setProfile] = React.useState<{ name: string; email: string } | null>(null);

  React.useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      if (event instanceof AdminProfileUpdatedEvent) {
        setProfile(event.detail);
      }
    };

    window.addEventListener('admin-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('admin-profile-updated', handleProfileUpdate);
  }, []);

  return profile;
};
