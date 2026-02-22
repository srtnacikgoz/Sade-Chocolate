/**
 * Browser'dan CAPI Cloud Function'ı çağıran wrapper
 * Pixel event'leriyle aynı eventId kullanılarak deduplication sağlanır.
 * CAPI hatası kullanıcıyı ETKİLEMEZ — sessizce loglanır.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { getMetaCookies } from './metaPixelService';
import { generateEventId } from '../utils/cookieConsent';

const sendCapiEventFn = httpsCallable(functions, 'sendMetaCapiEvent');

type CapiEventOptions = {
  eventName: string;
  eventId?: string;
  eventSourceUrl?: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  };
  customData?: Record<string, unknown>;
  testEventCode?: string;
};

export async function sendCapiFromBrowser(options: CapiEventOptions): Promise<string> {
  const eventId = options.eventId || generateEventId();
  const cookies = getMetaCookies();

  try {
    await sendCapiEventFn({
      eventName: options.eventName,
      eventId: eventId,
      eventSourceUrl: options.eventSourceUrl || window.location.href,
      userData: {
        ...options.userData,
        fbc: cookies.fbc,
        fbp: cookies.fbp,
      },
      customData: options.customData,
      testEventCode: options.testEventCode,
    });
  } catch (error: unknown) {
    // CAPI hatası kullanıcıyı etkilememeli — sessizce logla
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[CAPI Client] ${options.eventName} failed:`, errMsg);
  }

  return eventId;
}
