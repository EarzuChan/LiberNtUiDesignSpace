export type SettingsPageId = 'system' | 'bluetooth' | 'network' | 'personalization' | 'apps' | 'accounts' | 'time' | 'accessibility' | 'privacy' | 'update' | 'about';

export interface SettingsPageMeta { id: SettingsPageId; name: string; desc: string; keywords: string[] }

export const SETTINGS_PAGES: SettingsPageMeta[] = [
  { id: 'system', name: '系统', desc: '显示、声音、通知、电源', keywords: ['显示', '亮度', '声音', '音量', '通知', '电源', '电池', '存储', '夜间'] },
  { id: 'bluetooth', name: '蓝牙和设备', desc: '蓝牙、打印机、鼠标', keywords: ['蓝牙', '设备', '鼠标', '键盘', '打印机'] },
  { id: 'network', name: '网络和 Internet', desc: 'WLAN、以太网、VPN', keywords: ['wifi', 'wlan', '网络', '以太网', 'vpn', '飞行模式', '热点'] },
  { id: 'personalization', name: '个性化', desc: '壁纸、颜色、主题、任务栏', keywords: ['壁纸', '背景', '颜色', '主题', '深色', '暗色', '强调色', '任务栏', '透明'] },
  { id: 'apps', name: '应用', desc: '已安装的应用、默认应用', keywords: ['应用', '卸载', '默认', '启动'] },
  { id: 'accounts', name: '账户', desc: '你的信息、登录选项', keywords: ['账户', '用户', '登录', '密码', '头像'] },
  { id: 'time', name: '时间和语言', desc: '日期、区域、输入法', keywords: ['时间', '日期', '语言', '区域', '输入法', '键盘'] },
  { id: 'accessibility', name: '辅助功能', desc: '文本大小、对比度、动画', keywords: ['辅助', '无障碍', '动画', '对比度', '放大', '字体'] },
  { id: 'privacy', name: '隐私和安全', desc: '权限、安全中心', keywords: ['隐私', '安全', '权限', '位置', '摄像头', '麦克风'] },
  { id: 'update', name: '系统更新', desc: '检查更新、更新历史', keywords: ['更新', '升级', '版本'] },
  { id: 'about', name: '关于', desc: '设备规格、系统信息', keywords: ['关于', '版本', '设备', '规格', '系统信息'] },
];
