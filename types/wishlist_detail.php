<?php
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_secure', '1');
session_start();
error_log('SESSION ID: ' . session_id());
// Debug: Log request method and POST data
file_put_contents(__DIR__ . '/wishlist_debug.log', date('c') . " METHOD: " .
    $_SERVER['REQUEST_METHOD'] . "\nPOST: " . print_r($_POST, true) . "\n\n", FILE_APPEND);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_POST['amount']) && empty($_POST['phone'])) {
    echo '<div style="color:red;text-align:center;margin-top:2em;">Warning: POST request detected but no support form data. This may indicate a browser or extension issue.</div>';
}

require_once __DIR__ . '/../config/db_functions.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/zeno_config.php';

$uuid = isset($_GET['uuid']) ? $_GET['uuid'] : '';
if (!$uuid) {
    echo '<div class="text-center py-20 text-gray-400">Wishlist item not found.</div>';
    exit;
}

// Handle payment status messages
$status = $_GET['status'] ?? null;
$message = $_GET['message'] ?? null;
$status_message = '';

// Only show inline messages for errors and timeouts, not for success
if ($status === 'error') {
    if ($message === 'invalid_session') {
        $status_message = '<div class="mb-4 p-3 rounded bg-red-100 text-red-700 border border-red-300">Invalid payment session. Please try again.</div>';
    } else {
        $status_message = '<div class="mb-4 p-3 rounded bg-red-100 text-red-700 border border-red-300">Payment failed. Please try again.</div>';
    }
} elseif ($status === 'timeout') {
    $status_message = '<div class="mb-4 p-3 rounded bg-yellow-100 text-yellow-700 border border-yellow-300">Payment timed out. Please try again.</div>';
}

$item = db_select_one("SELECT * FROM wishlist WHERE uuid = ?", [$uuid]);
if (!$item) {
    echo '<div class="text-center py-20 text-gray-400">Wishlist item not found.</div>';
    exit;
}
$creator = db_select_one("SELECT * FROM profiles WHERE user_id = ?", [$item->user_id]);
$images = db_select("SELECT image_url FROM wishlist_images WHERE wishlist_id = ?", [$item->id]);
$image_urls = array_map(function($img) { return $img->image_url; }, $images);
$main_image = $image_urls[0] ?? '/creator/assets/wishlist_images/default.webp';
$funded = db_select_one("SELECT COALESCE(SUM(amount), 0) as funded FROM supporters WHERE wishlist_id = ? AND type = 'wishlist' AND status = 'completed'", [$item->id])->funded ?? 0;
$progress = ($item->price > 0) ? min(100, round(($funded / $item->price) * 100)) : 0;
$remaining = max(0, $item->price - $funded);

// Fetch supporters for this wishlist (only completed)
$supporters = db_select("SELECT name, amount, created_at FROM supporters WHERE wishlist_id = ? AND type = 'wishlist' AND status = 'completed' ORDER BY created_at DESC", [$item->id]);

// For supporter count, use all completed transactions (not unique phones)
$supporter_count = db_select_one("SELECT COUNT(*) as count FROM supporters WHERE wishlist_id = ? AND type = 'wishlist' AND status = 'completed'", [$item->id])->count ?? 0;

