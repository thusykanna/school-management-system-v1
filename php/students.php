<?php
require_once 'config.php';

// Check if user is authenticated
if (!isset($_SESSION['teacher_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $pdo = getDBConnection();
    
    switch ($method) {
        case 'GET':
            if ($action === 'view' && isset($_GET['id'])) {
                // Get single student with subjects
                $stmt = $pdo->prepare("
                    SELECT s.*, 
                           GROUP_CONCAT(sub.subject_name) as subjects
                    FROM students s
                    LEFT JOIN enrollments e ON s.id = e.student_id
                    LEFT JOIN subjects sub ON e.subject_id = sub.id
                    WHERE s.id = ?
                    GROUP BY s.id
                ");
                $stmt->execute([$_GET['id']]);
                $student = $stmt->fetch();
                
                if ($student) {
                    $student['subjects'] = $student['subjects'] ? explode(',', $student['subjects']) : [];
                    echo json_encode(['success' => true, 'student' => $student, 'subjects' => $student['subjects']]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Student not found']);
                }
            } else {
                // Get all students
                $stmt = $pdo->query("SELECT * FROM students ORDER BY first_name, last_name");
                $students = $stmt->fetchAll();
                echo json_encode(['success' => true, 'students' => $students]);
            }
            break;
            
        case 'POST':
            if ($action === 'create') {
                // Create new student
                $stmt = $pdo->prepare("
                    INSERT INTO students (student_id, first_name, last_name, email, phone, address, date_of_birth, grade_level)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $_POST['student_id'],
                    $_POST['first_name'],
                    $_POST['last_name'],
                    $_POST['email'] ?: null,
                    $_POST['phone'] ?: null,
                    $_POST['address'] ?: null,
                    $_POST['date_of_birth'] ?: null,
                    $_POST['grade_level']
                ]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Student created successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create student']);
                }
                
            } elseif ($action === 'update' && isset($_GET['id'])) {
                // Update existing student
                $stmt = $pdo->prepare("
                    UPDATE students 
                    SET student_id = ?, first_name = ?, last_name = ?, email = ?, 
                        phone = ?, address = ?, date_of_birth = ?, grade_level = ?
                    WHERE id = ?
                ");
                
                $result = $stmt->execute([
                    $_POST['student_id'],
                    $_POST['first_name'],
                    $_POST['last_name'],
                    $_POST['email'] ?: null,
                    $_POST['phone'] ?: null,
                    $_POST['address'] ?: null,
                    $_POST['date_of_birth'] ?: null,
                    $_POST['grade_level'],
                    $_GET['id']
                ]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Student updated successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update student']);
                }
            }
            break;
            
        case 'DELETE':
            if ($action === 'delete' && isset($_GET['id'])) {
                // Delete student (cascading deletes will handle enrollments and marks)
                $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
                $result = $stmt->execute([$_GET['id']]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Student deleted successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete student']);
                }
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
    
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(['success' => false, 'message' => 'Student ID already exists']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
