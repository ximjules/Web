<?php
require_once 'db.php';
session_start();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        if ($method == 'POST') {
            register_user();
        }
        break;
    
    case 'login':
        if ($method == 'POST') {
            login_user();
        }
        break;
    
    case 'logout':
        logout_user();
        break;
    
    case 'get_user':
        if (isset($_SESSION['user_id'])) {
            get_user($_SESSION['user_id']);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Not authenticated']);
        }
        break;
    
    case 'get_all':
        if (isset($_SESSION['is_admin']) && $_SESSION['is_admin']) {
            get_all_users();
        } else {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Admin access required']);
        }
        break;
    
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function register_user() {
    global $conn;
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $username = sanitize_input($data['username'] ?? '');
    $email = sanitize_input($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $full_name = sanitize_input($data['full_name'] ?? '');
    
    if (empty($username) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        return;
    }
    
    // Check if user already exists
    $check = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $check->bind_param("ss", $username, $email);
    $check->execute();
    
    if ($check->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Username or email already exists']);
        return;
    }
    
    $hashed_password = hash_password($password);
    
    $stmt = $conn->prepare("INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $username, $email, $hashed_password, $full_name);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User registered successfully', 'user_id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Registration failed']);
    }
}

function login_user() {
    global $conn;
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $username = sanitize_input($data['username'] ?? '');
    $password = $data['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username and password are required']);
        return;
    }
    
    $stmt = $conn->prepare("SELECT id, password, is_admin FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows == 1) {
        $user = $result->fetch_assoc();
        
        if (verify_password($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $username;
            $_SESSION['is_admin'] = $user['is_admin'];
            
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user_id' => $user['id'],
                'is_admin' => $user['is_admin']
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        }
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
}

function logout_user() {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

function get_user($user_id) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT id, username, email, full_name, is_admin, created_at FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows == 1) {
        echo json_encode(['success' => true, 'data' => $result->fetch_assoc()]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
}

function get_all_users() {
    global $conn;
    
    $result = $conn->query("SELECT id, username, email, full_name, is_admin, created_at FROM users");
    
    if ($result === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        return;
    }
    
    if ($result->num_rows > 0) {
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $users]);
    } else {
        echo json_encode(['success' => true, 'data' => []]);
    }
}
?>
