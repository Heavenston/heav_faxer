import {
    component$,
    useStylesScoped$,
    Slot,
    DOMAttributes,
} from "@builder.io/qwik";
import styles from "./button.scss?inline";

export default component$<DOMAttributes<HTMLButtonElement>>(props => {
    useStylesScoped$(styles);
    return (
        <button {...props}>
            <span>
                <Slot />
            </span>
        </button>
    );
});
