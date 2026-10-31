/**
 * Deployment security profiles — shared types + editable catalogs for the
 * admin page. The API stores settings as JSONB and normalises unknown/missing
 * keys against the same defaults; keep these two lists in sync.
 */

export type DeploymentSecurityMode = 'ONLINE' | 'OFFLINE';

export type BlockedKey =
  | 'F1'
  | 'F5'
  | 'F12'
  | 'Ctrl+C'
  | 'Ctrl+V'
  | 'Ctrl+P'
  | 'Ctrl+U'
  | 'Ctrl+S'
  | 'Alt+Tab'
  | 'Alt+F4'
  | 'PrintScreen'
  | 'Ctrl+Shift+I';

export type MonitoredEvent =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'COPY'
  | 'PASTE'
  | 'RIGHT_CLICK'
  | 'FULLSCREEN_EXIT'
  | 'DEVTOOLS_OPEN'
  | 'PRINT_ATTEMPT'
  | 'IDLE_TIMEOUT'
  | 'NETWORK_DROP';

export type DeviceRestriction =
  | 'NO_NEW_TAB'
  | 'NO_REFRESH'
  | 'NO_BACK'
  | 'NO_ZOOM'
  | 'NO_TEXT_SELECTION'
  | 'NO_DRAG_DROP'
  | 'NO_SAVE_PAGE'
  | 'NO_SECOND_MONITOR';

export interface DeploymentSecuritySettings {
  // Delivery & exam behaviour
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  separateSubjects: boolean;
  showResults: boolean;
  showScoreImmediately: boolean;
  showCorrectAnswers: boolean;
  allowReviewBeforeSubmit: boolean;
  allowBackNavigation: boolean;
  allowCalculator: boolean;
  allowNotes: boolean;
  allowPause: boolean;
  disableTimer: boolean;
  autoSubmitOnTimeout: boolean;
  saveResumeProgress: boolean;
  // Integrity & proctoring
  requireLogin: boolean;
  requireFullScreen: boolean;
  detectTabSwitch: boolean;
  detectWindowBlur: boolean;
  detectCopyPaste: boolean;
  detectRightClick: boolean;
  detectDevTools: boolean;
  watermarkPaper: boolean;
  lockOnViolation: boolean;
  autoSubmitOnLeave: boolean;
  requireProctorApproval: boolean;
  requirePhotoCapture: boolean;
  // Offline host
  offlineAllowReconnect: boolean;
  offlineSyncResults: boolean;
  offlineLockAfterSubmit: boolean;
  offlineRequireHostApproval: boolean;
  // Limits
  maxQuestions: number;
  maxViolations: number;
  timeGraceSeconds: number;
  autoSaveIntervalSeconds: number;
  sessionTimeoutMinutes: number;
  maxAttempts: number;
  // Policies (radio)
  tabSwitchPolicy: 'WARN' | 'SUBMIT' | 'LOCK';
  copyPastePolicy: 'ALLOW' | 'BLOCK' | 'BLOCK_AND_WARN';
  calculatorPolicy: 'OFF' | 'ON' | 'ON_WITH_LOG';
  resultRelease: 'IMMEDIATE' | 'AFTER_DEPLOYMENT_ENDS' | 'MANUAL';
  navigationPolicy: 'FREE' | 'SEQUENTIAL' | 'LOCK_AFTER_ANSWER';
  devicePolicy: 'ANY' | 'ONE_DEVICE' | 'APPROVED_DEVICES';
  offlineKioskMode: 'NONE' | 'FULLSCREEN' | 'KIOSK';
  // Multi-select protections
  blockedKeys: BlockedKey[];
  monitoredEvents: MonitoredEvent[];
  restrictions: DeviceRestriction[];
}

export type BooleanSecurityKey = {
  [K in keyof DeploymentSecuritySettings]: DeploymentSecuritySettings[K] extends boolean ? K : never;
}[keyof DeploymentSecuritySettings];

export type NumberSecurityKey = {
  [K in keyof DeploymentSecuritySettings]: DeploymentSecuritySettings[K] extends number ? K : never;
}[keyof DeploymentSecuritySettings];

export type PolicySecurityKey =
  | 'tabSwitchPolicy'
  | 'copyPastePolicy'
  | 'calculatorPolicy'
  | 'resultRelease'
  | 'navigationPolicy'
  | 'devicePolicy'
  | 'offlineKioskMode';

export type MultiSecurityKey = 'blockedKeys' | 'monitoredEvents' | 'restrictions';

