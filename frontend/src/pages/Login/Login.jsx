import LoginForm from "../../components/sections/LoginForm";
import LoginIllustration from "../../components/sections/LoginIllustration";

const Login = () => {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-10 items-center">

        {/* Left Side */}
        <LoginIllustration />

        {/* Right Side */}
        <LoginForm />

      </div>
    </div>
  );
};

export default Login;