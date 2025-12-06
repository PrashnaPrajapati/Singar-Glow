"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function PasswordInput(props) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="relative mt-1">
        <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={18} />

        <input
          {...props}
          type={show ? "text" : "password"}
          className="w-full pl-12 p-3 border rounded-lg focus:outline-pink-400 
                    placeholder-gray-700 text-gray-900"
        />

        <button
          type="button"
          className="absolute right-3 top-3 text-gray-400"
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
