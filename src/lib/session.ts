import { create } from 'zustand';
import { useSys } from './system';
import { useWm } from './wm';

/**
 * 会话状态（T2 安全桌面）：锁屏、登录、睡眠，以及注销 / 重启 / 关机。
 * 界面在 src/loginui/LoginUI.tsx：独立页面 /loginui.html 里整页显示；桌面里作为覆盖层嵌入（锁定和睡眠不结束会话，窗口保留）。
 */
export type EndAction = 'signout' | 'restart' | 'shutdown' | 'update';
export type SessionPhase = 'desktop' | 'lock' | 'login' | 'welcome' | 'sleep' | 'blocked' | 'off' | EndAction;

export const END_ACTIONS: readonly EndAction[] = ['signout', 'restart', 'shutdown', 'update'];
export const isEnd = (p: SessionPhase): p is EndAction => (END_ACTIONS as readonly string[]).includes(p);

interface SessionState {
  phase: SessionPhase;
  /** 被应用阻止时，等待确认的操作 */
  pending: EndAction | null;
  /** 初始阶段由网址指定时停在原地便于审阅；用户一旦操作就解除 */
  held: boolean;
  go: (phase: SessionPhase) => void;
  /** 结束会话：有窗口带未保存的更改时先进入 blocked，force 跳过检查 */
  end: (action: EndAction, force?: boolean) => void;
}

export const useSession = create<SessionState>(set => ({
  phase: 'desktop',
  pending: null,
  held: false,
  go: phase => {
    useSys.getState().setFlyout(null);
    set({ phase, pending: null, held: false });
  },
  end: (action, force) => {
    useSys.getState().setFlyout(null);
    const blocked = !force && useWm.getState().wins.some(w => w.dirty);
    set(blocked ? { phase: 'blocked', pending: action, held: false } : { phase: action, pending: null, held: false });
  },
}));
