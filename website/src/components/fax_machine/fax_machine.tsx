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
    useVisibleTask$,
    useComputed$,
} from "@builder.io/qwik";
import styles from "./fax_machine.scss?inline";

import Display from "~/components/display/display";
import Button from "~/components/button/button";

export type SendFunction =
    | (() => Promise<string>)
    | ((set_progress: (status: number, message?: string) => void) => Promise<string>);

export type Props = {
    show_input_paper?: boolean,
    allow_reset?: boolean,
    input_msg: string,
    send_function: QRL<SendFunction>;

    on_reset?: QRL<() => void>;
};

type State = {
    // Set to true at the first render
    started: boolean,
    cleanups: NoSerialize<(() => void)[]>;
    state:
        | {
              name: "input";
          }
        | {
              name: "sending";
              progress: number;
              show_progress: boolean;
              message?: string;
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
        started: false,
        state: { name: "input" },
        cleanups: noSerialize([]),
    });
    useTask$(({ cleanup }) =>
        cleanup(() => {
            store.cleanups?.forEach(c => c());
        })
    );

    useVisibleTask$(() => {
        store.started = true;
    });

    const can_reset = useComputed$(() => {
        if (store.state.name === "showing")
            return true;
        if (store.state.name !== "sending")
            return props.allow_reset ?? false;
        return false;
    });

    const on_send = $(async () => {
        if (store.state.name !== "input" && store.state.name !== "error")
            return;
        store.state = { name: "sending", progress: 1, show_progress: false };
        try {
            const link = await props.send_function((n, m) => {
                console.log(`Status = ${n}`);
                if (store.state.name === "sending") {
                    store.state.progress = n;
                    store.state.show_progress = true;
                    store.state.message = m;
                }
            });
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
        if (!can_reset.value)
            return;
        store.state = { name: "input" };
        props.on_reset?.();
    });

    let display_text: string = "ERROR";
    let output_paper: boolean = false;
    let eat_progress: number = 0;
    if (store.state.name === "input") {
        display_text = props.input_msg;
    } else if (store.state.name === "error") {
        display_text = `Error, ${store.state.error_message}`;
    } else if (store.state.name === "sending") {
        if (store.state.show_progress) {
            if (store.state.message === undefined) {
                let progress_text = (store.state.progress * 100).toFixed(1);
                while (progress_text.length < 5)
                    progress_text = "0" + progress_text;
                display_text = `Progress ${progress_text}%`;
            }
            else {
                display_text = store.state.message;
            }
        }
        else
            display_text = "Contacting server";
        eat_progress = store.state.progress;
    } else if (store.state.name === "showing") {
        display_text = "Have a nice day";
        eat_progress = 1;
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
                "show-input": store.started &&
                    ((eat_progress > 0) || (props.show_input_paper ?? true)),
                "output-paper": output_paper,
            }}
            style={{
                "--eat-progress": eat_progress,
                "--eat-is-finished": eat_progress === 1 ? 1 : 0,
            }}
        >
            <div class="input-paper-container">
                <Slot name="input-paper-container" />
                <div class="paper input-paper">
                    <Slot name="input-paper" />
                </div>
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
                    <span>Create Shortcut</span>
                </Button>
                <Button
                    class="send-button"
                    onClick$={on_reset}
                    disabled={!can_reset.value}
                >
                    Reset
                    <span>New Input</span>
                </Button>
            </div>
        </div>
    );
});
