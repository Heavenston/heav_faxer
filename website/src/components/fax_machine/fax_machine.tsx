import { $, mutable, component$, useRef, useOnWindow, useStylesScoped$, useClientEffect$, useStore, useCleanup$, NoSerialize, noSerialize } from "@builder.io/qwik";
import styles from "./fax_machine.scss?inline";

import Display from "~/components/display/display";
import Button from "~/components/button/button";

export const num_pad_data: [number | string, string?][] = [
    [1],   [2, "ABC"], [3, "DEF"],
    [4],   [5, "ABC"], [6, "DEF"],
    [7],   [8, "ABC"], [9, "DEF"],
    ["A"], [0],        ["B"],
];

interface State {
    state: "input" | "sending" | "showing",
    cleanups: NoSerialize<(() => void)[]>,
}

export default component$(() => {
    useStylesScoped$(styles);

    const state = useStore<State>({
        state: "input",
        cleanups: noSerialize([]),
    });
    useCleanup$(() => {
        state.cleanups?.forEach(c => c());
    });

    const on_send = $(() => {
        if (state.state !== "input")
            return;
        state.state = "sending";
        const a = setTimeout(() => {
            state.state = "showing";
        }, 2000);
        if (state.cleanups == undefined)
            state.cleanups = noSerialize([]);
        state.cleanups?.push(() => clearTimeout(a));
    });

    let display_text: string = "ERROR";
    let eat_paper: boolean = false;
    let output_paper: boolean = false;
    if (state.state === "input") {
        display_text = "Please press send";
    }
    else if (state.state === "sending") {
        display_text = "Contacting server";
        eat_paper = true;
    }
    else if (state.state === "showing") {
        display_text = "Have a nice day";
        eat_paper = true;
        output_paper = true;
    }

    const select_elem = (e: MouseEvent) => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement))
            return;
        t.select();
    };

    return (
        <div class={`machine ${eat_paper && "eat-paper"} ${output_paper && "output-paper"}`}>
            <div class="paper input-paper" />
            <div class="paper output-paper">
                <div>
                    <div>Your shortened link is:</div>
                    <input {...({ readonly: "" } as any)} onClick$={select_elem} value="bite" />
                </div>
            </div>
            <Display text={mutable(display_text.toUpperCase())} />
            <div class="lower_part">
                <div class="keyboard">
                    {num_pad_data.map(([n, a]) => <Button>{n} {a ?? <span>{a}</span>}</Button>)}
                </div>
                <div>
                    <Button class="send-button">Print</Button>
                    <Button class="send-button" onClick$={on_send}>Send</Button>
                </div>
            </div>
        </div>
    );
});