// Payment POST logic for wishlist
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if ($funded >= $item->price) {
            throw new Exception('This wish is already fully funded!');
        }
        
        $amount = filter_input(INPUT_POST, 'amount', FILTER_VALIDATE_INT);
        $paymentMethod = $_POST['payment_method'] ?? 'mobile';
        
        if (!$amount || $amount < 1000) {
            throw new Exception('Amount must be at least 1,000 TZS');
        }
        
        if ($paymentMethod === 'mobile') {
            // Mobile Money Payment
            $phone = trim($_POST['phone']);
            $name = trim($_POST['name'] ?? 'Anonymous');
            
            if (!$phone || !$name) {
                throw new Exception('Phone number and name are required for mobile money payment');
            }
            
            // Format phone number for Tanzania
            if (strlen($phone) === 10 && substr($phone, 0, 1) === '0') {
                $phone = '255' . substr($phone, 1);
            } elseif (strlen($phone) === 9) {
                $phone = '255' . $phone;
            }
            
            // Create mobile money payment order with new ZenoPay API
            $webhookUrl = 'https://' . $_SERVER['HTTP_HOST'] . '/creator/webhook.php';
            $metadata = [
                'wishlist_id' => $item->id,
                'wishlist_uuid' => $item->uuid,
                'type' => 'wishlist',
                'payment_type' => 'mobile',
                'currency' => 'TZS',
                'country' => 'TZ'
            ];
            
            $data = createZenoPaymentOrder('customer@example.com', $name, $phone, $amount, $webhookUrl, $metadata);
            
        } elseif ($paymentMethod === 'card') {
            // Card Payment
            $buyerName = trim($_POST['buyer_name'] ?? 'Anonymous');
            $buyerEmail = trim($_POST['buyer_email'] ?? 'customer@example.com');
            $buyerPhone = trim($_POST['buyer_phone'] ?? '');
            
            if (!$buyerName || !$buyerEmail) {
                throw new Exception('Name and email are required for card payment');
            }
            
            // Create card payment with new ZenoPay API
            $webhookUrl = 'https://' . $_SERVER['HTTP_HOST'] . '/creator/webhook.php';
            $redirectUrl = 'https://' . $_SERVER['HTTP_HOST'] . '/creator/payment_success_wishlist.php?uuid=' . urlencode($item->uuid);
            $cancelUrl = 'https://' . $_SERVER['HTTP_HOST'] . '/creator/wishlist_detail.php?uuid=' . urlencode($item->uuid);
            
            $metadata = [
                'wishlist_id' => $item->id,
                'wishlist_uuid' => $item->uuid,
                'type' => 'wishlist',
                'payment_type' => 'card',
                'currency' => 'TZS',
                'country' => 'TZ'
            ];
            
            $data = createZenoCardPayment($amount, $buyerName, $buyerEmail, $buyerPhone, $webhookUrl, $redirectUrl, $cancelUrl, $metadata, 'TZS');
            
            // Store wishlist info in session for card payment
            $_SESSION['wishlist_card_payment'] = [
                'amount' => $amount,
                'buyer_name' => $buyerName,
                'buyer_email' => $buyerEmail,
                'buyer_phone' => $buyerPhone,
                'creator_id' => $creator->user_id,
                'username' => $creator->username,
                'wishlist_id' => $item->id,
                'wishlist_uuid' => $item->uuid,
                'currency' => 'TZS',
                'country' => 'TZ'
            ];
            
            // Redirect to ZenoPay checkout page
            header('Location: ' . $data['payment_link']);
            exit;
        }
        
        // Store pending payment in session (for mobile money)
        $_SESSION['pending_payment'] = [
            'order_id' => $data['order_id'],
            'creator_id' => $creator->user_id,
            'wishlist_id' => $item->id,
            'wishlist_uuid' => $item->uuid,
            'amount' => $amount,
            'phone' => $phone ?? '',
            'name' => $name ?? '',
            'start_time' => time()
        ];
        
        // Insert pending supporter record
        db_insert('supporters', [
            'creator_id' => $creator->user_id,
            'name' => $name ?? $buyerName ?? 'Anonymous',
            'phone' => $phone ?? $buyerPhone ?? '',
            'amount' => $amount,
            'order_id' => $data['order_id'],
            'status' => 'pending',
            'wishlist_id' => $item->id,
            'wishlist_uuid' => $item->uuid,
            'type' => 'wishlist',
            'payment_method' => $paymentMethod,
            'currency' => 'TZS',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        // For mobile money, return JSON response to show processing popup
        if ($paymentMethod === 'mobile') {
            echo json_encode([
                'status' => 'success',
                'order_id' => $data['order_id'],
                'message' => 'Payment initiated successfully',
                'amount' => $amount
            ]);
            exit;
        }
        
        // For card payments, redirect immediately
        header('Location: payment_loading.php?order_id=' . urlencode($data['order_id']) . '&uuid=' . urlencode($item->uuid));
        exit;
        
    } catch (Exception $e) {
        $error = $e->getMessage();
        error_log("Payment error in wishlist_detail.php: " . $e->getMessage());
    }
}

