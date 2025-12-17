<?php


require_once 'db.php';
session_start();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_all':
        get_all_products();
        break;
    
    case 'get':
        $id = $_GET['id'] ?? null;
        if ($id) {
            get_product($id);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Product ID is required']);
        }
        break;
    
    case 'create':
        if ($method == 'POST' && isset($_SESSION['is_admin']) && $_SESSION['is_admin']) {
            create_product();
        } else {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Admin access required']);
        }
        break;
    
    case 'update':
        if ($method == 'PUT' && isset($_SESSION['is_admin']) && $_SESSION['is_admin']) {
            update_product();
        } else {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Admin access required']);
        }
        break;
    
    case 'delete':
        if ($method == 'DELETE' && isset($_SESSION['is_admin']) && $_SESSION['is_admin']) {
            delete_product();
        } else {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Admin access required']);
        }
        break;
    
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function get_all_products() {
    global $conn;
    
    $result = $conn->query("SELECT id, name, description, price, category, stock, image_url FROM products ORDER BY created_at DESC");
    
    if ($result === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        return;
    }
    
    if ($result->num_rows > 0) {
        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $products]);
    } else {
        echo json_encode(['success' => true, 'data' => []]);
    }
}

function get_product($id) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT id, name, description, price, category, stock, image_url FROM products WHERE id = ?");
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        return;
    }
    
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows == 1) {
        echo json_encode(['success' => true, 'data' => $result->fetch_assoc()]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Product not found']);
    }
}

function create_product() {
    global $conn;
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $name = sanitize_input($data['name'] ?? '');
    $description = sanitize_input($data['description'] ?? '');
    $price = floatval($data['price'] ?? 0);
    $category = sanitize_input($data['category'] ?? '');
    $stock = intval($data['stock'] ?? 0);
    $image_url = sanitize_input($data['image_url'] ?? '');
    
    if (empty($name) || $price < 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Name and price are required']);
        return;
    }
    
    $stmt = $conn->prepare("INSERT INTO products (name, description, price, category, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)");
    // types: name(s), description(s), price(d), category(s), stock(i), image_url(s)
    $stmt->bind_param("ssdsis", $name, $description, $price, $category, $stock, $image_url);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Product created', 'product_id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create product']);
    }
}

function update_product() {
    global $conn;
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id = intval($data['id'] ?? 0);
    $name = sanitize_input($data['name'] ?? '');
    $description = sanitize_input($data['description'] ?? '');
    $price = floatval($data['price'] ?? 0);
    $category = sanitize_input($data['category'] ?? '');
    $stock = intval($data['stock'] ?? 0);
    $image_url = sanitize_input($data['image_url'] ?? '');
    
    if (!$id || empty($name) || $price < 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID, name, and price are required']);
        return;
    }
    
    $stmt = $conn->prepare("UPDATE products SET name=?, description=?, price=?, category=?, stock=?, image_url=? WHERE id=?");
    // types: name(s), description(s), price(d), category(s), stock(i), image_url(s), id(i)
    $stmt->bind_param("ssdsisi", $name, $description, $price, $category, $stock, $image_url, $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Product updated']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update product']);
    }
}

function delete_product() {
    global $conn;
    
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($data['id'] ?? 0);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID is required']);
        return;
    }
    
    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Product deleted']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete product']);
    }
}
?>
