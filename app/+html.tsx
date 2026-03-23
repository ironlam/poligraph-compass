import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  const umamiUrl = process.env.EXPO_PUBLIC_UMAMI_URL;
  const umamiSiteId = process.env.EXPO_PUBLIC_UMAMI_SITE_ID;

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        {umamiUrl && umamiSiteId && (
          <script
            defer
            src={`${umamiUrl}/script.js`}
            data-website-id={umamiSiteId}
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
