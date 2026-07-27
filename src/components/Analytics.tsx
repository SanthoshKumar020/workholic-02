import Script from "next/script";
import { GA_ID, PLAUSIBLE_DOMAIN } from "@/lib/analytics";

/**
 * Loads whichever analytics provider is configured via env vars.
 * Renders nothing (and ships no JS) when neither is set.
 *
 * Both scripts load with `afterInteractive`, so they never block first paint.
 */
export function Analytics() {
  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {PLAUSIBLE_DOMAIN && (
        <Script
          defer
          data-domain={PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.tagged-events.js"
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