function get_first_n_words($text, $limit = 200) {
    $words = preg_split('/\s+/', strip_tags($text));
    if (count($words) <= $limit) return implode(' ', $words);
    return implode(' ', array_slice($words, 0, $limit)) . '...';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($item->name) ?> - Wishlist Detail</title>
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?= htmlspecialchars('https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']) ?>">
    <meta property="og:title" content="<?= htmlspecialchars($item->name) ?>">
    <meta property="og:description" content="<?= htmlspecialchars(get_first_n_words($item->description, 200)) ?>">
    <meta property="og:image" content="<?= htmlspecialchars('https://' . $_SERVER['HTTP_HOST'] . $main_image) ?>">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="<?= htmlspecialchars('https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']) ?>">
    <meta name="twitter:title" content="<?= htmlspecialchars($item->name) ?>">
    <meta name="twitter:description" content="<?= htmlspecialchars(get_first_n_words($item->description, 200)) ?>">
    <meta name="twitter:image" content="<?= htmlspecialchars('https://' . $_SERVER['HTTP_HOST'] . $main_image) ?>">

    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .payment-method-btn.active {
            border-color: #f97316 !important;
            background-color: #FFF7F5 !important;
            color: #f97316 !important;
        }
        
        .payment-method-btn:not(.active) {
            border-color: #D1D5DB !important;
            background-color: white !important;
            color: #6B7280 !important;
        }
    </style>
