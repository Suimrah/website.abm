<?php
header('Content-Type: application/json'); // Ensure JSON output

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception("Invalid request.");
    }

    $name = htmlspecialchars(trim($_POST["name"] ?? ''));
    $email = filter_var($_POST["email"] ?? '', FILTER_VALIDATE_EMAIL);
    $company = htmlspecialchars(trim($_POST["company"] ?? ''));
    $cellNumber = htmlspecialchars(trim($_POST["cellNumber"] ?? ''));
    $industry = htmlspecialchars(trim($_POST["industry"] ?? ''));
    $message = htmlspecialchars(trim($_POST["message"] ?? ''));
    $recaptchaResponse = $_POST["g-recaptcha-response"] ?? '';

    if (!$name || !$email || !$company || !$message) {
        throw new Exception("Please fill out all required fields.");
    }

    // Validate reCAPTCHA
    $recaptchaSecret = "6LcRUmUqAAAAAP90TrQzAtiPCnaeEyus34Rft20Z";
    $recaptchaURL = 'https://www.google.com/recaptcha/api/siteverify';
    $recaptchaValidation = file_get_contents($recaptchaURL . '?secret=' . $recaptchaSecret . '&response=' . $recaptchaResponse);

    if ($recaptchaValidation === false) {
        throw new Exception("Failed to validate reCAPTCHA.");
    }

    $recaptchaResult = json_decode($recaptchaValidation, true);

    if (empty($recaptchaResult['success'])) {
        throw new Exception("reCAPTCHA verification failed.");
    }

    // Prepare email
    $to = "contact@abmenergytech.com";
    $subject = "New Contact Form Submission from $name";
    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    $body = "Name: $name\n";
    $body .= "Email: $email\n";
    $body .= "Company: $company\n";
    $body .= "Phone Number: $cellNumber\n";
    $body .= "Industry: $industry\n";
    $body .= "Message:\n$message\n";

    if (!mail($to, $subject, $body, $headers)) {
        throw new Exception("There was an error sending your message.");
    }

    echo json_encode(["status" => "success", "message" => "Thank you, $name! Your message has been sent successfully."]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
