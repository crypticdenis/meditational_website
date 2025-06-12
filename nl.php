<?php
if ($_SERVER["REQUEST_METHOD"] === "POST" && !empty($_POST["email"])) {
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);

    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        file_put_contents("emails.txt", $email . PHP_EOL, FILE_APPEND);
        echo "Thanks for subscribing!";
    } else {
        echo "Invalid email address.";
    }
} else {
    echo "No email submitted.";
}