</head>
<body class="min-h-screen bg-white">
    <!-- Header -->
    <header class="w-full bg-white shadow-sm fixed top-0 left-0 z-50">
        <div class="max-w-7xl mx-auto flex flex-row items-center justify-between px-3 md:px-6 py-3 gap-2 md:gap-0">
            <!-- Logo -->
            <a href="/" class="flex items-center gap-2 mb-0">
                <img src="/creator/assets/logo.png" alt="Nisapoti Logo" class="h-10 md:h-8 w-auto object-contain" />
            </a>
            <!-- Auth Buttons -->
            <div class="flex items-center gap-3 mt-2 md:mt-0 w-full md:w-auto justify-end">
                <a href="/login.php" class="px-4 md:px-5 py-2 rounded-full font-semibold text-white md:text-gray-900 md:hover:bg-gray-100 transition md:bg-transparent" style="background:linear-gradient(90deg,#f97316 0%,#fb923c 100%);" onmouseover="if(window.innerWidth>=768)this.style.background='none';" onmouseout="if(window.innerWidth>=768)this.style.background='none';">
                  <span class="md:hidden">Log in</span>
                  <span class="hidden md:inline">Log in</span>
                </a>
                <a href="/signup.php" class="hidden md:inline-block px-5 py-2 rounded-full font-semibold text-white" style="background:linear-gradient(90deg,#f97316 0%,#fb923c 100%);">Sign up</a>
            </div>
        </div>
    </header>
    <div class="h-12 md:h-16"></div> <!-- Spacer for fixed header -->

    <!-- Success Modal -->
    <div id="successModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 opacity-0 pointer-events-none">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center relative transform transition-transform duration-300 scale-95">
            <button onclick="closeSuccessModal()" class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
            <div class="text-5xl mb-4">🎉</div>
            <div class="text-3xl font-bold text-green-600 mb-2">Thank You!</div>
            <div class="text-lg mb-4">Your payment was successful</div>
            <div class="text-2xl font-bold text-orange-500 mb-4">TSH <span id="supportedAmount">0</span></div>
            <div class="mb-2 text-gray-600">Your support means everything!</div>
        </div>
    </div>

    <!-- Processing Payment Modal -->
    <div id="processingModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 opacity-0 pointer-events-none">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center relative transform transition-transform duration-300 scale-95">
            <div class="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Processing Payment</h2>
            <p class="text-gray-600 mb-6">We have sent the USSD prompt to your mobile phone</p>
            <div class="text-sm text-gray-500 mb-4">
                <p>Please complete the payment on your phone</p>
                <p>We are checking the payment status...</p>
            </div>
            <div id="paymentStatus" class="text-sm font-medium text-orange-600">
                Checking payment status...
            </div>
        </div>
    </div>

    <canvas id="confettiCanvas" class="fixed inset-0 pointer-events-none z-50"></canvas>

    <div class="flex justify-center min-h-screen mt-12">
      <div class="flex flex-col lg:flex-row gap-16 custom-flex-row w-full max-w-7xl">
        <!-- Left/Main Column -->
        <div class="flex-1 max-w-2xl w-full mx-auto">
            <div class="bg-white rounded-3xl p-10">
                <div class="mb-6">
                  <div class="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-2 tracking-tight">
                    <?= htmlspecialchars($item->name) ?>
                  </div>
                </div>
                <div class="mb-6 flex flex-col lg:flex-row gap-4 justify-center items-start">
                  <!-- Main Image -->
                  <div class="flex-1 flex items-center justify-center">
                    <img id="mainImage" src="<?= htmlspecialchars($main_image) ?>" class="w-full max-h-96 object-contain rounded-2xl shadow-lg border-2 border-orange-100 bg-white" />
                  </div>
                  <!-- Thumbnails -->
                  <div class="flex flex-row lg:flex-col gap-2 mt-4 lg:mt-0">
                    <?php foreach ($image_urls as $idx => $img): ?>
                      <img
                        src="<?= htmlspecialchars($img) ?>"
                        class="w-14 h-14 object-cover rounded-lg cursor-pointer border-2 <?= $idx === 0 ? 'border-orange-500' : 'border-transparent' ?>"
                        onclick="showMainImage(<?= $idx ?>)"
                        id="thumb-<?= $idx ?>"
                      />
                    <?php endforeach; ?>
                  </div>
                </div>
                <div class="mb-4 flex flex-wrap gap-2">
                    <span class="inline-block px-3 py-1 rounded-full border text-sm font-semibold border-orange-400 text-orange-600 bg-orange-50">
                        <?= htmlspecialchars($item->category) ?>
                    </span>
                    <?php if (!empty($item->hashtags)): ?>
                        <?php foreach (array_slice(explode(',', $item->hashtags), 0, 3) as $tag): ?>
                            <span class="inline-block px-3 py-1 rounded-full border text-sm font-semibold border-orange-400 text-orange-600 bg-orange-50">
                                <?= htmlspecialchars(trim($tag)) ?>
                            </span>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
                <!-- Co-organised/Creator Info -->
                <div class="flex items-center gap-4 mb-6 mt-4">
                    <img src="<?= htmlspecialchars($creator->avatar_url ?? '/creator/assets/default_avatar.png') ?>" class="w-14 h-14 rounded-full border-2 border-orange-200 shadow" alt="Creator Avatar">
                    <div>
                        <div class="font-bold text-lg text-gray-900"><?= htmlspecialchars($creator->name ?? $creator->username) ?></div>
                        <div class="text-sm text-gray-500"><?= htmlspecialchars($creator->bio ?? 'Creator') ?></div>
                    </div>
                </div>
                <?php
                  $desc = $item->description;
                  $desc_short = mb_substr($desc, 0, 200);
                  $is_long = mb_strlen($desc) > 200;
                ?>
                <div class="mb-2 text-gray-700 text-lg leading-relaxed">
                  <span id="descShort"<?= $is_long ? '' : ' style="display:block;"' ?>><?= nl2br(htmlspecialchars($desc_short)) ?><?= $is_long ? '...' : '' ?></span>
                  <?php if ($is_long): ?>
                    <span id="descFull" style="display:none;"><?= nl2br(htmlspecialchars($desc)) ?></span>
                    <button id="readMoreBtn" class="font-semibold ml-2" style="color:#f97316;background:none;border:none;cursor:pointer;padding:0;" onclick="document.getElementById('descShort').style.display='none';document.getElementById('descFull').style.display='inline';this.style.display='none';return false;">Read more</button>
                  <?php endif; ?>
                </div>
                <?php if (!empty($item->link)): ?>
                  <a href="<?= htmlspecialchars($item->link) ?>" target="_blank" rel="noopener" class="inline-block mt-4 px-6 py-3 rounded-xl font-bold text-white" style="background:linear-gradient(90deg,#f97316 0%,#fb923c 100%);">View Product</a>
                <?php endif; ?>
            </div>
        </div>

        <!-- Right/Sidebar -->
        <div class="w-full lg:w-96 flex-shrink-0 lg:mr-24">
            <div class="bg-white rounded-3xl shadow-2xl p-8 mb-8 lg:sticky lg:top-24">
                <!-- Amount Raised and Progress -->
                <div class="flex items-center gap-4 mb-6">
                    <div class="relative w-20 h-20">
                        <?php $percent = $item->price > 0 ? min(100, round(($funded / $item->price) * 100)) : 0; ?>
                        <svg class="w-20 h-20" viewBox="0 0 40 40">
                            <defs>
                              <linearGradient id="circleGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#f97316" />
                                <stop offset="100%" stop-color="#fb923c" />
                              </linearGradient>
                            </defs>
                            <circle cx="20" cy="20" r="18" fill="none" stroke="#f3f4f6" stroke-width="4" />
                            <circle cx="20" cy="20" r="18" fill="none" stroke="url(#circleGradient)" stroke-width="4" stroke-dasharray="113" stroke-dashoffset="<?= 113 - (113 * $percent / 100) ?>" stroke-linecap="round" />
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center text-lg font-bold text-black">
                            <?= $percent ?>%
                        </div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-gray-900">TSH <?= number_format($funded) ?></div>
                        <div class="text-gray-500 text-sm">of TSH <?= number_format($item->price) ?> target</div>
                        <div class="text-green-600 font-semibold text-sm mt-1">TSH <?= number_format($remaining) ?> remaining</div>
                    </div>
                </div>
                <!-- Supporters Count -->
                <div class="flex items-center gap-3 mb-6">
                  <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white border border-orange-200">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M17 7L7 17M17 7h-6m6 0v6" stroke="#f97315" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <span class="font-semibold text-lg text-[#f97315]"><?= $supporter_count ?> people have supported</span>
                </div>
                <div class="mb-6">
                  <button id="shareBtn" class="w-full py-3 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2" style="background:linear-gradient(90deg,#f97316 0%,#fb923c 100%);">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 8.25V6a2.25 2.25 0 0 0-2.25-2.25h-6A2.25 2.25 0 0 0 4.5 6v12A2.25 2.25 0 0 0 6.75 20.25h6A2.25 2.25 0 0 0 15 18v-2.25m3-4.5-4.5-4.5m4.5 4.5-4.5 4.5m4.5-4.5H9" /></svg>
                    <span>Share</span>
                  </button>
                  <div id="shareMsg" class="hidden text-center text-sm text-[#f97315] font-semibold">Link copied!</div>
                </div>
                <script>
                  document.addEventListener('DOMContentLoaded', function() {
                    var shareBtn = document.getElementById('shareBtn');
                    var shareMsg = document.getElementById('shareMsg');
                    if (shareBtn) {
                      shareBtn.addEventListener('click', function() {
                        var url = window.location.href; // TODO: Replace with short link if available
                        navigator.clipboard.writeText(url).then(function() {
                          shareMsg.classList.remove('hidden');
                          setTimeout(function() {
                            shareMsg.classList.add('hidden');
                          }, 1500);
                        });
                      });
                    }
                  });
                </script>
                <!-- Payment/Support Form -->
                <div class="mt-8">
                    <div class="text-lg font-bold mb-3">Support this wish</div>
                    
                    <!-- Payment Method Selection -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                        <div class="grid grid-cols-2 gap-3">
                            <button type="button" 
                                    id="mobileMoneyBtn" 
                                    class="payment-method-btn active px-4 py-3 rounded-xl border-2 border-orange-400 bg-orange-50 text-orange-600 font-medium transition-all duration-200">
                                <div class="flex items-center justify-center space-x-2">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 002 2v14a2 2 0 002 2z"></path>
                                    </svg>
                                    <span>Mobile Money</span>
                                </div>
                            </button>
                            <button type="button" 
                                    id="cardBtn" 
                                    class="payment-method-btn px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-600 font-medium transition-all duration-200">
                                <div class="flex items-center justify-center space-x-2">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 003 3v8a3 3 0 003 3z"></path>
                                    </svg>
                                    <span>Card</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <form id="payForm" method="POST" class="space-y-4">
                        <input type="hidden" name="wishlist_id" value="<?= $item->id ?>">
                        <input type="hidden" id="payment-method" name="payment_method" value="mobile">
                        
                        <!-- Amount Input Field -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-3">Amount to Support</label>
                            <div class="flex justify-between gap-2 mb-2">
                                <button type="button" class="quick-amount-btn flex-1 px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-200" style="border-color:#f97316;color:#f97316;background:#fff;" data-amount="5000">TSH 5,000</button>
                                <button type="button" class="quick-amount-btn flex-1 px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-200" style="border-color:#f97316;color:#f97316;background:#fff;" data-amount="10000">TSH 10,000</button>
                                <button type="button" class="quick-amount-btn flex-1 px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-200" style="border-color:#f97316;color:#f97316;background:#fff;" data-amount="50000">TSH 50,000</button>
                            </div>
                            <input type="number" name="amount" id="custom-amount" min="1000" step="100" required placeholder="Enter custom amount (TSH)" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition" />
                        </div>
                        
                        <!-- Mobile Money Fields -->
                        <div id="mobileMoneyFields" class="space-y-4">
                            <input type="tel" name="phone" required pattern="[0-9]{10,}" placeholder="Phone number (e.g., 0712345678)" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition" />
                            <input type="text" name="name" required placeholder="Your name" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition" />
                        </div>
                        
                        <!-- Card Payment Fields -->
                        <div id="cardFields" class="space-y-4 hidden">
                            <input type="email" name="buyer_email" required placeholder="Email address" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition" />
                            <input type="text" name="buyer_name" required placeholder="Your name" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition" />
                            <input type="tel" name="buyer_phone" placeholder="Phone number (optional)" pattern="[0-9]{10,}" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition" />
                        </div>
                        
                        <button type="submit" class="w-full py-3 rounded-xl text-white font-bold text-xl flex items-center justify-center" style="background:linear-gradient(90deg,#f97316 0%,#fb923c 100%);">Support this wish</button>
                    </form>
                    <div id="payStatus" class="mt-3 text-center text-sm"></div>
                </div>
            </div>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <script>
    // Carousel logic
    var imageUrls = <?= json_encode($image_urls) ?>;
    function showMainImage(idx) {
        document.getElementById('mainImage').src = imageUrls[idx];
        imageUrls.forEach((_, i) => {
            document.getElementById('thumb-' + i).classList.toggle('border-orange-500', i === idx);
            document.getElementById('thumb-' + i).classList.toggle('border-transparent', i !== idx);
        });
    }
    // Quick amount button logic
    document.querySelectorAll('.quick-amount-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.getElementById('custom-amount').value = this.getAttribute('data-amount');
            document.querySelectorAll('.quick-amount-btn').forEach(function(b) {
                b.style.background = '#fff';
                b.style.color = '#f97316';
                b.style.borderColor = '#f97316';
            });
            this.style.background = '#f97316';
            this.style.color = '#fff';
            this.style.borderColor = '#f97316';
        });
    });

    function showSuccessModal(amount) {
        const modal = document.getElementById('successModal');
        const amountEl = document.getElementById('supportedAmount');
        
        // Set amount
        amountEl.textContent = parseInt(amount).toLocaleString();
        
        // Show modal with animation
        modal.classList.remove('pointer-events-none');
        modal.classList.add('opacity-100');
        modal.querySelector('div').classList.add('scale-100');
        modal.querySelector('div').classList.remove('scale-95');
        
        // Setup confetti
        const confettiCanvas = document.getElementById('confettiCanvas');
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        
        // Multiple confetti bursts
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });

        fire(0.2, {
            spread: 60,
        });

        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });

        // Auto-hide after 8 seconds
        setTimeout(() => {
            closeSuccessModal();
        }, 8000);
    }

    function closeSuccessModal() {
        const modal = document.getElementById('successModal');
        modal.classList.add('pointer-events-none');
        modal.classList.remove('opacity-100');
        modal.querySelector('div').classList.add('scale-95');
        modal.querySelector('div').classList.remove('scale-100');
        // Remove status=success and amount from URL
        if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('status');
            url.searchParams.delete('amount');
            window.history.replaceState({}, document.title, url.pathname + url.search);
        }
    }

    // Check URL parameters for success status
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success') {
        const amount = urlParams.get('amount') || '0';
        // Small delay to ensure animation plays after page load
        setTimeout(() => {
            showSuccessModal(amount);
        }, 300);
    }

    // Payment Method Selection
    document.addEventListener('DOMContentLoaded', function() {
        const mobileMoneyBtn = document.getElementById('mobileMoneyBtn');
        const cardBtn = document.getElementById('cardBtn');
        const mobileMoneyFields = document.getElementById('mobileMoneyFields');
        const cardFields = document.getElementById('cardFields');
        const paymentMethodInput = document.getElementById('payment-method');
        
        if (mobileMoneyBtn && cardBtn) {
            mobileMoneyBtn.addEventListener('click', function() {
                selectPaymentMethod('mobile');
            });
            
            cardBtn.addEventListener('click', function() {
                selectPaymentMethod('card');
            });
        }
        
        // Initialize with mobile money selected
        selectPaymentMethod('mobile');
    });
    
    function selectPaymentMethod(method) {
        const mobileMoneyBtn = document.getElementById('mobileMoneyBtn');
        const cardBtn = document.getElementById('cardBtn');
        const mobileMoneyFields = document.getElementById('mobileMoneyFields');
        const cardFields = document.getElementById('cardFields');
        const paymentMethodInput = document.getElementById('payment-method');
        
        // Get all form inputs
        const phoneInput = document.querySelector('input[name="phone"]');
        const nameInput = document.querySelector('input[name="name"]');
        const buyerEmailInput = document.querySelector('input[name="buyer_email"]');
        const buyerNameInput = document.querySelector('input[name="buyer_name"]');
        const buyerPhoneInput = document.querySelector('input[name="buyer_phone"]');
        
        if (method === 'mobile') {
            // Mobile Money active
            mobileMoneyBtn.classList.add('active');
            cardBtn.classList.remove('active');
            
            // Show mobile money fields, hide card fields
            mobileMoneyFields.classList.remove('hidden');
            cardFields.classList.add('hidden');
            
            // Set required attributes for mobile money fields
            if (phoneInput) phoneInput.required = true;
            if (nameInput) nameInput.required = true;
            
            // Remove required attributes from card fields
            if (buyerEmailInput) buyerEmailInput.required = false;
            if (buyerNameInput) buyerNameInput.required = false;
            if (buyerPhoneInput) buyerPhoneInput.required = false;
            
            // Update hidden input
            if (paymentMethodInput) paymentMethodInput.value = 'mobile';
            
        } else if (method === 'card') {
            // Card Payment active
            cardBtn.classList.add('active');
            mobileMoneyBtn.classList.remove('active');
            
            // Show card fields, hide mobile money fields
            cardFields.classList.remove('hidden');
            mobileMoneyFields.classList.add('hidden');
            
            // Remove required attributes from mobile money fields
            if (phoneInput) phoneInput.required = false;
            if (nameInput) nameInput.required = false;
            
            // Set required attributes for card fields
            if (buyerEmailInput) buyerEmailInput.required = true;
            if (buyerNameInput) buyerNameInput.required = true;
            if (buyerPhoneInput) buyerNameInput.required = false; // Optional for card
            
            // Update hidden input
            if (paymentMethodInput) paymentMethodInput.value = 'card';
        }
    }

    function showProcessingModal() {
        const modal = document.getElementById('processingModal');
        modal.classList.remove('pointer-events-none', 'opacity-0');
        modal.classList.add('opacity-100');
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
    }

    function hideProcessingModal() {
        const modal = document.getElementById('processingModal');
        modal.classList.add('pointer-events-none', 'opacity-0');
        modal.classList.remove('opacity-100');
        modal.querySelector('div').classList.add('scale-95');
        modal.querySelector('div').classList.remove('scale-100');
    }

    function updatePaymentStatus(message) {
        const statusElement = document.getElementById('paymentStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    function checkPaymentStatus(orderId) {
        let checkCount = 0;
        const maxChecks = 20; // Check for 60 seconds (20 * 3 seconds)
        const checkInterval = 3000; // Check every 3 seconds
        
        function checkStatus() {
            checkCount++;
            updatePaymentStatus(`Checking payment status... (${checkCount}/${maxChecks})`);
            
            fetch('check_payment.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_id: orderId,
                    check_status: true
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Payment status check:', data);
                
                if (data.status === 'completed') {
                    // Payment successful
                    updatePaymentStatus('Payment completed successfully! 🎉');
                    setTimeout(() => {
                        hideProcessingModal();
                        // Show success modal
                        showSuccessModal(data.amount || 0);
                        // Reset button
                        const btn = document.querySelector('#payForm button[type="submit"]');
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = 'Support this wish';
                        }
                    }, 2000);
                    
                } else if (data.status === 'pending' && checkCount < maxChecks) {
                    // Payment still pending, check again
                    updatePaymentStatus(`Payment pending... Please complete the USSD prompt (${checkCount}/${maxChecks})`);
                    setTimeout(checkStatus, checkInterval);
                    
                } else if (data.status === 'timeout') {
                    // Payment timed out
                    updatePaymentStatus('Payment timed out. Please try again.');
                    setTimeout(() => {
                        hideProcessingModal();
                        // Reset button
                        const btn = document.querySelector('#payForm button[type="submit"]');
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = 'Support this wish';
                        }
                    }, 3000);
                    
                } else if (checkCount >= maxChecks) {
                    // Max checks reached
                    updatePaymentStatus('Payment check timeout. Please refresh the page to check status.');
                    setTimeout(() => {
                        hideProcessingModal();
                        // Reset button
                        const btn = document.querySelector('#payForm button[type="submit"]');
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = 'Support this wish';
                        }
                    }, 5000);
                    
                } else {
                    // Other status
                    updatePaymentStatus('Payment status: ' + (data.status || 'unknown'));
                    if (checkCount < maxChecks) {
                        setTimeout(checkStatus, checkInterval);
                    }
                }
            })
            .catch(error => {
                console.error('Error checking payment status:', error);
                updatePaymentStatus('Error checking payment status. Retrying...');
                
                if (checkCount < maxChecks) {
                    setTimeout(checkStatus, checkInterval);
                } else {
                    updatePaymentStatus('Failed to check payment status. Please refresh the page.');
                    setTimeout(() => {
                        hideProcessingModal();
                        // Reset button
                        const btn = document.querySelector('#payForm button[type="submit"]');
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = 'Support this wish';
                        }
                    }, 5000);
                }
            });
        }
        
        // Start checking
        checkStatus();
    }

    // Add loading spinner to 'Support this wish' button on submit
    const payForm = document.getElementById('payForm');
    if (payForm) {
      payForm.addEventListener('submit', function(e) {
        const btn = payForm.querySelector('button[type="submit"]');
        const paymentMethod = document.getElementById('payment-method').value;
        
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<svg class="animate-spin mr-2 h-6 w-6 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Processing...';
        }
        
        // For mobile money, show processing modal and check status
        if (paymentMethod === 'mobile') {
          e.preventDefault(); // Prevent default form submission
          
          // Show processing modal
          showProcessingModal();
          
          // Submit form via AJAX
          const formData = new FormData(payForm);
          
          fetch(window.location.href, {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            console.log('Payment response:', data);
            
            if (data.status === 'success') {
              updatePaymentStatus('Payment initiated successfully! Checking status...');
              
              // Start checking payment status
              checkPaymentStatus(data.order_id);
            } else {
              updatePaymentStatus('Payment failed: ' + (data.message || 'Unknown error'));
              setTimeout(() => {
                hideProcessingModal();
                // Reset button
                if (btn) {
                  btn.disabled = false;
                  btn.innerHTML = 'Support this wish';
                }
              }, 3000);
            }
          })
          .catch(error => {
            console.error('Payment error:', error);
            updatePaymentStatus('Payment failed. Please try again.');
            setTimeout(() => {
              hideProcessingModal();
              // Reset button
              if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Support this wish';
              }
            }, 3000);
          });
          
          return false;
        }
        
        // For card payments, let the form submit normally
        console.log('Card payment - proceeding with normal form submission');
      });
    }
    </script>
</body>
<style>
@media (min-width: 1024px) {
  .custom-flex-row {
    gap: 0 !important;
  }
  .custom-flex-row > .flex-1 {
    margin-right: -32px; /* Adjust this value for desired closeness */
  }
}
</style>
</html> 