export const DEFAULT_SECURITY_SETTINGS: DeploymentSecuritySettings = {
  // Delivery & exam behaviour
  shuffleQuestions: false,
  shuffleOptions: true,
  separateSubjects: false,
  showResults: true,
  showScoreImmediately: true,
  showCorrectAnswers: false,
  allowReviewBeforeSubmit: true,
  allowBackNavigation: true,
  allowCalculator: true,
  allowNotes: false,
  allowPause: false,
  disableTimer: false,
  autoSubmitOnTimeout: true,
  saveResumeProgress: true,
  // Integrity & proctoring
  requireLogin: true,
  requireFullScreen: false,
  detectTabSwitch: true,
  detectWindowBlur: true,
  detectCopyPaste: true,
  detectRightClick: false,
  detectDevTools: true,
  watermarkPaper: false,
  lockOnViolation: false,
  autoSubmitOnLeave: false,
  requireProctorApproval: false,
  requirePhotoCapture: false,
  // Offline host
  offlineAllowReconnect: true,
  offlineSyncResults: true,
  offlineLockAfterSubmit: true,
  offlineRequireHostApproval: false,
  // Limits
  maxQuestions: 0,
  maxViolations: 3,
  timeGraceSeconds: 15,
  autoSaveIntervalSeconds: 30,
  sessionTimeoutMinutes: 0,
  maxAttempts: 1,
  // Policies
  tabSwitchPolicy: 'WARN',
  copyPastePolicy: 'BLOCK_AND_WARN',
  calculatorPolicy: 'ON',
  resultRelease: 'MANUAL',
  navigationPolicy: 'FREE',
  devicePolicy: 'ANY',
  offlineKioskMode: 'FULLSCREEN',
  // Multi-select protections
  blockedKeys: ['F12', 'Ctrl+Shift+I'],
  monitoredEvents: ['TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT'],
  restrictions: ['NO_REFRESH', 'NO_BACK'],
};

/** Fresh defaults — arrays are copied so edits never mutate the shared object. */
export const cloneDefaultSecuritySettings = (): DeploymentSecuritySettings => ({
  ...DEFAULT_SECURITY_SETTINGS,
  blockedKeys: [...DEFAULT_SECURITY_SETTINGS.blockedKeys],
  monitoredEvents: [...DEFAULT_SECURITY_SETTINGS.monitoredEvents],
  restrictions: [...DEFAULT_SECURITY_SETTINGS.restrictions],
});

/** Merge an API payload over defaults, tolerating partial/legacy profiles. */
export const mergeSecuritySettings = (
  value?: Partial<DeploymentSecuritySettings> | null,
): DeploymentSecuritySettings => {
  const base = cloneDefaultSecuritySettings();
  if (!value) return base;
  return {
    ...base,
    ...value,
    blockedKeys: Array.isArray(value.blockedKeys) ? [...value.blockedKeys] : base.blockedKeys,
    monitoredEvents: Array.isArray(value.monitoredEvents) ? [...value.monitoredEvents] : base.monitoredEvents,
    restrictions: Array.isArray(value.restrictions) ? [...value.restrictions] : base.restrictions,
  };
};

export interface SecuritySwitchDef {
  key: BooleanSecurityKey;
  label: string;
  hint?: string;
}

export interface SecuritySwitchGroup {
  title: string;
  text: string;
  options: SecuritySwitchDef[];
}

export const SECURITY_SWITCH_GROUPS: SecuritySwitchGroup[] = [
  {
    title: 'Delivery & exam behaviour',
    text: 'What pupils see and how the paper behaves while the deployment is live.',
    options: [
      { key: 'shuffleQuestions', label: 'Shuffle questions', hint: 'Each pupil gets a different question order.' },
      { key: 'shuffleOptions', label: 'Shuffle options', hint: 'A/B/C/D order is randomised per pupil.' },
      { key: 'separateSubjects', label: 'Separate subjects into sections', hint: 'Group the palette by subject.' },
      { key: 'showResults', label: 'Show results when done', hint: 'Release the score immediately after submit.' },
      { key: 'showScoreImmediately', label: 'Show score immediately', hint: 'Skip the result-pending screen.' },
      { key: 'showCorrectAnswers', label: 'Show correct answers', hint: 'Let pupils review answers after submission.' },
      { key: 'allowReviewBeforeSubmit', label: 'Allow review before submit', hint: 'Pupils can revisit answered questions.' },
      { key: 'allowBackNavigation', label: 'Allow previous / back navigation' },
      { key: 'allowCalculator', label: 'Allow calculator' },
      { key: 'allowNotes', label: 'Allow on-screen notes' },
      { key: 'allowPause', label: 'Allow pause exam', hint: 'Pupils can pause the timer and resume.' },
      { key: 'disableTimer', label: 'Disable timer', hint: 'Run the exam without a countdown.' },
      { key: 'autoSubmitOnTimeout', label: 'Auto-submit on timeout' },
      { key: 'saveResumeProgress', label: 'Save & resume progress', hint: 'Restore answers after a reload.' },
    ],
  },
  {
    title: 'Integrity & proctoring',
    text: 'Detection and enforcement options for online sittings and desktop hosts.',
    options: [
      { key: 'requireLogin', label: 'Require pupil login' },
      { key: 'requireFullScreen', label: 'Force full screen' },
      { key: 'detectTabSwitch', label: 'Detect tab switching' },
      { key: 'detectWindowBlur', label: 'Detect window blur' },
      { key: 'detectCopyPaste', label: 'Detect copy / paste' },
      { key: 'detectRightClick', label: 'Detect right-click' },
      { key: 'detectDevTools', label: 'Detect developer tools' },
      { key: 'watermarkPaper', label: 'Watermark paper', hint: 'Stamp the pupil name and code on every page.' },
      { key: 'lockOnViolation', label: 'Lock on violation' },
      { key: 'autoSubmitOnLeave', label: 'Auto-submit when pupil leaves' },
      { key: 'requireProctorApproval', label: 'Require proctor approval', hint: 'A staff member must release each pupil.' },
      { key: 'requirePhotoCapture', label: 'Require photo capture', hint: 'Take a webcam snapshot at sign-in.' },
    ],
  },
];

