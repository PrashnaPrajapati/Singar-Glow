import { FcGoogle } from "react-icons/fc";

export default function GoogleButton() {
  return (
    <button className="w-full border p-3 rounded-lg flex items-center justify-center gap-2 
      hover:bg-gray-100 transition text-gray-800 font-medium">
      <FcGoogle size={20} />
      Continue with Google
    </button>
  );
}
