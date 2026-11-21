import type { Win } from '@/lib/wm';
import { APPS } from '@/lib/apps';
import { TitleBar } from '@/shell/Window';
import { Files } from './files/Files';
import { Settings } from './settings/Settings';
import { Notepad } from './Notepad';
import { Calculator } from './Calculator';
import { Photos } from './Photos';
import { Terminal } from './Terminal';

function Splash({ win }: { win: Win }) {
  const d = APPS[win.app];
  return (
    <>
      <TitleBar />
      <div className="col grow" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <img src={d.icon} width={96} height={96} alt="" />
        <div className="t-subtitle">{d.name}</div>
        <div className="c-2">演示环境中未包含此应用的内容</div>
      </div>
    </>
  );
}

export function AppView({ win }: { win: Win }) {
  switch (win.app) {
    case 'files': return <Files win={win} />;
    case 'settings': return <Settings win={win} />;
    case 'notepad': return <Notepad win={win} />;
    case 'calculator': return <Calculator />;
    case 'photos': return <Photos win={win} />;
    case 'terminal': return <Terminal />;
    default: return <Splash win={win} />;
  }
}
