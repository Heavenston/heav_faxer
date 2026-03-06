import { Slot, component$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { LuPlus, LuUserCircle, LuChevronDown } from "@qwikest/icons/lucide";
import c from "./layout.module.scss";

export default component$(() => {
  const tabs: { id: string, name: string }[] = [];
  const location = useLocation();

  function createTab() {
    
  }

  return <div class={c["container"]}>
    <header class={{[c["header-discrete"]]: location.url.pathname === "/"}}>
      <div class={c["header-inside-container"]}>
        {tabs.map(tab => (
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