export const SECURITY_OFFLINE_SWITCHES: SecuritySwitchDef[] = [
  { key: 'offlineAllowReconnect', label: 'Allow LAN reconnect', hint: 'Pupils can rejoin if the Wi-Fi drops.' },
  { key: 'offlineSyncResults', label: 'Sync results automatically', hint: 'Push sittings back to the cloud when online.' },
  { key: 'offlineLockAfterSubmit', label: 'Lock after submit', hint: 'Prevent re-sitting on the host device.' },
  { key: 'offlineRequireHostApproval', label: 'Require host approval', hint: 'Invigilator releases each device before the paper starts.' },
];

export interface SecurityRadioOption {
  value: string;
  label: string;
  hint?: string;
}

export interface SecurityRadioDef {
  key: PolicySecurityKey;
  label: string;
  options: SecurityRadioOption[];
}

export const SECURITY_RADIOS: SecurityRadioDef[] = [
  {
    key: 'tabSwitchPolicy',
    label: 'Tab-switch policy',
    options: [
      { value: 'WARN', label: 'Warn pupil' },
      { value: 'SUBMIT', label: 'Submit automatically' },
      { value: 'LOCK', label: 'Lock the paper' },
    ],
  },
  {
    key: 'copyPastePolicy',
    label: 'Copy / paste policy',
    options: [
      { value: 'ALLOW', label: 'Allow' },
      { value: 'BLOCK', label: 'Block silently' },
      { value: 'BLOCK_AND_WARN', label: 'Block & warn' },
    ],
  },
  {
    key: 'calculatorPolicy',
    label: 'Calculator policy',
    options: [
      { value: 'OFF', label: 'Off' },
      { value: 'ON', label: 'On' },
      { value: 'ON_WITH_LOG', label: 'On + log usage' },
    ],
  },
  {
    key: 'resultRelease',
    label: 'Result release',
    options: [
      { value: 'IMMEDIATE', label: 'Immediately' },
      { value: 'AFTER_DEPLOYMENT_ENDS', label: 'When deployment ends' },
      { value: 'MANUAL', label: 'Manual by admin' },
    ],
  },
  {
    key: 'navigationPolicy',
    label: 'Navigation policy',
    options: [
      { value: 'FREE', label: 'Free navigation' },
      { value: 'SEQUENTIAL', label: 'Sequential only' },
      { value: 'LOCK_AFTER_ANSWER', label: 'Lock answered questions' },
    ],
  },
  {
    key: 'devicePolicy',
    label: 'Device policy',
    options: [
      { value: 'ANY', label: 'Any device' },
      { value: 'ONE_DEVICE', label: 'One device per pupil' },
      { value: 'APPROVED_DEVICES', label: 'Approved devices only' },
    ],
  },
];

export const SECURITY_OFFLINE_RADIO: SecurityRadioDef = {
  key: 'offlineKioskMode',
  label: 'Desktop kiosk mode',
  options: [
    { value: 'NONE', label: 'Normal windows' },
    { value: 'FULLSCREEN', label: 'Full screen' },
    { value: 'KIOSK', label: 'Locked kiosk' },
  ],
};

export interface SecurityCheckOption<T extends string> {
  value: T;
  label: string;
}

export interface SecurityCheckGroup<K extends MultiSecurityKey, T extends string> {
  key: K;
  title: string;
  text: string;
  options: Array<SecurityCheckOption<T>>;
}

