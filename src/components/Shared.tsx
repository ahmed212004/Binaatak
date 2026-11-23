import { useState, type ReactNode } from "react";
import { CheckCircle2, X, Search, MapPin, Clock3, Send, Paperclip } from "lucide-react";
import { taxonomy, type TaxonomyNode } from "../data/mockData";
import {
  isServiceProvider,
  providerAccountTypes,
  type AccountType,
} from "../types/app";

export function TaxonomyPicker({
  value,
  onChange,
  nodes,
}: {
  value: { category: string; sub: string; specialty: string };
  onChange: (v: { category: string; sub: string; specialty: string }) => void;
  nodes?: TaxonomyNode[];
}) {
  const list = nodes && nodes.length > 0 ? nodes : taxonomy;
  const main = list.find((x) => x.name === value.category);
  const subs = main?.children || [];
  const sub = subs.find((x) => x.name === value.sub);
  const specs = sub?.children || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
      <select
        className="field"
        value={value.category}
        onChange={(e) => onChange({ category: e.target.value, sub: "", specialty: "" })}
      >
        <option value="">التصنيف الرئيسي</option>
        {list.map((x) => (
          <option key={x.name}>{x.name}</option>
        ))}
      </select>
      <select
        className="field"
        value={value.sub}
        disabled={!value.category}
        onChange={(e) => onChange({ ...value, sub: e.target.value, specialty: "" })}
      >
        <option value="">التصنيف الفرعي</option>
        {subs.map((x) => (
          <option key={x.name}>{x.name}</option>
        ))}
      </select>
      <select
        className="field"
        value={value.specialty}
        disabled={!value.sub}
        onChange={(e) => onChange({ ...value, specialty: e.target.value })}
      >
        <option value="">التخصص الدقيق</option>
        {specs.map((x) => (
          <option key={x.name}>{x.name}</option>
        ))}
      </select>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <h2 className="font-extrabold text-lg">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function AccountFields({
  name,
  setName,
  type,
  setType,
}: {
  name: string;
  setName: (v: string) => void;
  type: AccountType;
  setType: (v: AccountType) => void;
}) {
  const providerMode = isServiceProvider(type);

  return (
    <>
      <Field label="صفة الحساب">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setType("طالب خدمة")}
            className={`p-3 rounded-xl border text-right transition ${
              !providerMode
                ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="font-extrabold text-sm text-slate-900">طالب خدمة</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              أبحث عن مهندسين أو مقاولين أو توريد خامات
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!providerMode) setType("مهندس");
            }}
            className={`p-3 rounded-xl border text-right transition ${
              providerMode
                ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="font-extrabold text-sm text-slate-900">مقدم خدمة</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              أقدم خدمات هندسية أو مقاولات أو منتجات
            </div>
          </button>
        </div>
      </Field>

      {providerMode && (
        <Field label="تخصص مقدم الخدمة">
          <div className="grid grid-cols-3 gap-2">
            {providerAccountTypes.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`account-option ${type === t ? "selected" : ""}`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label={providerMode ? "الاسم أو اسم الشركة / المكتب" : "الاسم الكامل"}>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
    </>
  );
}

export function Button({
  variant = "amber",
  type = "button",
  onClick,
  disabled,
  children,
}: {
  variant?: "amber" | "dark" | "green";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const variantClass =
    variant === "dark" ? "btn-dark" : variant === "green" ? "btn-green" : "btn-amber";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn ${variantClass}`}>
      {children}
    </button>
  );
}

export function Tag({
  color = "amber",
  children,
}: {
  color?: "amber" | "blue" | "slate" | "green";
  children: ReactNode;
}) {
  const styles: Record<string, string> = {
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[color]}`}>
      {children}
    </span>
  );
}

export function Verified() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
      <CheckCircle2 size={14} /> موثق
    </span>
  );
}

export function Location({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <MapPin size={14} className="text-amber-600" /> {children}
    </span>
  );
}

export function Time({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
      <Clock3 size={13} /> {children}
    </span>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex items-center">
      <Search size={16} className="absolute right-3 text-slate-400 pointer-events-none" />
      <input
        className="field pr-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-bold">
      {message}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="panel p-10 text-center text-slate-400 text-sm font-semibold">{text}</div>;
}

export function ChatComposer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="p-3 border-t flex items-center gap-2 bg-white"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text.trim());
        setText("");
      }}
    >
      <button type="button" className="p-2 text-slate-400 hover:text-slate-600">
        <Paperclip size={18} />
      </button>
      <input
        className="field flex-1"
        placeholder="اكتب رسالتك هنا..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button type="submit">
        <Send size={16} /> إرسال
      </Button>
    </form>
  );
}