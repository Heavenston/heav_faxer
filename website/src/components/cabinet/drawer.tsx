import {
    component$,
    useStylesScoped$,
    useStore,
    useTask$,
    useContext,
    createContextId,
    useContextProvider,
    QwikMouseEvent,
} from "@builder.io/qwik";
import styles from "./drawer.scss?inline";

import Paper from "./paper";

export const prevent_drawer_open_context = createContextId<{ index: number }>(
    "prevent_drawer_open_context"
);
export const prevent_drawer_close_context = createContextId<{ count: number }>(
    "prevent_drawer_close_context"
);

interface Props {
    index: number;
    label: string;
    click_cb?: (el: QwikMouseEvent) => void;
}

export default component$<Props>(({ index, label, click_cb }) => {
    useStylesScoped$(styles);

    const prevent_drawer_close = useStore({ count: 0 });
    useContextProvider(prevent_drawer_close_context, prevent_drawer_close);

    const prevent_drawer_open = useContext(prevent_drawer_open_context);
    useTask$(({ track }) => {
        const drc = track(() => prevent_drawer_close.count);
        const dro = track(() => prevent_drawer_open.index);
        if (dro === -1 && drc > 0) {
            prevent_drawer_open.index = index;
        } else if (prevent_drawer_open.index === index && drc == 0) {
            prevent_drawer_open.index = -1;
        }
    });

    const prevent_open =
        prevent_drawer_open.index !== -1 && prevent_drawer_open.index !== index;

    return (
        <button
            {...(click_cb ? { onClick$: click_cb } : {})}
            preventdefault:click
            class={`drawer ${
                prevent_drawer_close.count > 0 ? "prevent-close" : ""
            } ${prevent_open ? "prevent-open" : ""}`}
            tabIndex={index}
        >
            <div class="background">
                {Array(13)
                    .fill(null)
                    .map((_value, index) => (
                        <Paper key={index} />
                    ))}
            </div>
            <div class="foreground">
                <span>{label}</span>
            </div>
        </button>
    );
});
