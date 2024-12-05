"use client";

import { useState, FormEvent } from 'react';
import { CognitoUserPool, CognitoUserAttribute, CognitoUser } from 'amazon-cognito-identity-js';
import { useRouter } from 'next/navigation';
import awsmobile from '@/src/aws-exports';

// Cognito User Pool Configuration
const userPoolData = {
  UserPoolId: awsmobile.aws_user_pools_id,
  ClientId: awsmobile.aws_user_pools_web_client_id,
};

const userPool = new CognitoUserPool(userPoolData);

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isConfirmationStep, setIsConfirmationStep] = useState(false);
  const router = useRouter();

  const handleSignUp = (event: FormEvent) => {
    event.preventDefault();
    const attributeList = [];

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
      if (err) {
        console.error('Error signing up:', err.message || JSON.stringify(err));
        alert(err.message || JSON.stringify(err));
        return;
      }
      console.log('Signup successful:', result);
      setIsConfirmationStep(true);
    });
  };

  const handleConfirmSignUp = (event: FormEvent) => {
    event.preventDefault();

    const userData = {
      Username: email,
      Pool: userPool,
    };
    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(confirmationCode, true, (err, result) => {
      if (err) {
        console.error('Error confirming sign up:', err.message || JSON.stringify(err));
        alert(err.message || JSON.stringify(err));
        return;
      }
      console.log('Successfully confirmed:', result);
      alert('Signup confirmed! You can now login.');
      router.push('/login'); // Redirect to login page
    });
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-80">
        <h1 className="text-2xl font-bold mb-4">{!isConfirmationStep ? 'Sign Up' : 'Confirm Sign Up'}</h1>
        {!isConfirmationStep ? (
          <form onSubmit={handleSignUp}>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded"
              required
            />
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
              Sign Up
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmSignUp}>
            <input
              type="text"
              placeholder="Confirmation Code"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Confirm Sign Up
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUp;
