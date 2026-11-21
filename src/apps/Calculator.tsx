import { useEffect, useState } from 'react';
import { TitleBar } from '@/shell/Window';
import { useWindow } from '@/shell/Window';
import './apps.css';

type Op = '+' | '−' | '×' | '÷';
const KEYS: [string, 'fn' | 'op' | 'num' | 'eq'][] = [
  ['%', 'fn'], ['CE', 'fn'], ['C', 'fn'], ['⌫', 'fn'],
  ['¹⁄ₓ', 'fn'], ['x²', 'fn'], ['√x', 'fn'], ['÷', 'op'],
  ['7', 'num'], ['8', 'num'], ['9', 'num'], ['×', 'op'],
  ['4', 'num'], ['5', 'num'], ['6', 'num'], ['−', 'op'],
  ['1', 'num'], ['2', 'num'], ['3', 'num'], ['+', 'op'],
  ['±', 'num'], ['0', 'num'], ['.', 'num'], ['=', 'eq'],
];
const calc = (a: number, b: number, op: Op) => (op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : b === 0 ? NaN : a / b);
const fmt = (n: number) => (Number.isFinite(n) ? Number(n.toPrecision(12)).toLocaleString('en-US', { maximumFractionDigits: 10 }) : '无法计算');

export function Calculator() {
  const { active } = useWindow();
  const [cur, setCur] = useState('0');
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true);
  const [expr, setExpr] = useState('');

  const press = (k: string) => {
    const v = parseFloat(cur.replace(/,/g, ''));
    if (/^\d$/.test(k)) { setCur(fresh || cur === '0' ? k : cur.length < 16 ? cur + k : cur); setFresh(false); }
    else if (k === '.') { setCur(fresh ? '0.' : cur.includes('.') ? cur : cur + '.'); setFresh(false); }
    else if (k === '±') setCur(String(-v));
    else if (k === 'C') { setCur('0'); setAcc(null); setOp(null); setExpr(''); setFresh(true); }
    else if (k === 'CE') { setCur('0'); setFresh(true); }
    else if (k === '⌫') setCur(fresh || cur.length <= 1 ? '0' : cur.slice(0, -1));
    else if (k === '%') { setCur(String((acc ?? 0) * v / 100)); setFresh(true); }
    else if (k === '¹⁄ₓ') { setExpr(`1/(${fmt(v)})`); setCur(String(1 / v)); setFresh(true); }
    else if (k === 'x²') { setExpr(`sqr(${fmt(v)})`); setCur(String(v * v)); setFresh(true); }
    else if (k === '√x') { setExpr(`√(${fmt(v)})`); setCur(String(Math.sqrt(v))); setFresh(true); }
    else if (k === '=') {
      if (op === null || acc === null) return;
      const r = calc(acc, v, op);
      setExpr(`${fmt(acc)} ${op} ${fmt(v)} =`); setCur(String(r)); setAcc(null); setOp(null); setFresh(true);
    } else {
      const r = op !== null && acc !== null && !fresh ? calc(acc, v, op) : v;
      setAcc(r); setOp(k as Op); setExpr(`${fmt(r)} ${k}`); setCur(String(r)); setFresh(true);
    }
  };

  useEffect(() => {
    if (!active) return;
    const map: Record<string, string> = { '*': '×', '/': '÷', '-': '−', Enter: '=', Backspace: '⌫', Escape: 'C', Delete: 'CE' };
    const on = (e: KeyboardEvent) => {
      if ((e.target as Element).closest('input, textarea')) return;
      const k = map[e.key] ?? e.key;
      if (KEYS.some(x => x[0] === k)) { e.preventDefault(); press(k); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  const shown = cur.endsWith('.') || (cur.includes('.') && cur.endsWith('0') && !fresh) ? cur : fmt(parseFloat(cur));
  return (
    <>
      <TitleBar />
      <div className="calc">
        <div className="calc-display">
          <div className="calc-expr tnum">{expr}</div>
          <div className="calc-value tnum" style={{ fontSize: shown.length > 11 ? Math.max(22, 44 - (shown.length - 11) * 3) : undefined }}>{shown}</div>
        </div>
        <div className="calc-keys">
          {KEYS.map(([k, kind]) => <button key={k} type="button" className="calc-key" data-kind={kind} onClick={() => press(k)}>{k}</button>)}
        </div>
      </div>
    </>
  );
}
