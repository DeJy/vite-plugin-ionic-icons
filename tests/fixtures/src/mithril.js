// Mithril hyperscript fixture
// Detected icons: menu
import m from 'mithril';

export const Toolbar = {
  view: () =>
    m('nav', [
      m('ion-icon', { name: 'menu' }),
      m("ion-icon", { size: "large", name: "menu" }), // duplicate
    ]),
};
