import { component$ } from "@builder.io/qwik";
import {
    QwikCityProvider,
    RouterOutlet,
    ServiceWorkerRegister,
} from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";

export default component$(() => {
    /**
     * The root of a QwikCity site always start with the <QwikCity> component,
     * immediately followed by the document's <head> and <body>.
     *
     * Dont remove the `<head>` and `<body>` elements.
     */
    return (
        <QwikCityProvider>
            <head>
                <meta charSet="utf-8" />
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
