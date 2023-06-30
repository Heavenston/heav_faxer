import {
    component$,
    useStylesScoped$,
    Slot,
    type QwikIntrinsicElements,
} from "@builder.io/qwik";
import styles from "./button.scss?inline";

export type Props = QwikIntrinsicElements["button"];

export default component$<Props>(props => {
    useStylesScoped$(styles);
    return (
        <button {...props}>
            <span>
                <Slot />
            </span>
        </button>
    );
});
