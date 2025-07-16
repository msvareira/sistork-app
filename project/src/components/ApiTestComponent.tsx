import { useState } from 'react';
import { authService } from '../services/auth';
import { apiClient } from '../services/api';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
}

export default function ApiTestComponent() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Health Check
      try {
        const healthData = await apiClient.get('/health');
        testResults.push({
          test: 'Health Check',
          success: true,
          message: 'API is responding',
          data: healthData
        });
      } catch (error) {
        testResults.push({
          test: 'Health Check',
          success: false,
          message: `Failed: ${error}`
        });
      }

      // Test 2: Login
      try {
        const loginData = await authService.login({
          email: 'admin@sistork.com',
          password: 'admin123'
        });
        testResults.push({
          test: 'Login',
          success: true,
          message: 'Login successful',
          data: { user: loginData.user.name, token: '***' }
        });
      } catch (error) {
        testResults.push({
          test: 'Login',
          success: false,
          message: `Failed: ${error}`
        });
      }

      // Test 3: Get Current User (Protected Route)
      try {
        const userData = await authService.getCurrentUser();
        testResults.push({
          test: 'Get Current User',
          success: true,
          message: 'Protected route accessible',
          data: userData
        });
      } catch (error) {
        testResults.push({
          test: 'Get Current User',
          success: false,
          message: `Failed: ${error}`
        });
      }

      // Test 4: Get Users List
      try {
        const usersData = await apiClient.get<any>('/users');
        testResults.push({
          test: 'Get Users List',
          success: true,
          message: `Found ${usersData.data?.length || 0} users`,
          data: usersData
        });
      } catch (error) {
        testResults.push({
          test: 'Get Users List',
          success: false,
          message: `Failed: ${error}`
        });
      }

    } catch (error) {
      console.error('Test suite failed:', error);
    }

    setResults(testResults);
    setIsLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🔧 API Connection Test
        </h2>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={runTests}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md font-medium ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Running Tests...' : 'Run API Tests'}
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear Results
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Test Results:</h3>
            
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  result.success
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${
                    result.success ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium text-gray-900">
                    {result.test}
                  </span>
                  <span className={`text-sm ${
                    result.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.success ? '✅ PASSED' : '❌ FAILED'}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-2">{result.message}</p>
                
                {result.data && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      View Response Data
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Test Credentials:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Email:</strong> admin@sistork.com</p>
            <p><strong>Password:</strong> admin123</p>
            <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
