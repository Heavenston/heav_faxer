use leptos::*;

#[component]
fn App(cx: Scope) -> impl IntoView { 
    view!{ cx,
        <div class="fill center">
            <h1>"Heavenstone"</h1>
        </div>
    }
}

fn main() {
    _ = console_log::init_with_level(log::Level::Debug);
    console_error_panic_hook::set_once();

    mount_to_body(|cx| view! { cx,
        <App />
    })
}
