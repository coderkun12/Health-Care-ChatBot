import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const [error,setError]=useState("");
    const navigate=useNavigate();

    const handleLogin=async(e) => {
        e.preventDefault();
        setError("");

        const response=await fetch("http://127.0.0.1:5000/api/login", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            credentials:"include",
            body:JSON.stringify({email,password})
        });

        const data=await response.json();
        if (response.ok){
            navigate("/home");
        } else {
            setError(data.error || "Login failed!");
        }
    };
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
            <h1 className="text-2xl mb-4">Login</h1>
            <form onSubmit={handleLogin} className="w-80 bg-gray-900 p-6 rounded-lg shadow-lg">
                {error && <p className="text-red-500">{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 mb-2 rounded bg-gray-800 text-white"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mb-4 rounded bg-gray-800 text-white"
                    required
                />
                <button className="w-full bg-blue-500 p-2 rounded hover:bg-blue-600">Login</button>
            </form>
            <p className="mt-4">
                Don't have an account? <a href="/signup" className="text-blue-400">Sign up</a>
            </p>
        </div>
    );
};

export default Login;