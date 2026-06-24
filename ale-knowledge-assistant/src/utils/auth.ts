// Utility functions for local authentication using Web Crypto API and localStorage

export interface User {
  name: string;
  email: string;
  department: string;
}

// Simple SHA-256 hash using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function registerUser(user: User, passwordRaw: string): Promise<User> {
  const usersStr = localStorage.getItem('ale_users');
  const users = usersStr ? JSON.parse(usersStr) : {};

  if (users[user.email]) {
    throw new Error('User with this email already exists.');
  }

  if (passwordRaw.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const hashedPassword = await hashPassword(passwordRaw);

  users[user.email] = {
    ...user,
    password: hashedPassword,
  };

  localStorage.setItem('ale_users', JSON.stringify(users));
  
  return user;
}

export async function loginUser(email: string, passwordRaw: string): Promise<User> {
  const usersStr = localStorage.getItem('ale_users');
  if (!usersStr) {
    throw new Error('No registered users found. Please sign up.');
  }
  const users = JSON.parse(usersStr);
  const userRecord = users[email];

  if (!userRecord) {
    throw new Error('Invalid email or password.');
  }

  const hashedPassword = await hashPassword(passwordRaw);
  if (userRecord.password !== hashedPassword) {
    throw new Error('Invalid email or password.');
  }

  return {
    name: userRecord.name,
    email: userRecord.email,
    department: userRecord.department,
  };
}
