// Example API usage scripts
// Run with: node examples/api-examples.js

const BASE_URL = 'http://localhost:3000/api/v1';

// Helper function to make HTTP requests
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.message || data.error}`);
  }

  return data;
}

// Example 1: Create a new user
async function createUser() {
  console.log('Creating a new user...');
  
  try {
    const userData = {
      email: 'john.doe@example.com',
      name: 'John Doe',
      age: 30,
    };

    const result = await makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    console.log('✅ User created successfully:', result.data);
    return result.data.id;
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    throw error;
  }
}

// Example 2: Get all users
async function getAllUsers() {
  console.log('Getting all users...');
  
  try {
    const result = await makeRequest('/users');
    console.log('✅ Users retrieved successfully:', result.data);
    console.log(`Total users: ${result.count}`);
    return result.data;
  } catch (error) {
    console.error('❌ Error getting users:', error.message);
    throw error;
  }
}

// Example 3: Get users with filters
async function getUsersWithFilters() {
  console.log('Getting users with filters...');
  
  try {
    const result = await makeRequest('/users?minAge=25&limit=5');
    console.log('✅ Filtered users retrieved successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error getting filtered users:', error.message);
    throw error;
  }
}

// Example 4: Get user by ID
async function getUserById(userId) {
  console.log(`Getting user with ID: ${userId}...`);
  
  try {
    const result = await makeRequest(`/users/${userId}`);
    console.log('✅ User retrieved successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error getting user:', error.message);
    throw error;
  }
}

// Example 5: Update user
async function updateUser(userId) {
  console.log(`Updating user with ID: ${userId}...`);
  
  try {
    const updateData = {
      name: 'John Smith',
      age: 31,
    };

    const result = await makeRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    console.log('✅ User updated successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    throw error;
  }
}

// Example 6: Delete user
async function deleteUser(userId) {
  console.log(`Deleting user with ID: ${userId}...`);
  
  try {
    const result = await makeRequest(`/users/${userId}`, {
      method: 'DELETE',
    });

    console.log('✅ User deleted successfully:', result.message);
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    throw error;
  }
}

// Example 7: Error handling examples
async function demonstrateErrorHandling() {
  console.log('Demonstrating error handling...');
  
  try {
    // Try to create a user with invalid data
    await makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        name: '',
        age: -5,
      }),
    });
  } catch (error) {
    console.log('✅ Validation error caught:', error.message);
  }

  try {
    // Try to get a non-existent user
    await makeRequest('/users/non-existent-id');
  } catch (error) {
    console.log('✅ Not found error caught:', error.message);
  }
}

// Main function to run all examples
async function runExamples() {
  console.log('🚀 Starting API Examples...\n');
  
  try {
    // Create a user
    const userId = await createUser();
    console.log('\n' + '='.repeat(50) + '\n');

    // Get all users
    await getAllUsers();
    console.log('\n' + '='.repeat(50) + '\n');

    // Get users with filters
    await getUsersWithFilters();
    console.log('\n' + '='.repeat(50) + '\n');

    // Get specific user
    await getUserById(userId);
    console.log('\n' + '='.repeat(50) + '\n');

    // Update user
    await updateUser(userId);
    console.log('\n' + '='.repeat(50) + '\n');

    // Get updated user
    await getUserById(userId);
    console.log('\n' + '='.repeat(50) + '\n');

    // Demonstrate error handling
    await demonstrateErrorHandling();
    console.log('\n' + '='.repeat(50) + '\n');

    // Delete user
    await deleteUser(userId);
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('🎉 All examples completed successfully!');
  } catch (error) {
    console.error('💥 Example failed:', error.message);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

module.exports = {
  createUser,
  getAllUsers,
  getUsersWithFilters,
  getUserById,
  updateUser,
  deleteUser,
  demonstrateErrorHandling,
  runExamples,
}; 