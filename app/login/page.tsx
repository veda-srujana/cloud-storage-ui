"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, FormEvent } from 'react';
import { CognitoUserPool, AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link for client-side navigation

// Cognito User Pool Configuration
import awsmobile from '@/src/aws-exports';

// Cognito User Pool Configuration
const userPoolData = {
  UserPoolId: awsmobile.aws_user_pools_id,
  ClientId: awsmobile.aws_user_pools_web_client_id,
};

const userPool = new CognitoUserPool(userPoolData);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Loading state for better UX

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true); // Start loading

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        console.log('Login success:', result);
        alert('Successfully logged in!');
        router.push('/'); // Redirect to home page after login
        setLoading(false); // Stop loading
      },
      onFailure: (err) => {
        console.error('Error logging in:', err.message || JSON.stringify(err));
        alert(err.message || JSON.stringify(err));
        setLoading(false); // Stop loading
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        // Handle new password requirement if necessary
        alert('Please set a new password.');
        setLoading(false); // Stop loading
      },
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-indigo-600">
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Welcome Back</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center ${
              loading ? 'cursor-not-allowed opacity-50' : ''
            }`}
            disabled={loading}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-white rounded-full"
                viewBox="0 0 24 24"
              ></svg>
            ) : (
              'Login'
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          Don&qout;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-semibold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
