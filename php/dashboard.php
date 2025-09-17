<?php
require_once 'config.php';

// Check if user is authenticated
if (!isset($_SESSION['teacher_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Get statistics
    $stats = [];
    
    // Total students
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM students");
    $stats['total_students'] = $stmt->fetch()['count'];
    
    // Total subjects
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM subjects");
    $stats['total_subjects'] = $stmt->fetch()['count'];
    
    // Total enrollments
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM enrollments");
    $stats['total_enrollments'] = $stmt->fetch()['count'];
    
    // Average grade
    $stmt = $pdo->query("SELECT AVG(marks) as avg_marks FROM marks");
    $avgMarks = $stmt->fetch()['avg_marks'];
    
    if ($avgMarks) {
        if ($avgMarks >= 75) $stats['average_grade'] = 'A';
        elseif ($avgMarks >= 60) $stats['average_grade'] = 'B';
        elseif ($avgMarks >= 40) $stats['average_grade'] = 'S';
        else $stats['average_grade'] = 'F';
    } else {
        $stats['average_grade'] = 'N/A';
    }
    
    echo json_encode(['success' => true, 'stats' => $stats]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
