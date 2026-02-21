import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Ziyaretçi hareketlerini takip eden ve kaydeden hook
 */
export const useVisitorTracker = () => {
    const location = useLocation();
    const initRef = useRef(false);

    useEffect(() => {
        const trackPageView = async () => {
            // Session ve Visitor ID yönetimi
            let sessionId = sessionStorage.getItem('session_id');
            if (!sessionId) {
                sessionId = uuidv4();
                sessionStorage.setItem('session_id', sessionId);
            }

            let visitorId = localStorage.getItem('visitor_id');
            if (!visitorId) {
                visitorId = uuidv4();
                localStorage.setItem('visitor_id', visitorId);
            }

            const logVisitorEvent = httpsCallable(functions, 'logVisitorEvent');

            try {
                await logVisitorEvent({
                    path: location.pathname + location.search,
                    action: 'view',
                    visitorId,
                    sessionId,
                    metadata: {
                        referrer: document.referrer,
                        title: document.title,
                        timestamp: new Date().toISOString(),
                        screen: `${window.screen.width}x${window.screen.height}`,
                        language: navigator.language,
                        platform: navigator.platform,
                        // @ts-ignore
                        connection: (navigator as any).connection ? (navigator as any).connection.effectiveType : 'unknown'
                    }
                });
            } catch (error) {
                // Sessizce hatayı yut (kullanıcı deneyimini etkilememeli)
                console.error('Visitor tracking error:', error);
            }
        };

        trackPageView();

    }, [location]); // Her lokasyon değişiminde çalışır
};
