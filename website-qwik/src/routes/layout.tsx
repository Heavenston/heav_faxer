import { component$, Slot, useContextProvider, useStore } from "@builder.io/qwik";
import { default as GlobalModal, link_modal_context } from "~/components/global_link_modal/global_link_modal";

export default component$(() => {
    const mc = useStore({ enable: false });
    useContextProvider(link_modal_context, mc);

    return (
        <>
            <Slot/>
            <GlobalModal/>
        </>
    );
});
