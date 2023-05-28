import { component$ } from "@builder.io/qwik";
import { useDocumentHead } from "@builder.io/qwik-city";

/**
 * The RouterHead component is placed inside of the document `<head>` element.
 */
export const RouterHead = component$(() => {
    const head = useDocumentHead();

    return (
        <>
            <title>{head.title}</title>
            <meta property="og:site_name" content="heav-faxer" />
            <meta name="twitter:title" content="heav-faxer" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
            />

            {head.meta.map((m, i) => (
                <meta {...m} key={i} />
            ))}

            {head.links.map((l, i) => (
                <link {...l} key={i} />
            ))}

            {head.styles.map((s, i) => (
                <style {...s.props} dangerouslySetInnerHTML={s.style} key={i} />
            ))}
        </>
    );
});
