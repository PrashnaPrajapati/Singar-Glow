import { Mail } from "lucide-react";

export default function TextInput({ icon: Icon = Mail, ...props }) {
  return (
    <div>
      <div className="relative mt-1">
        <Icon className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
        <input
          {...props}
          className="w-full pl-12 p-3 border rounded-lg focus:outline-pink-400
                    placeholder-gray-700 text-gray-900"
        />
      </div>
    </div>
  );
}

