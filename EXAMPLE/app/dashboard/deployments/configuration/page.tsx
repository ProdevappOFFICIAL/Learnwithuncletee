"use client"
import { useState, useEffect } from 'react';
import { X, Upload, Check, Monitor, Type, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import axios from 'axios';
import { ScaleLoader } from 'react-spinners';

interface ExamConfig {
    randomQuestions: boolean;
    randomOptions: boolean;
    showResults: boolean;
    forceSubmit: boolean;
    showCalculator: boolean;
    pauseExam: boolean;
    separateSubjects: boolean;
    disableTimer: boolean;
    maxQuestions: number;
    schoolName: string;
    schoolLogo: string;
    theme: 'light' | 'dark';
    fontType: string;
    platformWeb: boolean;
    platformDesktop: boolean;
}

const Configuration = ({ onClose }: { onClose: () => void }) => {
    const [config, setConfig] = useState<ExamConfig>({
        randomQuestions: false,
        randomOptions: false,
        showResults: false,
        forceSubmit: false,
        showCalculator: false,
        pauseExam: false,
        separateSubjects: false,
        disableTimer: false,
        maxQuestions: 10,
        schoolName: '',
        schoolLogo: '',
        theme: 'light',
        fontType: 'Arial',
        platformWeb: true,
        platformDesktop: true,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await axios.get('http://localhost:8787/api/config');
                if (response.data.success && response.data.data) {
                    const data = response.data.data;
                    setConfig({
                        randomQuestions: !!data.randomQuestions,
                        randomOptions: !!data.randomOptions,
                        showResults: !!data.showResults,
                        forceSubmit: !!data.forceSubmit,
                        showCalculator: !!data.showCalculator,
                        pauseExam: !!data.pauseExam,
                        separateSubjects: !!data.separateSubjects,
                        disableTimer: !!data.disableTimer,
                        maxQuestions: data.maxQuestions || 10,
                        schoolName: data.schoolName || '',
                        schoolLogo: data.schoolLogo || '',
                        theme: data.theme || 'light',
                        fontType: data.fontType || 'Arial',
                        platformWeb: !!data.platformWeb,
                        platformDesktop: !!data.platformDesktop,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch config:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await axios.post('http://localhost:8787/api/config', config);
            setMessage({ type: 'success', text: 'Configuration saved successfully!' });
            setTimeout(() => onClose(), 1500);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save configuration.' });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setConfig(prev => ({ ...prev, schoolLogo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center p-12 bg-white rounded shadow border border-zinc-200">
                <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded  border border-zinc-200 flex flex-col max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="hidden p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
                        <Monitor size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm  text-zinc-900 leading-none">Exam Configuration</h2>
                        <p className="text-[10px] text-zinc-500 mt-1">Customize your examination environment</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-zinc-200">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.platformWeb}
                                onChange={e => setConfig(prev => ({ ...prev, platformWeb: e.target.checked }))}
                                className="w-3 h-3 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[10px] font-medium text-zinc-600">Web</span>
                        </label>
                        <div className="w-px h-3 bg-zinc-200" />
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.platformDesktop}
                                onChange={e => setConfig(prev => ({ ...prev, platformDesktop: e.target.checked }))}
                                className="w-3 h-3 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[10px] font-medium text-zinc-600">Desktop</span>
                        </label>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Configuration Options */}
                <section>
                    <h3 className="text-[11px] rounded text-zinc-400 uppercase tracking-wider mb-3">Configuration Options</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'randomQuestions', label: 'Shows questions at random' },
                            { id: 'randomOptions', label: 'Shows options at random' },
                            { id: 'showResults', label: 'Shows results when done' },
                            { id: 'forceSubmit', label: 'Force all users to submit' },
                            { id: 'showCalculator', label: 'Show calculator' },
                            { id: 'pauseExam', label: 'Pause exam' },
                            { id: 'separateSubjects', label: 'Separate subjects into sections' },
                            { id: 'disableTimer', label: 'Disable timer' },
                        ].map((opt) => (
                            <label key={opt.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors border border-transparent hover:border-zinc-100">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${config[opt.id as keyof ExamConfig] ? 'bg-blue-600 border-blue-600 text-white' : 'border-zinc-300 bg-white'}`}>
                                    {config[opt.id as keyof ExamConfig] && <Check size={10} strokeWidth={3} />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={config[opt.id as keyof ExamConfig] as boolean}
                                    onChange={e => setConfig(prev => ({ ...prev, [opt.id]: e.target.checked }))}
                                />
                                <span className="text-xs text-zinc-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </section>

                {/* Exam Limits */}
                <section>
                    <h3 className="text-[11px] rounded text-zinc-400 uppercase tracking-wider mb-3">Exam Limits</h3>
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                        <label className="block text-[11px] text-zinc-600 mb-1.5 font-medium">
                            Maximum number of questions viewable by student in the current exam
                        </label>
                        <input
                            type="number"
                            value={config.maxQuestions}
                            onChange={e => setConfig(prev => ({ ...prev, maxQuestions: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-white border border-zinc-200 rounded px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="10"
                        />
                    </div>
                </section>

                {/* School Information */}
                <section className="space-y-4">
                    <h3 className="text-[11px] rounded text-zinc-400 uppercase tracking-wider mb-3">School / Organizer Information</h3>
                    <div>
                        <label className="block text-[11px] text-zinc-600 mb-1.5 font-medium">School / Organizer name *</label>
                        <input
                            type="text"
                            value={config.schoolName}
                            onChange={e => setConfig(prev => ({ ...prev, schoolName: e.target.value }))}
                            className="w-full border border-zinc-200 rounded px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="Type name here..."
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] text-zinc-600 mb-2 font-medium">School Banner Image</label>
                        <div className="flex gap-4 items-start">
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center bg-zinc-50 relative group overflow-hidden">
                                {config.schoolLogo ? (
                                    <>
                                        <img src={config.schoolLogo} alt="Logo" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setConfig(prev => ({ ...prev, schoolLogo: '' }))}
                                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-medium"
                                        >
                                            Remove
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="w-6 h-6 text-zinc-300 mb-1" />
                                        <span className="text-[10px] text-zinc-400">Preview</span>
                                    </>
                                )}
                            </div>
                            <label className="flex-1 h-24 rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center hover:bg-zinc-50 hover:border-blue-400 cursor-pointer transition-all group">
                                <div className="w-8 h-8 rounded-full bg-zinc-100 group-hover:bg-blue-50 flex items-center justify-center mb-1 transition-colors">
                                    <Upload size={14} className="text-zinc-400 group-hover:text-blue-500" />
                                </div>
                                <span className="text-[10px] font-medium text-zinc-500 group-hover:text-blue-600">Click to upload banner</span>
                                <span className="text-[9px] text-zinc-400 mt-0.5">PNG, JPG up to 2MB</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>
                </section>

                {/* Visual Theme & Settings */}
                <section className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-[11px] rounded text-zinc-400 uppercase tracking-wider mb-3">Theme</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfig(prev => ({ ...prev, theme: 'light' }))}
                                className={`flex-1 py-1.5 rounded text-[11px] font-medium border transition-all ${config.theme === 'light' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => setConfig(prev => ({ ...prev, theme: 'dark' }))}
                                className={`flex-1 py-1.5 rounded text-[11px] font-medium border transition-all ${config.theme === 'dark' ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[11px] rounded text-zinc-400 uppercase tracking-wider mb-3">Font type</h3>
                        <div className="relative">
                            <Type className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                            <select
                                value={config.fontType}
                                onChange={e => setConfig(prev => ({ ...prev, fontType: e.target.value }))}
                                className="w-full bg-white border border-zinc-200 rounded pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all cursor-pointer"
                            >
                                <option value="Arial">Arial</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Inter">Inter</option>
                                <option value="Outfit">Outfit</option>
                                <option value="System">System Default</option>
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                {message ? (
                    <div className={`text-[10px] font-medium px-3 py-1 rounded-full ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {message.text}
                    </div>
                ) : <div />}

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-medium bg-blue-600/20 text-black hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-sm shadow-blue-200 transition-all active:scale-95"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={14} />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Configuration;
