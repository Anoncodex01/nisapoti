<?php
// Enable error reporting
error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', 0); // Disable displaying errors to users

session_start();
require_once __DIR__ . '/../config/db_functions.php';

// Get creator username from URL
$username = basename($_SERVER['REQUEST_URI']); // This will get 'Alvin' from '/creator/Alvin'

if (empty($username)) {
    echo "Creator not found";
    exit();
}

try {
    // Get creator profile from database using username
    $creator = db_select_one(
        "SELECT user_id, username, display_name, avatar_url, category FROM profiles WHERE username = ?",
        [$username]
    );

    if (!$creator) {
        echo "Creator not found";
        exit();
    }

    // Get supporter count
    $supporter_count = db_select_one(
        "SELECT COUNT(*) as count 
         FROM supporters 
         WHERE creator_id = ?",
        [$creator->user_id]
    );

    // Include new ZenoPay configuration
    require_once __DIR__ . '/../config/zeno_config.php';

    // Handle form submission
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            // Validate inputs
            $amount = filter_input(INPUT_POST, 'amount', FILTER_VALIDATE_INT);
            $phone = trim($_POST['phone']);
            $name = trim($_POST['name'] ?? 'Anonymous');
            
            if (!$amount || !$phone) {
                throw new Exception('Invalid amount or phone number');
            }

            // Format phone number
            $phone = preg_replace('/[^0-9]/', '', $phone);
            if (strlen($phone) === 10 && substr($phone, 0, 1) === '0') {
                $phone = '255' . substr($phone, 1);
            } elseif (strlen($phone) === 9) {
                $phone = '255' . $phone;
            }

            // Create payment order with new ZenoPay API
            $webhookUrl = 'https://' . $_SERVER['HTTP_HOST'] . '/creator/webhook.php';
            
            error_log("Initiating payment with new ZenoPay API");

            try {
                $result = createZenoPaymentOrder(
                    'customer@example.com',
                    $name,
                    $phone,
                    $amount,
                    $webhookUrl
                );
                
                $data = $result;
                
            } catch (Exception $e) {
                throw new Exception('Failed to initiate payment: ' . $e->getMessage());
            }

            // First create the supporter record in pending state
            try {
                beginTransaction(); // Start transaction

                // Insert into supporters table using db_insert with table and data array
                $supporter_data = [
                    'creator_id' => $creator->user_id,
                    'name' => $name,
                    'phone' => $phone,
                    'amount' => $amount,
                    'order_id' => $data['order_id'],
                    'status' => 'pending',
                    'created_at' => date('Y-m-d H:i:s')
                ];

                $result = db_insert('supporters', $supporter_data);

                if (!$result) {
                    throw new Exception('Failed to create supporter record');
                }

                // Store payment info in session
                $_SESSION['pending_payment'] = [
                    'order_id' => $data['order_id'],
                    'creator_id' => $creator->user_id,
                    'amount' => $amount,
                    'phone' => $phone,
                    'name' => $name,
                    'start_time' => time()
                ];

                commitTransaction(); // Commit the transaction

                echo json_encode([
                    'status' => 'success',
                    'order_id' => $data['order_id'],
                    'message' => 'Payment initiated'
                ]);

            } catch (Exception $e) {
                rollbackTransaction(); // Rollback on error
                error_log("Database error: " . $e->getMessage());
                throw new Exception('Failed to process payment');
            }

        } catch (Exception $e) {
            error_log("Payment error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    // For non-POST requests, continue with regular page rendering
    header('Content-Type: text/html'); // Reset content type for HTML

    // Record page view
    if (!isset($_SESSION['viewed_' . $creator->user_id])) {
        try {
            $sql = "INSERT INTO page_views (creator_id, viewer_ip, created_at) VALUES (?, ?, NOW())";
            db_insert($sql, [$creator->user_id, $_SERVER['REMOTE_ADDR']]);
            $_SESSION['viewed_' . $creator->user_id] = true;
        } catch (Exception $e) {
            error_log("Failed to record page view: " . $e->getMessage());
        }
    }

    // Success message handling
    $success = isset($_GET['status']) && $_GET['status'] === 'success';
    $thanked_name = isset($_GET['name']) ? htmlspecialchars(urldecode($_GET['name'])) : '';
    $thanked_amount = isset($_GET['amount']) ? (int)urldecode($_GET['amount']) : 0;
    $error = isset($error) ? $error : '';

} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    echo "An error occurred";
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support <?php echo htmlspecialchars($creator->display_name); ?></title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/theme-minimal@4/minimal.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        .nisapoti-orange {
            background-color: #FF6B35;
        }
        .tip-button {
            background-color: #fff;
            border: 1px solid #FF6B35;
            color: #FF6B35;
        }
        .tip-button.active {
            background-color: #FF6B35;
            color: white;
            transform: scale(1.05);
        }
        .tip-button:hover {
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.15);
        }
        .glass-morphism {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .gradient-bg {
            background: linear-gradient(135deg, #FF6B35 0%, #FF8B3D 100%);
        }
        input, textarea {
            backdrop-filter: blur(8px);
        }
        input:focus, textarea:focus {
            background-color: white;
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        
        input[type="number"] {
            -moz-appearance: textfield;
        }
        .success-modal {
            position: fixed;
            inset: 0;
            background: rgba(255, 255, 255, 0.98);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 50;
            backdrop-filter: blur(20px);
        }

        .success-content {
            text-align: center;
            padding: 3rem;
            max-width: 90%;
            width: 440px;
            animation: modalPop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            background: linear-gradient(145deg, #ffffff, #fff6f3);
            border-radius: 32px;
            box-shadow: 
                0 24px 48px -12px rgba(255, 107, 53, 0.18),
                0 0 0 1px rgba(255, 107, 53, 0.08);
        }

        .amount-display {
            background: linear-gradient(135deg, rgba(255, 107, 53, 0.08), rgba(255, 107, 53, 0.03));
            padding: 1.5rem;
            border-radius: 20px;
            margin: 2rem 0;
            position: relative;
            overflow: hidden;
        }

        .amount-display::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
                45deg,
                transparent,
                rgba(255, 107, 53, 0.1),
                transparent
            );
            transform: translateX(-100%);
            animation: shimmer 2s infinite;
        }

        .confetti {
            position: absolute;
            animation: confettiFall 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes modalPop {
            0% { transform: scale(0.95); opacity: 0; }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); opacity: 1; }
        }

        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }

        @keyframes confettiFall {
            0% { 
                transform: translateY(-100vh) rotate(0deg) scale(0);
                opacity: 1;
            }
            100% { 
                transform: translateY(100vh) rotate(720deg) scale(1);
                opacity: 0;
            }
        }

        .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto;
            background: linear-gradient(135deg, #FF6B35, #FF8B3D);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: iconPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
        }

        @keyframes iconPop {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }

        /* Add the missing .show class styles */
        .success-modal.show {
            display: flex;
            animation: modalPop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Update the button styles */
        .support-button {
            background: linear-gradient(135deg, #FF6B35 0%, #FF8B3D 100%);
            transition: all 0.3s ease;
        }

        .support-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px -6px rgba(255, 107, 53, 0.4);
        }

        .support-button:active {
            transform: translateY(0);
        }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
    <?php if ($success): ?>
        <div class="max-w-md mx-auto mt-10 glass-morphism text-orange-600 px-6 py-4 rounded-2xl relative">
            <p class="text-center font-medium">
                Thank you<?php echo $thanked_name !== 'Anonymous' ? ', ' . $thanked_name : ''?>! 
                Your support of TZS <?php echo number_format($thanked_amount); ?> means everything! 🎉
            </p>
        </div>
    <?php endif; ?>

    <div class="max-w-md mx-auto my-10 glass-morphism rounded-3xl shadow-lg p-8">
        <!-- Profile Section -->
        <div class="flex items-center space-x-5 mb-10">
            <div class="relative">
                <img src="<?php echo htmlspecialchars($creator->avatar_url ?? '/assets/images/default-avatar.png'); ?>" 
                     alt="<?php echo htmlspecialchars($creator->display_name); ?>" 
                     class="w-20 h-20 rounded-2xl object-cover">
                <div class="absolute -bottom-2 -right-2 bg-green-400 w-5 h-5 rounded-full border-2 border-white"></div>
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-900"><?php echo htmlspecialchars($creator->display_name); ?></h1>
                <p class="text-orange-500 font-medium"><?php echo htmlspecialchars($creator->category ?? 'Creator'); ?></p>
                <p class="text-gray-500 text-sm mt-1">
                    <?php echo number_format($supporter_count->count); ?> supporters
                </p>
            </div>
        </div>

        <form action="" method="POST" class="space-y-8">
            <input type="hidden" name="creator_id" value="<?php echo htmlspecialchars($creator->user_id); ?>">
            
            <!-- Tip Amount Buttons -->
            <div class="amount-options mb-6">
                <div class="flex justify-between gap-2 mb-4">
                    <button type="button" 
                            class="tip-button flex-1 px-4 py-3 rounded-xl transition-all duration-300 text-sm md:text-base" 
                            data-amount="5000">
                        TZS 5,000
                    </button>
                    <button type="button" 
                            class="tip-button flex-1 px-4 py-3 rounded-xl transition-all duration-300 text-sm md:text-base" 
                            data-amount="10000">
                        TZS 10,000
                    </button>
                    <button type="button" 
                            class="tip-button flex-1 px-4 py-3 rounded-xl transition-all duration-300 text-sm md:text-base" 
                            data-amount="50000">
                        TZS 50,000
                    </button>
                </div>
                
                <div class="custom-amount">
                    <input type="number" 
                           id="custom-amount" 
                           class="w-full px-4 py-3 rounded-xl bg-white bg-opacity-50 border border-gray-300 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35] focus:ring-opacity-50 transition-all duration-300"
                           placeholder="Enter custom amount"
                           min="1000"
                           step="100">
                </div>
            </div>

            <input type="hidden" id="selected-amount" name="amount" value="5000">

            <!-- Optional Fields -->
            <div class="space-y-4">
                <!-- Required Phone Number Field -->
                <div class="relative">
                    <input type="tel" 
                           name="phone" 
                           class="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl
                                  focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400
                                  transition-all placeholder-gray-400"
                           placeholder="Phone number *"
                           pattern="[0-9]{10,}"
                           title="Please enter a valid phone number"
                           required>
                    <?php if (isset($error)): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $error; ?></p>
                    <?php endif; ?>
                </div>

                <!-- Name Field -->
                <div class="relative">
                    <input type="text" 
                           name="name" 
                           class="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl
                                  focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400
                                  transition-all placeholder-gray-400"
                           placeholder="Your name (optional)">
                </div>
            </div>

            <!-- Payment Button -->
            <button type="submit" 
                    class="w-full support-button text-white py-4 rounded-xl
                           flex items-center justify-center space-x-3
                           transition-all duration-300 nisapoti-orange hover:opacity-90">
                <span class="text-lg font-semibold">Nisapoti TZS <span id="total-amount">5,000</span></span>
            </button>
        </form>
    </div>

    <div id="successModal" class="success-modal">
        <div class="success-content">
            <div class="success-icon">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            
            <h2 class="text-4xl font-bold text-gray-900 mt-6 mb-2">You're Amazing!</h2>
            <p class="text-gray-600">You just supported</p>

            <div class="amount-display">
                <p class="text-[#FF6B35] text-5xl font-bold tracking-tight">
                    TZS <span id="supportAmount" class="font-mono">0</span>
                </p>
            </div>
            
           

            <button onclick="closeSuccessModal()" 
                    class="mt-8 px-8 py-3 rounded-2xl bg-gray-900 text-white font-medium 
                           transform transition-all duration-300
                           hover:bg-gray-800 hover:scale-105 hover:shadow-lg 
                           hover:shadow-gray-200 active:scale-95">
                Thank You! 🎉
            </button>
        </div>
    </div>

    <script>
    // Constants
    const MAX_CHECK_TIME = 60000; // Increase to 60 seconds
    const CHECK_INTERVAL = 3000;  // Check every 3 seconds
    let checkCount = 0;
    const maxChecks = Math.ceil(MAX_CHECK_TIME / CHECK_INTERVAL);
    let isCheckingPayment = false;

    // Get DOM elements
    const form = document.querySelector('form');
    const amountButtons = document.querySelectorAll('[data-amount]');
    const customAmountInput = document.getElementById('custom-amount');
    const selectedAmountInput = document.getElementById('selected-amount');
    const totalAmountSpan = document.getElementById('total-amount');

    // Helper Functions
    function formatAmount(amount) {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function updateTotalAmount(amount) {
        selectedAmountInput.value = amount;
        totalAmountSpan.textContent = formatAmount(amount);
    }

    function showUSSDPrompt() {
        let timeLeft = 60; // Increased to 60 seconds
        
        Swal.fire({
            title: 'Payment Initiated',
            html: `
                <div class="text-center">
                    <p class="mb-4">USSD prompt sent to your phone.</p>
                    <p class="font-semibold">Please complete the payment on your phone.</p>
                    <div class="mt-4 text-sm text-gray-600">
                        <p>Waiting for your response...</p>
                        <p class="mt-2">Time remaining: <span id="timer">${timeLeft}</span> seconds</p>
                    </div>
                </div>
            `,
            icon: 'info',
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
                
                const timerInterval = setInterval(() => {
                    timeLeft--;
                    const timerElement = document.getElementById('timer');
                    if (timerElement) {
                        timerElement.textContent = timeLeft;
                    }
                    if (timeLeft <= 0) {
                        clearInterval(timerInterval);
                    }
                }, 1000);

                // Start checking payment status
                checkPaymentStatus();
            }
        });
    }

    async function checkPaymentStatus() {
        if (isCheckingPayment) return;
        isCheckingPayment = true;

        try {
            const response = await fetch('check_payment.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    check_status: true
                })
            });

            const text = await response.text();
            console.log('Raw response:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse response:', text);
                throw new Error('Invalid response format');
            }
            
            console.log('Payment status response:', data);

            if (data.error) {
                throw new Error(data.error);
            }
            
            if (data.status === 'completed') {
                isCheckingPayment = false;
                
                // Close the USSD prompt
                Swal.close();
                
                // Show success message
                Swal.fire({
                    title: 'Payment Successful!',
                    text: 'Thank you for your support!',
                    icon: 'success',
                    confirmButtonColor: '#FF813F'
                }).then(() => {
                    window.location.reload();
                });
                
                // Clear session
                fetch('clear_session.php');
                
            } else if (data.status === 'pending' && checkCount < maxChecks) {
                checkCount++;
                console.log(`Payment still pending, check ${checkCount}/${maxChecks}`);
                setTimeout(() => {
                    isCheckingPayment = false;
                    checkPaymentStatus();
                }, CHECK_INTERVAL);
                
            } else {
                isCheckingPayment = false;
                Swal.fire({
                    title: 'Payment Timeout',
                    text: 'The payment process has timed out. Please try again.',
                    icon: 'warning',
                    confirmButtonColor: '#FF813F'
                }).then(() => {
                    fetch('clear_session.php').then(() => {
                        window.location.reload();
                    });
                });
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
            isCheckingPayment = false;
            
            if (error.message.includes('Invalid or expired payment session')) {
                Swal.fire({
                    title: 'Session Expired',
                    text: 'Your payment session has expired. Please try again.',
                    icon: 'warning',
                    confirmButtonColor: '#FF813F'
                }).then(() => {
                    window.location.reload();
                });
                return;
            }

            if (checkCount < maxChecks) {
                setTimeout(checkPaymentStatus, CHECK_INTERVAL);
            } else {
                Swal.close();
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Failed to check payment status. Please try again.',
                    icon: 'error',
                    confirmButtonColor: '#FF813F'
                }).then(() => {
                    window.location.reload();
                });
            }
        }
    }

    // Event Listeners
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const phone = formData.get('phone');
        const amount = parseInt(selectedAmountInput.value) || parseInt(customAmountInput.value) || 0;

        console.log('Submitting payment:', { phone, amount });

        if (!phone || !amount) {
            Swal.fire({
                title: 'Error',
                text: 'Please enter both phone number and amount',
                icon: 'error',
                confirmButtonColor: '#FF813F'
            });
            return;
        }

        // Show loading state
        Swal.fire({
            title: 'Processing',
            text: 'Initiating payment...',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await fetch(window.location.href, {
                method: 'POST',
                body: formData
            });
            
            const text = await response.text();
            console.log('Server response:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Parse error:', text);
                throw new Error('Invalid server response');
            }

            console.log('Parsed response:', data);
            if (data.status === 'success' && data.order_id) {
                console.log('Payment initiated with order ID:', data.order_id);
                // Start the USSD prompt and status checking
                showUSSDPrompt();
                // Reset check count when starting a new payment
                checkCount = 0;
                isCheckingPayment = false;
            } else {
                throw new Error(data.message || 'Failed to process payment');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'An error occurred. Please try again.',
                icon: 'error',
                confirmButtonColor: '#FF813F'
            });
        }
    });

    // Add back the event listeners for amount buttons and custom input
    customAmountInput.addEventListener('input', function() {
        const amount = parseInt(this.value) || 0;
        updateTotalAmount(amount);
        amountButtons.forEach(btn => btn.classList.remove('active'));
    });

    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            const amount = parseInt(this.dataset.amount);
            updateTotalAmount(amount);
            customAmountInput.value = '';
            amountButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Set initial amount
    updateTotalAmount(5000);
    </script>
</body>
</html>