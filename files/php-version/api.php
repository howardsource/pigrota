<?php
/**
 * The Blue Pig - Volunteer Rota
 * API Endpoints
 */

require_once 'config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$db = getDB();

switch ($action) {
    // SHIFTS
    case 'get_shifts':
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate = $_GET['end_date'] ?? date('Y-m-t');
        
        $stmt = $db->prepare("SELECT * FROM shifts WHERE date BETWEEN ? AND ? ORDER BY date, shift_type");
        $stmt->execute([$startDate, $endDate]);
        echo json_encode($stmt->fetchAll());
        break;
        
    case 'add_shift':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("INSERT INTO shifts (volunteer_name, subtitle, date, shift_type, custom_start_time, custom_end_time) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['volunteer_name'] ?? null,
            $data['subtitle'] ?? null,
            $data['date'],
            $data['shift_type'],
            $data['custom_start_time'] ?? null,
            $data['custom_end_time'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        break;
        
    case 'delete_shift':
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        
        $stmt = $db->prepare("DELETE FROM shifts WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
        break;
        
    // EVENTS
    case 'get_events':
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate = $_GET['end_date'] ?? date('Y-m-t');
        
        $stmt = $db->prepare("SELECT * FROM events WHERE date BETWEEN ? AND ? ORDER BY date, start_time");
        $stmt->execute([$startDate, $endDate]);
        echo json_encode($stmt->fetchAll());
        break;
        
    case 'add_event':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("INSERT INTO events (title, date, start_time, end_time) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['title'],
            $data['date'],
            $data['start_time'],
            $data['end_time']
        ]);
        
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        break;
        
    case 'delete_event':
        $id = $_GET['id'] ?? $_POST['id'] ?? 0;
        
        $stmt = $db->prepare("DELETE FROM events WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}
