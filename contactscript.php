<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Form input sanitization and validation
    $name = htmlspecialchars(trim($_POST["name"]));
    $email = filter_var($_POST["email"], FILTER_VALIDATE_EMAIL);
    $company = htmlspecialchars(trim($_POST["company"]));
    $cellNumber = htmlspecialchars(trim($_POST["cellNumber"]));
    $industry = htmlspecialchars(trim($_POST["industry"]));
    $message = htmlspecialchars(trim($_POST["message"]));
    $recaptchaResponse = $_POST["g-recaptcha-response"];

    // Verify all required fields
    if (!$name || !$email || !$company || !$message) {
        echo "Please fill out all required fields.";
        exit;
    }

    // reCAPTCHA verification
    $recaptchaSecret = "6LcRUmUqAAAAAPEwBgQdxZGUxk9q8x45zlTISynR"; // Replace with your secret key from Google reCAPTCHA
    $recaptchaURL = 'https://www.google.com/recaptcha/api/siteverify';

    $recaptchaValidation = file_get_contents($recaptchaURL . '?secret=' . $recaptchaSecret . '&response=' . $recaptchaResponse);
    $recaptchaResult = json_decode($recaptchaValidation, true);

    if (!$recaptchaResult['success']) {
        echo "reCAPTCHA verification failed. Please try again.";
        exit;
    }

    // Email configuration
    $to = "contact@abmenergytech.com"; // Replace with your email address
    $subject = "New Contact Form Submission from $name";
    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    // Email body
    $body = "Name: $name\n";
    $body .= "Email: $email\n";
    $body .= "Company: $company\n";
    $body .= "Phone Number: $cellNumber\n";
    $body .= "Industry: $industry\n";
    $body .= "Message:\n$message\n";

    // Send email
    if (mail($to, $subject, $body, $headers)) {
        echo "Thank you, $name! Your message has been sent successfully.";
    } else {
        echo "There was an error sending your message. Please try again later.";
    }
} else {
    echo "Invalid request.";
}
?>
