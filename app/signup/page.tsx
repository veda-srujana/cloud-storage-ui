"use client";

import { useState, FormEvent } from 'react';
import { CognitoUserPool, CognitoUserAttribute, CognitoUser } from 'amazon-cognito-identity-js';
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

const SignUp = () => {
  // Form state variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  
  // Step state
  const [isConfirmationStep, setIsConfirmationStep] = useState(false);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const router = useRouter();

  // Handle Sign Up
  const handleSignUp = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const attributeList: CognitoUserAttribute[] = [];

    const firstNameAttribute = new CognitoUserAttribute({
      Name: 'given_name',
      Value: firstName,
    });
    const lastNameAttribute = new CognitoUserAttribute({
      Name: 'family_name',
      Value: lastName,
    });

    attributeList.push(firstNameAttribute, lastNameAttribute);

    userPool.signUp(email, password, attributeList, [], (err, result) => {
      setLoading(false);
      if (err) {
        console.error('Error signing up:', err.message || JSON.stringify(err));
        setError(err.message || 'An unexpected error occurred.');
        return;
      }
      console.log('Signup successful:', result);
      setSuccess('Signup successful! Please check your email for the confirmation code.');
      setIsConfirmationStep(true);
    });
  };

  // Handle Confirmation
  const handleConfirmSignUp = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const userData = {
      Username: email,
      Pool: userPool,
    };
    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(confirmationCode, true, (err, result) => {
      setLoading(false);
      if (err) {
        console.error('Error confirming sign up:', err.message || JSON.stringify(err));
        setError(err.message || 'An unexpected error occurred during confirmation.');
        return;
      }
      console.log('Successfully confirmed:', result);
      setSuccess('Signup confirmed! You can now log in.');
      // Optionally, redirect to login after a short delay
      setTimeout(() => {
        router.push('/login'); // Redirect to login page
      }, 3000);
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-400 to-blue-500">
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          {!isConfirmationStep ? 'Create Account' : 'Confirm Your Account'}
        </h1>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 text-green-700 bg-green-100 rounded">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}

        {/* Signup Form */}
        {!isConfirmationStep ? (
          <form onSubmit={handleSignUp}>
            <div className="mb-4">
              <label htmlFor="firstName" className="block text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="lastName" className="block text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                required
              />
            </div>

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
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
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
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition duration-200 flex items-center justify-center ${
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
                'Sign Up'
              )}
            </button>
          </form>
        ) : (
          /* Confirmation Form */
          <form onSubmit={handleConfirmSignUp}>
            <div className="mb-4">
              <label htmlFor="confirmationCode" className="block text-gray-700 mb-2">
                Confirmation Code
              </label>
              <input
                type="text"
                id="confirmationCode"
                placeholder="Enter the confirmation code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition duration-200 flex items-center justify-center ${
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
                'Confirm Sign Up'
              )}
            </button>
          </form>
        )}

        {/* Navigation Link to Login Page */}
        {!isConfirmationStep && (
          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-800 font-semibold">
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default SignUp;
