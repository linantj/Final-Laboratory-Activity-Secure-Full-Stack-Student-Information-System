
type AuthFieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  placeholder: string;
  autoComplete?: string;
};

export default function AuthField({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
