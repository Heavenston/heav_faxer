import {
    $,
    component$,
    useStylesScoped$,
    useStore,
    NoSerialize,
    noSerialize,
    useTask$,
    Slot,
    QRL,
} from "@builder.io/qwik";
import styles from "./fax_machine.scss?inline";

import Display from "~/components/display/display";
import Button from "~/components/button/button";

export type Props = {
    send_function: QRL<() => Promise<string>>;

    on_reset?: QRL<() => void>;
};

type State = {
    cleanups: NoSerialize<(() => void)[]>;
    state:
        | {
              name: "input";
          }
        | {
              name: "sending";
          }
        | {
              name: "error";
              error_message: string;
          }
        | {
              name: "showing";
              shortened_url: string;
          };
};

export default component$<Props>(props => {
    useStylesScoped$(styles);

    const store = useStore<State>({
        state: { name: "input" },
        cleanups: noSerialize([]),
    });
    useTask$(({ cleanup }) =>
        cleanup(() => {
            store.cleanups?.forEach(c => c());
        })
    );

    const on_send = $(async () => {
        if (store.state.name !== "input" && store.state.name !== "error")
            return;
        store.state = { name: "sending" };
        try {
            const link = await props.send_function();
            store.state = { name: "showing", shortened_url: link };
        } catch (e) {
            if (typeof e === "string" || e instanceof Object) {
                store.state = {
                    name: "error",
                    error_message: e.toString(),
                };
            }
        }
    });

    const on_reset = $(async () => {
        if (store.state.name !== "showing")
            return;
        store.state = { name: "input" };
        props.on_reset?.();
    });

    let display_text: string = "ERROR";
    let eat_paper: boolean = false;
    let output_paper: boolean = false;
    if (store.state.name === "input") {
        display_text = "Please write a link on the paper";
    } else if (store.state.name === "error") {
        display_text = `Error, ${store.state.error_message}`;
    } else if (store.state.name === "sending") {
        display_text = "Contacting server";
        eat_paper = true;
    } else if (store.state.name === "showing") {
        display_text = "Have a nice day";
        eat_paper = true;
        output_paper = true;
    }

    const select_elem = $((e: MouseEvent) => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement)) return;
        t.select();
    });

    return (
        <div
            class={{
                machine: true,
                "eat-paper": eat_paper,
                "output-paper": output_paper,
            }}
        >
            <div class="paper input-paper">
                <Slot />
            </div>
            <div class="paper output-paper">
                <div>
                    <div>Your link is:</div>
                    <input
                        {...({ readonly: "" } as any)}
                        onClick$={select_elem}
                        value={
                            store.state.name === "showing" &&
                            store.state.shortened_url
                        }
                    />
                </div>
            </div>
            <Display
                text={display_text.toUpperCase()}
                state={
                    store.state.name === "error"
                        ? "error"
                        : store.state.name === "showing"
                        ? "success"
                        : "normal"
                }
            />
            <div class="lower-part">
                <Button
                    class="send-button"
                    onClick$={on_send}
                    disabled={
                        store.state.name != "input" &&
                        store.state.name != "error"
                    }
                >
                    Send
                    <span>Compress Link</span>
                </Button>
                <Button
                    class="send-button"
                    onClick$={on_reset}
                    disabled={store.state.name != "showing"}
                >
                    Reset
                    <span>New link</span>
                </Button>
            </div>
        </div>
    );
});
