import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const DeepLinkHandler = () => {
  const navigate = useNavigate();

  const handleUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      const path = url.pathname;
      const hash = url.hash;

      if (path === '/reset-password' || path.includes('/reset-password')) {
        // Forward hash params (access_token, refresh_token, type=recovery)
        navigate(`/reset-password${hash}`, { replace: true });
      } else if (path === '/auth/callback' || path.includes('/auth/callback')) {
        navigate(`/auth/callback${hash}`, { replace: true });
      }
    } catch (e) {
      console.error('DeepLinkHandler: failed to parse URL', e);
    }
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Handle cold start — app opened from a link when not running
    App.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleUrl(result.url);
      }
    });

    // Handle warm start — app already running, link opened
    const listener = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      if (event.url) {
        handleUrl(event.url);
      }
    });

    return () => {
      listener.then(h => h.remove());
    };
  }, [navigate]);

  return null;
};

export default DeepLinkHandler;
