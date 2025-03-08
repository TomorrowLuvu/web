
// User authentication and permissions management
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123"; // Change this in production
const ADMIN_PERMISSIONS = ["view", "download", "delete", "manage_permissions", "edit_info", "unlock_info"];

// Store users in localStorage
let users = JSON.parse(localStorage.getItem('users') || '[]');

// Initialize admin account if it doesn't exist
function initializeAdmin() {
  if (!users.find(user => user.username === ADMIN_USERNAME)) {
    users.push({
      id: "admin-" + Date.now(),
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      permissions: ADMIN_PERMISSIONS,
      isAdmin: true
    });
    saveUsers();
    console.log("Admin account initialized");
  }
}

function saveUsers() {
  localStorage.setItem('users', JSON.stringify(users));
}

function registerUser(username, password) {
  // Check if username already exists
  if (users.find(user => user.username === username)) {
    return { success: false, message: "Tên đăng nhập đã tồn tại" };
  }
  
  // Create new user with default permissions
  const newUser = {
    id: "user-" + Date.now(),
    username: username,
    password: password,
    permissions: [], // No permissions by default
    isAdmin: false
  };
  
  users.push(newUser);
  saveUsers();
  
  return { success: true, user: { ...newUser, password: undefined } };
}

function loginUser(username, password) {
  const user = users.find(user => 
    user.username === username && user.password === password
  );
  
  if (user) {
    // Don't return password to client
    const userInfo = { ...user };
    delete userInfo.password;
    return { success: true, user: userInfo };
  } else {
    return { success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng" };
  }
}

function updateUserPermissions(userId, permissions) {
  const userIndex = users.findIndex(user => user.id === userId);
  if (userIndex === -1) return false;
  
  users[userIndex].permissions = permissions;
  saveUsers();
  return true;
}

function getUsersWithEditPermission() {
  return users.filter(user => 
    user.permissions.includes('edit_info') || user.isAdmin
  ).map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}

function isUserLocked(userId) {
  const user = users.find(user => user.id === userId);
  return user ? user.locked === true : false;
}

function lockUser(userId) {
  const userIndex = users.findIndex(user => user.id === userId);
  if (userIndex >= 0) {
    users[userIndex].locked = true;
    saveUsers();
    return true;
  }
  return false;
}

function unlockUser(userId) {
  const userIndex = users.findIndex(user => user.id === userId);
  if (userIndex >= 0) {
    users[userIndex].locked = false;
    saveUsers();
    return true;
  }
  return false;
}

function getAllUsers() {
  // Return users without passwords
  return users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}

// Initialize admin on script load
initializeAdmin();

// Export functions
window.userAuth = {
  registerUser,
  loginUser,
  updateUserPermissions,
  getAllUsers,
  getUsersWithEditPermission,
  isUserLocked,
  lockUser,
  unlockUser,
  PERMISSIONS: {
    VIEW: "view",
    DOWNLOAD: "download",
    DELETE: "delete",
    MANAGE_PERMISSIONS: "manage_permissions",
    EDIT_INFO: "edit_info",
    UNLOCK_INFO: "unlock_info"
  }
};
