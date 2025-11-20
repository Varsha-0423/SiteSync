import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    
    console.log('Attempting login with:', { email });
    
    try {
      // Make the login request
      console.log('Sending request to /api/auth/login');
      const response = await api.post("/auth/login", { 
        email, 
        password 
      });
      
      console.log('Login response received:', response);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      console.log('Login successful, response data:', response.data);
      
      // Store token and user data
      const { token, user } = response.data;
      if (!token || !user) {
        throw new Error('Invalid response from server: Missing token or user data');
      }
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      console.log('User data stored, redirecting...');
      
      // Redirect based on role
      const redirectPath = user.role === 'admin' ? 
        "/admin/dashboard" : 
        user.role === 'worker' ? 
          "/worker/dashboard" : 
          "/dashboard";
      
      navigate(redirectPath);
      
    } catch (error) {
      // Log detailed error information
      console.error('Login error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          data: error.response?.data
        },
        request: {
          method: error.config?.method,
          url: error.config?.url,
          data: error.config?.data,
          headers: error.config?.headers
        }
      });
      
      // Show user-friendly error message
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error details:', error.response.data);
        
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (typeof error.response.data === 'object') {
            errorMessage = error.response.data.message || JSON.stringify(error.response.data);
          }
        }
        
        if (error.response.status === 401 || error.response.status === 400) {
          errorMessage = 'Invalid email or password';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. ';
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', error.message);
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={login}>
        <input 
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
