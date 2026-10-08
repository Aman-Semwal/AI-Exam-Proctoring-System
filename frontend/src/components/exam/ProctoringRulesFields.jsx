import { DEFAULT_PROCTORING_RULES } from "../../utils/proctoringRules";

const TOGGLES = [
  { key: "identityCheckEnabled", label: "Identity check", hint: "Live photo before the exam, verified during it" },
  { key: "audioMonitoringEnabled", label: "Audio monitoring", hint: "Flags speech picked up by the microphone" },
  { key: "gazeTrackingEnabled", label: "Gaze tracking", hint: "Flags looking away from the screen" },
  { key: "objectDetectionEnabled", label: "Object detection", hint: "Flags phones, books and other devices" },
];

const ProctoringRulesFields = ({ value, onChange }) => {
  const rules = { ...DEFAULT_PROCTORING_RULES, ...value };
  const set = (key, v) => onChange({ ...rules, [key]: v });

  return (
    <fieldset className="border border-white/8 rounded-lg p-3 space-y-2.5">
      <legend className="px-1 text-xs font-semibold text-slate-300">Proctoring rules</legend>

      {TOGGLES.map(({ key, label, hint }) => (
        <label key={key} className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={rules[key]}
            onChange={(e) => set(key, e.target.checked)}
            className="mt-0.5 accent-blue-500"
          />
          <span>
            <span className="block text-slate-200 text-xs font-medium">{label}</span>
            <span className="block text-slate-500 text-[11px]">{hint}</span>
          </span>
        </label>
      ))}

      <label className="flex items-center justify-between gap-3 pt-1">
        <span>
          <span className="block text-slate-200 text-xs font-medium">Tab switches before auto-submit</span>
          <span className="block text-slate-500 text-[11px]">0 = record only, never auto-submit</span>
        </span>
        <input
          type="number"
          min="0"
          max="20"
          value={rules.tabSwitchLimit}
          onChange={(e) => set("tabSwitchLimit", Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
          className="w-16 px-2 py-1 bg-[#090a0f] border border-white/8 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>
          <span className="block text-slate-200 text-xs font-medium">Attempts allowed</span>
          <span className="block text-slate-500 text-[11px]">Submitted, auto-submitted and terminated attempts all count</span>
        </span>
        <input
          type="number"
          min="1"
          max="10"
          value={rules.maxAttempts}
          onChange={(e) => set("maxAttempts", Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
          className="w-16 px-2 py-1 bg-[#090a0f] border border-white/8 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
        />
      </label>
    </fieldset>
  );
};

export default ProctoringRulesFields;
