<?php
require_once 'config.php';

if (isset($_SESSION['teacher_id'])) {
    echo json_encode(['valid' => true]);
} else {
    echo json_encode(['valid' => false]);
}
?>
