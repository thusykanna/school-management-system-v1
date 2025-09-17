<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username and password are required']);
        exit;
    }
    
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT * FROM teachers WHERE username = ?");
        $stmt->execute([$username]);
        $teacher = $stmt->fetch();
        
        if ($teacher && password_verify($password, $teacher['password'])) {
            $_SESSION['teacher_id'] = $teacher['id'];
            $_SESSION['teacher_username'] = $teacher['username'];
            $_SESSION['teacher_name'] = $teacher['full_name'];
            
            echo json_encode([
                'success' => true,
                'teacher' => [
                    'id' => $teacher['id'],
                    'username' => $teacher['username'],
                    'full_name' => $teacher['full_name'],
                    'email' => $teacher['email']
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
