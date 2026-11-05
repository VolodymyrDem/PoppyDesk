// The site's Liquid Glass controls, from glisse (github.com/0kzh/glisse), mounted into the static page
// wherever an element has data-glisse. They talk to the page's own script through "poppy:*" events
// on the document, so the page never needs to know they're components.
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Button, Glass, SegmentedControl, Switch, TabBar } from "glisse";

import copySvg from "@phosphor-icons/core/assets/regular/copy.svg";
import checkSvg from "@phosphor-icons/core/assets/regular/check.svg";

const emit = (name, detail) => document.dispatchEvent(new CustomEvent(`poppy:${name}`, { detail }));
const useBus = (name, fn) =>
  useEffect(() => {
    const on = e => fn(e.detail);
    document.addEventListener(`poppy:${name}`, on);
    return () => document.removeEventListener(`poppy:${name}`, on);
  }, [name]);

// A Phosphor icon, as an inline <svg> so glisse sizes it like its own.
const Icon = ({ svg }) => (
  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: svg.replace(/^<svg[^>]*>|<\/svg>\s*$/g, "") }} />
);

// The app's own glyphs, drawn as black shapes and coloured by CSS.
const Glyph = ({ src }) => <i class="icon" style={{ "--icon": `url(${src})` }} aria-hidden="true" />;

// A pane of glass behind something that's already on the page, such as the navigation bar.
const Pane = () => <Glass className="glass-pane" aria-hidden="true" />;

// The notch demo's tabs. The page shows them off on its own until someone picks one.
function Tabs({ items, label }) {
  const list = JSON.parse(items);
  const [value, setValue] = useState(list[0].value);
  useBus("show-tab", setValue);
  return (
    <TabBar aria-label={label} value={value}
      items={list.map(t => ({ value: t.value, label: t.label, icon: <Glyph src={t.icon} /> }))}
      onValueChange={v => { setValue(v); emit("tab", v); }} />
  );
}

// Black or clear glass, like the Look setting in the app. Every one on the page moves together.
function Look({ label, short }) {
  const [value, setValue] = useState("black");
  useBus("look", setValue);
  return (
    <SegmentedControl aria-label={label} value={value}
      items={[
        { value: "black", label: <span class="look-label"><span class="swatch black" />Black</span> },
        { value: "glass", label: <span class="look-label"><span class="swatch glass" />{short ? "Glass" : "Clear glass"}</span> },
      ]}
      onValueChange={v => emit("look", v)} />
  );
}

const Toggle = ({ label, on }) => <Switch aria-label={label} defaultChecked={on === "true"} />;

// Copies a line, and says so. Where the clipboard is out of reach, it selects the line for ⌘C instead.
function Copy({ text, target }) {
  const [state, setState] = useState("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2400);
    return () => clearTimeout(t);
  }, [state]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      const el = document.querySelector(target);
      if (el) getSelection().selectAllChildren(el);
      setState("selected");
    }
  };
  return (
    <Button icon={<Icon svg={state === "copied" ? checkSvg : copySvg} />} onClick={copy}
      className={state === "copied" ? "is-done" : undefined} aria-live="polite">
      {state === "copied" ? "Copied" : state === "selected" ? "Press ⌘C" : "Copy"}
    </Button>
  );
}

// The phone-sized menu's button: two lines that turn into a cross.
function MenuToggle() {
  const [open, setOpen] = useState(false);
  useBus("menu", setOpen);
  return (
    <Button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}
      aria-controls="menu-panel" data-open={open ? "" : undefined}
      icon={<span class="menu-lines" aria-hidden="true"><i /><i /></span>}
      onClick={() => emit("menu", !open)} />
  );
}

const islands = { pane: Pane, tabs: Tabs, look: Look, toggle: Toggle, copy: Copy, menu: MenuToggle };

for (const el of document.querySelectorAll("[data-glisse]")) {
  const Island = islands[el.dataset.glisse];
  if (!Island) continue;
  const { glisse, ...props } = el.dataset;
  el.textContent = "";
  render(<Island {...props} />, el);
  el.classList.add("is-live");
}
document.documentElement.classList.add("glisse-ready");
