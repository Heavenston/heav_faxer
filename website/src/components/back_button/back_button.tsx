import {
    component$,
    useStyles$,
} from "@builder.io/qwik";
import styles from "./back_button.scss?inline";
import { Link } from "@builder.io/qwik-city";

export type Props = {
};

export default component$<Props>(() => {
    useStyles$(styles);

    return (
        <Link href="/" class="back-button">
            <span>Back</span>
        </Link>
    );
});
