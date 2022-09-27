import { component$, useStyles$, Slot, PropsOf, DOMAttributes } from "@builder.io/qwik";
import styles from "./button.scss?inline";

export default component$<DOMAttributes<HTMLButtonElement>>(props => {
    useStyles$(styles);
    return (
        <button {...props}>
            <span>
                <Slot />
            </span>
        </button>
    );
});