export const SECURITY_CHECK_GROUPS: Array<SecurityCheckGroup<MultiSecurityKey, string>> = [
  {
    key: 'blockedKeys',
    title: 'Blocked keyboard shortcuts',
    text: 'Keys the exam room / host app intercepts before the browser sees them.',
    options: [
      { value: 'F1', label: 'F1 help' },
      { value: 'F5', label: 'F5 refresh' },
      { value: 'F12', label: 'F12 devtools' },
      { value: 'Ctrl+C', label: 'Ctrl + C copy' },
      { value: 'Ctrl+V', label: 'Ctrl + V paste' },
      { value: 'Ctrl+P', label: 'Ctrl + P print' },
      { value: 'Ctrl+U', label: 'Ctrl + U view source' },
      { value: 'Ctrl+S', label: 'Ctrl + S save page' },
      { value: 'Alt+Tab', label: 'Alt + Tab switch' },
      { value: 'Alt+F4', label: 'Alt + F4 close' },
      { value: 'PrintScreen', label: 'Print screen' },
      { value: 'Ctrl+Shift+I', label: 'Ctrl + Shift + I devtools' },
    ],
  },
  {
    key: 'monitoredEvents',
    title: 'Monitored events',
    text: 'Signals written to the session activity log for staff review.',
    options: [
      { value: 'TAB_SWITCH', label: 'Tab switch' },
      { value: 'WINDOW_BLUR', label: 'Window blur / minimise' },
      { value: 'COPY', label: 'Copy' },
      { value: 'PASTE', label: 'Paste' },
      { value: 'RIGHT_CLICK', label: 'Right-click' },
      { value: 'FULLSCREEN_EXIT', label: 'Full-screen exit' },
      { value: 'DEVTOOLS_OPEN', label: 'Devtools opened' },
      { value: 'PRINT_ATTEMPT', label: 'Print attempt' },
      { value: 'IDLE_TIMEOUT', label: 'Idle timeout' },
      { value: 'NETWORK_DROP', label: 'Network drop' },
    ],
  },
  {
    key: 'restrictions',
    title: 'Device restrictions',
    text: 'Hard blocks enforced by the exam room or offline host app.',
    options: [
      { value: 'NO_NEW_TAB', label: 'No new tabs' },
      { value: 'NO_REFRESH', label: 'No refresh' },
      { value: 'NO_BACK', label: 'No browser back' },
      { value: 'NO_ZOOM', label: 'No zoom' },
      { value: 'NO_TEXT_SELECTION', label: 'No text selection' },
      { value: 'NO_DRAG_DROP', label: 'No drag & drop' },
      { value: 'NO_SAVE_PAGE', label: 'No save page' },
      { value: 'NO_SECOND_MONITOR', label: 'No second monitor' },
    ],
  },
];

export interface DeploymentSecurityNumberDef {
  key: NumberSecurityKey;
  label: string;
  hint: string;
  suffix?: string;
}

export const SECURITY_NUMBERS: DeploymentSecurityNumberDef[] = [
  { key: 'maxQuestions', label: 'Max questions per pupil', hint: '0 = serve every question in scope.' },
  { key: 'maxViolations', label: 'Violations before action', hint: '0 = act on the first violation.' },
  { key: 'timeGraceSeconds', label: 'Disconnect grace', hint: 'Seconds allowed to reconnect.', suffix: 'sec' },
  { key: 'autoSaveIntervalSeconds', label: 'Auto-save interval', hint: 'How often progress is persisted.', suffix: 'sec' },
  { key: 'sessionTimeoutMinutes', label: 'Idle session timeout', hint: '0 = never time out an idle pupil.', suffix: 'min' },
  { key: 'maxAttempts', label: 'Max attempts', hint: 'Re-sits allowed for the same pupil.' },
];

export interface DeploymentSecurityDeploymentRef {
  id: string;
  code: string;
  mode: DeploymentSecurityMode;
  status: 'DRAFT' | 'LIVE' | 'ENDED' | string;
}

export interface DeploymentSecurityProfileItem {
  id: string;
  name: string;
  description?: string | null;
  mode: DeploymentSecurityMode;
  settings: Partial<DeploymentSecuritySettings> | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  deployments?: DeploymentSecurityDeploymentRef[];
  _count?: { deployments?: number };
}

/** Human label for a policy value (used in profile summaries). */
export const policyLabel = (key: PolicySecurityKey, value: string): string => {
  const all = key === 'offlineKioskMode' ? [SECURITY_OFFLINE_RADIO] : SECURITY_RADIOS;
  const def = all.find((item) => item.key === key);
  return def?.options.find((option) => option.value === value)?.label ?? value;
};

/** How many protections are switched on — a quick density indicator on cards. */
export const enabledSecurityCount = (settings: Partial<DeploymentSecuritySettings>): number => {
  const merged = mergeSecuritySettings(settings);
  const groups = [...SECURITY_SWITCH_GROUPS.flatMap((group) => group.options), ...SECURITY_OFFLINE_SWITCHES];
  return groups.filter((def) => merged[def.key]).length;
};
