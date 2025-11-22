import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (userStr && token) {
        try {
          // Verify token with the server
          const response = await api.get('/auth/verify-token');
          
          // Get user data from localStorage and ensure it has an ID
          let user = JSON.parse(userStr);
          
          // If the server returned fresh user data, use that instead
          if (response.data?.user) {
            user = response.data.user;
            localStorage.setItem('user', JSON.stringify(user));
          }
          
          // Ensure user has an ID
          if (!user.id && !user._id) {
            console.error('User data is missing ID:', user);
            throw new Error('User data is missing ID');
          }
          
          // Normalize user data to always use 'id'
          const normalizedUser = {
            ...user,
            id: user._id || user.id
          };
          
          console.log('User verified:', { 
            userId: normalizedUser.id,
            email: normalizedUser.email,
            role: normalizedUser.role 
          });
          
          setCurrentUser(normalizedUser);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (email, password, role) => {
    // Normalize inputs
    email = email?.trim().toLowerCase();
    role = role?.toLowerCase();

    try {
      console.log('Login attempt:', { 
        email, 
        role,
        password: password ? '***' : 'MISSING',
        timestamp: new Date().toISOString()
      });

      // Input validation
      if (!email || !password) {
        const error = new Error('Email and password are required');
        error.name = 'ValidationError';
        throw error;
      }

      const requestData = { 
        email, 
        password,
        role 
      };

      console.log('Sending login request to /auth/login with data:', {
        ...requestData,
        password: '***' // Don't log actual password
      });
      
      const response = await api.post(
        '/auth/login',
        requestData,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          validateStatus: (status) => {
            console.log(`Received status code: ${status}`);
            return status < 500; // Reject only if server error (5xx)
          }
        }
      );

      const responseData = response.data || {};
      console.log('Server response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: responseData,
        config: {
          url: response.config?.url,
          method: response.config?.method,
          headers: response.config?.headers
        }
      });

      // Handle error responses
      if (response.status >= 400) {
        const errorMsg = responseData.message || 
                        responseData.error || 
                        `Login failed with status ${response.status}`;
                        
        const error = new Error(errorMsg);
        error.response = response;
        error.status = response.status;
        
        console.error('Login failed:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMsg,
          responseData,
          requestData: {
            email: requestData.email,
            role: requestData.role,
            password: '***'
          }
        });
        
        throw error;
      }

      // Validate response format
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid server response');
      }

      // Handle case where token needs to be verified
      if (response.data.success && (!response.data.token || !response.data.user)) {
        console.log('Fetching user data from verify-token endpoint');
        try {
          const verifyResponse = await api.get('/auth/verify-token');
          if (verifyResponse.data?.user) {
            response.data.user = verifyResponse.data.user;
          }
        } catch (verifyError) {
          console.error('Error verifying token:', verifyError);
          throw new Error('Login successful but could not fetch user data');
        }
      }

      const { token, user } = response.data;

      if (!token || !user) {
        console.error('Missing token or user in response:', response.data);
        throw new Error('Invalid login response');
      }

      // Ensure user object has an id field
      if (!user._id && !user.id) {
        console.error('User data is missing ID:', user);
        throw new Error('User data is missing ID');
      }
      
      // Normalize user data to always use 'id' instead of '_id'
      const normalizedUser = {
        ...user,
        id: user._id || user.id
      };
      
      // Store the token and user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      console.log('User logged in successfully:', {
        userId: normalizedUser.id,
        email: normalizedUser.email,
        role: normalizedUser.role
      });
      
      setCurrentUser(normalizedUser);
      return normalizedUser;

    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      
      return { 
        success: false, 
        message: error.message || 'Login failed. Please check your credentials and try again.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;