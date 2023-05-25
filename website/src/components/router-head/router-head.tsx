import { component$ } from "@builder.io/qwik";
import { useDocumentHead, useLocation } from "@builder.io/qwik-city";

/**
 * The RouterHead component is placed inside of the document `<head>` element.
 */
export const RouterHead = component$(() => {
    const head = useDocumentHead();
    const loc = useLocation();

    return (
        <>
            <title>{head.title}</title>
            <meta property="og:site_name" content="heav-faxer" />
            <meta name="twitter:title" content="heav-faxer" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
            />

            {head.meta.map(m => (
                <meta {...m} />
            ))}

            {head.links.map(l => (
                <link {...l} />
            ))}

            {head.styles.map(s => (
                <style {...s.props} dangerouslySetInnerHTML={s.style} />
            ))}
        </>
    );
});
