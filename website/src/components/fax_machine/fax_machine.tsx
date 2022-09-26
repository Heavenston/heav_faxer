import { $, component$, useRef, useOnWindow, useStyles$, useClientEffect$, useStore } from "@builder.io/qwik";
import styles from "./fax_machine.css?inline";

import Display from "~/components/display/display";
import Button from "~/components/button/button";

export default component$(() => {
    useStyles$(styles);
    return (
        <div class="machine">
            <Display text="ABCDEFGHIJKLMNOPQRSTUVWXYZ l'alphabet est" />
            <div class="lower_part">
                <div class="keyboard">
                    <Button>1 </Button> <Button>2 <span>ABC</span></Button> <Button>3 <span>DEF</span></Button>
                    <Button>4 <span>GHI</span></Button> <Button>5 <span>JKL</span></Button> <Button>6 <span>MNO</span></Button>
                    <Button>7 <span>PQRS</span></Button> <Button>8 <span>TUV</span></Button> <Button>9 <span>WXYZ</span></Button>
                    <Button>A </Button> <Button>0 </Button> <Button>B</Button>
                </div>
                <div>
                    <Button class="send-button">Send!</Button>
                </div>
            </div>
        </div>
    );
});
