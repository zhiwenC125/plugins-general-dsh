function apply(ctx) {
  const h = React.createElement;
  function Mark({ size = 36 }) {
    return h('svg', { viewBox: '0 0 512 512', width: size, height: size, role: 'img', 'aria-label': 'Revolution' },
      h('rect', { width: 512, height: 512, rx: 112, fill: '#17191d' }),
      h('path', { d: 'M110 112h133c79 0 124 37 124 98 0 42-24 75-65 91l49 99h-83l-67-145h40c30 0 47-15 47-42s-17-41-47-41h-53v228h-78z', fill: '#f5f4ef' }),
      h('path', { d: 'm285 330 49 70h45l60-184h-66l-25 99-21-35z', fill: '#c7f36b' }));
  }
  function Fist() { return h('span', { role: 'img', 'aria-label': 'Revolution · 高举的拳头', style: { display: 'inline-flex', width: 112, height: 112, flexShrink: 0 }, dangerouslySetInnerHTML: { __html: REV_HERO_SVG.replace('width="512" height="512"', 'width="112" height="112"') } }); }
  for (const [name, component] of [['sidebar.brand.mark', Mark], ['sidebar.brand.name', () => h('strong', null, 'Revolution')], ['conversation.hero.brand.mark', Fist]]) {
    ctx.slots.inject(name, () => ctx.slots.register({ name }, component));
  }
  ctx.effect(() => ctx.theme.overrideTokens('revolution', {
    '--dsw-alias-bg-base': { light: '#f7f7f3', dark: '#141619' },
    '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#1c1f23' },
    '--dsw-alias-bg-layer-2': { light: '#f0f1eb', dark: '#25292e' },
    '--dsw-specific-sidebar-fill': { light: '#eeefe8', dark: '#191c20' },
    '--dsw-alias-brand-primary': { light: '#48651d', dark: '#c7f36b' },
    '--dsw-alias-brand-primary-new-colorprimary-new-color': { light: '#48651d', dark: '#c7f36b' },
  }));
  ctx.effect(() => {
    const oldTitle = document.title;
    const updateTitle = () => {
      const title = document.title.replace(/DeepSeek Harness/g, 'Revolution');
      if (title !== document.title) document.title = title;
    };
    updateTitle();
    const titleNode = document.querySelector('title');
    const observer = new MutationObserver(updateTitle);
    if (titleNode) observer.observe(titleNode, { childList: true, subtree: true, characterData: true });
    const icon = document.createElement('link'); icon.rel = 'icon'; icon.href = REV_ICON; document.head.appendChild(icon);
    return () => { observer.disconnect(); icon.remove(); document.title = oldTitle; };
  });
}
