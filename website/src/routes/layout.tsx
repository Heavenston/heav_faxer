import { Slot, component$, useStore } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { LuPlus, LuUserCircle, LuChevronDown } from "@qwikest/icons/lucide";
import c from "./layout.module.scss";
import { GlobalStore, useGlobalStoreProvider } from "~/lib/global_store";

export default component$(() => {
  const location = useLocation();
  const globalStore = useStore<GlobalStore>({
    tabs: [
      {
        id: "ft1",
        name: "Fake Tab #1",
        files: [
          {
            id: "fa",
            name: "a.png",
          },
          {
            id: "fb",
            name: "b.png",
          },
        ],
      },
      {
        id: "ft2",
        name: "Fake Tab #2",
        files: [],
      },
    ],
  });
  useGlobalStoreProvider(globalStore);

  function createTab() {
    
  }

  return <div class={c["container"]}>
    <header class={{[c["header-discrete"]]: location.url.pathname === "/"}}>
      <div class={c["header-inside-container"]}>
        {globalStore.tabs.map(tab => (
          <a
            class={[c["tab"],{[c["tab-selected"]]: location.url.pathname === `/tab/${tab.id}`}]}
            href="/tab/{tab_data.id}"
          >
            {tab.name}
          </a>
        ))}
        <button
          class={c["new-tab"]}
          onClick$={() => createTab()}
        >
          <LuPlus height="1.3rem" />
        </button>
        <div class={c["tabs-separator"]}></div>
        <a href="/user-settings" class={[c["tabs-header-button"], {[c["tabs-header-button-selected"]]: location.url.pathname === "/user-settings" }]}>
          <LuUserCircle height="1.3rem" />
        </a>
      </div>
      <div class={c["discrete-arrow"]}>
        <LuChevronDown height="1.3rem" />
      </div>
    </header>
    <Slot />
  </div>;
});
