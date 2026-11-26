// 生成 src/ui/icons.ts：按图标组从 Fluent System Icons（headless，无 CSS-in-JS）重新导出。
// 需要新图标时，把组名加入下方列表后运行：node scripts/gen-icons.mjs
// 查组名：node scripts/find-icon.mjs <关键字>
import fs from 'node:fs';
const groups = `
dismiss subtract square square-multiple maximize arrow-left arrow-right arrow-up arrow-down arrow-clockwise
chevron-right chevron-down chevron-left chevron-up search home add cut copy clipboard-paste rename share delete
arrow-sort grid list text-bullet-list apps-list more-horizontal more-vertical info panel-right star pin folder-add document-add
open desktop arrow-download document image video hard-drive cloud globe settings power lock-closed person
arrow-sync edit play pause next previous headphones checkmark circle checkmark-circle warning error-circle
eye eye-off calendar-ltr alert alert-off bluetooth bluetooth-disabled airplane weather-moon dark-theme
brightness-high brightness-low accessibility cast location keyboard mic apps paint-brush color games shield
storage window-multiple text-font wifi wifi-off speaker speaker-mute battery battery-charge battery-saver music-note
leaf-one target folder folder-open tag filter options link arrow-up-right sparkle weather-sunny timer
globe-clock clock phone-laptop print usb-stick mouse-settings wallpaper? lock-open sleep arrow-exit
laptop tablet-laptop? arrow-maximize arrow-minimize full-screen-maximize window data-usage? history
text-description note code terminal? calculator window-new tab-desktop layout-column-two question-circle
shield-checkmark key touch? pen ink-stroke? globe-search translate local-language people person-circle
heart send attach emoji thumb-like slide-text? board apps-add-in arrow-upload save zoom-in zoom-out
arrow-undo arrow-redo text-bold text-italic text-underline line-horizontal-3 navigation checkbox-unchecked
radio-button toggle-left slide-size? arrow-swap arrow-repeat-all arrow-shuffle device-eq? drag ruler
color-fill eyedropper phone desktop-mac? shifts? resize? resize-large? table image-multiple? grid-dots
panel-left sidebar? document-pdf document-text folder-zip? arrow-enter text-sort-ascending
arrow-sort-down arrow-sort-up checkmark-starburst? cloud-arrow-down? design-ideas shapes
oval dock image-add paint-bucket color-background layer cursor-click zoom-fit arrow-rotate-clockwise align-left drop cursor router fingerprint password mail cloud-sync top-speed plug-connected wifi-settings bluetooth-connected
shield-lock? camera notebook? window-apps? arrow-reset bug? beaker? flag? subtract-circle add-circle dismiss-circle
wrench window-console arrow-counterclockwise developer-board stethoscope
`.split(/\s+/).filter(Boolean);
const dir = 'node_modules/@fluentui/react-icons/lib/atoms/headless-svg';
let out = '// 由 scripts/gen-icons.mjs 生成。Fluent System Icons（MIT），按组导出，打包时按需摇树。\n';
const missing = [];
for (const raw of [...new Set(groups)]) {
  const g = raw.replace(/\?$/, '');
  if (fs.existsSync(`${dir}/${g}.js`)) out += `export * from '@fluentui/react-icons/headless/svg/${g}';\n`;
  else missing.push(g);
}
fs.writeFileSync('src/ui/icons.ts', out);
console.log('icons.ts written;', 'missing:', missing.join(' ') || 'none');
