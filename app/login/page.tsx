"use client";

import { useState, FormEvent } from 'react';
import { CognitoUserPool, AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';
import { useRouter } from 'next/navigation';

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

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();

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
      },
      onFailure: (err) => {
        console.error('Error logging in:', err.message || JSON.stringify(err));
        alert(err.message || JSON.stringify(err));
      },
    });
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-80">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded"
            required
          />
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
