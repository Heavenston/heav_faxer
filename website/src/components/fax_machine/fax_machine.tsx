import { $, component$, useRef, useOnWindow, useStylesScoped$, useClientEffect$, useStore } from "@builder.io/qwik";
import styles from "./fax_machine.scss?inline";

import Display from "~/components/display/display";
import Button from "~/components/button/button";

export const num_pad_data: [number | string, string?][] = [
    [1],   [2, "ABC"], [3, "DEF"],
    [4],   [5, "ABC"], [6, "DEF"],
    [7],   [8, "ABC"], [9, "DEF"],
    ["A"], [0],        ["B"],
];

export default component$(() => {
    useStylesScoped$(styles);

    return (
        <div class="machine">
            <Display text="ABCDEFGHIJKLMNOPQRSTUVWXYZ l'alphabet est" />
            <div class="lower_part">
                <div class="keyboard">
                    {num_pad_data.map(([n, a]) => <Button>{n} {a ?? <span>{a}</span>}</Button>)}
                </div>
                <div>
                    <Button class="send-button">Send</Button>
                    <Button class="send-button">Print</Button>
                </div>
            </div>
        </div>
    );
});
