import {
    $,
    component$,
    useStylesScoped$,
    useStore,
    NoSerialize,
    noSerialize,
    useTask$,
} from "@builder.io/qwik";
import styles from "./fax_machine.scss?inline";

import Display from "~/components/display/display";
import Button from "~/components/button/button";
import { useLocation } from "@builder.io/qwik-city";

import * as api from "~/api";

export const num_pad_data: [number | string, string?][] = [
    [1],
    [2, "ABC"],
    [3, "DEF"],
    [4],
    [5, "ABC"],
    [6, "DEF"],
    [7],
    [8, "ABC"],
    [9, "DEF"],
    ["A"],
    [0],
    ["B"],
];

interface State {
    state: "input" | "sending" | "showing";
    redirect_url: string;
    cleanups: NoSerialize<(() => void)[]>;
}

export default component$(() => {
    useStylesScoped$(styles);
    const loc = useLocation();

    const state = useStore<State>({
        state: "input",
        redirect_url: "",
        cleanups: noSerialize([]),
    });
    useTask$(({cleanup}) => cleanup(() => {
        state.cleanups?.forEach(c => c());
    }));

    const on_send = $(async () => {
        if (state.state !== "input") return;
        if (state.cleanups == undefined) state.cleanups = noSerialize([]);
        state.state = "sending";

        const shrtn_lnk = api.create_random_link();
        const controller = new AbortController();
        state.cleanups?.push(() => controller.abort());
        const res = await api.upload_link(
            shrtn_lnk,
            loc.params["link"],
            controller.signal
        );

        if (res.success) {
            state.redirect_url = res.shortened_to;
            state.state = "showing";
        } else {
            state.state = "input";
        }
    });

    let display_text: string = "ERROR";
    let eat_paper: boolean = false;
    let output_paper: boolean = false;
    if (state.state === "input") {
        display_text = "Please press send";
    } else if (state.state === "sending") {
        display_text = "Contacting server";
        eat_paper = true;
    } else if (state.state === "showing") {
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
            class={`machine ${eat_paper && "eat-paper"} ${
                output_paper && "output-paper"
            }`}
        >
            <div class="paper input-paper">
                <div>{loc.params["link"]}</div>
            </div>
            <div class="paper output-paper">
                <div>
                    <div>Your shortened link is:</div>
                    <input
                        {...({ readonly: "" } as any)}
                        onClick$={select_elem}
                        value={state.redirect_url}
                    />
                </div>
            </div>
            <Display text={display_text.toUpperCase()} />
            <div class="lower_part">
                <div class="keyboard">
                    {num_pad_data.map(([n, a], i) => (
                        <Button key={i}>
                            {n} {a && <span>{a}</span>}
                        </Button>
                    ))}
                </div>
                <div>
                    <Button class="send-button">Print</Button>
                    <Button class="send-button" onClick$={on_send}>
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
});
