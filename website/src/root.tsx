import { component$ } from "@builder.io/qwik";
import {
    QwikCityProvider,
    RouterOutlet,
    ServiceWorkerRegister,
} from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";

export default component$(() => {
    return (
        <QwikCityProvider>
            <head>
                <meta charSet="utf-8" />
                <meta name="title" content="Heav Faxer - Link and file shortening" />
                <meta name="description" content="Create short versions of your links or upload files all for free." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://faxer.heav.fr" />
                <meta property="og:title" content="Heav Faxer - Link and file shortening" />
                <meta property="og:description" content="Create short versions of your links or upload files all for free." />

                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content="https://faxer.heav.fr" />
                <meta property="twitter:title" content="Heav Faxer - Link and file shortening" />
                <meta property="twitter:description" content="Create short versions of your links or upload files all for free." />

                <link rel="icon" type="image/png" href="/faxer_logo.png" />
                <RouterHead />
            </head>
            <body lang="en">
                <RouterOutlet />
                <ServiceWorkerRegister />
            </body>
        </QwikCityProvider>
    );
});
