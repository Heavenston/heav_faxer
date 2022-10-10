import { setContext, getContext } from "svelte";

export function useTypedContext<ContextType>(name: string) {
    const storeKey = Symbol(name);
    return {
        get: () => {
            return getContext<ContextType>(storeKey);
        },
        set: (value: ContextType) => {
            setContext<ContextType>(storeKey, value);
        },
    };
}
