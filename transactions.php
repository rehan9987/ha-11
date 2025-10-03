<?php
header('Content-Type: application/json');

// File to store transactions
$dataFile = 'transactions_data.json';

// Helper: Read all transactions
function readTransactions($file) {
    if (!file_exists($file)) return [];
    $json = file_get_contents($file);
    return $json ? json_decode($json, true) : [];
}

// Helper: Write all transactions
function writeTransactions($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get ID if present
$id = isset($_GET['id']) ? $_GET['id'] : null;

// Handle GET: Return all transactions
if ($method === 'GET') {
    echo json_encode(readTransactions($dataFile));
    exit;
}

// Handle POST: Add new transaction
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $transactions = readTransactions($dataFile);
    $newId = count($transactions) ? (max(array_column($transactions, 'id')) + 1) : 1;
    $transaction = [
        'id' => strval($newId),
        'amount' => intval($input['amount']),
        'type' => $input['type'],
        'category' => $input['category'],
        'description' => $input['description'],
        'date' => date('c')
    ];
    $transactions[] = $transaction;
    writeTransactions($dataFile, $transactions);
    echo json_encode($transaction);
    exit;
}

// Handle PUT: Update transaction
if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    $transactions = readTransactions($dataFile);
    foreach ($transactions as &$t) {
        if ($t['id'] === $id) {
            $t['amount'] = intval($input['amount']);
            $t['type'] = $input['type'];
            $t['category'] = $input['category'];
            $t['description'] = $input['description'];
            // Keep original date
        }
    }
    writeTransactions($dataFile, $transactions);
    echo json_encode(['status' => 'updated']);
    exit;
}

// Handle DELETE: Remove transaction
if ($method === 'DELETE' && $id) {
    $transactions = readTransactions($dataFile);
    $transactions = array_filter($transactions, function($t) use ($id) {
        return $t['id'] !== $id;
    });
    writeTransactions($dataFile, array_values($transactions));
    echo json_encode(['status' => 'deleted']);
    exit;
}

// If no valid method
http_response_code(400);
echo json_encode(['error' => 'Invalid request']);
